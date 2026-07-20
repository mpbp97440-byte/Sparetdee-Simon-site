/* Private analytics and comment moderation; all data is retrieved through
 * admin-only RPCs after auth.js has verified public.admin_users. */
(() => {
  'use strict';
  const clips = {'l-argent':'L’Argent','clip-je-sais-que-tu-sais':'Je sais que tu sais','clip-j-existe':'J’existe','clip-dois-je-me-taire':'Dois-je me taire ?'};
  const artists = {'sparetdee-simon':'Sparetdee Simon','makeda-muse':'Makéda Muse','juste-une-plume':'Juste Une Plume'};
  const $ = (id) => document.getElementById(id);
  const count = (value) => new Intl.NumberFormat('fr-FR').format(Number(value) || 0);
  const date = (value) => value ? new Intl.DateTimeFormat('fr-FR', {dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '—';
  const setStatus = (id, message, error = false) => { const node = $(id); if (node) { node.textContent = message; node.classList.toggle('success', !error && Boolean(message)); } };
  const textCell = (row, value) => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); };
  const renderRows = (id, rows, values) => { const body = $(id); if (!body) return; body.replaceChildren(); rows.forEach((row) => { const tr = document.createElement('tr'); values(row).forEach((value) => textCell(tr, value)); body.append(tr); }); };
  const rpc = (name, args) => window.MPBP440Admin?.rpc(name, args);

  async function loadAnalytics() {
    setStatus('analyticsStatus', 'Chargement des statistiques…');
    try {
      const [summary, clipsData, artistsData, pagesData, activity] = await Promise.all([rpc('get_admin_dashboard_summary'), rpc('get_admin_clip_stats'), rpc('get_admin_artist_stats'), rpc('get_admin_page_stats'), rpc('get_admin_recent_activity')]);
      const cards = $('adminAnalyticsCards'); cards.replaceChildren();
      [['Visites aujourd’hui',summary.visits_today],['7 derniers jours',summary.visits_7_days],['30 derniers jours',summary.visits_30_days],['Visites totales',summary.visits_total],['Commentaires à modérer',summary.pending_comments]].forEach(([label,value]) => { const card = document.createElement('div'); card.className='metric'; const strong=document.createElement('strong'); strong.textContent=count(value); const span=document.createElement('span'); span.textContent=label; card.append(strong,span); cards.append(card); });
      const rankByViews = [...(clipsData || [])].sort((a,b) => Number(b.views) - Number(a.views));
      const rankByLikes = [...(clipsData || [])].sort((a,b) => Number(b.likes) - Number(a.likes));
      const viewRank = new Map(rankByViews.map((item,index) => [item.video_id, index + 1]));
      const likeRank = new Map(rankByLikes.map((item,index) => [item.video_id, index + 1]));
      renderRows('adminClipStats', clipsData || [], (item) => [clips[item.video_id] || item.video_id, count(item.views), `#${viewRank.get(item.video_id)}`, count(item.likes), `#${likeRank.get(item.video_id)}`]);
      renderRows('adminArtistStats', artistsData || [], (item) => [artists[item.artist_key] || item.artist_key, count(item.visits)]);
      renderRows('adminPageStats', pagesData || [], (item) => [item.path, count(item.visits)]);
      const activityList = $('adminRecentActivity'); activityList.replaceChildren(); (activity || []).forEach((item) => { const li=document.createElement('li'); li.textContent=`${item.kind} — ${date(item.occurred_at)}`; activityList.append(li); });
      setStatus('analyticsStatus', `Dernière activité : ${date(summary.last_activity)}`);
    } catch (_) { setStatus('analyticsStatus', 'Les statistiques privées sont momentanément indisponibles.', true); }
  }

  const actionLabels = {pending:['Approuver','approved'],approved:['Masquer','hidden'],hidden:['Restaurer','pending'],rejected:['Restaurer','pending'],deleted:['Restaurer','pending']};
  async function loadComments() {
    const filter = $('adminCommentFilter')?.value || 'pending'; setStatus('commentsStatus','Chargement des commentaires…');
    try {
      const items = await rpc('admin_list_comments', {p_status:filter}); const list=$('adminCommentsList'); list.replaceChildren();
      if (!items?.length) { const empty=document.createElement('p'); empty.className='muted'; empty.textContent='Aucun commentaire pour ce filtre.'; list.append(empty); }
      (items || []).forEach((item) => {
        const article=document.createElement('article'); article.className='comment-admin-card';
        const meta=document.createElement('p'); meta.className='comment-admin-meta'; meta.textContent=`${clips[item.content_id] || item.content_id} · ${item.display_name} · ${date(item.created_at)} · ${item.status}`;
        const message=document.createElement('p'); message.className='comment-admin-message'; message.textContent=item.message;
        const actions=document.createElement('div'); actions.className='actions';
        const [label,status]=actionLabels[item.status] || actionLabels.pending;
        const update=document.createElement('button'); update.type='button'; update.className='btn ghost'; update.textContent=label; update.addEventListener('click',()=>moderate(item.id,status));
        const reject=document.createElement('button'); reject.type='button'; reject.className='btn ghost'; reject.textContent='Refuser'; reject.disabled=item.status==='rejected'||item.status==='deleted'; reject.addEventListener('click',()=>moderate(item.id,'rejected'));
        const remove=document.createElement('button'); remove.type='button'; remove.className='btn danger'; remove.textContent='Supprimer'; remove.disabled=item.status==='deleted'; remove.addEventListener('click',()=>removeComment(item.id));
        actions.append(update,reject,remove); article.append(meta,message,actions); list.append(article);
      });
      setStatus('commentsStatus', `${items?.length || 0} commentaire(s) affiché(s).`);
    } catch (_) { setStatus('commentsStatus','Les commentaires sont momentanément indisponibles.',true); }
  }
  async function moderate(id, status) { setStatus('commentsStatus','Mise à jour…'); try { await rpc('admin_moderate_comment',{p_comment_id:id,p_new_status:status}); await loadComments(); } catch (_) { setStatus('commentsStatus','La modération a échoué.',true); } }
  async function removeComment(id) { if (!confirm('Supprimer ce commentaire de l’espace public ?')) return; setStatus('commentsStatus','Suppression…'); try { await rpc('admin_delete_comment',{p_comment_id:id}); await loadComments(); } catch (_) { setStatus('commentsStatus','La suppression a échoué.',true); } }
  function init() { document.querySelectorAll('[data-admin-reload]').forEach((button)=>button.addEventListener('click',()=>button.dataset.adminReload==='analytics'?loadAnalytics():loadComments())); $('adminCommentFilter')?.addEventListener('change',loadComments); loadAnalytics(); loadComments(); }
  document.addEventListener('mpbp-admin-ready', init, {once:true});
})();
