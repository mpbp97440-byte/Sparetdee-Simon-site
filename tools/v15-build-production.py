from pathlib import Path
import re,json,shutil,subprocess,html
from urllib.parse import urljoin,urlsplit
R=Path(__file__).resolve().parents[1]; P=R/'preview/v15'; S=R.parent/'source'; A=R/'assets/v15'; E=R/'engineering'
A.mkdir(exist_ok=True);E.mkdir(exist_ok=True)
from v15_catalogue_contract import validate_catalogue
catalog=json.loads((P/'data/engineering.json').read_text(encoding='utf-8'));validate_catalogue(catalog,json.loads((P/'data/catalogue.schema.json').read_text(encoding='utf-8')))
def write(path,text):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text,encoding='utf-8',newline='\n')
for name in ('site.css','premium-r2.css','atelier-r3.css','fonts-r3.css','site.js','corporate-update.css'):
 shutil.copyfile(P/name,A/name)
shutil.copytree(P/'fonts',A/'fonts',dirs_exist_ok=True)
shutil.copytree(P/'data',E/'data',dirs_exist_ok=True)
content=(P/'engineering-content.js').read_text(encoding='utf-8').replace("const base=new URL('.',script.src);","const base=new URL('/engineering/',location.origin);").replace("if(local){try{const draft=localStorage.getItem(draftKey);", "if(local&&document.querySelector('#editor-form')){try{const draft=localStorage.getItem(draftKey);")
content=content.replace("'engineering.html#projets'","'/engineering/#projets'")
write(A/'engineering-content.js',content)
map_pages={'index.html':'/','musique.html':'/musique/','engineering.html':'/engineering/','boutique.html':'/engineering/boutique.html','demos.html':'/engineering/demos.html'}
def public_url(ref,source):
 if ref.startswith(('#','/','https:','http:','mailto:','data:','tel:')):return ref
 resolved=urlsplit(urljoin('https://local/preview/v15/'+source,ref));path=resolved.path.removeprefix('/preview/v15/')
 target=map_pages.get(path)
 if target is None:
  target='/engineering/'+path if path.startswith('projets/') else '/assets/v15/'+path
 return target+('?' +resolved.query if resolved.query else '')+('#'+resolved.fragment if resolved.fragment else '')
def page(source,dest,description):
 text=(P/source).read_text(encoding='utf-8')
 text=re.sub(r'<div class="review">.*?</div>','',text)
 text=text.replace(' · Revue V15','').replace('Revue locale · Aucun logiciel en vente actuellement.','Aucun logiciel en vente actuellement.')
 text=text.replace('noindex,nofollow,noarchive','index,follow')
 text=re.sub(r'(href|src)="([^"]+)"',lambda m:m[1]+'="'+html.escape(public_url(html.unescape(m[2]),source),quote=True)+'"',text)
 canonical='https://www.mpbp440.com'+dest
 meta=f'<meta name="description" content="{html.escape(description,quote=True)}"><link rel="canonical" href="{canonical}"><meta property="og:url" content="{canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="MPBP 440 Corp."><meta property="og:title" content="MPBP 440 Corp. — '+('Engineering' if source!='index.html' else 'Musique et création numérique')+'"><meta property="og:description" content="'+html.escape(description,quote=True)+'"><meta property="og:image" content="https://www.mpbp440.com/assets/brand/v15/mpbp440-corp-user-official.jpg"><meta name="twitter:card" content="summary_large_image"><link rel="manifest" href="/manifest.webmanifest">'
 text=text.replace('href="/assets/v15/corporate-update.css"','href="/assets/v15/corporate-update.css?v=20261123-content-2"')
 text=text.replace('src="/assets/v15/engineering-content.js"','src="/assets/v15/engineering-content.js?v=20261123-gousto-lumelys"')
 text=text.replace('</head>',meta+'<script src="/assets/v15/portal.js" defer></script></head>')
 text=text.replace('</nav></div><div class="wrap footer-inner">','<a href="/informations/">Informations & confidentialité</a></nav></div><div class="wrap footer-inner">')
 if source=='index.html':
  org={'@context':'https://schema.org','@type':'Organization','name':'MPBP 440 Corp.','url':canonical,'logo':'https://www.mpbp440.com/assets/brand/v15/mpbp440-corp-user-official.jpg'}
  text=text.replace('</head>','<script type="application/ld+json">'+json.dumps(org,ensure_ascii=False)+'</script></head>')
 write(R/(dest.lstrip('/')+'index.html' if dest.endswith('/') else dest.lstrip('/')),text)
page('index.html','/','MPBP 440 Corp. : découvrez MPBP Music et notre univers Design & Software Engineering, logiciels, agents IA et créations numériques.')
page('engineering.html','/engineering/','MPBP Engineering : logiciels, applications, agents IA, services et MPBP Game Studio. Découvrez nos projets et les futurs essais publics.')
page('boutique.html','/engineering/boutique.html','La future boutique MPBP : projets logiciels, licences et créations numériques. Aucun achat ni abonnement actif actuellement.')
page('demos.html','/engineering/demos.html','Les démonstrations et futurs essais publics des applications, agents IA et jeux MPBP. Seuls les liens vérifiés seront proposés.')
for project in (P/'projets').glob('*.html'):
 page('projets/'+project.name,'/engineering/projets/'+project.name,'Présentation et informations vérifiées du projet MPBP '+project.stem+'. Disponibilité et accès selon validation.')
 item=next((i for i in catalog['items'] if i['slug']==project.stem and i['public'] and i['status']!='Retiré'),None)
 if not item:
  target=E/'projets'/project.name;write(target,target.read_text(encoding='utf-8').replace('index,follow','noindex,follow'));continue
 target=E/'projets'/project.name;text=target.read_text(encoding='utf-8');extras=[];esc=lambda x:html.escape(str(x),quote=True)
 def safe_url(u):return isinstance(u,str) and (u.startswith('https://') or (u.startswith('/') and not u.startswith('//')))
 caption='Pochette officielle du jeu — bêta publique pour les plus de 16 ans.' if item['category']=='game' and item['verification']['access'] else 'Capture réelle de l’application accessible en ligne ; informations personnelles masquées.' if item['cta']['kind']=='open' else 'Capture de présentation du projet. Disponibilité publique et essais à venir ; aucun téléchargement ni accès démo activé.'
 for image in item['images']:
  if safe_url(image['src']):extras.append('<figure><a href="'+esc(image['src'])+'" target="_blank" rel="noopener"><img loading="lazy" src="'+esc(image['src'])+'" alt="'+esc(image['alt'])+'" style="max-width:100%;height:auto"></a><figcaption>'+caption+'</figcaption></figure>')
 for key,label in [('limitations','Limites'),('useCases','Cas d’utilisation')]:
  if item[key]:extras.append('<h3>'+label+'</h3><ul>'+''.join('<li>'+esc(x)+'</li>' for x in item[key])+'</ul>')
 if item['hosting']:extras.append('<p>Hébergement : '+esc(item['hosting'])+'</p>')
 text=text.replace('<section class="section" id="acces">',''.join(extras)+'<section class="section" id="acces">')
 access=[]
 if item['verification']['access']:
  video=item['demoVideo']
  video_notice='<p class="editorial-note">'+esc(item['demoVideoNotice'])+'</p>' if item.get('demoVideoNotice') else ''
  if video and safe_url(video):
   parsed=urlsplit(video)
   if parsed.netloc=='www.mpbp440.com' and parsed.path.startswith('/assets/engineering/') and parsed.path.endswith('.mp4'):
    access.append('<figure class="official-trailer"><video controls playsinline preload="none" aria-label="Bande-annonce officielle — '+esc(item['name'])+'" aria-describedby="trailer-notice" poster="'+esc(item['images'][0]['src'] if item['images'] else '')+'" style="display:block;width:100%;height:auto;aspect-ratio:16/9"><source src="'+esc(parsed.path)+'" type="video/mp4">Votre navigateur ne permet pas la lecture intégrée.</video><figcaption id="trailer-notice">Teaser officiel 2026 · Lecture à votre demande. <a href="'+esc(parsed.path)+'">Ouvrir la vidéo MP4</a>.'+video_notice+'</figcaption></figure>')
   else:access.append('<p><a class="button secondary" rel="noopener noreferrer" href="'+esc(video)+'">Voir la démonstration officielle</a></p>')
  if item['cta']['verified'] and item['cta']['kind'] in ('open','play','demo','download') and safe_url(item['cta']['url']):access.append('<p><a class="button secondary" target="_blank" rel="noopener noreferrer" href="'+esc(item['cta']['url'])+'">'+{'open':'Ouvrir My Gousto Cuisto','play':'Jouer sur Roblox','demo':'Essayer la démonstration','download':'Télécharger'}[item['cta']['kind']]+'</a></p>')
 if access:text=text.replace('<h2>Démonstrations &amp; accès</h2>','<h2>Démonstrations &amp; accès</h2>'+''.join(access)).replace('<h2>Démonstrations & accès</h2>','<h2>Démonstrations & accès</h2>'+''.join(access))
 if access:text=text.replace('Les vidéos officielles et les liens d’essai seront ajoutés lorsqu’un accès public vérifié sera disponible.','Accès officiel fourni par MPBP. Consultez les conditions et prérequis avant de continuer.')
 if item['images']:
  text=text.replace('property="og:image" content="https://www.mpbp440.com/assets/brand/v15/mpbp440-corp-user-official.jpg"','property="og:image" content="'+esc(urljoin('https://www.mpbp440.com',item['images'][0]['src']))+'"')
 write(target,text)
# Controlled migration from the immutable baseline, never from an already transformed home.
BASELINE='49e4ae78539e2305296db3c92ad7d8e1a3f528f2'
def baseline(name):return subprocess.check_output(['git','show',BASELINE+':'+name],cwd=R).decode('utf-8')
original=baseline('index.html')
def music_link(value,filename):
 parsed=urlsplit(urljoin('https://www.mpbp440.com/'+filename,value))
 if parsed.netloc!='www.mpbp440.com' or parsed.path not in ('/','/index.html'):return value
 if parsed.fragment=='morceaux':return '/music/index.html#morceaux'
 return '/musique/'+('?' +parsed.query if parsed.query else '')+('#'+parsed.fragment if parsed.fragment else '')
for name in subprocess.check_output(['git','ls-tree','-r','--name-only',BASELINE],cwd=R,text=True).splitlines():
 if not name.endswith('.html'):continue
 relative=Path(name)
 if '.git' in relative.parts or str(relative)=='index.html':continue
 src=baseline(name)
 updated=re.sub(r'href="([^"]+)"',lambda m:'href="'+music_link(m[1],relative.as_posix())+'"',src)
 if relative.as_posix().startswith('artistes/'):
  updated=updated.replace('artist.js?v=v13-3-content-video-20260910','artist.js?v=v15-links-20261123').replace('artist.js?v=v13-2-release-hardening-20260829b','artist.js?v=v15-links-20261123')
 if not relative.parts[0].startswith('admin'):
  updated=re.sub(r'(src="(?:\.\./|/)?script\.js)\?[^"\s]*',r'\1?v=v15-content-20261123',updated)
 if updated!=src:write(R/relative,updated)
music=re.sub(r'(src|href)="([^"]+)"',lambda m:m[1]+'="'+(m[2] if m[2].startswith(('/','#','http:','https:','mailto:','data:')) else '/'+m[2])+'"',original)
music=re.sub(r'href="([^"]+)"',lambda m:'href="'+music_link(m[1],'index.html')+'"',music)
# The old root-only helper strips /assets into assets. At /musique/ it breaks
# lazy static images and the generic error fallback conceals the failed request.
legacy_image_rewrite="<script>document.querySelectorAll('img[src^=\"/assets/\"]').forEach(image => { image.src = image.getAttribute('src').slice(1); });</script>"
assert music.count(legacy_image_rewrite)==1, 'Audit changed: inspect the original image rewrite before migrating'
music=music.replace(legacy_image_rewrite,'<!-- V15: preserve root-absolute media paths at /musique/. -->')

# Canonical and structured website identity belong to the musical entry now.
music=music.replace('https://www.mpbp440.com/"','https://www.mpbp440.com/musique/"')
music=music.replace('<title>MPBP440 - Site officiel | M.P.B.P 440 Corp.</title>','<title>MPBP Music — Artistes, sorties et clips | MPBP 440 Corp.</title>')
music=music.replace('<h2>Informations</h2>','<h2>Informations</h2><a href="/">Portail MPBP 440 Corp.</a><a href="/engineering/">Design & Engineering</a><a href="/informations/">Informations & confidentialité</a>')
music=music.replace('v=v13-2-release-hardening-20260829','v=v15-content-20261123').replace('v=v13-3-content-video-20260910','v=v15-production-20261123')
music=music.replace('<link rel="canonical" href="/musique/">','<link rel="canonical" href="https://www.mpbp440.com/musique/">')
write(R/'musique/index.html',music)
script=baseline('script.js').replace('(?:music|artistes|','(?:musique|music|actu|mon-espace|artistes|').replace('"/#radio"','"/musique/#radio"').replace('"../index.html#radio"','"/musique/#radio"')
script=script.replace('(path === "/" || path === "")','(path === "/" || path === "" || path === "/musique/")')
script=script.replace('"35 titres Sparetdee Simon et Je sais que tu sais, avec pochettes, liens plateformes et recherche accentuée."','String(tracks.length) + " titres du catalogue officiel, avec les pochettes d’origine et les liens de chaque artiste."')
script=script.replace('La page Music Hub contient les 36 cartes et tous les filtres.','La page Music Hub rassemble tous les titres et les filtres du catalogue.')
write(R/'script.js',script)
home=baseline('assets/js/v12-homepage.js').replace('document.baseURI','new URL("/",location.origin)')
write(R/'assets/js/v12-homepage.js',home)
nav=baseline('assets/js/v12-navigation.js').replace('linkPath === "/" &&','linkPath === "/musique/" &&').replace('currentPath !== "/" ||','currentPath !== "/musique/" ||')
write(R/'assets/js/v12-navigation.js',nav)
legacy=['home','sortie','alaune','avenir','clips','artistes','artists-hall','actus','actu','events','galerie','radio','label','recherche','journal','liens','application','contenu-principal','morceaux']
portal='''(() => { 'use strict';
const legacy=new Set(LEGACY);
function route(){if(!['/','/index.html'].includes(location.pathname))return;let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{return;}if(legacy.has(hash)){location.replace((hash==='morceaux'?'/music/index.html':'/musique/')+location.search+'#'+encodeURIComponent(hash));}}
route();addEventListener('hashchange',route);
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
})();'''.replace('LEGACY',json.dumps(legacy))
write(A/'portal.js',portal)
manifest=json.loads(baseline('manifest.webmanifest'));manifest['id']='/';manifest['start_url']='/musique/'
write(R/'manifest.webmanifest',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# Cache only explicitly public resources. Never cache account/admin/Worker/API requests.
precache=['/','/index.html','/musique/','/offline.html','/manifest.webmanifest','/script.js','/data.json','/data/releases.json','/data/news.json','/data/events.json','/data/gallery.json','/assets/v15/corporate-update.css','/assets/brand/mpbp440-corp-official.png']
precache += ['/'+p.relative_to(R).as_posix() for p in (R/'assets/css').glob('v14-*.css')]
precache += ['/assets/js/'+x for x in ('v12-preview-basepath.js','v12-navigation.js','v12-homepage.js','v14-motion.js','mpbp440-firebase.js')]
precache += ['/assets/v15/'+x for x in ('site.css','premium-r2.css','site.js','portal.js')]
sw='''const MPBP_CACHE='mpbp440-v15-20261123-v4-gousto-lumelys';
const PRECACHE=PRECACHE_JSON;
const privatePath=/^\\/(?:admin[^/]*|members|mon-espace|analytics|dashboard|api)(?:\\/|\\.|$)/;
self.addEventListener('install',event=>{event.waitUntil(caches.open(MPBP_CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mpbp440-')&&k!==MPBP_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||privatePath.test(url.pathname)||(url.search&&!/^\\/(?:assets\\/|script\\.js$|data(?:\\.json|\\/))/.test(url.pathname))||request.headers.has('Authorization')||!(/\\.(?:html|css|js|json|webmanifest|png|jpg|webp|ttf)$/.test(url.pathname)||url.pathname.endsWith('/')))return;
event.respondWith(fetch(request).then(response=>{if(response.ok&&response.type==='basic'&&!/no-store|private/i.test(response.headers.get('Cache-Control')||'')){const clone=response.clone();event.waitUntil(caches.open(MPBP_CACHE).then(cache=>cache.put(url.pathname,clone)));}return response;}).catch(()=>caches.match(url.pathname).then(hit=>hit||(request.mode==='navigate'?caches.match('/offline.html'):Response.error()))));});
self.addEventListener('notificationclick',event=>{event.notification.close();let target=new URL('/musique/',self.location.origin);try{const requested=new URL(event.notification?.data?.url||'/musique/',self.location.origin);if(requested.origin===self.location.origin)target=requested;}catch{}event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{const found=list[0];if(found){found.navigate(target.href);return found.focus();}return clients.openWindow(target.href);}));});
'''.replace('PRECACHE_JSON',json.dumps(precache))
write(R/'sw.js',sw)
# Directory route previously returned 404: retain the existing artist section itself.
artists=re.search(r'<section[^>]*id="artistes".*?</section>',music,re.S)[0]
write(R/'artistes/index.html','<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Artistes — MPBP Music</title><link rel="canonical" href="https://www.mpbp440.com/artistes/"><link rel="stylesheet" href="/assets/css/v14-compat.css"><link rel="stylesheet" href="/assets/css/v14-home.css"><link rel="stylesheet" href="/assets/css/v14-responsive.css"></head><body class="v14-miami"><main><p><a href="/musique/">MPBP Music</a> · <a href="/">Portail MPBP 440 Corp.</a></p>'+artists+'</main></body></html>')
info='''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informations & confidentialité — MPBP 440 Corp.</title><link rel="canonical" href="https://www.mpbp440.com/informations/"><link rel="stylesheet" href="/assets/v15/site.css"></head><body><main class="wrap section"><a href="/">MPBP 440 Corp.</a><h1>Informations & confidentialité</h1><h2>Contact professionnel</h2><p><a href="mailto:mpbp97440@gmail.com">mpbp97440@gmail.com</a></p><h2>Édition et hébergement</h2><p>Site MPBP 440 Corp., hébergé sur GitHub Pages. Les informations juridiques de l’éditeur et du responsable de publication restent à compléter et à valider.</p><h2>Données et contenus intégrés</h2><p>L’univers musical conserve ses services Firebase, ses médias externes et ses fonctions existantes. Certains lecteurs externes peuvent transmettre des données à leurs fournisseurs lors de leur utilisation. Les informations détaillées sur les traitements, durées de conservation et droits restent à valider.</p><p>Les préférences, favoris et brouillons locaux sont conservés sur l’appareil. Ils ne constituent pas un espace client sécurisé.</p><h2>Commercialisation</h2><p>Aucun logiciel n’est proposé à la vente. Aucun paiement ou abonnement n’est activé. Les tarifs, conditions de licence, CGV, modalités de résiliation et informations précontractuelles seront validés avant toute ouverture commerciale.</p><p>Cette page ne constitue pas une validation juridique des mentions à compléter.</p><a href="/musique/">MPBP Music</a> · <a href="/engineering/">Engineering</a></main></body></html>'''
write(R/'informations/index.html',info)
write(R/'404.html','<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page introuvable — MPBP 440 Corp.</title><link rel="stylesheet" href="/assets/v15/site.css"><main class="wrap section"><h1>Page introuvable</h1><p>Retrouvez les deux univers de MPBP 440 Corp.</p><a href="/">Portail corporate</a> · <a href="/musique/">MPBP Music</a> · <a href="/engineering/">Engineering</a></main></html>')
sitemap=baseline('sitemap.xml')
urls=['/musique/','/engineering/','/engineering/boutique.html','/engineering/demos.html','/artistes/','/informations/']+['/engineering/projets/'+i['slug']+'.html' for i in catalog['items'] if i['public'] and i['status']!='Retiré']
extra=''.join('<url><loc>https://www.mpbp440.com'+u+'</loc></url>\n' for u in urls if 'https://www.mpbp440.com'+u+'</loc>' not in sitemap)
write(R/'sitemap.xml',sitemap.replace('</urlset>',extra+'</urlset>'))
print('Production V15 generated: corporate, complete musical migration, Engineering, protected public PWA, SEO. No backend or payment changes.')
