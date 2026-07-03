let allTracks = [];

function safeText(value){
  return String(value || "");
}

function cleanKey(value){
  return safeText(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
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
    ? `<img class="nextReleaseCover" src="${release.cover}" alt="${release.title}" onerror="this.replaceWith(Object.assign(document.createElement('p'),{className:'nextReleaseMissing',textContent:'Image manquante : ${release.cover}'}))">`
    : `<p class="nextReleaseMissing">Image manquante pour cette sortie.</p>`;

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
    const data = await fetch("/data.json?v=20260703-quality", {cache:"no-store"}).then(r=>r.json());

    const f = data.featured;
    const featuredCard = document.getElementById("featuredCard");
    if(f && featuredCard){
      featuredCard.innerHTML = `
        <img src="${f.cover}" alt="${f.title}">
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
      const upcoming = data.upcoming || [];
      upcomingGrid.innerHTML = upcoming.length ? upcoming.map((x,i)=>`
        <article class="time-card">
          <img src="${x.cover}" alt="${x.title}">
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
      const events = data.events || [];
      eventsGrid.innerHTML = events.length ? events.map(e=>`
        <article class="event-card panel">
          <img src="${e.cover}" alt="${e.title}">
          <div>
            <p class="sup">${e.date || ""}${e.time ? " • " + e.time : ""}</p>
            <h3>${e.title}</h3>
            <p><strong>${e.place || ""}</strong></p>
            <p>${e.description || ""}</p>
            <a class="btn primary" href="${e.url || "#"}">${e.buttonText || "Voir l’évènement"}</a>
          </div>
        </article>`).join("") : emptyStateHtml("Contenu bientot disponible : les prochains evenements MPBP440 seront annonces ici.", "/mpbp-tv/index.html", "Ouvrir MPBP TV");
    }

    allTracks = (data.tracks || []).map(t => ({...t, displayLinks: itemLinks(t, data)}));
    renderTracks(allTracks);

    const videoList = document.getElementById("videoList");
    if(videoList){
      const videos = data.videos || [];
      videoList.innerHTML = videos.length ? videos.map(v=>`
        <div>
          <div class="video-frame">
            <iframe src="https://www.youtube.com/embed/${v.youtubeId}" title="${v.title}" allowfullscreen></iframe>
          </div>
          <div class="platforms"><a href="${v.url}" target="_blank" rel="noopener">${v.title}</a></div>
        </div>`).join("") : emptyStateHtml("Contenu bientot disponible : les prochains clips seront publies ici.", "/mpbp-tv/index.html", "Ouvrir MPBP TV");
    }

    const galleryGrid = document.getElementById("galleryGrid");
    if(galleryGrid){
      const gallery = data.gallery || [];
      galleryGrid.innerHTML = gallery.length ? gallery.map(item => `
        <article class="galleryCard">
          <img src="${item.image}" alt="${item.title}">
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
        const filtered = allTracks.filter(t => matchesTrackSearch(t, e.target.value));
        renderTracks(filtered);
      });
    }
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
        renderTracks(allTracks);
      });
    }
    return;
  }
  tracksEl.innerHTML = tracks.map(t=>`
    <article class="card">
      <img src="${t.cover}" alt="${t.title}">
      <div class="card-body">
        ${t.year ? `<p class="sup">${t.artist ? t.artist + " • " : ""}${t.year}</p>` : ""}
        <h3>${t.title}</h3>
        <p>${t.description || ""}</p>
        <div class="platforms">${orderedLinksHtml(t.displayLinks || normalizeLinks(t.links || {}))}</div>
      </div>
    </article>`).join("");
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

document.getElementById("menuBtn")?.addEventListener("click",()=>document.getElementById("navlinks").classList.toggle("open"));
window.addEventListener("scroll",()=>{const b=document.getElementById("topBtn"); if(b)b.style.display=scrollY>500?"block":"none"});
document.getElementById("topBtn")?.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));

document.addEventListener("DOMContentLoaded", () => {
  setupAllMiniCountdowns();
  loadData();
});


// V3.2.9 — MPBP440 Media Center controls
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
    const res = await fetch("live_status.json?v=" + Date.now(), {cache:"no-store"});
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
      {keys:["morceaux","music hub"],url:"/#morceaux"},
      {keys:["mpbp tv"],url:"/mpbp-tv/index.html"},
      {keys:["radio"],url:"/#radio"},
      {keys:["actus","actualites","actualités"],url:"/#actus"},
      {keys:["artistes"],url:"/#artistes"},
      {keys:["recherche"],url:"/#morceaux"},
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
document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll('a[href*="admin-pro"],a[href*="admin-440-mpbp-corp"],[href*="admin-pro"],[href*="admin-440-mpbp-corp"]').forEach(el=>el.remove());const navMap=[["morceaux","#morceaux"],["mpbp tv","/mpbp-tv/index.html"],["actus","#actus"],["actualites","#actus"],["actualités","#actus"],["a venir","#avenir"],["à venir","#avenir"],["evenements","#events"],["événements","#events"]];document.querySelectorAll(".topbar nav a,#mainNav a").forEach(a=>{const t=(a.textContent||"").trim().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");navMap.forEach(([k,u])=>{if(t===k.normalize("NFD").replace(/[\\u0300-\\u036f]/g,""))a.href=u;});});const radio=document.querySelector("#radio");if(radio&&!radio.querySelector("iframe")){radio.insertAdjacentHTML("beforeend",`<div class="spotifyRadioBox panel"><h3>Playlist MPBP440 sur Spotify</h3><p>Écoute la sélection officielle directement depuis le site.</p><iframe style="border-radius:18px" src="https://open.spotify.com/embed/artist/1893053126?utm_source=generator" width="100%" height="352" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`);}});



// V6.4.9 — correctif radio Spotify + liens plateformes complets
document.addEventListener("DOMContentLoaded", async ()=>{
  try{
    const res = await fetch("/data.json?v=6.4.9", {cache:"no-store"});
    const siteData = await res.json();
    async function getRadioData(){
      const mainRadio = siteData.radio || {};
      if(mainRadio.embed) return mainRadio;
      try{
        const radioRes = await fetch("/data/radio.json?v=6.4.9", {cache:"no-store"});
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
