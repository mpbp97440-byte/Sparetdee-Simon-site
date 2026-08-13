/* Resolve against the public site root, not the hostname root.  This keeps the
 * CMS working both at www.mpbp440.com and under the GitHub Pages preview path. */
const DATA_FILES = Object.freeze({
  site:"data.json",
  music:"data/music-library.json",
  releases:"data/releases.json",
  countdowns:"data/countdowns.json",
  videos:"data/videos.json",
  gallery:"data/gallery.json",
  events:"data/events.json",
  news:"data/news.json"
});

const state = {
  original:{},
  data:{},
  media:new Map(),
  ready:false,
  changes:[]
};

const $ = id => document.getElementById(id);
const text = value => String(value || "").trim();
const clone = value => JSON.parse(JSON.stringify(value));

function slugify(value){
  return text(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80) || "media";
}
function fileExt(file, fallback="jpg"){
  return (file?.name?.split(".").pop() || fallback).toLowerCase().replace(/[^a-z0-9]/g,"") || fallback;
}
function localPath(folder, title, file){
  return `${folder}/${slugify(title || file?.name || "media")}.${fileExt(file)}`;
}
function setValue(id, value){ const el = $(id); if(el) el.value = value || ""; }
function getValue(id){ return text($(id)?.value); }
function markChanged(label="Modification enregistrée dans le brouillon"){ state.changes.unshift({label,at:new Date().toISOString()}); renderAll(); renderCmsStatus(); document.dispatchEvent(new CustomEvent("mpbp-cms-changed")); }
function linksFrom(prefix){
  return {
    Spotify:getValue(prefix+"Spotify"),
    "Apple Music":getValue(prefix+"Apple"),
    Deezer:getValue(prefix+"Deezer"),
    YouTube:getValue(prefix+"Youtube"),
    Amazon:getValue(prefix+"Amazon"),
    TikTok:getValue(prefix+"Tiktok"),
    Facebook:getValue(prefix+"Facebook"),
    Other:getValue(prefix+"Other")
  };
}
function cleanLinks(links){
  return Object.fromEntries(Object.entries(links || {}).filter(([,url]) => text(url)));
}
function ytId(url){
  try{
    const parsed = new URL(url);
    if(parsed.hostname.includes("youtu.be")) return parsed.pathname.replace("/","");
    return parsed.searchParams.get("v") || "";
  }catch(e){ return ""; }
}
function normalizeList(value){
  if(Array.isArray(value)) return value;
  if(value && Array.isArray(value.items)) return value.items;
  return [];
}
function visible(item){ return !item.hidden && item.status !== "Masqué"; }

async function loadJsonFile(key, url){
  const target = new URL("../" + url, document.baseURI);
  target.searchParams.set("admin", String(Date.now()));
  const res = await fetch(target, {cache:"no-store"});
  if(!res.ok) throw new Error(`${key} (${res.status})`);
  try { return await res.json(); }
  catch(_) { throw new Error(`${key} contient un JSON invalide`); }
}
async function loadAllData(){
  cmsMessage("Chargement des données publiées…", false);
  try {
    const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key,url]) => [key, await loadJsonFile(key,url)]));
    const next = Object.fromEntries(entries.map(([key,value]) => [key, clone(value)]));
    if(!next.site || typeof next.site !== "object" || Array.isArray(next.site)) throw new Error("data.json est invalide");
    for(const key of ["tracks","videos","gallery","events","upcoming","countdowns","label_artists"]){
      if(next.site[key] === undefined) next.site[key] = [];
      if(!Array.isArray(next.site[key])) throw new Error(`data.json.${key} doit être une collection`);
    }
    state.original = clone(next);
    state.data = clone(next);
    state.changes = [];
    state.ready = true;
    renderAll();
    renderCmsStatus();
    cmsMessage("Données publiées rechargées.", false);
    return true;
  } catch(error) {
    /* Never replace a real collection with an empty fallback after a network,
       path or JSON error.  Existing unsaved work stays untouched as well. */
    cmsMessage(`Chargement impossible : ${error.message}. Les données existantes sont conservées.`, true);
    renderCmsStatus();
    return false;
  }
}

function currentTracks(){ return state.data.site.tracks || []; }
function currentVideos(){ return state.data.site.videos || []; }
function currentGallery(){ return state.data.site.gallery || []; }
function currentEvents(){ return state.data.site.events || []; }
function currentNews(){ return normalizeList(state.data.news); }
function currentUpcoming(){ return state.data.site.upcoming || []; }
function currentArtists(){ return state.data.site.label_artists || []; }
function currentReleases(){ return normalizeList(state.data.releases); }
function currentLibrary(){ return normalizeList(state.data.music); }
function sameContent(a,b){ return a && b && (text(a.id) && text(a.id)===text(b.id) || (slugify(a.title)===slugify(b.title) && slugify(a.artist)===slugify(b.artist))); }
function normalizeArtistList(item){ return [...new Set([text(item.artist), ...(Array.isArray(item.artists)?item.artists:[]), ...(text(item.featuring).split(/,|feat\.?/i).map(text))].filter(Boolean))]; }
function setMirroredList(key, list){ state.data[key]=Array.isArray(state.data[key])?list:{...(state.data[key]||{}),items:list}; }
function copyRelease(item){ return clone({...item, id:item.id || slugify(`${item.artist}-${item.title}`), links:cleanLinks(item.links)}); }
function removeByContent(list,item){ return (list||[]).filter(candidate=>!sameContent(candidate,item)); }
function syncTrackRelations(item, previous){
  const normalized=copyRelease(item);
  normalized.artists=normalizeArtistList(normalized);
  const available=normalized.status === "Disponible";
  const upcoming=!available && /venir|bientot|bientôt/i.test(text(normalized.status));
  let library=removeByContent(currentLibrary(),previous||normalized);
  let releases=removeByContent(currentReleases(),previous||normalized);
  library.unshift(normalized); releases.unshift(normalized);
  setMirroredList("music",library); setMirroredList("releases",releases);
  let future=removeByContent(currentUpcoming(),previous||normalized);
  let countdowns=removeByContent(state.data.countdowns||[],previous||normalized);
  state.data.site.countdowns=removeByContent(state.data.site.countdowns||[],previous||normalized);
  if(upcoming){
    const futureItem={...normalized,status:"À venir",label:"Prochaine sortie officielle"};
    future.unshift(futureItem); countdowns.unshift(futureItem); state.data.site.countdowns.unshift(futureItem);
  }
  state.data.site.upcoming=future; state.data.countdowns=countdowns;
  if(available){
    const news=currentNews(); const existing=news.find(entry=>sameContent(entry,normalized));
    const announcement={id:`${normalized.id}-available`,title:`${normalized.title} est disponible maintenant`,date:normalized.date || new Date().toISOString().slice(0,10),type:"sortie",text:`${normalized.title}, le nouveau titre de ${normalized.artist}, est disponible dès maintenant sur les plateformes officielles.`,image:normalized.cover,url:"/music/index.html#morceaux",buttonText:`Écouter ${normalized.title}`};
    if(existing) Object.assign(existing,announcement); else news.unshift(announcement);
    setNewsList(news);
  }
}
function setNewsList(list){
  if(Array.isArray(state.data.news)){
    state.data.news = list;
  }else if(state.data.news && typeof state.data.news === "object"){
    state.data.news.items = list;
  }else{
    state.data.news = list;
  }
}

function saveFileInput(inputId, targetId, folder, titleId){
  const input = $(inputId);
  const file = input?.files?.[0];
  if(!file) return "";
  const path = localPath(folder, getValue(titleId), file);
  state.media.set(path, file);
  setValue(targetId, path);
  return path;
}

function initTabs(){
  document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tabPanel").forEach(p => p.classList.remove("active"));
      button.classList.add("active");
      $("tab-" + button.dataset.tab)?.classList.add("active");
    });
  });
}
function initActions(){
  document.body.addEventListener("click", event => {
    const action = event.target?.dataset?.action;
    if(!action) return;
    ({
      "save-track":saveTrack, "clear-track":clearTrack,
      "save-video":saveVideo, "clear-video":clearVideo,
      "save-gallery":saveGallery, "clear-gallery":clearGallery,
      "save-event":saveEvent, "clear-event":clearEvent,
      "save-news":saveNews, "clear-news":clearNews,
      "save-upcoming":saveUpcoming, "clear-upcoming":clearUpcoming,
      "save-artist":saveArtist, "clear-artist":clearArtist, "save-featured":saveFeatured,
      "export-zip":exportZip, "reset-work":resetWork
    })[action]?.();
  });
  $("reloadDataBtn")?.addEventListener("click", loadAllData);
  $("quickExportBtn")?.addEventListener("click", exportZip);
  $("trackMedia")?.addEventListener("change", () => saveFileInput("trackMedia","trackCover","assets/covers","trackTitle"));
  $("videoFile")?.addEventListener("change", () => saveFileInput("videoFile","videoSrc","assets/videos","videoTitle"));
  $("videoPosterFile")?.addEventListener("change", () => saveFileInput("videoPosterFile","videoPoster","assets/covers","videoTitle"));
  $("galleryFile")?.addEventListener("change", () => saveFileInput("galleryFile","galleryImage","assets/gallery","galleryTitle"));
  $("eventFile")?.addEventListener("change", () => saveFileInput("eventFile","eventCover","assets/gallery","eventTitle"));
  $("newsFile")?.addEventListener("change", () => saveFileInput("newsFile","newsImage","assets/gallery","newsTitle"));
  $("upcomingFile")?.addEventListener("change", () => saveFileInput("upcomingFile","upcomingCover","assets/covers","upcomingTitle"));
  $("artistFile")?.addEventListener("change", () => saveFileInput("artistFile","artistPhoto","assets/artists","artistName"));
  $("featuredType")?.addEventListener("change", renderFeaturedChoices);
}

function renderAll(){
  if(!state.ready) return;
  renderDashboard();
  renderTracks();
  renderVideos();
  renderGallery();
  renderEvents();
  renderNews();
  renderUpcoming();
  renderArtists();
  renderFeaturedChoices();
  renderExport();
}
function renderDashboard(){
  $("dashboardCards").innerHTML = [
    ["Morceaux", currentTracks().length],
    ["MPBP TV", currentVideos().length],
    ["Galerie", currentGallery().length],
    ["Événements", currentEvents().length],
    ["Actualités", currentNews().length],
    ["Médias ajoutés", state.media.size]
  ].map(([label,count]) => `<div class="metric"><strong>${count}</strong><span>${label}</span></div>`).join("");
  const items = [
    ...currentTracks().slice(0,4).map(item => ({title:item.title, sub:item.artist, image:item.cover})),
    ...currentUpcoming().slice(0,2).map(item => ({title:item.title, sub:item.date, image:item.cover}))
  ];
  $("previewCards").innerHTML = items.map(card => `
    <article class="preview-card">
      <img src="/${card.image || "assets/brand/mpbp440-corp-official.png"}" alt="">
      <div><h3>${card.title || ""}</h3><p>${card.sub || ""}</p></div>
    </article>`).join("");
}
function tableActions(type,index){
  return `<td class="actions-cell">
    <button class="btn ghost" onclick="editItem('${type}',${index})">Modifier</button>
    <button class="btn ghost" onclick="hideItem('${type}',${index})">Masquer</button>
    <button class="btn danger" onclick="deleteItem('${type}',${index})">Supprimer</button>
  </td>`;
}
function renderTracks(){
  $("tracksTable").innerHTML = currentTracks().map((item,index) => `
    <tr class="${visible(item) ? "" : "hidden-row"}"><td>${item.title || ""}</td><td>${item.artist || ""}</td><td><span class="status-pill">${item.status || item.year || ""}</span></td>${tableActions("track",index)}</tr>`).join("");
}
function renderVideos(){
  $("videosTable").innerHTML = currentVideos().map((item,index) => `
    <tr class="${visible(item) ? "" : "hidden-row"}"><td>${item.title || ""}</td><td>${item.category || item.type || "clip officiel"}</td><td>${item.src ? "MP4" : item.youtubeId ? "YouTube" : ""}</td>${tableActions("video",index)}</tr>`).join("");
}
function renderGallery(){
  $("galleryTable").innerHTML = currentGallery().map((item,index) => `
    <tr class="${visible(item) ? "" : "hidden-row"}"><td>${item.title || ""}</td><td>${item.category || item.type || ""}</td><td>${item.artist || ""}</td>${tableActions("gallery",index)}</tr>`).join("");
}
function renderEvents(){
  $("eventsTable").innerHTML = currentEvents().map((item,index) => `
    <tr class="${visible(item) ? "" : "hidden-row"}"><td>${item.title || ""}</td><td>${item.date || ""}</td><td>${item.status || ""}</td>${tableActions("event",index)}</tr>`).join("");
}
function renderNews(){
  $("newsTable").innerHTML = currentNews().map((item,index) => `
    <tr class="${visible(item) ? "" : "hidden-row"}"><td>${item.title || ""}</td><td>${item.date || ""}</td><td>${item.url ? "Oui" : ""}</td>${tableActions("news",index)}</tr>`).join("");
}
function renderUpcoming(){
  $("upcomingTable").innerHTML = currentUpcoming().map((item,index) => `
    <tr class="${visible(item) ? "" : "hidden-row"}"><td>${item.title || ""}</td><td>${item.artist || ""}</td><td>${item.date || ""}</td>${tableActions("upcoming",index)}</tr>`).join("");
}
function renderArtists(){
  const root=$("artistsTable"); if(!root) return;
  root.innerHTML=currentArtists().map((item,index)=>`<tr class="${visible(item) ? "" : "hidden-row"}"><td>${item.name || ""}</td><td>${item.role || ""}</td>${tableActions("artist",index)}</tr>`).join("");
}
function featuredSource(){
  const type=getValue("featuredType") || "track";
  return {track:currentTracks(),video:currentVideos(),event:currentEvents(),news:currentNews()}[type] || [];
}
function renderFeaturedChoices(){
  const select=$("featuredItem"); if(!select) return;
  select.innerHTML=featuredSource().map((item,index)=>`<option value="${index}">${item.title || "Sans titre"}${item.artist ? ` — ${item.artist}` : ""}</option>`).join("");
}

function editItem(type,index){
  const maps = {
    track:[currentTracks()[index], fillTrack],
    video:[currentVideos()[index], fillVideo],
    gallery:[currentGallery()[index], fillGallery],
    event:[currentEvents()[index], fillEvent],
    news:[currentNews()[index], fillNews],
    upcoming:[currentUpcoming()[index], fillUpcoming],
    artist:[currentArtists()[index], fillArtist]
  };
  const [item, fill] = maps[type] || [];
  if(fill) fill(item, index);
}
function hideItem(type,index){
  const list = {track:currentTracks(), video:currentVideos(), gallery:currentGallery(), event:currentEvents(), news:currentNews(), upcoming:currentUpcoming(), artist:currentArtists()}[type];
  if(!list?.[index]) return;
  list[index].hidden = !list[index].hidden;
  if(type === "track") syncTrackRelations({...list[index],status:list[index].hidden ? "Masqué" : list[index].status}, list[index]);
  markChanged(`${list[index].title || "Contenu"} : ${list[index].hidden ? "masqué" : "affiché"}`);
}
function deleteItem(type,index){
  const list = {track:currentTracks(), video:currentVideos(), gallery:currentGallery(), event:currentEvents(), news:currentNews(), upcoming:currentUpcoming(), artist:currentArtists()}[type];
  const item=list?.[index];
  if(!item) return;
  if(!confirm(`Supprimer « ${item.title || item.name || "ce contenu"} » du brouillon ? Les contenus liés seront retirés ensemble si nécessaire.`)) return;
  list?.splice(index,1);
  if(type === "track"){
    setMirroredList("music",removeByContent(currentLibrary(),item));
    setMirroredList("releases",removeByContent(currentReleases(),item));
    state.data.site.upcoming=removeByContent(currentUpcoming(),item);
    state.data.countdowns=removeByContent(state.data.countdowns||[],item);
    state.data.site.countdowns=removeByContent(state.data.site.countdowns||[],item);
    if(sameContent(state.data.site.featured,item)) state.data.site.featured={};
  }
  markChanged(`${item.title || item.name || "Contenu"} : supprimé du brouillon`);
}

function fillTrack(item={}, index=""){
  setValue("trackIndex", index); setValue("trackTitle", item.title); setValue("trackArtist", item.artist); setValue("trackStatus", item.status || item.year); setValue("trackDate", item.date || item.year);
  setValue("trackDescription", item.description); setValue("trackCover", item.cover); setValue("trackFeaturing", item.featuring || (item.artists||[]).filter(name=>name!==item.artist).join(", "));
  const links = item.links || {}; setValue("trackSpotify", links.Spotify || links.spotify); setValue("trackApple", links["Apple Music"] || links.apple); setValue("trackDeezer", links.Deezer || links.deezer); setValue("trackYoutube", links.YouTube || links.youtube); setValue("trackAmazon", links.Amazon || links.amazon); setValue("trackTiktok", links.TikTok || links.tiktok); setValue("trackFacebook", links.Facebook || links.facebook); setValue("trackOther", links.Other || links.other);
}
function clearTrack(){ fillTrack({}); }
function saveTrack(){
  const index = getValue("trackIndex");
  const previous = index !== "" ? currentTracks()[Number(index)] : null;
  const item = {id:previous?.id || slugify(`${getValue("trackArtist")}-${getValue("trackTitle")}`),title:getValue("trackTitle"), artist:getValue("trackArtist"), featuring:getValue("trackFeaturing"), year:getValue("trackDate") || getValue("trackStatus"), date:getValue("trackDate"), status:getValue("trackStatus") || "À venir", description:getValue("trackDescription"), cover:getValue("trackCover"), links:cleanLinks(linksFrom("track"))};
  if(!item.title || !item.artist){ cmsMessage("Un titre et un artiste principal sont requis.",true); return; }
  item.artists=normalizeArtistList(item);
  if(index !== "") currentTracks()[Number(index)] = item; else currentTracks().unshift(item);
  syncTrackRelations(item,previous);
  clearTrack(); markChanged(`${item.title} : ${previous ? "mise à jour" : "ajouté"} et synchronisé`);
}
function fillVideo(item={}, index=""){
  setValue("videoIndex", index); setValue("videoTitle", item.title); setValue("videoArtist", item.artist); setValue("videoCategory", item.category || item.type || "clip officiel"); setValue("videoYoutube", item.url || item.youtube || ""); setValue("videoSrc", item.src); setValue("videoPoster", item.poster); setValue("videoDescription", item.description);
}
function clearVideo(){ fillVideo({}); }
function saveVideo(){
  const youtube = getValue("videoYoutube");
  const index = getValue("videoIndex");
  const youtubeId=ytId(youtube);
  if(youtube && !youtubeId){ cmsMessage("Le lien YouTube est invalide.",true); return; }
  if(youtubeId && currentVideos().some((entry,entryIndex)=>entryIndex!==Number(index) && entry.youtubeId===youtubeId)){ cmsMessage("Cette vidéo existe déjà dans MPBP TV.",true); return; }
  const item = {id:index!=="" ? currentVideos()[Number(index)]?.id || slugify(getValue("videoTitle")) : slugify(getValue("videoTitle")),title:getValue("videoTitle"), artist:getValue("videoArtist"), category:getValue("videoCategory"), description:getValue("videoDescription"), url:youtube, youtubeId, src:getValue("videoSrc"), poster:getValue("videoPoster")};
  if(!item.title || !item.artist || (!item.youtubeId && !item.src)){ cmsMessage("Titre, artiste et une source vidéo valide sont requis.",true); return; }
  if(index !== "") currentVideos()[Number(index)] = item; else currentVideos().unshift(item);
  state.data.videos = currentVideos();
  clearVideo(); markChanged(`${item.title} : clip ajouté ou mis à jour`);
}
function fillGallery(item={}, index=""){ setValue("galleryIndex", index); setValue("galleryTitle", item.title); setValue("galleryCategory", item.category || item.type); setValue("galleryArtist", item.artist); setValue("galleryImage", item.image); setValue("galleryDescription", item.description); }
function clearGallery(){ fillGallery({}); }
function saveGallery(){
  const item = {title:getValue("galleryTitle"), category:getValue("galleryCategory"), artist:getValue("galleryArtist"), image:getValue("galleryImage"), description:getValue("galleryDescription")};
  const index = getValue("galleryIndex"); if(index !== "") currentGallery()[Number(index)] = item; else currentGallery().unshift(item);
  state.data.gallery = currentGallery(); clearGallery(); markChanged();
}
function fillEvent(item={}, index=""){ setValue("eventIndex", index); setValue("eventTitle", item.title); setValue("eventDate", item.date); setValue("eventTime", item.time); setValue("eventPlace", item.place || item.url); setValue("eventStatus", item.status); setValue("eventCover", item.cover); setValue("eventDescription", item.description); }
function clearEvent(){ fillEvent({}); }
function saveEvent(){
  const place = getValue("eventPlace");
  const item = {title:getValue("eventTitle"), date:getValue("eventDate"), time:getValue("eventTime"), place, url:place.startsWith("http") ? place : "", status:getValue("eventStatus"), cover:getValue("eventCover"), description:getValue("eventDescription")};
  const index = getValue("eventIndex"); if(index !== "") currentEvents()[Number(index)] = item; else currentEvents().unshift(item);
  state.data.events = currentEvents(); clearEvent(); markChanged();
}
function fillNews(item={}, index=""){ setValue("newsIndex", index); setValue("newsTitle", item.title); setValue("newsDate", item.date); setValue("newsUrl", item.url); setValue("newsImage", item.image || item.cover); setValue("newsText", item.text || item.description); }
function clearNews(){ fillNews({}); }
function saveNews(){
  const item = {title:getValue("newsTitle"), date:getValue("newsDate"), text:getValue("newsText"), image:getValue("newsImage"), url:getValue("newsUrl")};
  const list = currentNews(); const index = getValue("newsIndex"); if(index !== "") list[Number(index)] = item; else list.unshift(item);
  setNewsList(list); clearNews(); markChanged();
}
function fillUpcoming(item={}, index=""){ setValue("upcomingIndex", index); setValue("upcomingTitle", item.title); setValue("upcomingArtist", item.artist); setValue("upcomingDate", item.date); setValue("upcomingCover", item.cover); setValue("upcomingDescription", item.description); }
function clearUpcoming(){ fillUpcoming({}); }
function saveUpcoming(){
  const title=getValue("upcomingTitle"), artist=getValue("upcomingArtist"), index=getValue("upcomingIndex");
  const matched=currentTracks().find(track=>slugify(track.title)===slugify(title) && slugify(track.artist)===slugify(artist));
  const item={...(matched||{}),id:matched?.id || slugify(`${artist}-${title}`),title,artist,date:getValue("upcomingDate"),cover:getValue("upcomingCover"),description:getValue("upcomingDescription"),status:"À venir"};
  if(!title || !artist || !item.date){ cmsMessage("Titre, artiste et date sont requis.",true); return; }
  if(matched) Object.assign(matched,item); else currentTracks().unshift(item);
  syncTrackRelations(item,matched);
  clearUpcoming(); markChanged(`${item.title} : ajoutée aux prochaines sorties et au compte à rebours`);
}
function fillArtist(item={}, index=""){ setValue("artistIndex",index); setValue("artistName",item.name); setValue("artistRole",item.role); setValue("artistPhoto",item.photo); setValue("artistBio",item.bio); }
function clearArtist(){ fillArtist({}); }
function saveArtist(){
  const item={name:getValue("artistName"),role:getValue("artistRole"),photo:getValue("artistPhoto"),bio:getValue("artistBio")};
  if(!item.name) return;
  const index=getValue("artistIndex"); if(index!=="") currentArtists()[Number(index)]=item; else currentArtists().push(item);
  clearArtist(); markChanged();
}
function saveFeatured(){
  const item=featuredSource()[Number(getValue("featuredItem"))]; if(!item) return;
  state.data.site.featured={...item, type:getValue("featuredType")}; markChanged(`${item.title || "Contenu"} : mis à la une`);
}
function markTrackAvailable(index){
  const item=currentTracks()[Number(index)]; if(!item) return;
  if(!confirm(`${item.title} va devenir disponible. La sortie sera retirée de « À venir » et de son compte à rebours, puis synchronisée dans la bibliothèque et les actualités.`)) return;
  const previous=clone(item); item.status="Disponible"; item.hidden=false;
  syncTrackRelations(item,previous);
  markChanged(`${item.title} : passée de À venir à Disponible, compte à rebours retiré`);
}
function syncCountdown(item){
  if(!Array.isArray(state.data.site.countdowns)) state.data.site.countdowns = [];
  const found = state.data.site.countdowns.find(x => slugify(x.title) === slugify(item.title));
  const countdown = {title:item.title, artist:item.artist, date:item.date, label:"Pré-sortie officielle", description:item.description, cover:item.cover};
  if(found) Object.assign(found, countdown); else state.data.site.countdowns.unshift(countdown);
  if(Array.isArray(state.data.countdowns)){
    const foundData = state.data.countdowns.find(x => slugify(x.title) === slugify(item.title));
    if(foundData) Object.assign(foundData, countdown); else state.data.countdowns.unshift(countdown);
  }
}

function changedJsonFiles(){
  if(!state.ready) return [];
  const files = [];
  const pairs = [
    ["data.json", state.data.site, state.original.site],
    ["data/music-library.json", state.data.music, state.original.music],
    ["data/releases.json", state.data.releases, state.original.releases],
    ["data/countdowns.json", state.data.countdowns, state.original.countdowns],
    ["data/videos.json", state.data.videos, state.original.videos],
    ["data/gallery.json", state.data.gallery, state.original.gallery],
    ["data/events.json", state.data.events, state.original.events],
    ["data/news.json", state.data.news, state.original.news]
  ];
  pairs.forEach(([path,current,original]) => {
    if(JSON.stringify(current) !== JSON.stringify(original)) files.push([path, JSON.stringify(current,null,2)]);
  });
  return files;
}
function readmeText(files){
  const lines = [
    "MPBP440 - Mise à jour exportée",
    "Date : " + new Date().toLocaleString(),
    "",
    "Uploader ces fichiers dans le depot en respectant exactement les chemins :",
    ""
  ];
  files.forEach(([path]) => lines.push("- " + path));
  if(!files.length) lines.push("- Aucun fichier modifié.");
  lines.push("", "Export local genere sans serveur externe.");
  return lines.join("\n");
}
function renderExport(){
  const files = [...changedJsonFiles(), ...[...state.media.keys()].map(path => [path,"media"])];
  const messages=state.changes.slice(0,12).map(change=>`<div class="change-item">${change.label}</div>`);
  $("changeList").innerHTML = files.length ? `${messages.join("")}${files.map(([path]) => `<div class="change-item change-item--file">${path}</div>`).join("")}` : `<div class="change-item">Aucune modification prête.</div>`;
  $("readmePreview").textContent = readmeText(files);
}
function resetWork(){
  if(!confirm("Annuler toutes les modifications locales non exportées ?")) return;
  state.data = clone(state.original);
  state.media.clear();
  state.changes=[];
  renderAll();
}

const crcTable = (() => {
  const table = [];
  for(let n=0;n<256;n++){
    let c=n;
    for(let k=0;k<8;k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n]=c>>>0;
  }
  return table;
})();
function crc32(bytes){
  let crc = 0 ^ -1;
  for(let i=0;i<bytes.length;i++) crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}
function u16(value){ return [value & 255, (value >>> 8) & 255]; }
function u32(value){ return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }
function dosDateTime(date=new Date()){
  const time = (date.getHours()<<11) | (date.getMinutes()<<5) | Math.floor(date.getSeconds()/2);
  const dosDate = ((date.getFullYear()-1980)<<9) | ((date.getMonth()+1)<<5) | date.getDate();
  return {time, date:dosDate};
}
async function makeZip(entries){
  const encoder = new TextEncoder();
  let offset = 0;
  const localParts = [];
  const centralParts = [];
  const nowParts = dosDateTime();
  for(const entry of entries){
    const nameBytes = encoder.encode(entry.path.replace(/^\/+/,""));
    const dataBytes = entry.blob ? new Uint8Array(await entry.blob.arrayBuffer()) : encoder.encode(entry.content || "");
    const crc = crc32(dataBytes);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(nowParts.time), ...u16(nowParts.date),
      ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length), ...u16(nameBytes.length), ...u16(0)
    ]);
    localParts.push(local, nameBytes, dataBytes);
    const central = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(nowParts.time), ...u16(nowParts.date),
      ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length), ...u16(nameBytes.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset)
    ]);
    centralParts.push(central, nameBytes);
    offset += local.length + nameBytes.length + dataBytes.length;
  }
  const centralSize = centralParts.reduce((sum,part) => sum + part.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length), ...u32(centralSize), ...u32(offset), ...u16(0)]);
  return new Blob([...localParts, ...centralParts, end], {type:"application/zip"});
}
async function exportZip(){
  renderExport();
  const jsonFiles = changedJsonFiles();
  const mediaFiles = [...state.media.entries()].map(([path,blob]) => ({path, blob}));
  const all = [...jsonFiles.map(([path,content]) => ({path,content})), ...mediaFiles];
  all.push({path:"README_UPLOAD.txt", content:readmeText([...jsonFiles, ...mediaFiles.map(item => [item.path])])});
  if(all.length <= 1){ alert("Aucune modification à exporter."); return; }
  jsonFiles.forEach(([path,content]) => JSON.parse(content));
  const zip = await makeZip(all);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(zip);
  a.download = "mpbp440-update-" + new Date().toISOString().slice(0,10) + ".zip";
  a.click();
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initActions();
});
document.addEventListener("mpbp-admin-ready", loadAllData);

/* CMS V2: the existing editor remains the single source of truth.  These
 * actions save private drafts in Supabase and publish changed JSON atomically
 * through an authenticated Edge Function; no GitHub credential reaches the UI. */
function cmsNode(id){ return document.getElementById(id); }
function cmsMessage(message, error=false){
  const node=cmsNode('cmsStatus'); if(!node) return;
  node.textContent=message; node.classList.toggle('error',error); node.classList.toggle('success',!error && Boolean(message));
}
function cmsDraftPayload(){
  return { version:2, files:Object.fromEntries(changedJsonFiles().map(([path,content])=>[path,JSON.parse(content)])) };
}
function validateCmsData(){
  const problems=[];
  const duplicate=(items,key,label)=>{ const seen=new Set(); items.forEach((item)=>{const value=text(item[key]); if(value && seen.has(value)) problems.push(`${label} dupliqué : ${value}`); if(value) seen.add(value);}); };
  duplicate(currentTracks(),"id","ID de morceau"); duplicate(currentVideos(),"id","ID de clip"); duplicate(currentVideos(),"youtubeId","ID YouTube");
  currentTracks().forEach(item=>{
    if(!text(item.title)||!text(item.artist)) problems.push("Un morceau doit avoir un titre et un artiste.");
    if(!text(item.cover)) problems.push(`${item.title || "Morceau"} : pochette manquante.`);
    if(item.status==="Disponible" && currentUpcoming().some(entry=>sameContent(entry,item))) problems.push(`${item.title} est Disponible mais présent dans À venir.`);
    Object.entries(item.links||{}).forEach(([name,url])=>{ if(text(url) && !/^https:\/\//i.test(text(url))) problems.push(`${item.title} : lien ${name} invalide.`); });
  });
  currentVideos().forEach(item=>{ if(!item.youtubeId && !text(item.src)) problems.push(`${item.title || "Clip"} : source vidéo manquante.`); });
  return problems;
}
function renderCmsStatus(){
  const count=changedJsonFiles().length + state.media.size;
  const countNode=cmsNode('cmsChangeCount'); if(countNode) countNode.textContent=`${count} modification${count===1?'':'s'} non publiée${count===1?'':'s'}`;
  const publish=cmsNode('publishSiteBtn'); if(publish) publish.disabled=!count;
  const save=cmsNode('saveDraftBtn'); if(save) save.disabled=!count;
}
async function saveCmsDraft(){
  const payload=cmsDraftPayload();
  if(!Object.keys(payload.files).length && !state.media.size){ cmsMessage('Aucune modification à enregistrer.'); return; }
  cmsMessage('Enregistrement du brouillon sécurisé…');
  try {
    await window.MPBP440Admin.rpc('cms_save_draft',{p_payload:payload});
    cmsMessage('Brouillon enregistré. Le site public reste inchangé.');
  } catch(error) { cmsMessage(`Brouillon non enregistré : ${error.message}`,true); }
}
function replaceMediaUrls(value, replacements){
  if(Array.isArray(value)) return value.map(item=>replaceMediaUrls(item,replacements));
  if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceMediaUrls(item,replacements)]));
  return typeof value==='string' && replacements.has(value) ? replacements.get(value) : value;
}
async function uploadCmsMedia(){
  const replacements=new Map();
  for(const [localPath,file] of state.media.entries()){
    const folder=(localPath.split('/')[1]||'covers').replace('assets','covers');
    const safeFolder=folder==='videos' ? 'clips' : (['covers','clips','gallery','events','artists'].includes(folder)?folder:'covers');
    const form=new FormData(); form.append('folder',safeFolder); form.append('file',file,file.name);
    const result=await window.MPBP440Admin.invoke('admin-media-upload',form);
    if(!result?.url) throw new Error('URL média manquante après import');
    replacements.set(localPath,result.url);
  }
  if(replacements.size){
    state.data=replaceMediaUrls(state.data,replacements);
    state.media.clear(); renderAll();
  }
}
async function publishCmsSite(){
  if(!Object.keys(cmsDraftPayload().files).length && !state.media.size) return;
  const problems=validateCmsData();
  if(problems.length){ cmsMessage(`Contrôle : ${problems.length} problème(s) à corriger — ${problems[0]}`,true); return; }
  if(!confirm('Publier ces modifications sur le site public ? Cette action crée un seul commit et déclenche GitHub Pages.')) return;
  const button=cmsNode('publishSiteBtn'); if(button) button.disabled=true;
  cmsMessage('Import des médias et validation des données…');
  try {
    await uploadCmsMedia();
    const payload=cmsDraftPayload();
    if(!Object.keys(payload.files).length) throw new Error('Aucun JSON modifié à publier.');
    cmsMessage('Publication atomique en cours…');
    const result=await window.MPBP440Admin.invoke('admin-publish-site',{payload});
    cmsMessage(`Publié : commit ${result.sha}. GitHub Pages est déclenché.`);
    state.original=clone(state.data); renderAll();
  } catch(error) { cmsMessage(`Publication refusée : ${error.message}`,true); }
  finally { renderCmsStatus(); }
}
document.addEventListener('mpbp-admin-ready',()=>{
  cmsNode('saveDraftBtn')?.addEventListener('click',saveCmsDraft);
  cmsNode('publishSiteBtn')?.addEventListener('click',publishCmsSite);
  cmsNode('publishSiteBtnSecondary')?.addEventListener('click',publishCmsSite);
  cmsNode('quickExportBtn')?.addEventListener('click',()=>cmsNode('tab-export')?.scrollIntoView({behavior:'smooth',block:'start'}));
  renderCmsStatus();
},{once:true});
