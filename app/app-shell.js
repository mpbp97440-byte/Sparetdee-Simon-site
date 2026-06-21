/* MPBP440 V6.0.4 — App Shell neutralisé */
(function(){
  function killShell(){
    document.querySelectorAll(".mpbp-native-shell,.mpbp-mini-player").forEach(function(el){
      el.remove();
    });
    document.body.style.paddingBottom = "0px";
    document.documentElement.style.paddingBottom = "0px";
  }

  function registerSW(){
    if(!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js?v=6.0.4").then(function(reg){
      if(reg.waiting){
        reg.waiting.postMessage({type:"SKIP_WAITING"});
      }
    }).catch(function(){});
  }

  document.addEventListener("DOMContentLoaded", function(){
    killShell();
    registerSW();
    setInterval(killShell, 500);
  });

  window.addEventListener("load", killShell);
  window.addEventListener("resize", killShell);
  window.addEventListener("orientationchange", killShell);
})();
