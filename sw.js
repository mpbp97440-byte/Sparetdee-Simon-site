/* MPBP440 Service Worker — V6.0 Quasi Native */
const MPBP_CACHE = "mpbp440-pwa-v6-0";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/app/app-shell.css",
  "/app/app-shell.js",
  "/app/player.js",
  "/app/offline-manager.js",
  "/pwa/pwa.css",
  "/pwa/pwa-advanced.css",
  "/pwa/pwa-advanced.js",
  "/assets/icons/mpbp440-icon.svg",
  "/assets/icons/mpbp440-maskable.svg",
  "/application/index.html",
  "/telechargements/index.html",
  "/music/index.html",
  "/live/index.html",
  "/galerie/index.html",
  "/mon-espace/index.html",
  "/analytics/index.html",
  "/artistes/sparetdee-simon.html",
  "/artistes/juste-une-plume.html",
  "/data/app-version.json",
  "/data/music-library.json",
  "/data/artists.json",
  "/data/releases.json",
  "/data/videos.json",
  "/data/gallery.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(MPBP_CACHE).then(cache => cache.addAll(CORE_ASSETS).catch(()=>{})));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== MPBP_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if(event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;

  const isHTML = req.headers.get("accept") && req.headers.get("accept").includes("text/html");
  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(MPBP_CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
        return res;
      })
      .catch(() => {
        return caches.match(req).then(cached => cached || (isHTML ? caches.match("/offline.html") : undefined));
      })
  );
});
