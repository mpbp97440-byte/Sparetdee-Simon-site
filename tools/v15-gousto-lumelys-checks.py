"""Check the bounded Gousto/Lumélys update against the last published version."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse,unquote
import copy,hashlib,json,subprocess,sys,zipfile
from v15_catalogue_contract import validate_catalogue
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/v15/preuves/gousto-lumelys-20261123';OUT.mkdir(exist_ok=True)
BASE='040c9ed'; results=[]
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8'))
def old(p):return subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT)
def check(name,condition,detail=''):
    results.append({'name':name,'status':'PASS' if condition else 'FAIL','detail':detail});print(results[-1]['status'],name)

data=read('engineering/data/engineering.json');schema=read('engineering/data/catalogue.schema.json')
validate_catalogue(data,schema)
check('Nine public projects with schema and sales disabled',len(data['items'])==9 and all(i['public']and not i['pricing']['enabled']and not i['verification']['commercial']for i in data['items']))
check('Canonical, preview and production catalogue synchronized',data==read('preview/v15/data/engineering.json')and schema==read('docs/v15/catalogue.schema.json')==read('preview/v15/data/catalogue.schema.json'))
before=json.loads(old('engineering/data/engineering.json'))
check('Seven other projects strictly unchanged',all(i==next(x for x in data['items']if x['id']==i['id'])for i in before['items']if i['category']!='game'))
game=next(i for i in data['items']if i['category']=='game');app=next(i for i in data['items']if i['slug']=='gousto-cuisto')
check('Game beta, age condition and owner-provided official Roblox URL',game['status']=='Bêta'and 'plus de 16 ans'in game['description']and game['cta']['kind']=='play'and game['cta']['url']=='https://www.roblox.com/share?code=b27298616d269a4681a5b62bf1d46c08&type=ExperienceDetails&stamp=1795463095809')
check('Gousto live app is not labelled a fake demo or sale',app['cta']=={'kind':'open','url':'https://my-gousto-cuisto.pages.dev/','verified':True}and app['status']=='En développement'and 'libre d’utilisation pour le moment'in app['description'])
check('Local data and remote AI distinction accurately disclosed',all(w in app['description']for w in ['stockage du navigateur','prénom ou pseudo','historique récent','photo','Gemini'])and app['hosting']=='hybrid')
for kind in ['open','play']:
    invalid=copy.deepcopy(data);invalid['items'][-1]['cta']['kind']=kind;invalid['items'][-1]['cta']['verified']=False
    try:validate_catalogue(invalid,schema); rejected=False
    except ValueError:rejected=True
    check('Reject unverified '+kind+' access',rejected)
invalid=copy.deepcopy(data);invalid['items'][-1]['pricing']['enabled']=True
try:validate_catalogue(invalid,schema);rejected=False
except ValueError:rejected=True
check('Reject commercial activation',rejected)

unchanged=['data.json','data/releases.json','data/music-library.json','data/countdowns.json','data/news.json','script.js','musique/index.html','music/index.html','artistes/artist.js','manifest.webmanifest']
check('Music data, migrated homepage, catalogue, artist renderer and PWA identity unchanged',all((ROOT/p).read_bytes().replace(b'\r\n',b'\n')==old(p).replace(b'\r\n',b'\n')for p in unchanged))
files=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=ROOT,text=True).splitlines()
media=[p for p in files if p.startswith('assets/')and Path(p).suffix.lower()in('.png','.jpg','.jpeg','.webp','.svg','.mp3','.mp4','.wav')]
check('All existing media retained byte for byte',all((ROOT/p).read_bytes()==old(p)if not p.endswith('.svg')else (ROOT/p).read_bytes().replace(b'\r\n',b'\n')==old(p).replace(b'\r\n',b'\n')for p in media),str(len(media))+' original media')
protected=[p for p in files if p.startswith(('admin-440-mpbp-corp/','supabase/','.github/workflows/'))or p in ('firestore.rules','CNAME')]
check('No backend, workflow, admin or domain change',all((ROOT/p).read_bytes().replace(b'\r\n',b'\n')==old(p).replace(b'\r\n',b'\n')for p in protected))

privacy=read('docs/v15/preuves/gousto-privacy-20261123.json');im=Image.open(ROOT/privacy['publicFile'])
check('Real capture anonymized locally with stripped EXIF',not im.getexif()and len(privacy['redactions'])==4 and hashlib.sha256((ROOT/privacy['publicFile']).read_bytes()).hexdigest()==privacy['sha256'])
video=ROOT/'assets/engineering/lumelys/teaser-officiel-2026.mp4';blob=video.read_bytes()
check('Web trailer below GitHub file limit and fast start',len(blob)<30_000_000 and blob.index(b'moov')<blob.index(b'mdat'))
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',str(video)]))
check('H264/AAC trailer preserves duration',78<float(probe['format']['duration'])<79 and [s['codec_name']for s in probe['streams']]==['h264','aac'])
page=(ROOT/'engineering/projets/les-jardins-des-lumelys.html').read_text(encoding='utf-8')
check('Accessible player is controlled, inline and never autoplays','<video controls playsinline preload="none"'in page and 'autoplay'not in page and 'type="video/mp4"'in page and 'Ouvrir la vidéo MP4'in page)
check('Promotional video notice visible next to player and linked accessibly',all(word in page for word in ['Vidéo promotionnelle','visuels non contractuels','capacités de l’appareil','réglages graphiques','aria-describedby="trailer-notice"']))
check('No placeholder availability remains on active projects',all('Les vidéos officielles et les liens d’essai seront ajoutés'not in (ROOT/('engineering/projets/'+i['slug']+'.html')).read_text(encoding='utf-8')for i in [game,app]))
check('Video excluded from SW media cache and precache','.mp4'not in (ROOT/'sw.js').read_text(encoding='utf-8'))
class Page(HTMLParser):
    def __init__(self,text):super().__init__();self.refs=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        for k,v in attrs:
            if k in ('src','href','poster')and v:self.refs.append(v)
missing=[];total=0
for path in [ROOT/'index.html',ROOT/'musique/index.html']+list((ROOT/'engineering').rglob('*.html')):
    for ref in Page(path.read_text(encoding='utf-8')).refs:
        u=urlparse(urljoin('https://www.mpbp440.com/'+path.relative_to(ROOT).as_posix(),ref))
        if u.netloc!='www.mpbp440.com':continue
        target=ROOT/unquote(u.path.lstrip('/'));target=target/'index.html'if u.path.endswith('/')else target
        total+=1
        if not target.is_file():missing.append([path.name,ref])
check('All local public links and media resolve',not missing,str(total)+' refs; '+str(missing))
backup=ROOT.parent/'backups/v15-before-gousto-lumelys-040c9ed.zip'
with zipfile.ZipFile(backup)as archive:check('Pre-update backup verified',archive.testzip()is None)
for test in ['tools/v15-media-regression.test.cjs','tools/v15-visual-migration.test.cjs','tools/v15-sw-security.test.cjs','tests/security-surface.test.js','tools/v15-release-fixture.test.cjs']:
    p=subprocess.run(['node',test],cwd=ROOT,capture_output=True,text=True)
    (OUT/(Path(test).name+'.log')).write_text(p.stdout+p.stderr,encoding='utf-8');check(test,p.returncode==0)
for path in ['assets/v15/engineering-content.js','sw.js']:
    p=subprocess.run(['node','--check',path],cwd=ROOT,capture_output=True,text=True);check('JS syntax '+path,p.returncode==0)
(OUT/'static-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
sys.exit(any(x['status']=='FAIL'for x in results))
