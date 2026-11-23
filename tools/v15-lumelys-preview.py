"""Local read-only preview and restricted capture receiver for this update."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re, threading

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT.parent / 'evidence/gousto-lumelys'
EVIDENCE.mkdir(exist_ok=True)

class Site(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def list_directory(self, path): self.send_error(403)
    def log_message(self, *args): pass

class Capture(SimpleHTTPRequestHandler):
    def do_POST(self):
        name = self.path.lstrip('/')
        size = int(self.headers.get('Content-Length', '0'))
        if not re.fullmatch(r'(gousto-raw|(?:gousto|lumelys|demos|engineering)-(?:320|390|768|1440))\.jpg', name) or not 0 < size < 15_000_000:
            self.send_error(400); return
        body = self.rfile.read(size)
        if not body.startswith(b'\xff\xd8'): self.send_error(400); return
        (EVIDENCE / name).write_bytes(body)
        self.send_response(200); self.end_headers(); self.wfile.write(b'OK')
    def log_message(self, *args): pass

if __name__ == '__main__':
    threading.Thread(target=ThreadingHTTPServer(('127.0.0.1',4416),Capture).serve_forever,daemon=True).start()
    print('Preview http://127.0.0.1:4417/ ; captures outside Git.',flush=True)
    ThreadingHTTPServer(('127.0.0.1',4417),Site).serve_forever()
