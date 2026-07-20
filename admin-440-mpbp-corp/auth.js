/* Back-office authentication: Supabase Auth first, then the database role.
 * The publishable key is public by design; no password or token is logged. */
(() => {
  'use strict';

  const config = Object.freeze({
    url: 'https://eneuejomsrpdwvvpgvgl.supabase.co',
    publishableKey: 'sb_publishable_ysbrjS9YnmymD_6YIU2gbg_Gb2RfyiD'
  });
  const sessionKey = 'mpbp440.admin.supabase.session.v1';
  const timeoutMs = 6500;
  let activeSession = null;

  const byId = (id) => document.getElementById(id);
  const setMessage = (message, isError = true) => {
    const target = byId('loginMsg');
    if (!target) return;
    target.textContent = message;
    target.classList.toggle('success', !isError);
  };
  const sessionFromStorage = () => { try { return JSON.parse(sessionStorage.getItem(sessionKey) || 'null'); } catch (_) { return null; } };
  const saveSession = (session) => {
    if (!session?.access_token) throw new Error('Supabase n’a pas renvoyé de session valide.');
    activeSession = session;
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
  };
  const clearSession = () => { activeSession = null; sessionStorage.removeItem(sessionKey); };
  const isExpired = (session) => !session?.access_token || (session.expires_at && session.expires_at * 1000 <= Date.now() + 10000);
  const authError = (message, stage, status) => Object.assign(new Error(message), { stage, status });
  const request = async (path, options = {}, stage = 'request') => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${config.url}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', ...(options.headers || {}) }
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw authError(body?.error_description || body?.msg || body?.message || `Requête refusée (${response.status}).`, stage, response.status);
      }
      return body;
    } catch (error) {
      if (error?.name === 'AbortError') throw authError('La connexion à Supabase a expiré. Réessayez.', stage, 408);
      if (error instanceof TypeError) throw authError('Impossible de joindre Supabase. Vérifiez votre connexion réseau.', stage, 0);
      throw error;
    } finally { clearTimeout(timer); }
  };
  const token = () => activeSession?.access_token || '';
  const rpc = (name, args = {}) => request(`/rest/v1/rpc/${name}`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: JSON.stringify(args) }, `rpc:${name}`);
  const currentUser = () => request('/auth/v1/user', { headers: { Authorization: `Bearer ${token()}` } }, 'auth:user');
  const signInWithPassword = (email, password) => request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }, 'auth:signInWithPassword');
  const activate = (profile) => {
    byId('loginBox').hidden = true;
    byId('adminBox').hidden = false;
    const info = byId('sessionInfo');
    if (info) info.textContent = `Session administrateur active : ${profile.email || 'compte vérifié'}`;
    document.dispatchEvent(new CustomEvent('mpbp-admin-ready'));
  };
  const verifyAdminRole = async () => {
    const profile = await currentUser();
    await rpc('get_admin_dashboard_summary');
    return profile;
  };
  const messageForError = (error) => {
    if (error?.stage === 'auth:signInWithPassword') {
      if (error.status === 400 || error.status === 401 || /invalid login credentials/i.test(error.message)) return 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.';
      return error.message;
    }
    if (error?.stage === 'auth:user') return 'La session Supabase est invalide ou a expiré. Connectez-vous à nouveau.';
    if (String(error?.stage || '').startsWith('rpc:get_admin_dashboard_summary')) {
      if (error.status === 401 || error.status === 403 || /administrator access required|permission denied/i.test(error.message)) return 'Ce compte est authentifié, mais ne possède pas le rôle administrateur actif.';
      return `Impossible de vérifier le rôle administrateur : ${error.message}`;
    }
    return error?.message || 'Connexion impossible. Réessayez.';
  };
  const setLoading = (loading) => {
    const submit = byId('loginSubmit');
    if (!submit) return;
    submit.disabled = loading;
    submit.setAttribute('aria-busy', String(loading));
    submit.textContent = loading ? 'Connexion…' : 'Accéder au back office';
  };

  window.MPBP440Admin = Object.freeze({ rpc, signOut: clearSession });
  window.togglePassword = () => {
    const field = byId('adminPass');
    if (field) field.type = field.type === 'password' ? 'text' : 'password';
  };
  const loginAdmin = async (event) => {
    event?.preventDefault();
    const email = byId('adminEmail')?.value.trim();
    const password = byId('adminPass')?.value || '';
    if (!email || !password) { setMessage('Saisissez votre adresse e-mail et votre mot de passe.'); return; }
    setLoading(true);
    setMessage('Connexion Supabase en cours…', false);
    try {
      const session = await signInWithPassword(email, password);
      saveSession(session);
      const profile = await verifyAdminRole();
      byId('adminPass').value = '';
      setMessage('', false);
      activate(profile);
    } catch (error) {
      clearSession();
      setMessage(messageForError(error));
    } finally {
      setLoading(false);
    }
  };
  window.logoutAdmin = async () => {
    try { if (token()) await request('/auth/v1/logout', { method: 'POST', headers: { Authorization: `Bearer ${token()}` } }, 'auth:signOut'); } catch (_) {}
    clearSession();
    location.reload();
  };
  document.addEventListener('DOMContentLoaded', async () => {
    byId('adminLoginForm')?.addEventListener('submit', loginAdmin);
    const session = sessionFromStorage();
    if (isExpired(session)) { clearSession(); return; }
    saveSession(session);
    setMessage('Restauration de la session…', false);
    try { activate(await verifyAdminRole()); setMessage('', false); }
    catch (error) { clearSession(); setMessage(messageForError(error)); }
  }, { once: true });
})();
