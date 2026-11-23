"""Read-only site preview and narrowly scoped local screenshot receiver."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, re, threading

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT.parent / 'evidence/application-captures-private'
PUBLIC = ROOT / 'docs/v15/preuves/update-20261123'
PRIVATE.mkdir(exist_ok=True); PUBLIC.mkdir(exist_ok=True)

class Site(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def list_directory(self, path):
        self.send_error(403)
    def log_message(self, *args):
        pass

class Capture(SimpleHTTPRequestHandler):
    def do_POST(self):
        name = self.path.lstrip('/')
        length = int(self.headers.get('Content-Length', '0'))
        raw = re.fullmatch(r'(office|studio-os|render-nexus|studio-ia|audio-forensics-lab|brenda|roblox-game-factory)\.(?:png|jpg)', name)
        visual = re.fullmatch(r'(corporate|engineering|music|artist|project)-(320|390|768|1440)\.jpg', name)
        if not 0 < length < 15_000_000 or not (raw or visual or name == 'ui-update-qa.json'):
            self.send_error(400); return
        body = self.rfile.read(length)
        if raw:
            if not body.startswith((b'\x89PNG', b'\xff\xd8')): self.send_error(400); return
            target = PRIVATE / name
        elif visual:
            if not body.startswith(b'\xff\xd8'): self.send_error(400); return
            target = PUBLIC / name
        else:
            json.loads(body); target = PUBLIC / name
        target.write_bytes(body)
        self.send_response(200); self.end_headers(); self.wfile.write(b'OK')
    def log_message(self, *args):
        pass

if __name__ == '__main__':
    threading.Thread(target=ThreadingHTTPServer(('127.0.0.1', 4416), Capture).serve_forever, daemon=True).start()
    print('Local preview http://127.0.0.1:4417/ ; raw captures remain outside the Git worktree.', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4417), Site).serve_forever()
