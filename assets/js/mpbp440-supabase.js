/* MPBP440 V12.0.9 public engagement client. The publishable key is intentionally
 * public; administrative keys and passwords never belong in browser code. */
(() => {
  'use strict';

  const config = Object.freeze({
    url: 'https://eneuejomsrpdwvvpgvgl.supabase.co',
    publishableKey: 'sb_publishable_ysbrjS9YnmymD_6YIU2gbg_Gb2RfyiD'
  });
  const sessionKey = 'mpbp440.analytics.session.v1';
  const visitorKey = 'mpbp440.analytics.visitor.v1';
  const previewHost = location.hostname === 'mpbp97440-byte.github.io' && location.pathname.startsWith('/MPBP440-V12-Preview/');
  const timeoutMs = 5500;
  const pending = new Set();

  const createId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16); window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    return [...bytes].map((byte, index) => (index === 4 || index === 6 || index === 8 || index === 10 ? `-${byte.toString(16).padStart(2, '0')}` : byte.toString(16).padStart(2, '0'))).join('');
  };
  const storedId = (store, key) => { let value = store.getItem(key); if (!value) { value = createId(); store.setItem(key, value); } return value; };
  const sessionId = () => storedId(sessionStorage, sessionKey);
  const visitorId = () => storedId(localStorage, visitorKey);
  const normalPath = (path = location.pathname) => {
    const clean = String(path || '/').split('?')[0].replace(/\\/g, '/').replace(/\/index\.html$/, '/').replace(/\/{2,}/g, '/');
    return clean.length > 1 ? clean.replace(/\/$/, '') : '/';
  };
  const artistForPath = () => ({
    '/artistes/sparetdee-simon.html': 'sparetdee-simon',
    '/artistes/makeda-muse.html': 'makeda-muse',
    '/artistes/juste-une-plume.html': 'juste-une-plume'
  })[normalPath()];
  const request = async (name, args = {}, writes = false) => {
    if (writes && previewHost) return null;
    const token = `${name}:${JSON.stringify(args)}`;
    if (writes && pending.has(token)) return null;
    if (writes) pending.add(token);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
        method: 'POST', signal: controller.signal, headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args), keepalive: writes
      });
      if (!response.ok) throw new Error(`RPC ${name} (${response.status})`);
      return response.json();
    } finally { clearTimeout(timer); if (writes) pending.delete(token); }
  };
  const write = (name, args) => request(name, { p_session: sessionId(), p_visitor: visitorId(), ...args }, true).catch(() => null);
  const format = (count, label) => `${new Intl.NumberFormat('fr-FR').format(Number(count) || 0)} ${label}${Number(count) === 1 ? '' : 's'}`;
  const notifyUnavailable = (element) => { if (element) element.textContent = 'Statistiques temporairement indisponibles'; };

  const analytics = Object.freeze({
    isPreview: previewHost,
    siteVisit: () => write('increment_site_visit', { p_path: normalPath() }),
    artistVisit: (key) => write('increment_artist_visit', { p_artist_key: key }),
    eventVisit: (key) => write('increment_event_visit', { p_event_key: key }),
    videoView: (key) => write('increment_video_view', { p_video_id: key }),
    toggleLike: (key) => write('toggle_video_like', { p_video_id: key }),
    videoEngagement: async (key) => {
      const result = await request('get_video_engagement', { p_video_id: key, p_visitor: visitorId() });
      return Array.isArray(result) ? result[0] : result;
    },
    format,
    visitorId,
    sessionId
  });
  window.MPBP440Analytics = analytics;

  document.addEventListener('DOMContentLoaded', () => {
    analytics.siteVisit();
    const artist = artistForPath(); if (artist) analytics.artistVisit(artist);
    if (normalPath() === '/evenements') analytics.eventVisit('archives');
  }, { once: true });
  window.MPBP440AnalyticsUnavailable = notifyUnavailable;
})();
