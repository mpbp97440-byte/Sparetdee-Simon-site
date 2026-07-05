let allTracks = [];
const MPBP_PUBLIC_VERSION = "9.8-share-clips";
const musicHubState = {query:"", artist:"all", status:"all", sort:"source"};

function safeText(value){
  return String(value || "");
}

function cleanKey(value){
  return safeText(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

const fallbackLogo = "/assets/brand/mpbp440-official-logo.jpg";

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

function formatReleaseDate(value, targetDate){
  if(value && !String(value).includes("T")) return value;
  if(!targetDate) return value || "";
  return targetDate.toLocaleDateString("fr-FR", {day:"2-digit", month:"2-digit", year:"numeric"});
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
  const release = releases.find(item => cleanKey(item.title).includes("brainrot society 2.0")) || candidates[0];

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
      <p>${release.description || "Pré-sortie officielle sur toutes les plateformes le 11/07/2026"}</p>
      <div class="countdown nextReleaseTimer" data-date="${release.targetDate.toISOString()}">
        <div><strong>00</strong><span>Jours</span></div>
        <div><strong>00</strong><span>Heures</span></div>
        <div><strong>00</strong><span>Minutes</span></div>
        <div><strong>00</strong><span>Secondes</span></div>
      </div>
      <p class="nextReleaseStatus" aria-live="polite"></p>
    </div>`;

  const timer = box.querySelector(".nextReleaseTimer");
  const values = timer.querySelectorAll("strong");
  const status = box.querySelector(".nextReleaseStatus");
  function tick(){
    if(release.targetDate.getTime() <= Date.now()){
      status.textContent = "Disponible maintenant";
      values.forEach(value => value.textContent = "00");
      return;
    }
    countdownParts(release.targetDate).forEach((value,index)=>{
      if(values[index]) values[index].textContent = String(value).padStart(2,"0");
    });
    status.textContent = "";
  }
  tick();
  setInterval(tick, 1000);
}

async function loadData(){
  try{
    const data = await fetch(`/data.json?v=${MPBP_PUBLIC_VERSION}`, {cache:"no-store"}).then(r=>r.json());

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
      upcomingGrid.innerHTML = upcoming.length ? upcoming.map((x,i)=>`
        <article class="time-card">
          <img src="${mediaSrc(x.cover)}" alt="${x.title}" loading="lazy" decoding="async">
          <div class="time-body">
            <p class="sup">${x.artist || "MPBP 440"} • Étape ${i+1}</p>
            <h3>${x.title}</h3>
            <p><strong>${x.date || ""}</strong></p>
            <p>${x.description || ""}</p>
          </div>
        </article>`).join("") : emptyStateHtml("Contenu bientot disponible : les prochaines sorties seront annoncees ici.", "#morceaux", "Voir les morceaux");
    }

    const eventsGrid = document.getElementById("eventsGrid");
    if(eventsGrid){
      const events = (data.events || []).filter(isPublicItem);
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

function setupAllMiniCountdowns(){
  document.querySelectorAll(".miniCountdown[data-date], .countdown[data-date]").forEach(box => {
    const target = new Date(box.dataset.date).getTime();
    const values = box.querySelectorAll("strong");
    function tick(){
      if(!target || isNaN(target)) return;
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000); diff %= 86400000;
      const h = Math.floor(diff / 3600000); diff %= 3600000;
      const m = Math.floor(diff / 60000); diff %= 60000;
      const s = Math.floor(diff / 1000);
      [d,h,m,s].forEach((v,i)=>{ if(values[i]) values[i].textContent = String(v).padStart(2,"0"); });
    }
    tick();
    setInterval(tick, 1000);
  });
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
  setupAllMiniCountdowns();
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
  const close = () => {
    stopParticles();
    document.body.classList.remove("intro-active");
    finish();
  };
  soundOn?.addEventListener("click", () => {
    window.MPBPAudio?.startIntroJingle?.();
    close();
  }, {once:true});
  soundOff?.addEventListener("click", () => {
    try{
      localStorage.setItem("mpbpAmbianceEnabled", "0");
      localStorage.setItem("mpbpAmbianceMode", "off");
    }catch(e){}
    window.MPBPAudio?.stopAllAudio?.();
    close();
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
      title.textContent = live.title || "Live TikTok MPBP440";
      text.textContent = live.message_live || "Le live officiel est en cours.";
      button.textContent = "Rejoindre le live TikTok";
      button.href = live.url || live.fallback_url || "https://www.tiktok.com/@simonsparet";
    }else{
      card.classList.remove("is-live");
      badge.textContent = "🔴 LIVE / ÉVÈNEMENT";
      title.textContent = live.title || "Live TikTok — Fête de la musique";
      text.innerHTML = "<strong>21/06/2026 • 21h00</strong><br>Présentation des nouveautés Sparetdee Simon et Juste Une Plume.";
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
  function fixBrokenImages(){document.querySelectorAll("img").forEach(img=>{if(!img.dataset.v647){img.dataset.v647="1";img.addEventListener("error",function(){this.src="/assets/brand/mpbp440-official-logo.jpg";});}});}
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
          if(txt.includes(title.split(" ")[0]) || (title.includes("systeme") && txt.includes("systeme")) || (title.includes("reves") && txt.includes("reves"))){
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
