/* MPBP440 V6.0 — Offline Manager */
(function(){
  const ESSENTIALS = [
    "/", "/music/index.html", "/live/index.html", "/galerie/index.html",
    "/mon-espace/index.html", "/application/index.html", "/telechargements/index.html"
  ];
  window.mpbpCacheEssentials = async function(){
    if(!("caches" in window)) return false;
    const cache = await caches.open("mpbp440-user-cache-v6");
    await cache.addAll(ESSENTIALS).catch(()=>{});
    return true;
  };
})();
