"""Prepare only inspected, privacy-safe product images. Raw captures remain outside Git."""
from pathlib import Path
import copy, hashlib, json
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT.parent / 'evidence/application-captures-private'
OUTPUT = ROOT / 'assets/engineering/showcase-20261123'
OUTPUT.mkdir(parents=True, exist_ok=True)
CATALOGUE = ROOT / 'preview/v15/data/engineering.json'
data = json.loads(CATALOGUE.read_text(encoding='utf-8'))
if not any(item['id'] == 'mpbp-studio-ia' for item in data['items']):
    item = copy.deepcopy(data['items'][0])
    item.update(id='mpbp-studio-ia', slug='studio-ia', name='Studio IA MPBP440 PRO', order=max(i['order'] for i in data['items']) + 1)
    data['items'].append(item)
if not any(item['id'] == 'mpbp-roblox-game-factory' for item in data['items']):
    item = copy.deepcopy(data['items'][0])
    item.update(id='mpbp-roblox-game-factory', slug='roblox-game-factory', name='MPBP440 Roblox Game Factory', order=max(i['order'] for i in data['items']) + 1, images=[], features=[], description='', summary='Le projet MPBP de préparation et de création d’univers Roblox, présenté en vitrine avant ses futurs accès publics.')
    data['items'].append(item)

entries = [
    ('office', 'office.png', 'Vue d’ensemble de MPBP 440 Office — capture de présentation anonymisée', 'Un bureau de gestion MPBP pour présenter devis, factures, clients et documents dans un même environnement.', 'Archive de présentation existante ; espace initial sans clients ni montants personnels. Avatar utilisateur flouté.'),
    ('brenda', 'brenda.png', 'Brenda — interface de présentation de l’agent MPBP', 'Un agent MPBP à l’identité immersive, présenté ici avant sa future mise à disposition au public.', 'Archive de présentation existante ; accueil vide, aucune demande, clé ou donnée de compte visible.'),
    ('audio-forensics-lab', 'audio-forensics-lab.jpg', 'Audio Forensics Lab — écran d’analyse sans fichier personnel chargé', 'Un laboratoire audio MPBP dont l’interface réunit analyse, comparaison et outils spécialisés. Découvrez sa présentation avant son ouverture publique.', 'Capture native du 23 novembre 2026 ; aucun fichier chargé, aucune analyse lancée, aucun nom, chemin privé ou résultat personnel visible.'),
    ('studio-ia', 'studio-ia.jpg', 'Studio IA MPBP440 PRO — tableau de bord sans projet personnel chargé', 'Un studio audio MPBP dont l’interface réunit les pistes, le mixage et l’assistance IA. Une nouvelle vitrine dédiée, avant les futurs essais publics.', 'Capture native du 23 novembre 2026 ; aucun projet ni fichier chargé, pas de nom, chemin privé, clé ou donnée financière visible.'),
    ('studio-os', 'studio-os.jpg', 'MPBP Studio OS — cockpit de présentation avec données personnelles et financières floutées', 'Le cockpit MPBP de pilotage d’activité : un aperçu de son environnement de gestion, présenté avant sa future disponibilité publique.', 'Capture du 23 novembre 2026 ; nom, indicateurs financiers et compteurs confidentiels masqués localement avant publication. Aucun document modifié.'),
    ('render-nexus', 'render-nexus.jpg', 'MPBP440 Render Nexus — Visual Motion Lab, capture de présentation anonymisée', 'Un atelier de création visuelle MPBP : découvrez son interface de montage, sa timeline et son espace de composition avant les futurs essais publics.', 'Capture du 23 novembre 2026 ; nom du projet et libellé nominatif de l’assistant masqués. Aucun média importé et aucun export lancé.'),
    ('roblox-game-factory', 'roblox-game-factory.jpg', 'MPBP440 Roblox Game Factory — centre de commande local en présentation', 'Un atelier MPBP consacré à la préparation de projets Roblox. Découvrez son centre de commande avant les futurs essais publics.', 'Capture du 23 novembre 2026 ; aucun projet ou compte personnel affiché. Versions techniques de l’environnement masquées ; aucune publication de jeu effectuée.'),
]
proof = []
for slug, filename, alt, summary, note in entries:
    source = PRIVATE / filename
    if not source.exists():
        print('MISSING private capture:', slug)
        continue
    image = Image.open(source).convert('RGB')
    redactions = []
    boxes = []
    if slug == 'office':
        # The inspected archive is empty of business data. Redact its user avatar too.
        box = (int(image.width*.947), 8, min(image.width, int(image.width*.985)), 70)
        boxes.append(('user-avatar', box))
    elif slug == 'studio-os':
        assert image.size == (1920, 1032), 'Reinspect Studio OS redaction geometry after a new capture.'
        boxes = [('personal-greeting',(340,200,690,250)),('financial-status',(340,308,1060,338)),('private-document-counter',(210,390,238,417)),('financial-indicators',(315,537,1870,607)),('financial-chart',(330,708,1215,885)),('financial-summary',(318,936,1205,984)),('private-followup-counters',(1276,919,1840,960))]
    elif slug == 'render-nexus':
        assert image.size == (1920, 1032), 'Reinspect Render Nexus redaction geometry after a new capture.'
        boxes = [('private-project-title',(622,52,1240,105)),('assistant-personal-label',(1605,173,1728,194))]
    elif slug == 'roblox-game-factory':
        assert image.size == (1920, 1032), 'Reinspect Game Factory redaction geometry after a new capture.'
        boxes = [('local-tool-versions',(308,299,1828,327))]
    for kind, box in boxes:
        region=image.crop(box)
        # Remove fine details locally before blur; the original pixels never reach public assets.
        region=region.resize((max(1,region.width//40),max(1,region.height//40)),Image.Resampling.BOX).resize(region.size,Image.Resampling.NEAREST).filter(ImageFilter.GaussianBlur(24))
        image.paste(region,box)
        redactions.append({'kind':kind,'box':list(box),'method':'local downsampling and Gaussian blur'})
    image.thumbnail((1920, 1800))
    destination = OUTPUT / (slug + '.webp')
    image.save(destination, 'WEBP', quality=88, method=6, exif=b'')
    item = next(i for i in data['items'] if i['slug'] == slug)
    item.update(summary=summary, description=summary + ' Les captures présentent le projet ; elles ne constituent ni un accès au logiciel ni une démonstration interactive. La disponibilité future et les modalités d’essai en démo ou en ligne seront annoncées après validation.', images=[{'src':'/assets/engineering/showcase-20261123/'+destination.name, 'alt':alt}], status='En développement', updatedAt='2026-11-23')
    item['verification'].update(content=True, access=False, commercial=False, checkedAt='2026-11-23', source=note)
    item['cta']={'kind':'none','url':None,'verified':False}
    item['pricing']['enabled']=False
    proof.append({'slug':slug,'publicFile':destination.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(destination.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'review':note,'redactions':redactions,'dimensions':list(image.size),'exifRemoved':True})
CATALOGUE.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'docs/v15/preuves/showcase-privacy-20261123.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Prepared',len(proof),'privacy-reviewed presentation images; no software binaries or public access enabled.')
