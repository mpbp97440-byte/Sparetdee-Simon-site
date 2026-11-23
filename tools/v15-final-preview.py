from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import json,re,threading
R=Path.cwd();out=R/'docs/v15/preuves/final-captures';out.mkdir(exist_ok=True)
class Site(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(R),**k)
 def list_directory(self,path):self.send_error(403);return None
 def log_message(self,*a):pass
class Capture(SimpleHTTPRequestHandler):
 def do_POST(self):
  name=self.path.lstrip('/');length=int(self.headers.get('Content-Length','0'))
  if not(re.fullmatch(r'(corporate|music|engineering|shop|demos|tv|artist|project)-(320|390|768|1440)(-viewport)?\.jpg',name)or name in ('browser.json','pwa.json','live.json'))or not 0<length<5000000:self.send_error(400);return
  data=self.rfile.read(length)
  if name.endswith('.jpg'):
   if not data.startswith(bytes([255,216])):self.send_error(400);return
  else:json.loads(data)
  (out/name).write_bytes(data);self.send_response(200);self.end_headers();self.wfile.write(b'OK')
 def log_message(self,*a):pass
threading.Thread(target=ThreadingHTTPServer(('127.0.0.1',4416),Capture).serve_forever,daemon=True).start()
print('Final site http://127.0.0.1:4417/ ; limited screenshot/QA receiver 4416',flush=True)
ThreadingHTTPServer(('127.0.0.1',4417),Site).serve_forever()
