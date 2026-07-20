let allTracks = [];
const MPBP_PUBLIC_VERSION = "12-1-1-jour-de-pluie-fix-20260721";
const musicHubState = {query:"", artist:"all", status:"all", sort:"source"};

function safeText(value){
  return String(value || "");
}

function cleanKey(value){
  return safeText(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

const fallbackLogo = "/assets/brand/mpbp440-corp-official.png";

function mediaSrc(value){
  const src = safeText(value).trim();
  if(!src) return fallbackLogo;
  if(/^(https?:|data:|blob:)/i.test(src) || src.startsWith("/")) return src;
  return "/" + src.replace(/^\.?\//,"");
}

function fallbackImage(event){
  const img = event.currentTarget;
  img.onerror = null;
  img.src = fallbackLogo;
}

function applyImageFallbacks(root=document){
  root.querySelectorAll("img").forEach(img => {
    if(img.dataset.mpbpFallback) return;
    img.dataset.mpbpFallback = "1";
    img.addEventListener("error", fallbackImage);
  });
}

const platformLabels = {
  spotify: "Spotify",
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  deezer: "Deezer",
  apple: "Apple Music",
  amazon: "Amazon Music"
};

const platformOrder = ["spotify","youtube","tiktok","facebook","deezer","apple","amazon"];

function platformKey(name){
  const key = cleanKey(name).replace(/\s+/g,"");
  if(key.includes("spotify")) return "spotify";
  if(key.includes("youtube")) return "youtube";
  if(key.includes("tiktok")) return "tiktok";
  if(key.includes("facebook")) return "facebook";
  if(key.includes("deezer")) return "deezer";
  if(key.includes("apple")) return "apple";
  if(key.includes("amazon")) return "amazon";
  return cleanKey(name);
}

function normalizeLinks(links={}){
  const normalized = {};
  Object.entries(links || {}).forEach(([name,url])=>{
    if(!url) return;
    const key = platformKey(name);
    normalized[key] = {label: platformLabels[key] || name, url};
  });
  return normalized;
}

function mergeLinks(...sources){
  return sources.reduce((merged, source)=>Object.assign(merged, normalizeLinks(source)), {});
}

function orderedLinksHtml(links={}){
  const orderedKeys = [...platformOrder, ...Object.keys(links).filter(k=>!platformOrder.includes(k))];
  return orderedKeys.map(key => {
    const item = links[key];
    return item && item.url ? `<a href="${item.url}" target="_blank" rel="noopener">${item.label}</a>` : "";
  }).join("");
}

function linksHtml(links={}){
  return orderedLinksHtml(normalizeLinks(links));
}

function itemLinks(item={}, data={}){
  const itemArtist = cleanKey(item.artist || data.artist);
  const mainArtist = cleanKey(data.artist);
  const canUseGlobalLinks = !item.artist || itemArtist === mainArtist;
  return mergeLinks(canUseGlobalLinks ? data.socials : {}, item.links || {});
}

function getAnchorOffset(){
  const topbar = document.querySelector(".topbar");
  const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 0;
  const safeGap = window.innerWidth <= 720 ? 18 : 24;
  return Math.ceil(topbarHeight + safeGap);
}

function scrollToAnchorTarget(target, updateHash=true){
  if(!target) return false;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getAnchorOffset());
  document.body.classList.remove("menu-open");
  document.getElementById("mainNav")?.classList.remove("open");
  window.scrollTo({top, behavior:"smooth"});
  if(updateHash && target.id){
    history.pushState(null, "", `#${target.id}`);
  }
  return true;
}

function initAnchorScrollFix(){
  if(document.body.classList.contains("v12-shell")) return;
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[href]");
    if(!link) return;
    const rawHref = link.getAttribute("href") || "";
    if(!rawHref.includes("#")) return;
    let url;
    try{ url = new URL(rawHref, window.location.href); }catch(e){ return; }
    if(url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
    const id = decodeURIComponent(url.hash.slice(1));
    if(!id) return;
    const target = document.getElementById(id);
    if(!target) return;
    event.preventDefault();
    scrollToAnchorTarget(target);
  });
  if(window.location.hash){
    const id = decodeURIComponent(window.location.hash.slice(1));
    setTimeout(() => scrollToAnchorTarget(document.getElementById(id), false), 450);
  }
}

function valueForSearch(value){
  if(Array.isArray(value)) return value.map(valueForSearch).join(" ");
  if(value && typeof value === "object") return Object.keys(value).concat(Object.values(value).map(valueForSearch)).join(" ");
  return safeText(value);
}

function trackSearchText(track={}){
  return cleanKey([
    track.title,
    track.artist,
    track.description,
    track.year,
    track.status,
    track.type,
    track.genre,
    track.mood,
    track.keywords,
    track.tags,
    track.links,
    track.displayLinks
  ].map(valueForSearch).join(" "));
}

function matchesTrackSearch(track={}, query=""){
  const tokens = cleanKey(query).split(/\s+/).filter(Boolean);
  if(!tokens.length) return true;
  const haystack = trackSearchText(track);
  return tokens.every(token => haystack.includes(token));
}

function isPublicItem(item={}){
  return !item.hidden && cleanKey(item.status) !== "masque";
}

function emptyStateHtml(message, href="#home", label="Retour a l'accueil"){
  return `<div class="panel emptyState">
    <p>${message}</p>
    <a class="btn" href="${href}">${label}</a>
  </div>`;
}

function parseReleaseDate(value){
  if(!value) return null;
  if(String(value).includes("T")){
    const date = new Date(value);
    return isNaN(date) ? null : date;
  }
  const parts = String(value).split("/");
  if(parts.length === 3){
    const [day, month, year] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date) ? null : date;
  }
  const date = new Date(value);
  return isNaN(date) ? null : date;
}

function countdownParts(target){
  let diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / 86400000); diff %= 86400000;
  const hours = Math.floor(diff / 3600000); diff %= 3600000;
  const minutes = Math.floor(diff / 60000); diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  return [days, hours, minutes, seconds];
}

function countdownState(target, now = Date.now()){
  const timestamp = target instanceof Date ? target.getTime() : new Date(target).getTime();
  if(!timestamp || isNaN(timestamp)) return null;
  const remaining = timestamp - now;
  if(remaining <= 0) return {available:true, parts:[0,0,0,0], remaining:0};
  let diff = remaining;
  const days = Math.floor(diff / 86400000); diff %= 86400000;
  const hours = Math.floor(diff / 3600000); diff %= 3600000;
  const minutes = Math.floor(diff / 60000); diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  return {available:false, parts:[days, hours, minutes, seconds], remaining};
}

function formatReleaseDate(value, targetDate){
  const date = targetDate || parseReleaseDate(value);
  if(!date) return value || "";
  return date.toLocaleDateString("fr-FR", {day:"numeric", month:"long", year:"numeric"});
}

function updateCountdownElement(box, target, now = Date.now()){
  const state = countdownState(target, now);
  if(!state) return true;
  const values = box.querySelectorAll("strong");
  state.parts.forEach((value,index)=>{
    if(values[index]) values[index].textContent = String(value).padStart(2,"0");
  });
  const status = box.closest(".nextReleaseBody, .time-body, .release-card-artist, section, article")?.querySelector(".nextReleaseStatus,.countdownStatus");
  if(status) status.textContent = state.available ? "Disponible maintenant" : "";
  box.classList.toggle("is-available", state.available);
  return state.available;
}

function initCountdownElement(box){
  const dateValue = box.dataset.date || box.dataset.countdown;
  const target = parseReleaseDate(dateValue);
  if(!target) return;
  if(box._mpbpCountdownInterval){
    clearInterval(box._mpbpCountdownInterval);
    box._mpbpCountdownInterval = null;
  }
  const tick = () => {
    const available = updateCountdownElement(box, target);
    if(available && box._mpbpCountdownInterval){
      clearInterval(box._mpbpCountdownInterval);
      box._mpbpCountdownInterval = null;
    }
  };
  tick();
  if(target.getTime() > Date.now()){
    box._mpbpCountdownInterval = setInterval(tick, 1000);
  }
}

function initAllCountdowns(root=document){
  root.querySelectorAll(".miniCountdown[data-date], .countdown[data-date], [data-countdown]").forEach(initCountdownElement);
}

function parseEventDate(item={}){
  if(item.datetime) return parseReleaseDate(item.datetime);
  const raw = safeText(item.date).trim();
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(match){
    const [,d,m,y] = match;
    return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}T23:59:59+02:00`);
  }
  return parseReleaseDate(raw);
}

function isCurrentEvent(item={}){
  if(cleanKey(item.id).includes("live-tiktok-makeda-muse-2026-07-11")) return true;
  const date = parseEventDate(item);
  if(!date) return true;
  return date.getTime() >= Date.now();
}

function renderNextRelease(data={}){
  const box = document.getElementById("nextReleaseCountdown");
  if(!box) return;

  const releases = [...(data.countdowns || []), ...(data.upcoming || [])]
    .map(item => ({...item, targetDate: parseReleaseDate(item.date)}))
    .filter(item => item.targetDate);
  const candidates = releases
    .filter(item => item.targetDate.getTime() >= Date.now())
    .sort((a,b)=>a.targetDate - b.targetDate);
  const release = candidates[0];

  if(!release){
    box.innerHTML = `<div class="nextReleaseBody"><span class="status-pill">Disponible maintenant</span><h3>Disponible maintenant</h3></div>`;
    return;
  }

  const coverHtml = release.cover
    ? `<img class="nextReleaseCover" src="${mediaSrc(release.cover)}" alt="${release.title}" loading="lazy" decoding="async">`
    : `<img class="nextReleaseCover" src="${fallbackLogo}" alt="${release.title || "MPBP440"}" loading="lazy" decoding="async">`;

  box.innerHTML = `
    ${coverHtml}
    <div class="nextReleaseBody">
      <span class="status-pill">${release.label || "Prochaine sortie"}</span>
      <h3>${release.title}</h3>
      <p class="sup">${release.artist || "MPBP440"} • ${formatReleaseDate(release.date, release.targetDate)}</p>
      <p>${release.description || "Prochaine sortie officielle sur toutes les plateformes."}</p>
      <div class="countdown nextReleaseTimer" data-date="${release.targetDate.toISOString()}">
        <div><strong>00</strong><span>Jours</span></div>
        <div><strong>00</strong><span>Heures</span></div>
        <div><strong>00</strong><span>Minutes</span></div>
        <div><strong>00</strong><span>Secondes</span></div>
      </div>
      <p class="nextReleaseStatus" aria-live="polite"></p>
    </div>`;

  initAllCountdowns(box);
}

async function loadData(){
  try{
    const data = await fetch(`/data.json?v=${MPBP_PUBLIC_VERSION}`, {cache:"no-store"}).then(r=>r.json());

    const availableReleasesGrid = document.getElementById("availableReleasesGrid");
    if(availableReleasesGrid){
      const priorityIds = ["brainrot-society-2-0", "le-systeme", "je-sais-que-tu-sais"];
      const tracks = (data.tracks || []).filter(isPublicItem);
      const selected = priorityIds
        .map(id => tracks.find(track => cleanKey(track.id) === cleanKey(id) || cleanKey(track.title) === cleanKey(id)))
        .filter(Boolean);
      const releases = selected.length ? selected : tracks.slice(0, 3);
      availableReleasesGrid.innerHTML = releases.map(track => `
        <article class="v11ReleaseCard panel">
          <img src="${mediaSrc(track.cover)}" alt="${track.title}" loading="lazy" decoding="async">
          <div>
            <p class="sup">${track.artist || "MPBP440"} • ${track.status || "Disponible"}</p>
            <h3>${track.title}</h3>
            <p>${track.description || "Sortie officielle disponible sur les plateformes."}</p>
            <div class="platforms">${orderedLinksHtml(itemLinks(track, data))}</div>
          </div>
        </article>`).join("");
    }

    const f = data.featured;
    const featuredCard = document.getElementById("featuredCard");
    if(f && featuredCard){
      featuredCard.innerHTML = `
        <img src="${mediaSrc(f.cover)}" alt="${f.title}">
        <div>
          <span class="status-pill">${f.status || "Sortie officielle"}</span>
          <h3>${f.title}</h3>
          <p class="sup">${f.date || ""}</p>
          <p>${f.description || ""}</p>
          <div class="platforms">${orderedLinksHtml(itemLinks(f, data))}</div>
        </div>`;
    }

    renderNextRelease(data);

    const upcomingGrid = document.getElementById("upcomingGrid");
    if(upcomingGrid){
      const upcoming = (data.upcoming || []).filter(isPublicItem);
      upcomingGrid.innerHTML = upcoming.length ? upcoming.map((x,i)=>{
        const target = parseReleaseDate(x.date);
        const timer = target ? `<div class="miniCountdown" data-date="${target.toISOString()}" aria-label="Compte a rebours ${safeText(x.title)}">
          <div><strong>00</strong><span>Jours</span></div>
          <div><strong>00</strong><span>Heures</span></div>
          <div><strong>00</strong><span>Minutes</span></div>
          <div><strong>00</strong><span>Secondes</span></div>
        </div>` : "";
        return `
        <article class="time-card">
          <img src="${mediaSrc(x.cover)}" alt="${x.title}" loading="lazy" decoding="async">
          <div class="time-body">
            <p class="sup">${x.artist || "MPBP 440"} &bull; Etape ${i+1}</p>
            <h3>${x.title}</h3>
            <p><strong>${formatReleaseDate(x.date, target)}</strong></p>
            <p>${x.description || ""}</p>
            ${timer}
            ${target ? `<p class="countdownStatus" aria-live="polite"></p>` : ""}
          </div>
        </article>`;
      }).join("") : emptyStateHtml("Contenu bientot disponible : les prochaines sorties seront annoncees ici.", "#morceaux", "Voir les morceaux");
      initAllCountdowns(upcomingGrid);
    }

    const eventsGrid = document.getElementById("eventsGrid");
    if(eventsGrid){
      const events = (data.events || []).filter(isPublicItem).filter(isCurrentEvent);
      eventsGrid.innerHTML = events.length ? events.map(e=>`
        <article class="event-card panel">
          <img src="${mediaSrc(e.cover)}" alt="${e.title}" loading="lazy" decoding="async">
          <div>
            <p class="sup">${e.date || ""}${e.time ? " • " + e.time : ""}</p>
            <h3>${e.title}</h3>
            <p><strong>${e.place || ""}</strong></p>
            <p>${e.description || ""}</p>
            <a class="btn primary" href="${e.url || "#"}">${e.buttonText || "Voir l’évènement"}</a>
          </div>
        </article>`).join("") : emptyStateHtml("Contenu bientot disponible : les prochains evenements MPBP440 seront annonces ici.", "/mpbp-tv/index.html", "Ouvrir MPBP TV");
    }

    allTracks = (data.tracks || []).filter(isPublicItem).map(t => ({...t, displayLinks: itemLinks(t, data)}));
    setupV94MusicHub(allTracks);
    applyV94MusicFilters();

    const videoList = document.getElementById("videoList");
    if(videoList){
      const videos = (data.videos || []).filter(isPublicItem);
      videoList.innerHTML = videos.length ? videos.map(v=>`
        <article class="v85-video-card"><span class="v85-badge">Clip officiel</span>
          <div class="video-frame">
            <iframe src="https://www.youtube.com/embed/${v.youtubeId}" title="${v.title}" allowfullscreen loading="lazy"></iframe>
          </div>
          <div class="platforms"><a href="${v.url}" target="_blank" rel="noopener">${v.title}</a></div>
        </article>`).join("") : emptyStateHtml("Contenu bientot disponible : les prochains clips seront publies ici.", "/mpbp-tv/index.html", "Ouvrir MPBP TV");
    }

    const galleryGrid = document.getElementById("galleryGrid");
    if(galleryGrid){
      const gallery = (data.gallery || []).filter(isPublicItem);
      galleryGrid.innerHTML = gallery.length ? gallery.map(item => `
        <article class="galleryCard">
          <img src="${mediaSrc(item.image)}" alt="${item.title}" loading="lazy" decoding="async">
          <div class="galleryInfo"><h3>${item.title}</h3><p>${item.description || ""}</p></div>
        </article>`).join("") : emptyStateHtml("Contenu bientot disponible : les prochains visuels seront ajoutes ici.", "#liens", "Voir les liens officiels");
    }

    const officialLinks = document.getElementById("officialLinks");
    if(officialLinks){
      const socials = Object.entries(data.socials || {});
      officialLinks.innerHTML = socials.length ? socials.map(([n,u])=>`<a class="link-card" href="${u}" target="_blank" rel="noopener">${n}</a>`).join("") : emptyStateHtml("Contenu bientot disponible : les liens officiels seront ajoutes ici.", "#home", "Retour a l'accueil");
    }

    const searchInput = document.getElementById("searchInput");
    if(searchInput){
      searchInput.addEventListener("input", e => {
        musicHubState.query = e.target.value;
        applyV94MusicFilters();
      });
    }
    applyImageFallbacks();
  }catch(err){
    console.warn("Chargement data.json impossible, affichage statique conservé.", err);
  }
}

function renderTracks(tracks){
  const tracksEl = document.getElementById("tracks");
  if(!tracksEl) return;
  if(!tracks.length){
    tracksEl.innerHTML = emptyStateHtml("Aucun morceau ne correspond a cette recherche.", "#morceaux", "Voir tout le catalogue");
    const resetLink = tracksEl.querySelector(".emptyState a");
    if(resetLink){
      resetLink.addEventListener("click", event => {
        event.preventDefault();
        const searchInput = document.getElementById("searchInput");
        if(searchInput) searchInput.value = "";
        musicHubState.query = "";
        applyV94MusicFilters();
      });
    }
    return;
  }
  tracksEl.innerHTML = tracks.map(t=>`
    <article class="card v85-track-card">
      <img src="${mediaSrc(t.cover)}" alt="${t.title}" loading="lazy" decoding="async">
      <div class="card-body">
        ${t.year ? `<p class="sup">${t.artist ? t.artist + " • " : ""}${t.year}</p>` : ""}
        ${trackBadgesHtml(t)}
        <h3>${t.title}</h3>
        <p>${t.description || ""}</p>
        <div class="platforms">${orderedLinksHtml(t.displayLinks || normalizeLinks(t.links || {}))}</div>
      </div>
    </article>`).join("");
  applyImageFallbacks(tracksEl);
}

function trackBadgesHtml(track={}){
  const badges = [];
  const status = cleanKey(track.status);
  const title = cleanKey(track.title);
  if(status.includes("avenir") || status.includes("pre") || status.includes("soon")) badges.push("À venir");
  else badges.push("Disponible");
  if(title.includes("argent")) badges.push("Clip");
  if(title.includes("remix")) badges.push("Remix");
  return `<div class="v94-track-badges">${badges.map(label=>`<span>${label}</span>`).join("")}</div>`;
}

function trackDateSortValue(track={}){
  const parsed = parseReleaseDate(track.date || track.releaseDate || track.year || "");
  return parsed ? parsed.getTime() : 0;
}

function setupV94MusicHub(tracks=[]){
  const tracksEl = document.getElementById("tracks");
  if(!tracksEl || tracksEl.dataset.v94HubReady) return;
  tracksEl.dataset.v94HubReady = "1";
  const artists = Array.from(new Set(tracks.map(t => safeText(t.artist || "MPBP440")).filter(Boolean))).sort((a,b)=>a.localeCompare(b, "fr"));
  const controls = document.createElement("div");
  controls.className = "v94-music-tools";
  const isMusicPage = location.pathname.includes("/music/");
  controls.innerHTML = `
    <div class="v94-listen-now">
      <div>
        <p class="sup">Écouter maintenant</p>
        <h3>${isMusicPage ? "Catalogue officiel" : "Aperçu Music Hub"}</h3>
        <p>${isMusicPage ? "35 titres Sparetdee Simon et Je sais que tu sais, avec pochettes, liens plateformes et recherche accentuée." : "Une sélection du catalogue officiel. La page Music Hub contient les 36 cartes et tous les filtres."}</p>
      </div>
      <div class="v94-listen-actions">
        <a class="btn primary" href="/music/index.html#morceaux">Ouvrir Music Hub</a>
        <a class="btn" href="/mpbp-tv/index.html">Voir le clip L'Argent</a>
      </div>
    </div>
    <div class="v94-filter-row" aria-label="Filtres du catalogue">
      <label>Artiste
        <select id="artistFilter"><option value="all">Tous</option>${artists.map(artist=>`<option value="${artist}">${artist}</option>`).join("")}</select>
      </label>
      <label>Statut
        <select id="statusFilter"><option value="all">Tous</option><option value="available">Disponible</option><option value="upcoming">À venir</option></select>
      </label>
      <label>Tri
        <select id="sortFilter"><option value="source">Ordre officiel</option><option value="title">Titre A-Z</option><option value="artist">Artiste</option><option value="recent">Plus récent</option></select>
      </label>
    </div>`;
  tracksEl.before(controls);
  controls.querySelector("#artistFilter")?.addEventListener("change", event => {
    musicHubState.artist = event.target.value;
    applyV94MusicFilters();
  });
  controls.querySelector("#statusFilter")?.addEventListener("change", event => {
    musicHubState.status = event.target.value;
    applyV94MusicFilters();
  });
  controls.querySelector("#sortFilter")?.addEventListener("change", event => {
    musicHubState.sort = event.target.value;
    applyV94MusicFilters();
  });
}

function applyV94MusicFilters(){
  let filtered = allTracks.filter(track => matchesTrackSearch(track, musicHubState.query));
  if(musicHubState.artist !== "all"){
    filtered = filtered.filter(track => safeText(track.artist || "MPBP440") === musicHubState.artist);
  }
  if(musicHubState.status !== "all"){
    filtered = filtered.filter(track => {
      const status = cleanKey(track.status);
      const upcoming = status.includes("avenir") || status.includes("pre") || status.includes("soon");
      return musicHubState.status === "upcoming" ? upcoming : !upcoming;
    });
  }
  const indexed = filtered.map((track,index)=>({track,index}));
  if(musicHubState.sort === "title") indexed.sort((a,b)=>safeText(a.track.title).localeCompare(safeText(b.track.title), "fr"));
  if(musicHubState.sort === "artist") indexed.sort((a,b)=>safeText(a.track.artist).localeCompare(safeText(b.track.artist), "fr"));
  if(musicHubState.sort === "recent") indexed.sort((a,b)=>trackDateSortValue(b.track) - trackDateSortValue(a.track));
  if(musicHubState.sort === "source") indexed.sort((a,b)=>a.index - b.index);
  const isMusicPage = location.pathname.includes("/music/");
  const preview = !isMusicPage && !musicHubState.query ? indexed.slice(0, 6) : indexed;
  renderTracks(preview.map(item => item.track));
}

function redirectLegacyMusicHash(){
  const path = location.pathname.replace(/\/index\.html$/,"/");
  if((path === "/" || path === "") && cleanKey(location.hash) === "#morceaux"){
    location.replace("/music/index.html#morceaux");
  }
}

const primaryMenuBtn = document.getElementById("menuBtn");
if(primaryMenuBtn && !primaryMenuBtn.dataset.v647){
  primaryMenuBtn.dataset.v647 = "1";
  primaryMenuBtn.addEventListener("click",()=>{
    const nav=document.getElementById("mainNav")||document.getElementById("navlinks");
    if(nav) nav.classList.toggle("open");
  });
}
window.addEventListener("scroll",()=>{const b=document.getElementById("topBtn"); if(b)b.style.display=scrollY>500?"block":"none"});
document.getElementById("topBtn")?.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));

document.addEventListener("DOMContentLoaded", () => {
  redirectLegacyMusicHash();
  initAnchorScrollFix();
  initAllCountdowns();
  loadData();
});
window.addEventListener("hashchange", redirectLegacyMusicHash);

function initMPBPIntro(){
  const intro = document.getElementById("mpbpIntro");
  if(!intro) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const storage = {
    get(){
      try{return window.sessionStorage.getItem("mpbpIntroPlayed") === "1";}catch(e){}
      try{return /\bmpbpIntroPlayed=1\b/.test(window.name || "");}catch(e){}
      return false;
    },
    set(){
      try{window.sessionStorage.setItem("mpbpIntroPlayed", "1");}catch(e){}
      try{if(!/\bmpbpIntroPlayed=1\b/.test(window.name || "")) window.name = `${window.name || ""} mpbpIntroPlayed=1`.trim();}catch(e){}
    }
  };
  const hasPlayed = storage.get();
  let introClosed = false;
  const finish = () => {
    if(introClosed) return;
    introClosed = true;
    intro.classList.add("is-done");
    storage.set();
    setTimeout(() => intro.remove(), 520);
  };
  if(reduceMotion || hasPlayed){
    intro.remove();
    return;
  }
  const stopParticles = startMPBPCinematicParticles();
  document.body.classList.add("intro-active");
  const skip = document.getElementById("mpbpIntroSkip");
  const soundOn = document.getElementById("mpbpIntroSoundOn");
  const soundOff = document.getElementById("mpbpIntroSoundOff");
  const audioChoice = document.querySelector(".mpbpIntroAudioChoice");
  const close = () => {
    stopParticles();
    document.body.classList.remove("intro-active");
    finish();
  };
  const lockAudioChoice = () => {
    audioChoice?.classList.add("is-locked");
    [soundOn, soundOff].forEach(button => {
      if(button) button.disabled = true;
    });
  };
  soundOn?.addEventListener("click", event => {
    event.preventDefault();
    lockAudioChoice();
    window.MPBPAudio?.startIntroJingle?.();
  }, {once:true});
  soundOff?.addEventListener("click", event => {
    event.preventDefault();
    lockAudioChoice();
    try{
      localStorage.setItem("mpbpAmbianceEnabled", "0");
      localStorage.setItem("mpbpAmbianceMode", "off");
    }catch(e){}
    window.MPBPAudio?.stopAllAudio?.();
  }, {once:true});
  skip?.addEventListener("click", close, {once:true});
  setTimeout(close, 7000);
  setTimeout(close, 7600);
  window.addEventListener("pagehide", close, {once:true});
}

function startMPBPCinematicParticles(){
  const canvas = document.getElementById("mpbpIntroCanvas");
  if(!canvas) return () => {};
  const ctx = canvas.getContext("2d", {alpha:true});
  if(!ctx) return () => {};
  let running = true;
  let width = 0;
  let height = 0;
  let sparks = [];
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  function resize(){
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  function seed(){
      const count = width < 700 ? 110 : 190;
    const cx = width * .5;
    const cy = height * .48;
    sparks = Array.from({length:count}, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 7.2;
      const life = 130 + Math.random() * 115;
      return {
        x: cx + (Math.random() - .5) * 22,
        y: cy + (Math.random() - .5) * 22,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * .72 - Math.random() * .8,
        size: .7 + Math.random() * 2.1,
        life,
        maxLife: life,
        drift: (Math.random() - .5) * .035
      };
    });
  }
  function draw(){
    if(!running) return;
    ctx.clearRect(0,0,width,height);
    ctx.globalCompositeOperation = "lighter";
    sparks.forEach(p => {
      const alpha = Math.max(0, p.life / p.maxLife);
      const glow = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size * 8);
      glow.addColorStop(0, `rgba(255,244,190,${alpha})`);
      glow.addColorStop(.32, `rgba(212,175,55,${alpha * .72})`);
      glow.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size * 8,0,Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= .982;
      p.vy = p.vy * .982 + .018;
      p.vx += p.drift;
      p.life -= 1;
      if(p.life <= 0){
        p.x = width * .5;
        p.y = height * .48;
        p.life = 0;
      }
    });
    if(sparks.some(p => p.life > 0)) requestAnimationFrame(draw);
  }
  resize();
  seed();
  draw();
  window.addEventListener("resize", resize, {passive:true});
  return () => {
    running = false;
    window.removeEventListener("resize", resize);
    ctx.clearRect(0,0,width,height);
  };
}

function initPremiumMotion(){
  document.documentElement.classList.add("premium-motion-ready");
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const targets = document.querySelectorAll(".section,.hero,.v8FocusCard,.featuredCard,.homeExclusiveClip,.artistCard,.galleryCard");
  if(!("IntersectionObserver" in window)){
    targets.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.12, rootMargin:"0px 0px -8% 0px"});
  targets.forEach(el => {
    el.classList.add("reveal-on-scroll");
    observer.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMPBPAmbianceAudio();
  initMPBPIntro();
  initPremiumMotion();
});

if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

function initMPBPAmbianceAudio(){
  if(document.getElementById("mpbpAudioControl")) return;
  const ambiancePath = "/assets/audio/mpbp-ambiance.mp3";
  const jinglePath = "/assets/audio/mpbp-intro-jingle.mp3";
  const isSubPage = location.pathname.includes("/artistes/");
  const radioHref = isSubPage ? "../index.html#radio" : "/#radio";
  const control = document.createElement("div");
  control.id = "mpbpAudioControl";
  control.className = "mpbpAudioControl";
  control.innerHTML = `<button type="button" class="mpbpAudioButton" aria-pressed="false">Activer l'ambiance MPBP440</button>
    <button type="button" class="mpbpAudioOffButton" aria-pressed="false">Couper le son</button>
    <span class="mpbpAudioStatus" aria-live="polite">Ambiance OFF</span>
    <label class="mpbpAudioVolume" aria-label="Volume ambiance"><span>Volume</span><input type="range" min="0" max="1" step="0.01"></label>`;
  document.body.appendChild(control);

  const button = control.querySelector(".mpbpAudioButton");
  const offButton = control.querySelector(".mpbpAudioOffButton");
  const status = control.querySelector(".mpbpAudioStatus");
  const volumeInput = control.querySelector("input");
  const storedVolume = Number(localStorage.getItem("mpbpAmbianceVolume"));
  let baseVolume = Number.isFinite(storedVolume) && storedVolume >= 0 ? Math.min(storedVolume, 1) : 0.22;
  let audioMode = localStorage.getItem("mpbpAmbianceMode") || (localStorage.getItem("mpbpAmbianceEnabled") === "1" ? "paused" : "off");
  let ambianceAvailable = true;
  let jingleAvailable = true;
  let ambiancePlaying = false;
  let jinglePlaying = false;
  let ducked = false;
  let audioBlocked = false;
  let backgroundPaused = false;
  let ambianceFadeTimer = null;
  let jingleFadeTimer = null;
  const ambiance = new Audio(ambiancePath);
  const jingle = new Audio(jinglePath);
  ambiance.dataset.mpbpAudio = "ambiance";
  jingle.dataset.mpbpAudio = "intro-jingle";
  ambiance.loop = true;
  ambiance.preload = "none";
  ambiance.volume = baseVolume;
  jingle.loop = false;
  jingle.preload = "none";
  jingle.volume = Math.min(Math.max(baseVolume, 0.18), 0.32);
  volumeInput.value = String(baseVolume);

  function setUnavailable(){
    control.classList.add("is-fallback");
    control.innerHTML = `<a class="mpbpAudioButton" href="${radioHref}">Ouvrir Radio MPBP440</a>`;
  }
  function setState(text){
    if(status) status.textContent = text;
  }
  function persistMode(mode){
    audioMode = mode;
    localStorage.setItem("mpbpAmbianceMode", mode);
    localStorage.setItem("mpbpAmbianceEnabled", mode === "on" ? "1" : "0");
  }
  function setButton(){
    if(!button) return;
    if(jinglePlaying) button.textContent = "Pause";
    else if(ambiancePlaying) button.textContent = "Pause";
    else button.textContent = audioMode === "paused" ? "Relancer l'ambiance" : "Activer l'ambiance MPBP440";
    button.setAttribute("aria-pressed", ambiancePlaying || jinglePlaying ? "true" : "false");
    offButton?.setAttribute("aria-pressed", audioMode === "off" ? "true" : "false");
    setState(audioBlocked ? "Son a relancer" : (jinglePlaying ? "Jingle" : (ducked ? "Muet pendant lecture" : (ambiancePlaying ? "Ambiance ON" : (audioMode === "paused" ? "Ambiance en pause" : "Ambiance OFF")))));
    control.classList.toggle("is-playing", ambiancePlaying || jinglePlaying);
    control.classList.toggle("is-ducked", ducked);
    control.classList.toggle("is-paused", audioMode === "paused" && !ambiancePlaying && !jinglePlaying);
    control.classList.toggle("is-off", audioMode === "off");
  }
  function fadeAudio(audio, target, done, kind){
    const timerName = kind === "jingle" ? "jingle" : "ambiance";
    if(timerName === "jingle") clearInterval(jingleFadeTimer);
    else clearInterval(ambianceFadeTimer);
    const start = audio.volume;
    const steps = 18;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      audio.volume = start + (target - start) * (i / steps);
      if(i >= steps){
        clearInterval(timer);
        audio.volume = target;
        if(done) done();
      }
    }, 32);
    if(timerName === "jingle") jingleFadeTimer = timer;
    else ambianceFadeTimer = timer;
  }
  function restoreAmbiance(){
    if(audioMode !== "on"){
      ducked = false;
      setButton();
      return;
    }
    ducked = false;
    if(!ambianceAvailable || !ambiancePlaying || ambiance.paused){
      setButton();
      return;
    }
    fadeAudio(ambiance, baseVolume, setButton, "ambiance");
    setButton();
  }
  function duckAmbiance(){
    if(audioMode !== "on" || !ambiancePlaying) return;
    ducked = true;
    if(!ambianceAvailable || !ambiancePlaying || ambiance.paused){
      setButton();
      return;
    }
    fadeAudio(ambiance, 0.04, setButton, "ambiance");
    setButton();
  }
  async function startAmbiance(){
    if(!ambianceAvailable) return false;
    try{
      jingle.pause();
      jingle.currentTime = 0;
      jinglePlaying = false;
      backgroundPaused = false;
      ambiance.volume = 0;
      await ambiance.play();
      audioBlocked = false;
      ambiancePlaying = true;
      persistMode("on");
      fadeAudio(ambiance, ducked ? 0.04 : baseVolume, setButton, "ambiance");
      setButton();
      bindInternalMedia();
      return true;
    }catch(e){
      ambiancePlaying = false;
      audioBlocked = true;
      setButton();
      return false;
    }
  }
  function pauseAmbiance(reason){
    if(jinglePlaying){
      clearInterval(jingleFadeTimer);
      jingle.pause();
      jinglePlaying = false;
    }
    if(!ambiancePlaying){
      if(reason !== "background") persistMode("paused");
      setButton();
      return;
    }
    fadeAudio(ambiance, 0, () => {
      ambiance.pause();
      ambiancePlaying = false;
      setButton();
    }, "ambiance");
    if(reason === "background") backgroundPaused = true;
    if(reason !== "jingle") persistMode("paused");
    setButton();
  }
  function stopAllAudio(){
    clearInterval(ambianceFadeTimer);
    clearInterval(jingleFadeTimer);
    ambiance.pause();
    jingle.pause();
    try{ambiance.currentTime = 0;}catch(e){}
    try{jingle.currentTime = 0;}catch(e){}
    ambiance.volume = baseVolume;
    jingle.volume = Math.min(Math.max(baseVolume, 0.18), 0.32);
    ambiancePlaying = false;
    jinglePlaying = false;
    ducked = false;
    audioBlocked = false;
    backgroundPaused = false;
    persistMode("off");
    setButton();
  }
  async function startIntroJingle(){
    persistMode("on");
    if(!jingleAvailable){
      return startAmbiance();
    }
    try{
      if(ambiancePlaying) pauseAmbiance("jingle");
      jingle.volume = Math.min(Math.max(baseVolume, 0.18), 0.32);
      jingle.currentTime = 0;
      await jingle.play();
      audioBlocked = false;
      jinglePlaying = true;
      setButton();
      return true;
    }catch(e){
      jinglePlaying = false;
      audioBlocked = true;
      setButton();
      return startAmbiance();
    }
  }
  function stopIntroJingle(){
    if(!jinglePlaying) return;
    fadeAudio(jingle, 0, () => {
      jingle.pause();
      jingle.currentTime = 0;
      jinglePlaying = false;
      setButton();
    }, "jingle");
  }
  function bindInternalMedia(){
    document.querySelectorAll("video,audio").forEach(media => {
      if(media.dataset.mpbpAudio || media.dataset.mpbpAudioBound) return;
      media.dataset.mpbpAudioBound = "1";
      media.addEventListener("play", duckAmbiance);
      media.addEventListener("pause", restoreAmbiance);
      media.addEventListener("ended", restoreAmbiance);
    });
  }

  Promise.allSettled([
    fetch(ambiancePath, {method:"HEAD", cache:"no-store"}),
    fetch(jinglePath, {method:"HEAD", cache:"no-store"})
  ]).then(results => {
    ambianceAvailable = results[0].status === "fulfilled" && results[0].value.ok;
    jingleAvailable = results[1].status === "fulfilled" && results[1].value.ok;
    if(!ambianceAvailable && !jingleAvailable){ setUnavailable(); return; }
    control.classList.add("is-ready");
    setButton();
    bindInternalMedia();
  }).catch(setUnavailable);

  volumeInput.addEventListener("input", event => {
    baseVolume = Math.min(Number(event.target.value) || 0, 1);
    localStorage.setItem("mpbpAmbianceVolume", String(baseVolume));
    if(ambiancePlaying && !ambiance.paused) ambiance.volume = ducked ? 0.04 : baseVolume;
    if(jinglePlaying && !jingle.paused) jingle.volume = Math.min(Math.max(baseVolume, 0.18), 0.32);
    setButton();
  });
  jingle.addEventListener("ended", () => {
    jinglePlaying = false;
    setButton();
    if(audioMode === "on") startAmbiance();
  });
  ambiance.addEventListener("pause", () => {
    if(!jinglePlaying){
      ambiancePlaying = false;
      setButton();
    }
  });
  window.MPBPAudio = {
    startIntroJingle,
    stopIntroJingle,
    startAmbiance,
    pauseAmbiance,
    stopAllAudio,
    duckAmbiance,
    restoreAmbiance,
    getState(){
      return {ambianceAvailable,jingleAvailable,ambiancePlaying,jinglePlaying,ducked,audioBlocked,backgroundPaused,audioMode,baseVolume};
    }
  };
  button.addEventListener("click", async () => {
    if(jinglePlaying || ambiancePlaying) pauseAmbiance("user");
    else await startAmbiance();
  });
  offButton?.addEventListener("click", stopAllAudio);
  document.addEventListener("visibilitychange", () => {
    if(document.hidden && (ambiancePlaying || jinglePlaying)) pauseAmbiance("background");
    else if(backgroundPaused && audioMode === "paused") setButton();
  });
  window.addEventListener("pagehide", () => {
    if(ambiancePlaying || jinglePlaying) pauseAmbiance("background");
  });
  window.addEventListener("blur", () => {
    if(document.hidden && (ambiancePlaying || jinglePlaying)) pauseAmbiance("background");
  });
  window.addEventListener("beforeunload", () => {
    if(ambiancePlaying || jinglePlaying) pauseAmbiance("background");
  });
  setButton();
  setTimeout(bindInternalMedia, 1000);
}

document.addEventListener("DOMContentLoaded", initMPBPAmbianceAudio);

// V10 - Centre de notifications local MPBP440.
// Future push server integration placeholder: no VAPID key, token or external API is used in this static GitHub Pages version.
async function initMPBPNotifications(){
  const header = document.querySelector(".topbar, .artist-page .top");
  if(!header || document.getElementById("mpbpNotificationsButton")) return;
  if(!document.querySelector('link[href*="style.css"]') && !document.getElementById("mpbpNotificationsInlineStyle")){
    const style = document.createElement("style");
    style.id = "mpbpNotificationsInlineStyle";
    style.textContent = `.mpbpHeaderActions{display:flex;align-items:center;gap:8px;margin-left:auto}.mpbpNotificationsButton{position:relative;display:inline-grid;place-items:center;width:42px;height:42px;border:1px solid rgba(255,220,125,.34);border-radius:999px;background:linear-gradient(145deg,rgba(255,220,125,.14),rgba(0,0,0,.42));color:#fff1bd;cursor:pointer}.mpbpNotificationsBadge{position:absolute;top:-5px;right:-5px;min-width:20px;height:20px;display:inline-grid;place-items:center;border-radius:999px;background:linear-gradient(90deg,#d4af37,#fff1bd);color:#140d03;font-size:11px;font-weight:900}.mpbpNotificationsPanel{position:fixed;inset:0;z-index:950;display:none;justify-content:flex-end;background:rgba(0,0,0,.34);backdrop-filter:blur(4px)}.mpbpNotificationsPanel.open{display:flex}.mpbpNotificationsShell{width:min(430px,calc(100vw - 18px));max-height:calc(100dvh - 22px);margin:10px;overflow:hidden;display:grid;grid-template-rows:auto auto minmax(0,1fr);border:1px solid rgba(255,220,125,.28);border-radius:22px;background:linear-gradient(160deg,rgba(16,13,8,.98),rgba(4,4,5,.96));box-shadow:0 24px 80px rgba(0,0,0,.52)}.mpbpNotificationsHead{display:flex;justify-content:space-between;gap:14px;padding:18px;border-bottom:1px solid rgba(255,220,125,.14)}.mpbpNotificationsClose,.mpbpNotificationsTools button,.mpbpNotificationRead{border:1px solid rgba(255,220,125,.24);border-radius:999px;background:rgba(255,255,255,.06);color:#fff1bd;padding:9px 12px;font-weight:900;cursor:pointer}.mpbpNotificationsList{overflow:auto;padding:0 18px 18px;-webkit-overflow-scrolling:touch}.mpbpNotificationItem{display:grid;gap:9px;margin:0 0 12px;padding:14px;border:1px solid rgba(255,220,125,.18);border-radius:16px;background:rgba(255,255,255,.045)}.mpbpNotificationItem.high{border-color:rgba(255,220,125,.42)}.mpbpNotificationMeta{display:flex;align-items:center;flex-wrap:wrap;gap:8px;color:rgba(255,255,255,.65);font-size:12px;font-weight:900;text-transform:uppercase}.mpbpNotificationMeta span,.mpbpNotificationMeta strong{color:#140d03;background:linear-gradient(90deg,#d4af37,#fff1bd);border-radius:999px;padding:4px 8px}.mpbpNotificationActions{display:flex;flex-wrap:wrap;gap:8px}.mpbpNotificationItem h3{margin:0;color:#fff1bd}.mpbpNotificationItem p{margin:0;color:#fff}@media(max-width:720px){.mpbpNotificationsShell{width:calc(100vw - 16px);max-height:calc(100dvh - 18px);margin:8px;border-radius:18px}.mpbpNotificationsTools,.mpbpNotificationActions{display:grid;grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  const storageKey = "mpbpNotificationsRead";
  const openedKey = "mpbpNotificationsOpened";
  const nativeShownKey = "mpbpNotificationsNativeShown";
  const consentKey = "mpbpNotificationsConsent";
  const originalTitle = document.title;
  const notificationUrl = `/data/notifications.json?v=${MPBP_PUBLIC_VERSION}`;
  let notifications = [];

  function readIds(){
    try{
      const raw = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(raw) ? raw : [];
    }catch(e){
      return [];
    }
  }

  function saveRead(ids){
    localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set(ids))));
  }

  function seenNativeIds(){
    try{
      const raw = JSON.parse(localStorage.getItem(nativeShownKey) || "[]");
      return Array.isArray(raw) ? raw : [];
    }catch(e){
      return [];
    }
  }

  function saveNativeShown(ids){
    localStorage.setItem(nativeShownKey, JSON.stringify(Array.from(new Set(ids))));
  }

  function notificationConsent(){
    return localStorage.getItem(consentKey) || "unknown";
  }

  function saveNotificationConsent(value){
    localStorage.setItem(consentKey, value);
  }

  function labelForType(type){
    const labels = {site:"Site", sortie:"Sortie", clip:"Clip", artiste:"Artiste", radio:"Radio", evenement:"Événement", annonce:"Annonce"};
    return labels[cleanKey(type)] || "Annonce";
  }

  function actionLabel(item){
    const type = cleanKey(item.type);
    if(type === "clip") return "Voir le clip";
    if(type === "sortie") return "Voir les morceaux";
    if(type === "radio") return "Ouvrir la radio";
    return "Découvrir";
  }

  const actions = document.createElement("div");
  actions.className = "mpbpHeaderActions";
  actions.innerHTML = `<button id="mpbpNotificationsButton" class="mpbpNotificationsButton" type="button" aria-expanded="false" aria-controls="mpbpNotificationsPanel" aria-label="Ouvrir les notifications">
    <span aria-hidden="true">🔔</span><span class="mpbpNotificationsBadge" hidden>0</span>
  </button>`;
  const menuButton = header.querySelector("#menuBtn,.menuBtn");
  header.insertBefore(actions, menuButton || header.querySelector("nav") || null);

  const panel = document.createElement("aside");
  panel.id = "mpbpNotificationsPanel";
  panel.className = "mpbpNotificationsPanel";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `<div class="mpbpNotificationsShell" role="dialog" aria-modal="false" aria-labelledby="mpbpNotificationsTitle">
    <div class="mpbpNotificationsHead">
      <div><p class="sup">Nouveautés</p><h2 id="mpbpNotificationsTitle">Notifications MPBP440</h2></div>
      <button type="button" class="mpbpNotificationsClose" aria-label="Fermer les notifications">×</button>
    </div>
    <div class="mpbpNotificationsTools">
      <button type="button" class="mpbpNotificationsReadAll">Tout marquer comme lu</button>
      <button type="button" class="mpbpNotificationsPermission" hidden>Activer les notifications MPBP440</button>
    </div>
    <p class="mpbpNotificationsConsentText" hidden>Recevez les nouvelles sorties, clips exclusifs et actualites importantes de MPBP440. Vous pourrez desactiver cette option depuis les reglages de votre appareil.</p>
    <div class="mpbpNotificationsList" aria-live="polite"><p class="mpbpNotificationsEmpty">Chargement des nouveautés...</p></div>
  </div>`;
  document.body.appendChild(panel);

  const button = actions.querySelector("#mpbpNotificationsButton");
  const badge = actions.querySelector(".mpbpNotificationsBadge");
  const list = panel.querySelector(".mpbpNotificationsList");
  const closeButton = panel.querySelector(".mpbpNotificationsClose");
  const readAllButton = panel.querySelector(".mpbpNotificationsReadAll");
  const permissionButton = panel.querySelector(".mpbpNotificationsPermission");
  const consentText = panel.querySelector(".mpbpNotificationsConsentText");

  updatePermissionUi();

  function unreadItems(){
    const read = new Set(readIds());
    return notifications.filter(item => item.id && !read.has(item.id));
  }

  function updateBadge(){
    const count = unreadItems().length;
    badge.textContent = String(count);
    badge.hidden = count === 0;
    button.classList.toggle("has-unread", count > 0);
    button.setAttribute("aria-label", count ? `Ouvrir les notifications, ${count} non lue${count > 1 ? "s" : ""}` : "Ouvrir les notifications");
    updateAppBadge(count);
  }

  async function updateAppBadge(count){
    document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
    try{
      if(count > 0 && "setAppBadge" in navigator){
        await navigator.setAppBadge(count);
      }else if(count === 0 && "clearAppBadge" in navigator){
        await navigator.clearAppBadge();
      }
    }catch(e){}
  }

  function updatePermissionUi(){
    if(!("Notification" in window)){
      permissionButton.hidden = true;
      return;
    }
    const consent = notificationConsent();
    if(Notification.permission === "granted" && consent === "granted"){
      permissionButton.hidden = true;
      return;
    }
    permissionButton.hidden = false;
    if(Notification.permission === "denied" || consent === "denied"){
      permissionButton.textContent = "Notifications bloquees";
      permissionButton.disabled = true;
      permissionButton.title = "Reactivez les notifications depuis les reglages du navigateur ou de l'appareil.";
      return;
    }
    permissionButton.disabled = false;
    permissionButton.textContent = "Activer les notifications MPBP440";
    permissionButton.title = "";
  }

  function renderList(){
    const read = new Set(readIds());
    if(!notifications.length){
      list.innerHTML = `<p class="mpbpNotificationsEmpty">Aucune notification disponible.</p>`;
      updateBadge();
      return;
    }
    list.innerHTML = notifications.map(item => {
      const isRead = read.has(item.id);
      const priority = cleanKey(item.priority) === "high" ? " high" : "";
      const url = safeText(item.url);
      return `<article class="mpbpNotificationItem${isRead ? " is-read" : " is-unread"}${priority}" data-id="${item.id}">
        <div class="mpbpNotificationMeta"><span>${labelForType(item.type)}</span><time>${safeText(item.date)}</time>${isRead ? "" : "<strong>Nouveau</strong>"}</div>
        <h3>${safeText(item.title)}</h3>
        <p>${safeText(item.message)}</p>
        <div class="mpbpNotificationActions">
          ${url ? `<a class="btn small" href="${url}">${actionLabel(item)}</a>` : ""}
          <button type="button" class="mpbpNotificationRead">${isRead ? "Lu" : "Marquer comme lu"}</button>
        </div>
      </article>`;
    }).join("");
    updateBadge();
  }

  function openPanel(){
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
    localStorage.setItem(openedKey, new Date().toISOString());
    updatePermissionUi();
  }

  function closePanel(){
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    button.setAttribute("aria-expanded", "false");
  }

  function markAsRead(id){
    if(!id) return;
    saveRead(readIds().concat(id));
    renderList();
  }

  function markAllRead(){
    saveRead(notifications.map(item => item.id).filter(Boolean));
    renderList();
  }

  function renderJournal(){
    const journal = document.getElementById("mpbpJournalList");
    if(!journal) return;
    if(!notifications.length){
      journal.innerHTML = `<div class="panel emptyState"><p>Aucune nouveauté disponible pour le moment.</p></div>`;
      return;
    }
    journal.innerHTML = notifications.slice(0, 5).map(item => `<article class="mpbpJournalItem panel">
      <div class="mpbpNotificationMeta"><span>${labelForType(item.type)}</span><time>${safeText(item.date)}</time></div>
      <h3>${safeText(item.title)}</h3>
      <p>${safeText(item.message)}</p>
      ${item.url ? `<a class="btn" href="${item.url}">${actionLabel(item)}</a>` : ""}
    </article>`).join("");
  }

  async function maybeShowLocalNotification(){
    if(!("Notification" in window) || Notification.permission !== "granted" || notificationConsent() !== "granted") return;
    const unread = unreadItems().filter(item => cleanKey(item.priority) === "high");
    if(!unread.length) return;
    const shown = new Set(seenNativeIds());
    const next = unread.find(item => !shown.has(item.id));
    if(!next) return;
    try{
      const options = {
        body: next.message || "Nouvelle notification MPBP440",
        icon: "/assets/brand/mpbp440-corp-official.png",
        badge: "/assets/brand/mpbp440-corp-official.png",
        tag: next.id,
        data: {url: next.url || "/"},
        renotify: false
      };
      if(navigator.serviceWorker?.ready){
        const registration = await navigator.serviceWorker.ready;
        if(registration.showNotification){
          await registration.showNotification(next.title || "MPBP440", options);
        }else{
          const notification = new Notification(next.title || "MPBP440", options);
          notification.onclick = () => window.open(options.data.url, "_blank", "noopener");
        }
      }else{
        const notification = new Notification(next.title || "MPBP440", options);
        notification.onclick = () => window.open(options.data.url, "_blank", "noopener");
      }
      shown.add(next.id);
      saveNativeShown(Array.from(shown));
    }catch(e){}
  }

  button.addEventListener("click", () => {
    panel.classList.contains("open") ? closePanel() : openPanel();
  });
  closeButton.addEventListener("click", closePanel);
  panel.addEventListener("click", event => {
    if(event.target === panel) closePanel();
    const item = event.target.closest(".mpbpNotificationItem");
    if(event.target.closest(".mpbpNotificationRead") && item) markAsRead(item.dataset.id);
    if(event.target.closest("a")) closePanel();
  });
  readAllButton.addEventListener("click", markAllRead);
  permissionButton.addEventListener("click", async () => {
    if(!("Notification" in window)) return;
    if(consentText) consentText.hidden = false;
    if(Notification.permission === "denied"){
      saveNotificationConsent("denied");
      updatePermissionUi();
      return;
    }
    const result = await Notification.requestPermission();
    saveNotificationConsent(result === "granted" ? "granted" : "denied");
    permissionButton.hidden = result !== "default";
    updatePermissionUi();
    if(result === "granted") maybeShowLocalNotification();
  });
  document.addEventListener("keydown", event => {
    if(event.key === "Escape") closePanel();
  });

  try{
    const res = await fetch(notificationUrl, {cache:"no-store"});
    notifications = res.ok ? await res.json() : [];
    if(!Array.isArray(notifications)) notifications = [];
    notifications.sort((a,b) => safeText(b.date).localeCompare(safeText(a.date)));
  }catch(e){
    notifications = [];
  }
  renderList();
  renderJournal();
  maybeShowLocalNotification();
}

document.addEventListener("DOMContentLoaded", initMPBPNotifications);

function initPwaInstallHint(){
  const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone;
  if(!isAppleMobile || isStandalone || localStorage.getItem("mpbpPwaHintDismissed") === "1") return;
  const hint = document.createElement("div");
  hint.className = "mpbpPwaHint";
  hint.innerHTML = `<p>Sur iPhone, ajoutez MPBP440 à l'écran d'accueil pour profiter pleinement de l'application et de ses notifications.</p><button type="button" aria-label="Fermer l'aide PWA">OK</button>`;
  hint.querySelector("button").addEventListener("click", () => {
    localStorage.setItem("mpbpPwaHintDismissed", "1");
    hint.remove();
  });
  document.body.appendChild(hint);
}

document.addEventListener("DOMContentLoaded", initPwaInstallHint);

function labelForNewsType(type){
  const labels = {clip:"Clip", sortie:"Sortie", event:"Événement", evenement:"Événement", artiste:"Artiste", annonce:"Annonce"};
  return labels[cleanKey(type)] || "Annonce";
}

function defaultNewsUrl(item={}){
  const text = cleanKey(`${item.title || ""} ${item.text || ""}`);
  if(text.includes("dois je me taire")) return "/mpbp-tv/index.html#clip-dois-je-me-taire";
  if(text.includes("j existe") || text.includes("jexiste")) return "/mpbp-tv/index.html#clip-j-existe";
  if(text.includes("je sais que tu sais")) return "/mpbp-tv/index.html#clip-je-sais-que-tu-sais";
  if(text.includes("brainrot society 2.0")) return "/music/index.html#morceaux";
  if(text.includes("je laisse la porte ouverte")) return "/artistes/makeda-muse.html";
  if(text.includes("live tiktok")) return "#journal";
  return "#journal";
}

function defaultNewsCta(item={}){
  const text = cleanKey(`${item.title || ""} ${item.type || ""}`);
  if(text.includes("clip")) return "Voir le clip";
  if(text.includes("sortie") || text.includes("brainrot")) return "Voir les morceaux";
  if(text.includes("live") || text.includes("event")) return "Voir le journal";
  return "Découvrir";
}

async function initMPBPNewsSection(){
  const list = document.getElementById("mpbpNewsList");
  if(!list) return;
  try{
    const response = await fetch(`/data/news.json?v=${MPBP_PUBLIC_VERSION}`, {cache:"no-store"});
    const news = response.ok ? await response.json() : [];
    if(!Array.isArray(news) || !news.length){
      list.innerHTML = emptyStateHtml("Aucune actualité disponible pour le moment.", "/music/index.html#morceaux", "Voir les morceaux");
      return;
    }
    const items = news.filter(item => item && !item.hidden)
      .sort((a,b) => safeText(b.date).localeCompare(safeText(a.date)))
      .slice(0, 6);
    list.innerHTML = items.map(item => {
      const url = safeText(item.url || defaultNewsUrl(item));
      const cta = safeText(item.buttonText || defaultNewsCta(item));
      return `<article class="mpbpNewsCard panel">
        <div class="mpbpNewsMeta"><span>${labelForNewsType(item.type || "annonce")}</span><time>${safeText(item.date)}</time></div>
        <h3>${safeText(item.title)}</h3>
        <p>${safeText(item.text || item.message || "")}</p>
        ${url ? `<a class="btn" href="${url}">${cta}</a>` : ""}
      </article>`;
    }).join("");
  }catch(error){
    list.innerHTML = emptyStateHtml("Les actualités MPBP440 seront de nouveau disponibles dans un instant.", "/mpbp-tv/index.html", "Ouvrir MPBP TV");
  }
}

document.addEventListener("DOMContentLoaded", initMPBPNewsSection);


// V3.2.9 — MPBP440 Media Center controls
function initMPBPShareButtons(){
  document.querySelectorAll("[data-share-url]").forEach(button => {
    if(button.dataset.shareReady) return;
    button.dataset.shareReady = "1";
    const feedback = button.closest(".v98-exclusive-clip, .exclusiveVideo, section")?.querySelector(".v98-share-feedback");
    const writeFeedback = message => {
      if(!feedback) return;
      feedback.textContent = message;
      clearTimeout(feedback._mpbpShareTimer);
      feedback._mpbpShareTimer = setTimeout(() => { feedback.textContent = ""; }, 3200);
    };
    button.addEventListener("click", async () => {
      const shareData = {
        title: button.dataset.shareTitle || document.title,
        text: button.dataset.shareText || "",
        url: button.dataset.shareUrl
      };
      try{
        if(navigator.share){
          await navigator.share(shareData);
          writeFeedback("Partage prêt");
          return;
        }
      }catch(e){
        if(e && e.name === "AbortError") return;
      }
      try{
        if(navigator.clipboard && navigator.clipboard.writeText){
          await navigator.clipboard.writeText(shareData.url);
        }else{
          const input = document.createElement("input");
          input.value = shareData.url;
          input.setAttribute("readonly", "");
          input.style.position = "fixed";
          input.style.opacity = "0";
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          input.remove();
        }
          writeFeedback("Lien du clip copié");
      }catch(e){
        writeFeedback("Lien prêt : " + shareData.url);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", initMPBPShareButtons);

function initMPBPVideoUtilities(){
  document.querySelectorAll("[data-video-fullscreen]").forEach(button => {
    if(button.dataset.videoUtilityReady) return;
    button.dataset.videoUtilityReady = "1";
    button.addEventListener("click", async () => {
      const video = button.closest(".videoPlaybackBox, .exclusiveVideo")?.querySelector("video");
      if(!video) return;
      try{
        if(video.requestFullscreen) await video.requestFullscreen();
        else if(video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      }catch(error){}
    });
  });
}

document.addEventListener("DOMContentLoaded", initMPBPVideoUtilities);

function initMPBPTVControls(){
  const player = document.getElementById("mpbpTvPlayer");
  document.querySelectorAll("#mpbpTvList button[data-yt]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-yt");
      if(player && id){ player.src = "https://www.youtube.com/embed/" + id; }
    });
  });
}

async function loadLiveStatus(){
  try{
    const res = await fetch("/live_status.json?v=" + Date.now(), {cache:"no-store"});
    if(!res.ok) return;
    const live = await res.json();
    const card = document.getElementById("livePortalCard");
    const badge = document.getElementById("liveBadge");
    const title = document.getElementById("liveTitle");
    const text = document.getElementById("liveText");
    const button = document.getElementById("liveButton");
    if(!card || !badge || !title || !text || !button) return;
    if(live.is_live){
      card.classList.add("is-live");
      badge.textContent = "🔴 EN DIRECT MAINTENANT";
      title.textContent = live.title || "Événement exclusif MPBP440 - Live TikTok";
      text.textContent = live.message_live || "Le live officiel est en cours.";
      button.textContent = "Rejoindre le live TikTok";
      button.href = live.url || live.fallback_url || "https://www.tiktok.com/@simonsparet";
    }else{
      card.classList.remove("is-live");
      badge.textContent = "🔴 LIVE / ÉVÈNEMENT";
      title.textContent = live.title || "Événement exclusif MPBP440 - Live TikTok";
      text.innerHTML = "<strong>11/07/2026 • 21h00</strong><br>BrainRot Society 2.0, Makeda Muse, Jour de pluie, Sixieme Sens et Je sais que tu sais.";
      button.textContent = "Voir le TikTok officiel";
      button.href = live.fallback_url || live.url || "https://www.tiktok.com/@simonsparet";
    }
  }catch(e){ console.warn("Statut live indisponible", e); }
}

document.addEventListener("DOMContentLoaded", ()=>{
  initMPBPTVControls();
  loadLiveStatus();
  setInterval(loadLiveStatus, 30000);
});

// V6.4.6 public cleanup
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll('a[href*="admin-pro"],a[href*="admin-440-mpbp-corp"],[href*="admin-pro"],[href*="admin-440-mpbp-corp"]').forEach(el=>el.remove());
});


// MPBP440 V6.4.7 — navigation et clics stabilisés
(function(){
  function cleanText(s){return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
  function fixMenu(){
    const btn=document.getElementById("menuBtn");
    const nav=document.getElementById("mainNav")||document.querySelector(".topbar nav");
    if(btn&&nav&&!btn.dataset.v647){
      btn.dataset.v647="1";
      btn.addEventListener("click",()=>nav.classList.toggle("open"));
      nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
    }
  }
  function normalizeLinks(){
    const routes=[
      {keys:["accueil"],url:"/#home"},
      {keys:["label"],url:"/#label"},
      {keys:["sortie"],url:"/#sortie"},
      {keys:["a venir","à venir"],url:"/#avenir"},
      {keys:["evenements","événements","evenement","évènement"],url:"/#events"},
      {keys:["morceaux","music hub"],url:"/music/index.html#morceaux"},
      {keys:["mpbp tv"],url:"/mpbp-tv/index.html"},
      {keys:["radio"],url:"/#radio"},
      {keys:["actus","actualites","actualités"],url:"/#actus"},
      {keys:["artistes"],url:"/#artistes"},
      {keys:["recherche"],url:"/music/index.html#morceaux"},
      {keys:["clips"],url:"/#clips"},
      {keys:["galerie"],url:"/#galerie"},
      {keys:["liens"],url:"/#liens"},
      {keys:["application"],url:"/#application"},
      {keys:["mon espace","espace"],url:"/members/index.html"},
      {keys:["telechargements","téléchargements"],url:"/telechargements/index.html"}
    ];
    document.querySelectorAll(".topbar nav a,#mainNav a").forEach(a=>{
      const t=cleanText(a.textContent);
      for(const r of routes){if(r.keys.some(k=>t===cleanText(k))){a.setAttribute("href",r.url);break;}}
    });
    const tv=Array.from(document.querySelectorAll(".topbar nav a,#mainNav a")).filter(a=>cleanText(a.textContent)==="mpbp tv");
    tv.forEach((a,i)=>{a.href="/mpbp-tv/index.html";if(i>0)a.remove();});
  }
  function cleanPublicText(){
    const badPatterns=[/git/i,/assets/i,/mp4/i,/zone/i,/chemin/i,/compress/i,/html/i,/dev/i,/technique/i];
    document.querySelectorAll("p,div,article,section,li").forEach(el=>{
      if(el.children.length>8)return;
      const txt=el.textContent||"";
      if(badPatterns.filter(rx=>rx.test(txt)).length>=2)el.innerHTML="<p>Des contenus exclusifs seront ajoutés progressivement dans cet espace officiel MPBP440.</p>";
    });
  }
  function removeAdmin(){document.querySelectorAll('a[href*="admin-pro"],a[href*="admin-440-mpbp-corp"],[href*="admin-pro"],[href*="admin-440-mpbp-corp"]').forEach(el=>el.remove());}
  function fixBrokenImages(){document.querySelectorAll("img").forEach(img=>{if(!img.dataset.v647){img.dataset.v647="1";img.addEventListener("error",function(){this.src="/assets/brand/mpbp440-corp-official.png";});}});}
  function apply(){fixMenu();normalizeLinks();cleanPublicText();removeAdmin();fixBrokenImages();}
  document.addEventListener("DOMContentLoaded",()=>{apply();setTimeout(apply,500);setTimeout(apply,1500);});
})();

// V6.4.8 — sorties/radio/nav public fixes
document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll('a[href*="admin-pro"],a[href*="admin-440-mpbp-corp"],[href*="admin-pro"],[href*="admin-440-mpbp-corp"]').forEach(el=>el.remove());const navMap=[["morceaux","/music/index.html#morceaux"],["recherche","/music/index.html#morceaux"],["mpbp tv","/mpbp-tv/index.html"],["actus","#actus"],["actualites","#actus"],["actualités","#actus"],["a venir","#avenir"],["à venir","#avenir"],["evenements","#events"],["événements","#events"]];document.querySelectorAll(".topbar nav a,#mainNav a").forEach(a=>{const t=(a.textContent||"").trim().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");navMap.forEach(([k,u])=>{if(t===k.normalize("NFD").replace(/[\\u0300-\\u036f]/g,""))a.href=u;});});const radio=document.querySelector("#radio");if(radio&&!radio.querySelector("iframe")){radio.insertAdjacentHTML("beforeend",`<div class="spotifyRadioBox panel"><h3>Playlist MPBP440 sur Spotify</h3><p>Écoute la sélection officielle directement depuis le site.</p><iframe style="border-radius:18px" src="https://open.spotify.com/embed/artist/1893053126?utm_source=generator" width="100%" height="352" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`);}});



// V6.4.9 — correctif radio Spotify + liens plateformes complets
document.addEventListener("DOMContentLoaded", async ()=>{
  try{
    const res = await fetch(`/data.json?v=${MPBP_PUBLIC_VERSION}`, {cache:"no-store"});
    const siteData = await res.json();
    async function getRadioData(){
      const mainRadio = siteData.radio || {};
      if(mainRadio.embed) return mainRadio;
      try{
        const radioRes = await fetch(`/data/radio.json?v=${MPBP_PUBLIC_VERSION}`, {cache:"no-store"});
        if(radioRes.ok){
          const radioData = await radioRes.json();
          return Object.assign({}, mainRadio, radioData);
        }
      }catch(e){}
      return mainRadio;
    }

    // Corrige la radio : pas de iframe cassée si l'embed Spotify n'est pas valide.
    const radio = document.querySelector("#radio");
    if(radio){
      const oldBox = radio.querySelector(".spotifyRadioBox");
      const radioData = await getRadioData();
      const embed = radioData.embed;
      const spotify = radioData.spotify || radioData.spotify_playlist;
      if(oldBox){
        const frame = oldBox.querySelector("iframe");
        const validEmbed = /^https:\/\/open\.spotify\.com\/embed\//.test(safeText(embed));
        if(validEmbed && frame){
          frame.src = embed;
        }else{
          oldBox.innerHTML = `<div class="spotifyRadioFallback">
            <h3>Playlist MPBP440 sur Spotify</h3>
            <p>Le lecteur intégré n'est pas disponible ici. Ouvre la playlist officielle directement sur Spotify.</p>
            <a href="${spotify || 'https://open.spotify.com/search/MPBP440'}" target="_blank" rel="noopener">Ouvrir sur Spotify</a>
          </div>`;
        }
      }
    }

    // Ajoute les boutons manquants sur Rêves et Le Système si l'ancien rendu n'en affiche que deux.
    const fullLinks = {};
    (siteData.tracks || []).forEach(t=>{
      const n=(t.title||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if(n.includes("l'argent") || n.includes("argent") || n.includes("pousse")){
        Object.assign(fullLinks, t.links || {});
      }
    });
    (siteData.tracks || []).forEach(t=>{
      const n=(t.title||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if(n.includes("systeme") || n.includes("reves") || n.includes("cauchemards")){
        const title = (t.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        document.querySelectorAll(".card,.featuredCard,.time-card").forEach(card=>{
          const txt=(card.textContent||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
          if(txt.includes(title) || (title.includes("systeme") && txt.includes("systeme")) || (title.includes("reves") && txt.includes("reves"))){
            let box = card.querySelector(".platforms");
            if(!box){
              box = document.createElement("div");
              box.className = "platforms";
              card.appendChild(box);
            }
            const links = Object.assign({}, fullLinks, t.links || {});
            const labels = {spotify:"Spotify",youtube:"YouTube",tiktok:"TikTok",facebook:"Facebook",deezer:"Deezer",apple:"Apple Music",amazon:"Amazon Music"};
            Object.keys(labels).forEach(k=>{
              if(links[k] && !Array.from(box.querySelectorAll("a")).some(a=>(a.textContent||"").toLowerCase().includes(labels[k].toLowerCase().split(" ")[0]))){
                const a=document.createElement("a");
                a.href=links[k]; a.target="_blank"; a.rel="noopener"; a.textContent=labels[k];
                box.appendChild(a);
              }
            });
          }
        });
      }
    });
  }catch(e){}
});


// V9-performance public polish: gallery filters and final public cleanup.
function setupV85PublicPolish(){
  const filters = document.getElementById("galleryFilters");
  const gallery = document.getElementById("galleryGrid");
  if(filters && gallery && !filters.dataset.v85){
    filters.dataset.v85 = "1";
    filters.addEventListener("click", event => {
      const button = event.target.closest("button[data-filter]");
      if(!button) return;
      filters.querySelectorAll("button").forEach(btn => btn.classList.toggle("active", btn === button));
      const filter = button.dataset.filter;
      gallery.querySelectorAll(".galleryCard").forEach(card => {
        const text = cleanKey(card.textContent || "");
        const img = cleanKey(card.querySelector("img")?.getAttribute("src") || "");
        const haystack = text + " " + img;
        const visible = filter === "all"
          || (filter === "flyers" && /cover|pochette|flyer|sortie/.test(haystack))
          || (filter === "artistes" && /artist|profil|sparetdee|plume/.test(haystack))
          || (filter === "clips" && /clip|video|tv/.test(haystack))
          || (filter === "evenements" && /event|live|tiktok|evenement/.test(haystack));
        card.hidden = !visible;
      });
    });
  }
  const navLinks = Array.from(document.querySelectorAll(".topbar nav a"));
  navLinks.forEach((link, index, list) => {
    const key = cleanKey(link.textContent);
    if(key === "mpbp tv" && list.findIndex(a => cleanKey(a.textContent) === key) !== index) link.remove();
  });
  document.querySelectorAll('a[href*="admin-pro"],a[href*="admin-440-mpbp-corp"],[href*="admin-pro"],[href*="admin-440-mpbp-corp"]').forEach(el => el.remove());
}
document.addEventListener("DOMContentLoaded", () => { setupV85PublicPolish(); setTimeout(setupV85PublicPolish, 700); });

function setupV94MobileMenu(){
  const btn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainNav") || document.querySelector(".topbar nav");
  if(!btn || !nav || btn.dataset.v94Menu) return;
  btn.dataset.v94Menu = "1";
  btn.setAttribute("type", "button");
  btn.setAttribute("aria-controls", nav.id || "mainNav");
  btn.setAttribute("aria-label", "Ouvrir le menu");
  const sync = () => {
    const open = nav.classList.contains("open");
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };
  const closeMenu = () => {
    nav.classList.remove("open");
    sync();
  };
  btn.addEventListener("click", () => setTimeout(sync, 0));
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    closeMenu();
  }));
  window.addEventListener("resize", () => {
    if(window.innerWidth > 980) closeMenu();
  });
  window.addEventListener("pageshow", sync);
  sync();
}

document.addEventListener("DOMContentLoaded", setupV94MobileMenu);

// V12 final — source Spotify officielle unique et lecteur playlist valide.
document.addEventListener("DOMContentLoaded", () => {
  const radio = document.querySelector("#radio");
  if (!radio) return;
  const playlistUrl = "https://open.spotify.com/playlist/5e9OUZTwsGnWjBREAAVKUv";
  const embedUrl = "https://open.spotify.com/embed/playlist/5e9OUZTwsGnWjBREAAVKUv?utm_source=generator";
  radio.querySelectorAll(".spotifyRadioBox").forEach(box => box.remove());
  radio.insertAdjacentHTML("beforeend", `<section class="spotifyRadioBox panel" aria-label="Playlist Spotify MPBP440"><h3>Playlist MPBP440 sur Spotify</h3><p>Écoutez la sélection officielle du label directement depuis Spotify.</p><iframe title="Playlist Spotify officielle MPBP440" src="${embedUrl}" width="100%" height="352" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe><p class="spotifyRadioBox__actions"><a href="${playlistUrl}" target="_blank" rel="noopener noreferrer">Ouvrir la playlist Spotify</a></p></section>`);
});
