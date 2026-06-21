/* MPBP440 Service Worker — V6.0.4 Anti-cache */
const MPBP_CACHE = "mpbp440-pwa-v6-0-4";

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(MPBP_CACHE).then(cache => cache.addAll([
      "/",
      "/index.html",
      "/offline.html",
      "/manifest.webmanifest",
      "/app/app-shell.css",
      "/app/app-shell.js",
      "/app/player.js",
      "/assets/icons/mpbp440-icon.svg",
      "/assets/icons/mpbp440-maskable.svg"
    ]).catch(()=>{}))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if(event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;

  event.respondWith(
    fetch(req, {cache:"no-store"})
      .then(res => {
        const copy = res.clone();
        caches.open(MPBP_CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match("/offline.html")))
  );
});
