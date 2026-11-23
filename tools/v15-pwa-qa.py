from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import json
R=Path.cwd();flag=R.parent/'evidence/pwa-upgrade-v15.flag'
page='''<!doctype html><meta charset="utf-8"><title>Local PWA upgrade QA</title><h1>Local PWA upgrade QA</h1><button id="seed">Create isolated QA marker</button><pre id="state">Loading</pre><script>
document.querySelector('#seed').onclick=()=>{localStorage.setItem('mpbp440.v15.qa-only','preserved');location.reload();};
(async()=>{try{const registration=await navigator.serviceWorker.register('/sw.js');await registration.update();await navigator.serviceWorker.ready;const state={controller:navigator.serviceWorker.controller?.scriptURL||null,active:registration.active?.state,waiting:registration.waiting?.state,marker:localStorage.getItem('mpbp440.v15.qa-only'),caches:[]};for(const key of await caches.keys()){const cache=await caches.open(key);state.caches.push({key,paths:(await cache.keys()).map(r=>new URL(r.url).pathname)});}document.querySelector('#state').textContent=JSON.stringify(state,null,2);}catch(error){document.querySelector('#state').textContent=String(error);}})();</script>'''
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(R if flag.exists() else R.parent/'source'),**k)
 def do_GET(self):
  if self.path=='/qa-pwa.html':
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(page.encode());return
  super().do_GET()
 def end_headers(self):self.send_header('Cache-Control','no-cache');super().end_headers()
 def log_message(self,*a):pass
print('PWA QA baseline -> V15 server: http://127.0.0.1:4418/qa-pwa.html',flush=True)
ThreadingHTTPServer(('127.0.0.1',4418),Handler).serve_forever()
