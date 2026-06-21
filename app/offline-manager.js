/* MPBP440 V6.1 — Offline Manager */
(function(){
  const ESSENTIALS = [
    "/", "/index.html", "/dashboard/index.html", "/application/index.html",
    "/music/index.html", "/live/index.html", "/galerie/index.html",
    "/mon-espace/index.html", "/telechargements/index.html"
  ];
  window.mpbpCacheEssentials = async function(){
    if(!("caches" in window)) return false;
    const cache = await caches.open("mpbp440-user-cache-v6-1");
    await cache.addAll(ESSENTIALS).catch(()=>{});
    return true;
  };
})();