/* MPBP440 Service Worker - V9.1 Intro */
const MPBP_CACHE="mpbp440-pwa-v9-1-intro";
const PRECACHE=["/","/index.html","/style.css","/script.js","/manifest.webmanifest","/data.json","/music/index.html","/mpbp-tv/index.html","/members/index.html","/telechargements/index.html"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(MPBP_CACHE).then(c=>c.addAll(PRECACHE)).catch(()=>{}))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==MPBP_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const url=new URL(e.request.url);const isVideo=url.pathname.endsWith(".mp4");const isMedia=/^\/assets\//.test(url.pathname);if(isVideo||isMedia){e.respondWith(fetch(e.request));return;}e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const copy=r.clone();caches.open(MPBP_CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request)))});
