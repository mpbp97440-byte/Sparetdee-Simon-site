/* MPBP440 V6.0 — Mini Player Global */
(function(){
  const KEY = "mpbp440_global_player_track";

  function getTrack(){
    try{return JSON.parse(localStorage.getItem(KEY) || "null");}catch(e){return null;}
  }
  function saveTrack(track){
    localStorage.setItem(KEY, JSON.stringify(track));
    renderPlayer();
  }
  function renderPlayer(){
    let track = getTrack();
    if(!track){
      track = {title:"MPBP440 Radio", artist:"Portail musical officiel", url:"/music/index.html"};
    }
    let el = document.querySelector(".mpbp-mini-player");
    if(!el){
      el = document.createElement("div");
      el.className = "mpbp-mini-player";
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="mpbp-player-icon">🎵</div>
      <a href="${track.url || "/music/index.html"}">
        <div class="mpbp-player-title">${track.title || "MPBP440 Radio"}</div>
        <div class="mpbp-player-sub">${track.artist || "Portail musical officiel"}</div>
      </a>
      <div class="mpbp-player-controls"><button title="Ouvrir">▶</button></div>
    `;
    el.querySelector("button").onclick = () => { location.href = track.url || "/music/index.html"; };
  }

  window.mpbpSetGlobalTrack = saveTrack;
  document.addEventListener("DOMContentLoaded", renderPlayer);
})();
