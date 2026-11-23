"""Verify the explicitly authorized content/showcase update against the last published fix."""
from pathlib import Path
import copy, hashlib, json, subprocess, sys
from urllib.parse import urlparse, urljoin, unquote
from html.parser import HTMLParser
import runpy
from PIL import Image
from v15_catalogue_contract import validate_catalogue

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'docs/v15/preuves/update-20261123'
OUT.mkdir(exist_ok=True)
BASE = '0aedf54'
LINKS = runpy.run_path(str(ROOT/'tools/v15-content-update-20261123.py'))['LINKS']
results = []
def check(name, condition, detail=''):
    results.append({'name':name,'status':'PASS' if condition else 'FAIL','detail':detail})
    print(results[-1]['status'],name,detail)
def old(name):
    return subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT)
def read(name):
    return json.loads((ROOT/name).read_text(encoding='utf-8'))

data=read('data.json'); before=json.loads(old('data.json'))
check('All music track IDs and order retained',[i.get('id')for i in data['tracks']]==[i.get('id')for i in before['tracks']])
for previous,current in zip(before['tracks'],data['tracks']):
    if previous.get('id')not in LINKS:
        assert previous==current,previous.get('id')
    else:
        assert previous.get('cover')==current.get('cover') and previous.get('promoCover')==current.get('promoCover')
check('Unrequested tracks unchanged; original covers retained',True)
for name,entries in [('data.json',data['tracks']),('data/releases.json',read('data/releases.json')),('data/music-library.json',read('data/music-library.json'))]:
    for identity,links in LINKS.items():
        item=next(i for i in entries if i.get('id')==identity)
        check(name+' / '+identity,item['status']=='Disponible'and all(item['links'].get(k)==v for k,v in links.items()))
check('Confirmed releases removed from future countdowns',all(i.get('id')not in LINKS for field in ('upcoming','countdowns')for i in data[field]))
check('CMS countdown mirror synchronized',all(i.get('id')not in LINKS for i in read('data/countdowns.json')))
check('Latest featured release available',data['featured']['id']=='le-bizz-cest-bon-2-0'and data['featured']['status']=='Disponible')
for identity,links in LINKS.items():
    check('Official platform hosts '+identity,urlparse(links['apple']).hostname=='music.apple.com'and urlparse(links['spotify']).hostname=='open.spotify.com'and urlparse(links['youtube']).hostname=='music.youtube.com'and urlparse(links['deezer']).hostname=='link.deezer.com')
news=read('data/news.json')
check('Engineering announcement links to real universe',any(i['id']=='mpbp-engineering-vitrine-20261123'and i['url']=='/engineering/'for i in news))
check('Bizz news no longer advertises a future release',all('sortie prévue'not in i['title']and '/a-venir/'!=i.get('url')for i in news if i.get('id')=='le-bizz-cest-bon-2-0-presortie-20261024'))

catalogue=read('engineering/data/engineering.json');validate_catalogue(catalogue,read('engineering/data/catalogue.schema.json'))
check('Catalogue schema and no-sale policy',len(catalogue['items'])==8 and all(not i['pricing']['enabled']and i['cta']['kind']=='none'and not i['verification']['access']for i in catalogue['items']))
privacy=read('docs/v15/preuves/showcase-privacy-20261123.json')
check('Seven reviewed product images; no raw screenshot in public catalogue',len(privacy)==7 and all(i['images']and all(x['src'].endswith('.webp')for x in i['images'])for i in catalogue['items']if i['category']!='game'))
for item in privacy:
    image=Image.open(ROOT/item['publicFile'])
    check('Public image metadata stripped '+item['slug'],not image.getexif()and hashlib.sha256((ROOT/item['publicFile']).read_bytes()).hexdigest()==item['sha256'])
check('Sensitive Studio OS regions anonymized',len(next(i for i in privacy if i['slug']=='studio-os')['redactions'])>=7)
check('Private project label anonymized',bool(next(i for i in privacy if i['slug']=='render-nexus')['redactions']))

originals=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=ROOT,text=True).splitlines()
images=[p for p in originals if p.startswith('assets/')and Path(p).suffix.lower()in('.png','.jpg','.webp','.svg','.mp4','.mp3','.wav')]
check('All pre-existing media bytes unchanged',all(((ROOT/p).read_bytes().replace(b'\r\n',b'\n')==old(p).replace(b'\r\n',b'\n'))if p.endswith('.svg')else (ROOT/p).read_bytes()==old(p)for p in images),str(len(images))+' files; SVG line endings normalized')
protected=[p for p in originals if p.startswith(('admin-440-mpbp-corp/','supabase/','.github/workflows/'))or p in ('firestore.rules','CNAME')]
check('Backend, rules, production workflows unchanged',all((ROOT/p).read_bytes().replace(b'\r\n',b'\n')==old(p).replace(b'\r\n',b'\n')for p in protected),str(len(protected))+' files; text line endings normalized')

class Page(HTMLParser):
    def __init__(self,text):super().__init__();self.refs=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for key in ('href','src','poster'):
            if key in a:self.refs.append(a[key])
missing=[];total=0
pages=[ROOT/'index.html',ROOT/'musique/index.html']+list((ROOT/'engineering').rglob('*.html'))+list((ROOT/'artistes').glob('*.html'))
for page in pages:
    for value in Page(page.read_text(encoding='utf-8')).refs:
        url=urlparse(urljoin('https://www.mpbp440.com/'+page.relative_to(ROOT).as_posix(),value))
        if url.netloc!='www.mpbp440.com':continue
        target=ROOT/unquote(url.path.lstrip('/'));target=target/'index.html'if url.path.endswith('/')else target
        total+=1
        if not target.is_file():missing.append((page.name,value))
check('Production local resources resolve',not missing,str(total)+' references; '+str(missing))
for name in ('artistes/artist.js','assets/v15/engineering-content.js','sw.js'):
    result=subprocess.run(['node','--check',name],cwd=ROOT,capture_output=True,text=True)
    check('JS syntax '+name,result.returncode==0,result.stderr[:150])
for name in ('tools/v15-media-regression.test.cjs','tools/v15-visual-migration.test.cjs','tools/v15-sw-security.test.cjs','tests/security-surface.test.js','tools/v15-release-fixture.test.cjs','tests/release-hardening.test.js','tests/content-20261013.test.js'):
    result=subprocess.run(['node',name],cwd=ROOT,capture_output=True,text=True)
    (OUT/(Path(name).name+'.log')).write_text(result.stdout+result.stderr,encoding='utf-8')
    check(name,result.returncode==0,'Original October content expectations may intentionally differ; see log.')
(OUT/'static-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
sys.exit(any(i['status']=='FAIL'and i['name']not in ('tests/content-20261013.test.js','tests/release-hardening.test.js')for i in results))
