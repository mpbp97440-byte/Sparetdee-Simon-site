/* MPBP440 PWA Service Worker — V5.2 FULL */
const MPBP_CACHE = "mpbp440-pwa-v5-2-full";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/pwa/pwa.css",
  "/pwa/pwa.js",
  "/assets/icons/mpbp440-icon.svg",
  "/assets/icons/mpbp440-maskable.svg",
  "/data/artists.json",
  "/data/music-library.json",
  "/data/releases.json",
  "/data/videos.json",
  "/data/gallery.json",
  "/music/index.html",
  "/live/index.html",
  "/galerie/index.html",
  "/artistes/sparetdee-simon.html",
  "/artistes/juste-une-plume.html"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(MPBP_CACHE).then(cache => cache.addAll(CORE_ASSETS).catch(() => {})));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== MPBP_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(MPBP_CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match("/offline.html")))
  );
});
