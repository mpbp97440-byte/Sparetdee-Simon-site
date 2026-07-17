/* MPBP440 PWA Advanced — V5.6 */
(function(){
  const VERSION = "5.6";
  const VERSION_KEY = "mpbp440_app_version_seen";
  const NOTIF_KEY = "mpbp440_local_notifications";

  function createSplash(){
    if(sessionStorage.getItem("mpbp440_splash_seen")) return;
    const splash = document.createElement("div");
    splash.className = "mpbp-splash";
    splash.innerHTML = `
      <div>
        <img src="/assets/brand/mpbp440-corp-official.png" alt="MPBP440">
        <h1>M.P.B.P 440</h1>
        <p>PORTAIL MUSICAL OFFICIEL</p>
      </div>`;
    document.body.appendChild(splash);
    setTimeout(() => {
      splash.classList.add("hide");
      setTimeout(() => splash.remove(), 600);
    }, 1300);
    sessionStorage.setItem("mpbp440_splash_seen", "1");
  }

  function notifyUpdate(){
    const seen = localStorage.getItem(VERSION_KEY);
    if(seen === VERSION) return;
    localStorage.setItem(VERSION_KEY, VERSION);
    const note = document.createElement("div");
    note.className = "mpbp-update-toast";
    note.innerHTML = `<strong>MPBP440 App v${VERSION}</strong><span>Nouvelle version chargée.</span><button>OK</button>`;
    document.body.appendChild(note);
    note.querySelector("button").onclick = () => note.remove();
    setTimeout(() => { if(document.body.contains(note)) note.remove(); }, 7000);
  }

  function addLocalNotification(type, title, text){
    let list = [];
    try{ list = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]"); }catch(e){}
    list.unshift({type, title, text, date:new Date().toISOString(), read:false});
    localStorage.setItem(NOTIF_KEY, JSON.stringify(list.slice(0,50)));
  }

  function detectStandalone(){
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  }

  document.addEventListener("DOMContentLoaded", () => {
    createSplash();
    notifyUpdate();

    if(detectStandalone()){
      addLocalNotification("app", "Application ouverte", "MPBP440 fonctionne en mode application.");
    }

    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").then(reg => {
        reg.addEventListener("updatefound", () => {
          addLocalNotification("update", "Mise à jour disponible", "Une nouvelle version de MPBP440 est en préparation.");
        });
      }).catch(()=>{});
    }
  });

  window.mpbpAddLocalNotification = addLocalNotification;
})();
