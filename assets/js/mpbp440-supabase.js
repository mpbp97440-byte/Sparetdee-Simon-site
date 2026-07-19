/* MPBP440 V12.0.8 analytics service. It is inert until a public runtime config
 * supplies window.MPBP440_SUPABASE_CONFIG = { url, anonKey }. No secret belongs here. */
(() => {
  'use strict';

  const config = window.MPBP440_SUPABASE_CONFIG || {};
  const queueKey = 'mpbp440.analytics.queue';
  const sessionKey = 'mpbp440.analytics.session';
  const maxRetries = 3;
  const retryDelay = 500;

  const available = () => Boolean(config.url && config.anonKey && window.fetch && window.crypto);
  const sessionId = () => {
    let id = sessionStorage.getItem(sessionKey);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, id);
    }
    return id;
  };
  const readQueue = () => { try { return JSON.parse(localStorage.getItem(queueKey) || '[]'); } catch (_) { return []; } };
  const writeQueue = (queue) => localStorage.setItem(queueKey, JSON.stringify(queue.slice(-50)));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function request(name, args = {}, includeSession = true) {
    if (!available()) throw new Error('Supabase public runtime configuration is unavailable');
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
          method: 'POST',
          headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(includeSession ? { p_session: sessionId(), ...args } : args),
          keepalive: true
        });
        if (!response.ok) throw new Error(`Supabase RPC ${name} failed (${response.status})`);
        return response.json();
      } catch (error) {
        lastError = error;
        if (attempt + 1 < maxRetries) await sleep(retryDelay * (attempt + 1));
      }
    }
    throw lastError;
  }

  async function track(name, args) {
    try { return await request(name, args); }
    catch (error) {
      if (!navigator.onLine) writeQueue([...readQueue(), { name, args }]);
      console.warn('[MPBP440 analytics]', error.message);
      return null;
    }
  }

  async function flush() {
    if (!navigator.onLine || !available()) return;
    const queue = readQueue();
    writeQueue([]);
    for (const entry of queue) {
      try { await request(entry.name, entry.args); }
      catch (_) { writeQueue([...readQueue(), entry]); break; }
    }
  }

  window.addEventListener('online', flush);
  window.MPBP440Analytics = Object.freeze({
    enabled: available(),
    siteVisit: (path = location.pathname) => track('increment_site_visit', { p_path: path }),
    videoView: (id) => track('increment_video_view', { p_video_id: id }),
    toggleLike: (id) => track('toggle_video_like', { p_video_id: id }),
    artistVisit: (key) => track('increment_artist_visit', { p_artist_key: key }),
    eventVisit: (key) => track('increment_event_visit', { p_event_key: key }),
    videoEngagement: (id) => request('get_video_engagement', { p_video_id: id }, false),
    analyticsOverview: () => request('get_analytics_overview', {}, false),
    flush
  });
  flush();
})();
