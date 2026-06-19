
let drafts = { news: [], featured: {}, live: {}, gallery: [], videos: [], releases: [], countdowns: [], events: [] };
let preparedMedia = { file:null, filename:'', path:'', url:'' };

async function loadJson(path, fallback){
  try{ const r = await fetch(path,{cache:'no-store'}); return await r.json(); }
  catch(e){ return fallback; }
}

async function init(){
  drafts.news = JSON.parse(localStorage.getItem('mpbp_news_draft') || 'null') || await loadJson('data/news.json',[]);
  drafts.featured = JSON.parse(localStorage.getItem('mpbp_featured_draft') || 'null') || await loadJson('data/featured.json',{});
  drafts.live = JSON.parse(localStorage.getItem('mpbp_live_draft') || 'null') || await loadJson('data/live_status.json',{is_live:false});
  drafts.gallery = JSON.parse(localStorage.getItem('mpbp_gallery_draft') || 'null') || await loadJson('data/gallery.json',[]);
  drafts.videos = JSON.parse(localStorage.getItem('mpbp_videos_draft') || 'null') || await loadJson('data/videos.json',[]);
  drafts.releases = JSON.parse(localStorage.getItem('mpbp_releases_draft') || 'null') || await loadJson('data/releases.json',[]);
  drafts.countdowns = JSON.parse(localStorage.getItem('mpbp_countdowns_draft') || 'null') || await loadJson('data/countdowns.json',[]);
  drafts.events = JSON.parse(localStorage.getItem('mpbp_events_draft') || 'null') || await loadJson('data/events.json',[]);

  const events = await loadJson('data/events.json',[]);
  const artists = await loadJson('data/artists.json',[]);

  document.getElementById('eventsCount').textContent = events.length;
  document.getElementById('artistsCount').textContent = artists.length;
  document.getElementById('featuredTitle').value = drafts.featured.title || '';
  document.getElementById('featuredArtist').value = drafts.featured.artist || '';
  document.getElementById('featuredDate').value = drafts.featured.date || '';
  document.getElementById('featuredCover').value = drafts.featured.cover || '';
  document.getElementById('featuredDescription').value = drafts.featured.description || '';
  document.getElementById('liveUrl').value = drafts.live.url || 'https://www.tiktok.com/@simonsparet/live';
  render();
}

function slugify(text){
  return (text || 'media')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .substring(0,80) || 'media';
}

function prepareMedia(){
  const fileInput = document.getElementById('mediaFile');
  const file = fileInput.files[0];
  if(!file){ alert('Choisis une image.'); return; }

  const folder = document.getElementById('mediaFolder').value;
  const title = document.getElementById('mediaTitle').value || file.name.replace(/\.[^.]+$/,'');
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const filename = `${slugify(title)}.${ext}`;
  const path = `${folder}/${filename}`;

  preparedMedia = { file, filename, path, url: URL.createObjectURL(file) };

  document.getElementById('mediaPath').textContent = path;
  const img = document.getElementById('mediaPreview');
  img.src = preparedMedia.url;
  img.alt = title;

  render();
}

function downloadRenamedMedia(){
  if(!preparedMedia.file){ alert('Prépare d’abord une image.'); return; }
  const a = document.createElement('a');
  a.href = preparedMedia.url;
  a.download = preparedMedia.filename;
  a.click();
}

async function copyMediaPath(){
  if(!preparedMedia.path){ alert('Prépare d’abord une image.'); return; }
  await navigator.clipboard.writeText(preparedMedia.path);
  alert('Chemin image copié.');
}

function useMediaForFeatured(){
  if(!preparedMedia.path){ alert('Prépare d’abord une image.'); return; }
  document.getElementById('featuredCover').value = preparedMedia.path;
  saveFeaturedDraft();
}

function useMediaForGallery(){
  if(!preparedMedia.path){ alert('Prépare d’abord une image.'); return; }
  document.getElementById('galleryImage').value = preparedMedia.path;
}

function persist(){
  localStorage.setItem('mpbp_news_draft', JSON.stringify(drafts.news));
  localStorage.setItem('mpbp_featured_draft', JSON.stringify(drafts.featured));
  localStorage.setItem('mpbp_live_draft', JSON.stringify(drafts.live));
  localStorage.setItem('mpbp_gallery_draft', JSON.stringify(drafts.gallery));
  localStorage.setItem('mpbp_videos_draft', JSON.stringify(drafts.videos));
  localStorage.setItem('mpbp_releases_draft', JSON.stringify(drafts.releases));
  localStorage.setItem('mpbp_countdowns_draft', JSON.stringify(drafts.countdowns));
  localStorage.setItem('mpbp_events_draft', JSON.stringify(drafts.events));
  render();
}

function render(){
  document.getElementById('draftPreview').textContent = JSON.stringify(drafts, null, 2);
  document.getElementById('livePreview').textContent = JSON.stringify(drafts.live, null, 2);
  document.getElementById('newsCount').textContent = drafts.news.length;
  document.getElementById('liveStatus').textContent = drafts.live.is_live ? 'EN DIRECT' : 'HORS LIGNE';

  const latestNews = drafts.news[0] || {};
  document.getElementById('previewFeaturedTitle').textContent = drafts.featured.title || '--';
  document.getElementById('previewFeaturedText').textContent = `${drafts.featured.artist || ''} ${drafts.featured.date || ''} — ${drafts.featured.description || ''}`;
  document.getElementById('previewLiveTitle').textContent = drafts.live.is_live ? 'EN DIRECT' : 'HORS LIGNE';
  document.getElementById('previewLiveText').textContent = drafts.live.is_live ? (drafts.live.url || '') : 'Le site affichera le prochain live.';
  document.getElementById('previewNewsTitle').textContent = latestNews.title || '--';
  document.getElementById('previewNewsText').textContent = latestNews.text || '--';
  document.getElementById('previewMediaTitle').textContent = preparedMedia.filename || '--';
  document.getElementById('previewMediaText').textContent = preparedMedia.path || '--';
}

function addNews(){
  const item = {
    date: document.getElementById('newsDate').value,
    type: document.getElementById('newsType').value || 'actualité',
    title: document.getElementById('newsTitle').value,
    text: document.getElementById('newsText').value
  };
  if(!item.title || !item.text){ alert('Titre et texte obligatoires.'); return; }
  drafts.news.unshift(item);
  persist();
}

function saveFeaturedDraft(){
  drafts.featured = {
    title: document.getElementById('featuredTitle').value,
    artist: document.getElementById('featuredArtist').value,
    date: document.getElementById('featuredDate').value,
    cover: document.getElementById('featuredCover').value,
    description: document.getElementById('featuredDescription').value
  };
  persist();
}

function addGallery(){
  const item = {
    title: document.getElementById('galleryTitle').value,
    category: document.getElementById('galleryCategory').value,
    image: document.getElementById('galleryImage').value,
    description: document.getElementById('galleryDescription').value
  };
  if(!item.title || !item.image){ alert('Titre et image obligatoires.'); return; }
  drafts.gallery.unshift(item);
  persist();
}

function youtubeId(url){
  try{
    const u = new URL(url);
    if(u.hostname.includes('youtu.be')) return u.pathname.replace('/','');
    if(u.searchParams.get('v')) return u.searchParams.get('v');
    if(u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split('/')[0];
  }catch(e){}
  return '';
}

function addVideo(){
  const url = document.getElementById('videoUrl').value;
  const item = {
    title: document.getElementById('videoTitle').value,
    artist: document.getElementById('videoArtist').value,
    url,
    youtubeId: youtubeId(url),
    description: document.getElementById('videoDescription').value
  };
  if(!item.title || !item.url){ alert('Titre et lien obligatoires.'); return; }
  drafts.videos.unshift(item);
  persist();
}

function setLive(value){
  drafts.live = {
    is_live: value,
    platform: 'TikTok',
    title: value ? 'Live TikTok MPBP440' : 'Prochain Live TikTok',
    url: document.getElementById('liveUrl').value || 'https://www.tiktok.com/@simonsparet/live',
    fallback_url: 'https://www.tiktok.com/@simonsparet',
    message_live: '🔴 En direct maintenant — rejoins le live TikTok',
    message_offline: 'Prochain live TikTok annoncé ici',
    updated_at: new Date().toISOString()
  };
  persist();
}

function asJson(type){
  if(type === 'news') return JSON.stringify(drafts.news, null, 2);
  if(type === 'featured') return JSON.stringify(drafts.featured, null, 2);
  if(type === 'live') return JSON.stringify(drafts.live, null, 2);
  if(type === 'gallery') return JSON.stringify(drafts.gallery, null, 2);
  if(type === 'videos') return JSON.stringify(drafts.videos, null, 2);
  return JSON.stringify(drafts, null, 2);
}

async function copyJson(type){
  await navigator.clipboard.writeText(asJson(type));
  alert(type + '.json copié dans le presse-papiers.');
}
async function copyAll(){
  await navigator.clipboard.writeText(JSON.stringify(drafts, null, 2));
  alert('Tous les brouillons ont été copiés.');
}

function downloadFile(filename, data){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function downloadNews(){ downloadFile('news.json', drafts.news); }
function downloadFeatured(){ downloadFile('featured.json', drafts.featured); }
function downloadLive(){ downloadFile('live_status.json', drafts.live); }
function downloadGallery(){ downloadFile('gallery.json', drafts.gallery); }
function downloadVideos(){ downloadFile('videos.json', drafts.videos); }
function downloadAll(){
  downloadNews();
  setTimeout(downloadFeatured, 250);
  setTimeout(downloadLive, 500);
  setTimeout(downloadGallery, 750);
  setTimeout(downloadVideos, 1000);
  setTimeout(downloadReleases, 1250);
  setTimeout(downloadCountdowns, 1500);
  setTimeout(downloadEvents, 1750);
}
function resetDrafts(){
  if(!confirm('Réinitialiser les brouillons locaux ?')) return;
  ['mpbp_news_draft','mpbp_featured_draft','mpbp_live_draft','mpbp_gallery_draft','mpbp_videos_draft','mpbp_releases_draft','mpbp_countdowns_draft','mpbp_events_draft'].forEach(k => localStorage.removeItem(k));
  location.reload();
}
init();


function useMediaForRelease(){
  if(!preparedMedia.path){ alert('Prépare d’abord une image.'); return; }
  document.getElementById('releaseCover').value = preparedMedia.path;
}
function addReleasePack(){
  const artist = document.getElementById('releaseArtist').value;
  const title = document.getElementById('releaseTitle').value;
  const date = document.getElementById('releaseDate').value;
  const cover = document.getElementById('releaseCover').value;
  const description = document.getElementById('releaseDescription').value;
  if(!artist || !title || !date){ alert('Artiste, titre et date obligatoires.'); return; }
  const frDate = date.split('-').reverse().join('/');
  const links = {
    spotify: document.getElementById('releaseSpotify').value,
    apple: document.getElementById('releaseApple').value,
    deezer: document.getElementById('releaseDeezer').value,
    youtube: document.getElementById('releaseYoutube').value,
    amazon: document.getElementById('releaseAmazon').value
  };
  const release = {artist,title,date:frDate,isoDate:date,cover,description,links,status:'À venir'};
  drafts.releases.unshift(release);
  drafts.countdowns.unshift({title:`${title} — ${artist}`,artist,date:`${date}T00:00:00+02:00`,label:`Prochaine sortie ${artist}`,description,cover});
  drafts.events.unshift({title:`Sortie officielle — ${title}`,date:frDate,time:"00h00",place:"Toutes les plateformes",description:description || `${title} de ${artist} disponible sur toutes les plateformes.`,cover,buttonText:"Écouter",url:links.spotify || links.youtube || links.apple || "#"});
  drafts.news.unshift({date,type:"sortie",title:`${title} — sortie officielle`,text:description || `${artist} présente ${title}, disponible le ${frDate} sur toutes les plateformes.`});
  persist();
  alert('Pack sortie créé : releases, countdowns, events et news mis à jour.');
}
function downloadReleases(){ downloadFile('releases.json', drafts.releases); }
function downloadCountdowns(){ downloadFile('countdowns.json', drafts.countdowns); }
function downloadEvents(){ downloadFile('events.json', drafts.events); }


/* V3.5.0 — Dashboard Pro */
function parseDateFromRelease(item){
  if(item.isoDate) return item.isoDate;
  if(item.date && /^\d{2}\/\d{2}\/\d{4}$/.test(item.date)){
    const [d,m,y] = item.date.split('/');
    return `${y}-${m}-${d}`;
  }
  if(item.date && item.date.includes('T')) return item.date.split('T')[0];
  return item.date || '';
}

function renderDashboardPro(){
  const rel = drafts.releases || [];
  const vids = drafts.videos || [];
  const gal = drafts.gallery || [];
  const cnt = drafts.countdowns || [];

  const byId = (id) => document.getElementById(id);
  if(byId('releaseCount')) byId('releaseCount').textContent = rel.length;
  if(byId('videoCount')) byId('videoCount').textContent = vids.length;
  if(byId('galleryCount')) byId('galleryCount').textContent = gal.length;
  if(byId('countdownCount')) byId('countdownCount').textContent = cnt.length;

  const calendar = byId('releaseCalendar');
  if(calendar){
    const items = [...rel, ...cnt.map(c => ({
      title: c.title,
      artist: c.artist || '',
      date: c.date,
      cover: c.cover,
      status: 'Compte à rebours'
    }))];

    items.sort((a,b) => (parseDateFromRelease(a)||'').localeCompare(parseDateFromRelease(b)||''));

    calendar.innerHTML = items.length ? items.map(item => `
      <article class="calendar-item">
        <div>
          <strong>${item.title || 'Sans titre'}</strong>
          <span>${item.artist || ''}</span>
        </div>
        <time>${item.date || item.isoDate || 'Date non définie'}</time>
        <em>${item.status || 'Sortie'}</em>
      </article>
    `).join('') : '<p class="muted">Aucune sortie programmée dans les brouillons.</p>';
  }

  const media = byId('mediaManager');
  if(media){
    const mediaItems = [
      ...gal.map(g => ({type:'Galerie', title:g.title, path:g.image})),
      ...rel.map(r => ({type:'Pochette', title:r.title, path:r.cover})),
      ...vids.map(v => ({type:'Vidéo', title:v.title, path:v.url}))
    ].filter(x => x.path || x.title);

    media.innerHTML = mediaItems.length ? mediaItems.map((m, i) => `
      <article class="media-admin-card">
        <p class="sup">${m.type}</p>
        <h3>${m.title || 'Sans titre'}</h3>
        <code>${m.path || ''}</code>
        <button class="btn ghost" onclick="navigator.clipboard.writeText('${String(m.path || '').replace(/'/g,"\\'")}')">Copier chemin</button>
      </article>
    `).join('') : '<p class="muted">Aucun média préparé dans les brouillons.</p>';
  }

  const notif = byId('adminNotifications');
  if(notif){
    const notices = [];
    rel.forEach(r => {
      if(!r.cover) notices.push(`La sortie "${r.title}" n’a pas encore de pochette.`);
      if(!r.links || !Object.values(r.links).some(Boolean)) notices.push(`La sortie "${r.title}" n’a aucun lien plateforme.`);
    });
    vids.forEach(v => {
      if(!v.youtubeId) notices.push(`La vidéo "${v.title}" n’a pas d’identifiant YouTube détecté.`);
    });
    cnt.forEach(c => {
      if(!c.date) notices.push(`Un compte à rebours n’a pas de date.`);
    });

    notif.innerHTML = notices.length ? notices.map(n => `<article>⚠ ${n}</article>`).join('') : '<article>✅ Aucun point bloquant détecté dans les brouillons.</article>';
  }
}

const oldRender = render;
render = function(){
  oldRender();
  renderDashboardPro();
};


/* V3.6.0 — Studio de publication */
let studioBackup = null;
let checklistItems = [
  "Vérifier les titres",
  "Vérifier les dates",
  "Vérifier les pochettes",
  "Vérifier les liens plateformes",
  "Vérifier l’affichage mobile"
];

function makeStudioBackup(){
  studioBackup = {
    version: "3.6.0",
    created_at: new Date().toISOString(),
    drafts: JSON.parse(JSON.stringify(drafts))
  };
  localStorage.setItem("mpbp_studio_backup", JSON.stringify(studioBackup));
  renderStudio();
  alert("Sauvegarde créée dans le navigateur.");
}

function downloadStudioBackup(){
  if(!studioBackup){
    const saved = localStorage.getItem("mpbp_studio_backup");
    if(saved) studioBackup = JSON.parse(saved);
  }
  if(!studioBackup){ alert("Aucune sauvegarde disponible."); return; }
  const blob = new Blob([JSON.stringify(studioBackup, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mpbp440-studio-backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function restoreStudioBackup(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const backup = JSON.parse(reader.result);
      if(!backup.drafts){ alert("Sauvegarde invalide."); return; }
      drafts = backup.drafts;
      persist();
      localStorage.setItem("mpbp_studio_backup", JSON.stringify(backup));
      studioBackup = backup;
      renderStudio();
      alert("Sauvegarde restaurée.");
    }catch(e){ alert("Impossible de lire la sauvegarde."); }
  };
  reader.readAsText(file);
}

function renderChecklist(){
  const box = document.getElementById("publishingChecklist");
  if(!box) return;
  const saved = JSON.parse(localStorage.getItem("mpbp_checklist") || "{}");
  box.innerHTML = checklistItems.map((label, i) => `
    <label class="check-item">
      <input type="checkbox" ${saved[label] ? "checked" : ""} onchange="toggleChecklist('${label.replace(/'/g,"\\'")}', this.checked)">
      <span>${label}</span>
    </label>
  `).join("");
}

function toggleChecklist(label, value){
  const saved = JSON.parse(localStorage.getItem("mpbp_checklist") || "{}");
  saved[label] = value;
  localStorage.setItem("mpbp_checklist", JSON.stringify(saved));
  renderStudio();
}

function analyzePublishingState(){
  const warnings = [];
  (drafts.releases || []).forEach(r => {
    if(!r.cover) warnings.push(`Pochette manquante : ${r.title}`);
    if(!r.date && !r.isoDate) warnings.push(`Date manquante : ${r.title}`);
    if(!r.links || !Object.values(r.links).some(Boolean)) warnings.push(`Liens plateformes manquants : ${r.title}`);
  });
  (drafts.videos || []).forEach(v => {
    if(!v.youtubeId) warnings.push(`Identifiant YouTube manquant : ${v.title}`);
  });
  return warnings;
}

function renderStudio(){
  const status = document.getElementById("studioStatus");
  const text = document.getElementById("studioStatusText");
  const last = document.getElementById("lastBackupDate");
  if(!status || !text) return;

  const warnings = analyzePublishingState();
  if(warnings.length){
    status.textContent = "À vérifier";
    text.textContent = warnings.slice(0,4).join(" • ");
  }else{
    status.textContent = "Prêt à publier";
    text.textContent = "Aucun point bloquant détecté dans les brouillons.";
  }

  const saved = localStorage.getItem("mpbp_studio_backup");
  if(saved){
    try{
      const b = JSON.parse(saved);
      if(last) last.textContent = new Date(b.created_at).toLocaleString();
    }catch(e){}
  }
  renderChecklist();
}

const oldRenderStudioBase = render;
render = function(){
  oldRenderStudioBase();
  renderStudio();
};


/* V3.6.1 — Studio Pro+ */
function getAllPreparedMedia(){
  const media = [];
  (drafts.gallery || []).forEach((g, i) => media.push({type:"Galerie", title:g.title, path:g.image, index:i, source:"gallery"}));
  (drafts.releases || []).forEach((r, i) => media.push({type:"Pochette", title:r.title, path:r.cover, index:i, source:"releases"}));
  if(preparedMedia && preparedMedia.path) media.unshift({type:"Image préparée", title:preparedMedia.filename, path:preparedMedia.path, preview:preparedMedia.url, source:"prepared"});
  return media.filter(m => m.path || m.title);
}

function removeDraftItem(source, index){
  if(!confirm("Supprimer cet élément du brouillon ?")) return;
  if(source === "gallery") drafts.gallery.splice(index, 1);
  if(source === "releases") drafts.releases.splice(index, 1);
  persist();
}

function renderVisualMediaManager(){
  const box = document.getElementById("visualMediaManager");
  if(!box) return;
  const items = getAllPreparedMedia();
  box.innerHTML = items.length ? items.map(m => {
    const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(m.path || "");
    const preview = m.preview || (isImg ? m.path : "");
    return `
      <article class="visual-media-card">
        ${preview ? `<img src="${preview}" alt="">` : `<div class="media-placeholder">🖼️</div>`}
        <p class="sup">${m.type}</p>
        <h3>${m.title || "Sans titre"}</h3>
        <code>${m.path || ""}</code>
        <div>
          <button class="btn ghost" onclick="navigator.clipboard.writeText('${String(m.path || "").replace(/'/g,"\\'")}')">Copier chemin</button>
          ${m.source !== "prepared" ? `<button class="btn ghost" onclick="removeDraftItem('${m.source}', ${m.index})">Supprimer</button>` : ""}
        </div>
      </article>`;
  }).join("") : '<p class="muted">Aucun média préparé.</p>';
}

function renderAdvancedVideoManager(){
  const box = document.getElementById("advancedVideoManager");
  if(!box) return;
  const vids = drafts.videos || [];
  box.innerHTML = vids.length ? vids.map((v, i) => {
    const thumb = v.youtubeId ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` : "";
    return `
      <article class="visual-media-card">
        ${thumb ? `<img src="${thumb}" alt="">` : `<div class="media-placeholder">🎬</div>`}
        <p class="sup">${v.artist || "Vidéo"}</p>
        <h3>${v.title || "Sans titre"}</h3>
        <p>${v.description || ""}</p>
        <code>${v.url || ""}</code>
        <div>
          <button class="btn ghost" onclick="navigator.clipboard.writeText('${String(v.url || "").replace(/'/g,"\\'")}')">Copier lien</button>
          <button class="btn ghost" onclick="drafts.videos.splice(${i},1); persist();">Supprimer</button>
        </div>
      </article>`;
  }).join("") : '<p class="muted">Aucune vidéo préparée.</p>';
}

function renderStudioPlusCards(){
  const nextEl = document.getElementById("nextReleaseCard");
  const newsEl = document.getElementById("lastNewsCard");
  const platformEl = document.getElementById("platformCountCard");
  const mediaEl = document.getElementById("mediaCountCard");

  const releases = drafts.releases || [];
  const sorted = [...releases].sort((a,b) => (a.isoDate || a.date || "").localeCompare(b.isoDate || b.date || ""));
  if(nextEl) nextEl.textContent = sorted[0]?.title || "--";
  if(newsEl) newsEl.textContent = (drafts.news || [])[0]?.title || "--";

  let platformCount = 0;
  releases.forEach(r => {
    if(r.links) platformCount += Object.values(r.links).filter(Boolean).length;
  });
  if(platformEl) platformEl.textContent = platformCount;

  if(mediaEl) mediaEl.textContent = getAllPreparedMedia().length;
}

function createRestorePoint(){
  const point = {
    created_at: new Date().toISOString(),
    drafts: JSON.parse(JSON.stringify(drafts))
  };
  localStorage.setItem("mpbp_restore_point", JSON.stringify(point));
  alert("Point de restauration créé.");
}

function restoreLastPoint(){
  const saved = localStorage.getItem("mpbp_restore_point");
  if(!saved){ alert("Aucun point de restauration trouvé."); return; }
  if(!confirm("Restaurer le dernier point ?")) return;
  const point = JSON.parse(saved);
  drafts = point.drafts;
  persist();
  alert("Point de restauration restauré.");
}

const oldRenderV361 = render;
render = function(){
  oldRenderV361();
  renderVisualMediaManager();
  renderAdvancedVideoManager();
  renderStudioPlusCards();
};
