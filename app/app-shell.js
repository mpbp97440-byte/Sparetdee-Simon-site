/* MPBP440 V6.0 — App Shell */
(function(){
  const nav = [
    ["🏠","Accueil","/"],
    ["🎵","Music","/music/index.html"],
    ["🔴","Live","/live/index.html"],
    ["🖼️","Galerie","/galerie/index.html"],
    ["👤","Espace","/mon-espace/index.html"]
  ];

  function createShell(){
    if(document.querySelector(".mpbp-native-shell")) return;
    const bar = document.createElement("nav");
    bar.className = "mpbp-native-shell";
    const current = location.pathname;
    bar.innerHTML = nav.map(([icon,label,url]) => {
      const active = (url === "/" && current === "/") || (url !== "/" && current.startsWith(url.replace("index.html","")));
      return `<a class="${active ? "active" : ""}" href="${url}"><span>${icon}</span>${label}</a>`;
    }).join("");
    document.body.appendChild(bar);
  }

  function toast(title, text, buttonText, cb){
    const old = document.querySelector(".mpbp-app-toast");
    if(old) old.remove();
    const el = document.createElement("div");
    el.className = "mpbp-app-toast";
    el.innerHTML = `<strong>${title}</strong><span>${text}</span>${buttonText ? `<button>${buttonText}</button>` : ""}`;
    document.body.appendChild(el);
    if(buttonText) el.querySelector("button").onclick = () => { if(cb) cb(); el.remove(); };
    setTimeout(()=>{ if(document.body.contains(el)) el.remove(); }, 9000);
  }

  function registerSW(){
    if(!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").then(reg => {
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if(!nw) return;
        nw.addEventListener("statechange", () => {
          if(nw.state === "installed" && navigator.serviceWorker.controller){
            toast("Mise à jour disponible", "Une nouvelle version de MPBP440 est prête.", "Actualiser", () => location.reload());
          }
        });
      });
    }).catch(()=>{});
  }

  function onlineStatus(){
    window.addEventListener("offline", () => toast("Mode hors connexion", "MPBP440 continue en mode cache partiel.", "OK"));
    window.addEventListener("online", () => toast("Connexion rétablie", "Les contenus peuvent être mis à jour.", "OK"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.add("mpbp-app-ready");
    createShell();
    registerSW();
    onlineStatus();
  });
})();
