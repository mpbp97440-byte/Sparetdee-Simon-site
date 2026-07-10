
const FAV_KEY = "mpbp440_favorites";
function getFavorites(){
  try{return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");}
  catch(e){return [];}
}
function saveFavorites(favs){
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}
function addArtistFavorite(name, role){
  const favs = getFavorites();
  const key = "Artiste:" + name;
  if(!favs.find(f => f.key === key)){
    favs.unshift({key,type:"Artiste",title:name,meta:role,created_at:new Date().toISOString()});
  }
  saveFavorites(favs);
  alert(name + " ajouté aux favoris.");
}
function addReleaseFavorite(title, artist){
  const favs = getFavorites();
  const key = "Titre:" + title;
  if(!favs.find(f => f.key === key)){
    favs.unshift({key,type:"Titre",title:title,meta:artist,created_at:new Date().toISOString()});
  }
  saveFavorites(favs);
  alert(title + " ajouté aux favoris.");
}
function norm(s){
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
}
function linkButtons(links){
  if(!links) return "";
  const labels = {spotify:"Spotify", apple:"Apple Music", deezer:"Deezer", youtube:"YouTube", amazon:"Amazon Music"};
  return Object.keys(labels).map(k => (links[k] || links[labels[k]]) ? `<a class="btn ghost small" href="${links[k] || links[labels[k]]}" target="_blank" rel="noopener">${labels[k]}</a>` : "").join("");
}
async function loadArtistReleases(){
  const box = document.getElementById("artistDiscography");
  const filters = document.getElementById("discographyFilters");
  const artistName = document.body.dataset.artist || "";
  if(!box) return;
  try{
    const r = await fetch("../data/releases.json?v=jup-clip-intro-fix-202607", {cache:"no-store"});
    const releases = await r.json();
    const artistReleases = releases.filter(x => norm(x.artist) === norm(artistName));
    let current = "Tous";
    function render(){
      const list = current === "Tous" ? artistReleases : artistReleases.filter(x => norm(x.type) === norm(current));
      box.innerHTML = list.length ? list.map(item => `
        <article class="release-card-artist">
          ${item.cover ? `<img src="../${item.cover}" alt="${item.title}">` : `<div class="release-placeholder">🎵</div>`}
          <div>
            <p class="sup">${item.type || "Sortie"} • ${item.status || ""}</p>
            <h3>${item.title || ""}</h3>
            <p>${item.description || ""}</p>
            <p><strong>${item.date || ""}</strong></p>
            <div class="release-links">${linkButtons(item.links)}</div>
            <button class="btn ghost small" onclick="addReleaseFavorite('${String(item.title || "").replace(/'/g,"\\'")}','${String(item.artist || "").replace(/'/g,"\\'")}')">Favori</button>
          </div>
        </article>
      `).join("") : "<p>Aucune sortie à afficher pour le moment.</p>";
    }
    if(filters){
      const types = ["Tous", ...Array.from(new Set(artistReleases.map(x => x.type || "Single")))];
      filters.innerHTML = types.map(t => `<button class="btn ghost small" data-type="${t}">${t}</button>`).join("");
      filters.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
          current = btn.dataset.type;
          render();
        });
      });
    }
    render();
  }catch(e){
    box.innerHTML = "<p>La discographie sera affichée prochainement.</p>";
  }
}
document.addEventListener("DOMContentLoaded", loadArtistReleases);
