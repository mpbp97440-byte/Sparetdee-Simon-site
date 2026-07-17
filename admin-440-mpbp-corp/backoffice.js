const DATA_FILES = {
  site:"/data.json",
  music:"/data/music-library.json",
  releases:"/data/releases.json",
  countdowns:"/data/countdowns.json",
  videos:"/data/videos.json",
  gallery:"/data/gallery.json",
  events:"/data/events.json",
  news:"/data/news.json"
};

const state = {
  original:{},
  data:{},
  media:new Map(),
  ready:false
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
function markChanged(){ renderAll(); }
function linksFrom(prefix){
  return {
    Spotify:getValue(prefix+"Spotify"),
    "Apple Music":getValue(prefix+"Apple"),
    Deezer:getValue(prefix+"Deezer"),
    YouTube:getValue(prefix+"Youtube"),
    Amazon:getValue(prefix+"Amazon"),
    TikTok:getValue(prefix+"Tiktok")
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
  const res = await fetch(url + "?admin=" + Date.now(), {cache:"no-store"});
  if(!res.ok) throw new Error(url + " indisponible");
  return res.json();
}
async function loadAllData(){
  const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key,url]) => {
    try{ return [key, await loadJsonFile(key,url)]; }
    catch(e){ return [key, key === "site" ? {} : []]; }
  }));
  state.original = Object.fromEntries(entries.map(([k,v]) => [k, clone(v)]));
  state.data = Object.fromEntries(entries.map(([k,v]) => [k, clone(v)]));
  if(!Array.isArray(state.data.site.tracks)) state.data.site.tracks = [];
  if(!Array.isArray(state.data.site.videos)) state.data.site.videos = [];
  if(!Array.isArray(state.data.site.gallery)) state.data.site.gallery = [];
  if(!Array.isArray(state.data.site.events)) state.data.site.events = [];
  if(!Array.isArray(state.data.site.upcoming)) state.data.site.upcoming = [];
  if(!Array.isArray(state.data.site.countdowns)) state.data.site.countdowns = [];
  state.ready = true;
  renderAll();
}

function currentTracks(){ return state.data.site.tracks || []; }
function currentVideos(){ return state.data.site.videos || []; }
function currentGallery(){ return state.data.site.gallery || []; }
function currentEvents(){ return state.data.site.events || []; }
function currentNews(){ return normalizeList(state.data.news); }
function currentUpcoming(){ return state.data.site.upcoming || []; }
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

function editItem(type,index){
  const maps = {
    track:[currentTracks()[index], fillTrack],
    video:[currentVideos()[index], fillVideo],
    gallery:[currentGallery()[index], fillGallery],
    event:[currentEvents()[index], fillEvent],
    news:[currentNews()[index], fillNews],
    upcoming:[currentUpcoming()[index], fillUpcoming]
  };
  const [item, fill] = maps[type] || [];
  if(fill) fill(item, index);
}
function hideItem(type,index){
  const list = {track:currentTracks(), video:currentVideos(), gallery:currentGallery(), event:currentEvents(), news:currentNews(), upcoming:currentUpcoming()}[type];
  if(!list?.[index]) return;
  list[index].hidden = !list[index].hidden;
  if(list[index].hidden && !list[index].status) list[index].status = "Masqué";
  markChanged();
}
function deleteItem(type,index){
  if(!confirm("Supprimer cet élément du brouillon ?")) return;
  const list = {track:currentTracks(), video:currentVideos(), gallery:currentGallery(), event:currentEvents(), news:currentNews(), upcoming:currentUpcoming()}[type];
  list?.splice(index,1);
  markChanged();
}

function fillTrack(item={}, index=""){
  setValue("trackIndex", index); setValue("trackTitle", item.title); setValue("trackArtist", item.artist); setValue("trackStatus", item.status || item.year); setValue("trackDate", item.date || item.year);
  setValue("trackDescription", item.description); setValue("trackCover", item.cover);
  const links = item.links || {}; setValue("trackSpotify", links.Spotify || links.spotify); setValue("trackApple", links["Apple Music"] || links.apple); setValue("trackDeezer", links.Deezer || links.deezer); setValue("trackYoutube", links.YouTube || links.youtube); setValue("trackAmazon", links.Amazon || links.amazon); setValue("trackTiktok", links.TikTok || links.tiktok);
}
function clearTrack(){ fillTrack({}); }
function saveTrack(){
  const item = {title:getValue("trackTitle"), artist:getValue("trackArtist"), year:getValue("trackDate") || getValue("trackStatus"), status:getValue("trackStatus"), description:getValue("trackDescription"), cover:getValue("trackCover"), links:cleanLinks(linksFrom("track"))};
  const index = getValue("trackIndex");
  if(index !== "") currentTracks()[Number(index)] = item; else currentTracks().unshift(item);
  clearTrack(); markChanged();
}
function fillVideo(item={}, index=""){
  setValue("videoIndex", index); setValue("videoTitle", item.title); setValue("videoArtist", item.artist); setValue("videoCategory", item.category || item.type || "clip officiel"); setValue("videoYoutube", item.url || item.youtube || ""); setValue("videoSrc", item.src); setValue("videoPoster", item.poster); setValue("videoDescription", item.description);
}
function clearVideo(){ fillVideo({}); }
function saveVideo(){
  const youtube = getValue("videoYoutube");
  const item = {title:getValue("videoTitle"), artist:getValue("videoArtist"), category:getValue("videoCategory"), description:getValue("videoDescription"), url:youtube, youtubeId:ytId(youtube), src:getValue("videoSrc"), poster:getValue("videoPoster")};
  const index = getValue("videoIndex");
  if(index !== "") currentVideos()[Number(index)] = item; else currentVideos().unshift(item);
  state.data.videos = currentVideos();
  clearVideo(); markChanged();
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
  const item = {title:getValue("upcomingTitle"), artist:getValue("upcomingArtist"), date:getValue("upcomingDate"), cover:getValue("upcomingCover"), description:getValue("upcomingDescription"), status:"À venir"};
  const index = getValue("upcomingIndex"); if(index !== "") currentUpcoming()[Number(index)] = item; else currentUpcoming().unshift(item);
  syncCountdown(item); clearUpcoming(); markChanged();
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
  $("changeList").innerHTML = files.length ? files.map(([path]) => `<div class="change-item">${path}</div>`).join("") : `<div class="change-item">Aucune modification prête.</div>`;
  $("readmePreview").textContent = readmeText(files);
}
function resetWork(){
  if(!confirm("Annuler toutes les modifications locales non exportées ?")) return;
  state.data = clone(state.original);
  state.media.clear();
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
