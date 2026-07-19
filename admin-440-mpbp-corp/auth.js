/* Back-office access is verified by Supabase Auth and public.admin_users.
 * The publishable key is intentionally public; passwords are never stored here. */
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
  const safeSession = () => {
    try { return JSON.parse(sessionStorage.getItem(sessionKey) || 'null'); } catch (_) { return null; }
  };
  const saveSession = (session) => { activeSession = session; sessionStorage.setItem(sessionKey, JSON.stringify(session)); };
  const clearSession = () => { activeSession = null; sessionStorage.removeItem(sessionKey); };
  const request = async (path, options = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${config.url}${path}`, { ...options, signal: controller.signal, headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.msg || body?.message || `Connexion refusée (${response.status}).`);
      return body;
    } finally { clearTimeout(timer); }
  };
  const token = () => activeSession?.access_token || '';
  const rpc = (name, args = {}) => request(`/rest/v1/rpc/${name}`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: JSON.stringify(args) });
  const user = () => request('/auth/v1/user', { headers: { Authorization: `Bearer ${token()}` } });
  const isExpired = (session) => !session?.access_token || (session.expires_at && session.expires_at * 1000 <= Date.now() + 10000);
  const activate = (profile) => {
    byId('loginBox').hidden = true;
    byId('adminBox').hidden = false;
    const info = byId('sessionInfo');
    if (info) info.textContent = `Session administrateur active : ${profile.email || 'compte vérifié'}`;
    document.dispatchEvent(new CustomEvent('mpbp-admin-ready'));
  };
  const verifyAdmin = async () => {
    const profile = await user();
    await rpc('get_admin_dashboard_summary');
    return profile;
  };

  window.MPBP440Admin = Object.freeze({ rpc, signOut: () => clearSession() });
  window.togglePassword = () => {
    const field = byId('adminPass');
    if (field) field.type = field.type === 'password' ? 'text' : 'password';
  };
  window.loginAdmin = async () => {
    const email = byId('adminEmail')?.value.trim();
    const password = byId('adminPass')?.value || '';
    const submit = byId('loginSubmit');
    if (!email || !password) { setMessage('Saisissez votre adresse e-mail et votre mot de passe.'); return; }
    if (submit) submit.disabled = true;
    setMessage('Vérification de la session…', false);
    try {
      const session = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
      saveSession(session);
      const profile = await verifyAdmin();
      byId('adminPass').value = '';
      setMessage('');
      activate(profile);
    } catch (error) {
      clearSession();
      setMessage(error?.message === 'administrator access required' ? 'Ce compte ne possède pas le rôle administrateur actif.' : 'Connexion impossible. Vérifiez vos accès Supabase Auth.');
    } finally { if (submit) submit.disabled = false; }
  };
  window.logoutAdmin = async () => {
    try { if (token()) await request('/auth/v1/logout', { method: 'POST', headers: { Authorization: `Bearer ${token()}` } }); } catch (_) {}
    clearSession();
    location.reload();
  };
  document.addEventListener('DOMContentLoaded', async () => {
    const session = safeSession();
    if (isExpired(session)) { clearSession(); return; }
    saveSession(session);
    setMessage('Restauration de la session…', false);
    try { activate(await verifyAdmin()); setMessage(''); }
    catch (_) { clearSession(); setMessage('Votre session a expiré. Connectez-vous à nouveau.'); }
  }, { once: true });
})();
