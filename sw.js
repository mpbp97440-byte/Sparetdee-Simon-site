/* MPBP440 Service Worker - JUP clip intro fix */
const MPBP_CACHE="mpbp440-v10-jup-clip-intro-fix-202607";
const PRECACHE=["/","/index.html","/style.css","/script.js","/manifest.webmanifest","/data.json","/data/notifications.json","/data/countdowns.json","/data/events.json","/data/releases.json","/music/index.html","/mpbp-tv/index.html","/artistes/makeda-muse.html","/members/index.html","/telechargements/index.html"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(MPBP_CACHE).then(c=>c.addAll(PRECACHE)).catch(()=>{}))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==MPBP_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const url=new URL(e.request.url);const isVideo=url.pathname.endsWith(".mp4");const isMedia=/^\/assets\//.test(url.pathname);if(isVideo||isMedia){e.respondWith(fetch(e.request));return;}e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const copy=r.clone();caches.open(MPBP_CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request)))});
