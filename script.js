let allTracks = [];

function safeText(value){
  return String(value || "");
}

function linksHtml(links={}){
  return Object.entries(links).map(([n,u]) => u ? `<a href="${u}" target="_blank" rel="noopener">${n}</a>` : "").join("");
}

async function loadData(){
  try{
    const data = await fetch("data.json?v=3.2.8-mpbp-tv", {cache:"no-store"}).then(r=>r.json());

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
          <div class="platforms">${linksHtml(f.links || data.socials || {})}</div>
        </div>`;
    }

    const upcomingGrid = document.getElementById("upcomingGrid");
    if(upcomingGrid){
      upcomingGrid.innerHTML = (data.upcoming || []).map((x,i)=>`
        <article class="time-card">
          <img src="${x.cover}" alt="${x.title}">
          <div class="time-body">
            <p class="sup">${x.artist || "MPBP 440"} • Étape ${i+1}</p>
            <h3>${x.title}</h3>
            <p><strong>${x.date || ""}</strong></p>
            <p>${x.description || ""}</p>
          </div>
        </article>`).join("");
    }

    const eventsGrid = document.getElementById("eventsGrid");
    if(eventsGrid){
      eventsGrid.innerHTML = (data.events || []).map(e=>`
        <article class="event-card panel">
          <img src="${e.cover}" alt="${e.title}">
          <div>
            <p class="sup">${e.date || ""}${e.time ? " • " + e.time : ""}</p>
            <h3>${e.title}</h3>
            <p><strong>${e.place || ""}</strong></p>
            <p>${e.description || ""}</p>
            <a class="btn primary" href="${e.url || "#"}">${e.buttonText || "Voir l’évènement"}</a>
          </div>
        </article>`).join("");
    }

    allTracks = (data.tracks || []).map(t => ({...t, links: t.links || data.socials || {}}));
    renderTracks(allTracks);

    const videoList = document.getElementById("videoList");
    if(videoList){
      videoList.innerHTML = (data.videos || []).map(v=>`
        <div>
          <div class="video-frame">
            <iframe src="https://www.youtube.com/embed/${v.youtubeId}" title="${v.title}" allowfullscreen></iframe>
          </div>
          <div class="platforms"><a href="${v.url}" target="_blank" rel="noopener">${v.title}</a></div>
        </div>`).join("");
    }

    const galleryGrid = document.getElementById("galleryGrid");
    if(galleryGrid && data.gallery){
      galleryGrid.innerHTML = data.gallery.map(item => `
        <article class="galleryCard">
          <img src="${item.image}" alt="${item.title}">
          <div class="galleryInfo"><h3>${item.title}</h3><p>${item.description || ""}</p></div>
        </article>`).join("");
    }

    const officialLinks = document.getElementById("officialLinks");
    if(officialLinks){
      officialLinks.innerHTML = Object.entries(data.socials || {}).map(([n,u])=>`<a class="link-card" href="${u}" target="_blank" rel="noopener">${n}</a>`).join("");
    }

    const searchInput = document.getElementById("searchInput");
    if(searchInput){
      searchInput.addEventListener("input", e => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = allTracks.filter(t =>
          safeText(t.title).toLowerCase().includes(q) ||
          safeText(t.artist).toLowerCase().includes(q) ||
          safeText(t.description).toLowerCase().includes(q)
        );
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
  tracksEl.innerHTML = tracks.map(t=>`
    <article class="card">
      <img src="${t.cover}" alt="${t.title}">
      <div class="card-body">
        ${t.year ? `<p class="sup">${t.artist ? t.artist + " • " : ""}${t.year}</p>` : ""}
        <h3>${t.title}</h3>
        <p>${t.description || ""}</p>
        <div class="platforms">${linksHtml(t.links || {})}</div>
      </div>
    </article>`).join("");
}

function setupAllMiniCountdowns(){
  document.querySelectorAll(".miniCountdown[data-date]").forEach(box => {
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
