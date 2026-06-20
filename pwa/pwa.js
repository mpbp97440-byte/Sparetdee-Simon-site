/* MPBP440 PWA Loader — V5.2 FULL */
let deferredPrompt = null;

function mpbpCreateInstallButton(){
  if(document.getElementById("mpbpInstallAppBtn")) return;
  const btn = document.createElement("button");
  btn.id = "mpbpInstallAppBtn";
  btn.className = "mpbp-install-btn";
  btn.textContent = "Installer l’app MPBP440";
  btn.hidden = true;
  document.body.appendChild(btn);
  btn.addEventListener("click", async () => {
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.hidden = true;
  });
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  mpbpCreateInstallButton();
  const btn = document.getElementById("mpbpInstallAppBtn");
  if(btn) btn.hidden = false;
});

window.addEventListener("appinstalled", () => {
  const btn = document.getElementById("mpbpInstallAppBtn");
  if(btn) btn.hidden = true;
});

document.addEventListener("DOMContentLoaded", () => {
  mpbpCreateInstallButton();
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("MPBP440 PWA active"))
      .catch(err => console.warn("MPBP440 PWA erreur:", err));
  }
  document.documentElement.classList.add("mpbp-pwa-ready");
});
