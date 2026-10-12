/* Admin-only Firestore adapter. Unknown RPCs fail closed. No fabricated traffic. */
(() => {
  'use strict';
  const statuses=['pending','approved','rejected','hidden','deleted'];
  let cachedClips;
  async function clipStats(sdk){
    if(cachedClips && Date.now()-cachedClips.at<15000)return cachedClips.promise;
    const promise=(async()=>{
      const registry=await sdk.getDocs(sdk.collection(sdk.db,'content_registry'));
      return Promise.all(registry.docs.filter(d=>d.data().active===true).map(async entry=>{
        const totals=await Promise.all(['views','likes'].map(name=>sdk.getCountFromServer(sdk.collection(sdk.db,'engagement',entry.id,name))));
        return {video_id:entry.id,title:entry.data().title||entry.id,views:totals[0].data().count,likes:totals[1].data().count};
      }));
    })();
    cachedClips={at:Date.now(),promise};
    promise.catch(()=>{cachedClips=null;});return promise;
  }
  async function rpc(name,args,sdk){
    const comments=sdk.collection(sdk.db,'comments');
    if(name==='get_admin_clip_stats')return clipStats(sdk);
    if(name==='get_admin_dashboard_summary'){
      const [clips,pending,approved]=await Promise.all([clipStats(sdk),...['pending','approved'].map(status=>sdk.getCountFromServer(sdk.query(comments,sdk.where('status','==',status))))]);
      return {views:clips.reduce((n,c)=>n+c.views,0),likes:clips.reduce((n,c)=>n+c.likes,0),pending_comments:pending.data().count,approved_comments:approved.data().count};
    }
    if(name==='admin_list_comments'){
      if(!statuses.includes(args.p_status)&&args.p_status!=='all')throw new Error('Filtre invalide.');
      const filters=args.p_status==='all'?[]:[sdk.where('status','==',args.p_status)];
      const result=await sdk.getDocs(sdk.query(comments,...filters,sdk.limit(200)));
      return result.docs.map(entry=>{const d=entry.data();return {id:entry.id,content_id:d.contentId,display_name:d.displayName,message:d.message,status:d.status,created_at:d.createdAt?.toDate().toISOString()||null};}).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
    }
    if(name==='admin_moderate_comment'||name==='admin_delete_comment'){
      const status=name==='admin_delete_comment'?'deleted':args.p_new_status;
      if(!statuses.includes(status)||!/^[\w-]{1,160}$/.test(args.p_comment_id||''))throw new Error('Modération invalide.');
      await sdk.updateDoc(sdk.doc(sdk.db,'comments',args.p_comment_id),{status});return {ok:true};
    }
    throw new Error('RPC non pris en charge : '+name);
  }
  window.MPBP440AdminData=Object.freeze({rpc});
  document.addEventListener('mpbp-registry-ready',()=>{cachedClips=null;});
})();

/* Private Firestore analytics and comment moderation, after Firebase admin verification. */
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
      const [summary,clipsData]=await Promise.all([rpc('get_admin_dashboard_summary'),rpc('get_admin_clip_stats')]);
      const cards=$('adminAnalyticsCards');cards.replaceChildren();
      [['Vues uniques des clips',summary.views],['J’aime des clips',summary.likes],['Commentaires à modérer',summary.pending_comments],['Commentaires approuvés',summary.approved_comments]].forEach(([label,value])=>{
        const card=document.createElement('div');card.className='metric';
        const strong=document.createElement('strong');strong.textContent=count(value);
        const span=document.createElement('span');span.textContent=label;card.append(strong,span);cards.append(card);
      });
      const views=[...clipsData].sort((a,b)=>b.views-a.views),likes=[...clipsData].sort((a,b)=>b.likes-a.likes);
      renderRows('adminClipStats',clipsData,item=>[item.title||clips[item.video_id]||item.video_id,count(item.views),'#'+(views.indexOf(item)+1),count(item.likes),'#'+(likes.indexOf(item)+1)]);
      renderRows('adminArtistStats',[],()=>[]);renderRows('adminPageStats',[],()=>[]);
      const activity=$('adminRecentActivity');activity.replaceChildren();
      const note=document.createElement('li');note.textContent='Trafic site, artistes, pages et activité : consulter Google Analytics 4. Aucun historique fictif.';activity.append(note);
      setStatus('analyticsStatus','Google Analytics 4 actif — ');
      const link=document.createElement('a');link.href='https://analytics.google.com/analytics/web/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Ouvrir la console Analytics';$('analyticsStatus').append(link);

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
  document.addEventListener('mpbp-registry-ready',loadAnalytics);
})();
