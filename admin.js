
let drafts = { news: [], featured: {}, live: {}, gallery: [], videos: [] };
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
}
function resetDrafts(){
  if(!confirm('Réinitialiser les brouillons locaux ?')) return;
  ['mpbp_news_draft','mpbp_featured_draft','mpbp_live_draft','mpbp_gallery_draft','mpbp_videos_draft'].forEach(k => localStorage.removeItem(k));
  location.reload();
}
init();
