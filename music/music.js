
let musicLibrary = [];
const FAV_KEY = "mpbp440_music_favorites";

function getFavs(){try{return JSON.parse(localStorage.getItem(FAV_KEY)||"[]")}catch(e){return []}}
function saveFavs(f){localStorage.setItem(FAV_KEY,JSON.stringify(f))}
function isFav(id){return getFavs().some(x=>x.id===id)}
function toggleFav(track){
  let favs=getFavs();
  if(isFav(track.id)) favs=favs.filter(x=>x.id!==track.id);
  else favs.unshift({id:track.id,title:track.title,artist:track.artist,cover:track.cover,created_at:new Date().toISOString()});
  saveFavs(favs);
  renderMusic();
  renderFavorites();
}
function platformButtons(links){
  if(!links) return "";
  const labels={spotify:"Spotify",apple:"Apple Music",deezer:"Deezer",youtube:"YouTube",amazon:"Amazon Music"};
  return Object.keys(labels).map(k=>links[k]?`<a class="btn ghost small" href="${links[k]}" target="_blank" rel="noopener">${labels[k]}</a>`:"").join("");
}
function playTrack(track){
  const now=document.getElementById("nowPlaying");
  now.innerHTML=`
    <p class="sup">Sélection</p>
    <h2>${track.title}</h2>
    <p>${track.artist} • ${track.status || ""} • ${track.date || ""}</p>
    <div class="platforms">${platformButtons(track.links)}</div>
  `;
}
function renderMusic(){
  const q=(document.getElementById("musicSearch")?.value||"").toLowerCase();
  const artist=document.getElementById("artistFilter")?.value||"Tous";
  const grid=document.getElementById("musicGrid");
  let list=musicLibrary.filter(t=>
    (artist==="Tous"||t.artist===artist) &&
    ((t.title+t.artist+t.description).toLowerCase().includes(q))
  );
  grid.innerHTML=list.length?list.map(t=>`
    <article class="track-card">
      ${t.cover?`<img src="../${t.cover}" alt="${t.title}">`:`<div class="track-placeholder">🎵</div>`}
      <div>
        <p class="sup">${t.type||"Titre"} • ${t.status||""}</p>
        <h3>${t.title}</h3>
        <p>${t.artist}</p>
        <p>${t.description||""}</p>
        <button class="btn small" onclick='playTrack(${JSON.stringify(t).replace(/'/g,"&apos;")})'>Sélectionner</button>
        <button class="btn ghost small" onclick='toggleFav(${JSON.stringify(t).replace(/'/g,"&apos;")})'>${isFav(t.id)?"Retirer favori":"Favori"}</button>
        ${t.lyrics?`<a class="btn ghost small" href="../${t.lyrics}">Paroles</a>`:""}
        <div class="platforms">${platformButtons(t.links)}</div>
      </div>
    </article>
  `).join(""):"<p>Aucun titre trouvé.</p>";
}
function renderFavorites(){
  const box=document.getElementById("favoritesList");
  if(!box) return;
  const favs=getFavs();
  box.innerHTML=favs.length?favs.map(f=>`
    <article class="track-card">
      ${f.cover?`<img src="../${f.cover}" alt="${f.title}">`:`<div class="track-placeholder">❤️</div>`}
      <div><p class="sup">Favori</p><h3>${f.title}</h3><p>${f.artist}</p></div>
    </article>
  `).join(""):"<p>Aucun favori musical pour le moment.</p>";
}
function shuffleMusic(){
  if(!musicLibrary.length) return;
  const t=musicLibrary[Math.floor(Math.random()*musicLibrary.length)];
  playTrack(t);
}
async function initMusic(){
  try{
    const r=await fetch("../data/music-library.json?v=5.0",{cache:"no-store"});
    musicLibrary=await r.json();
  }catch(e){musicLibrary=[]}
  document.getElementById("musicSearch")?.addEventListener("input",renderMusic);
  document.getElementById("artistFilter")?.addEventListener("change",renderMusic);
  renderMusic();
  renderFavorites();
}
document.addEventListener("DOMContentLoaded",initMusic);
