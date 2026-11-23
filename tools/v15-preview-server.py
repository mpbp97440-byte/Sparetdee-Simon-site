"""Local-only design review server. Blocks remote integrations and all writes."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Robots-Tag','noindex, nofollow, noarchive')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; font-src 'self'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'self'")
        super().end_headers()
    def do_GET(self):
        if self.path.split('?')[0] in ('/sw.js','/manifest.webmanifest'):
            self.send_error(404,'PWA intentionally disabled on isolated design review origin');return
        if self.path=='/':
            self.send_response(302);self.send_header('Location','/preview/v15/');self.end_headers();return
        super().do_GET()
    def list_directory(self,path):self.send_error(403,'Directory listing disabled')
    def do_POST(self):self.send_error(405,'Read-only preview')
    def do_PUT(self):self.send_error(405,'Read-only preview')
    def do_DELETE(self):self.send_error(405,'Read-only preview')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4415);args=parser.parse_args()
    print(f'MPBP440 design review: http://127.0.0.1:{args.port}/preview/v15/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
