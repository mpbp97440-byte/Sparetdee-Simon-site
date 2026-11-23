"""Owner-provided game media and verified public application presentation."""
from pathlib import Path
import copy, hashlib, json
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path.home()/'Downloads/Les Jardins Des Lumélys pour teaser all'
EVIDENCE=ROOT.parent/'evidence/gousto-lumelys'
ROBLOX='https://www.roblox.com/share?code=b27298616d269a4681a5b62bf1d46c08&type=ExperienceDetails&stamp=1795463095809'
APP='https://my-gousto-cuisto.pages.dev/'

def write(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':
    image=Image.open(SOURCE/'flyer base.png').convert('RGB')
    image.save(ROOT/'assets/engineering/lumelys/pochette-officielle.webp','WEBP',quality=92,method=6)
    raw=EVIDENCE/'gousto-raw.jpg'
    image=Image.open(raw).convert('RGB')
    # Public fresh-browser screen contains a default name in four locations.
    # Mask them locally; never publish the unredacted capture.
    boxes=[(370,48,620,73),(400,201,645,237),(400,250,665,309),(396,650,848,704)]
    for box in boxes:
        region=image.crop(box)
        region=region.resize((max(1,region.width//22),max(1,region.height//22))).resize(region.size).filter(ImageFilter.GaussianBlur(15))
        image.paste(region,box)
    dest=ROOT/'assets/engineering/showcase-20261123/gousto-cuisto.webp'
    image.save(dest,'WEBP',quality=88,method=6)
    privacy={'slug':'gousto-cuisto','publicFile':dest.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'redactions':boxes,'review':'Capture réelle dans une session neuve, aucun compte personnel connecté ; prénom affiché masqué aux quatre emplacements. Aucun message ni photo envoyé.'}
    write(ROOT/'docs/v15/preuves/gousto-privacy-20261123.json',privacy)

    path=ROOT/'preview/v15/data/engineering.json'
    data=json.loads(path.read_text(encoding='utf-8'))
    game=next(i for i in data['items'] if i['slug']=='les-jardins-des-lumelys')
    game.update(summary='Entrez dans Les Jardins des Lumélys : un univers Roblox en bêta publique pour les joueurs de plus de 16 ans. Découvrez la pochette et le teaser officiels, puis rejoignez le jeu.',description='Les Jardins des Lumélys ouvre les portes de son univers sur Roblox. La bêta est publique pour les joueurs de plus de 16 ans. Découvrez la pochette officielle et la bande-annonce promotionnelle 2026, puis accédez à l’expérience avec le lien fourni par MPBP. Les mises à jour du jeu seront présentées ici au fil de leur publication.',images=[{'src':'/assets/engineering/lumelys/pochette-officielle.webp','alt':'Pochette officielle Les Jardins des Lumélys — monde féerique, jardins et portails lumineux'}],demoVideo='https://www.mpbp440.com/assets/engineering/lumelys/teaser-officiel-2026.mp4',features=['Bêta publique sur Roblox','Univers des Jardins des Lumélys','Pochette et teaser officiels 2026'],limitations=['Réservé aux joueurs de plus de 16 ans','Connexion et compte Roblox requis ; accès selon les conditions et réglages Roblox','Version bêta susceptible d’évoluer'],platforms=['Roblox'],requirements=['Compte Roblox compatible avec les conditions d’âge et d’accès','Connexion Internet','Application Roblox selon l’appareil'],hosting='cloud',status='Bêta',updatedAt='2026-11-23',cta={'kind':'play','url':ROBLOX,'verified':True},verification={'content':True,'access':True,'commercial':False,'checkedAt':'2026-11-23','source':'Pochette, teaser et lien officiels fournis par le propriétaire ; bêta publique plus de 16 ans et usage quotidien confirmés par lui. Lien Roblox contrôlé : redirection vers connexion. Session joueur non exécutée par Codex.'})
    game['demoVideoNotice']='Vidéo promotionnelle — visuels non contractuels. Les images, décors et éléments présentés peuvent différer de ceux du jeu. Le rendu peut varier selon les capacités de l’appareil et les réglages graphiques.'
    game['limitations'].append(game['demoVideoNotice'])
    app=next((i for i in data['items'] if i['slug']=='gousto-cuisto'),None)
    if app is None:
        app=copy.deepcopy(data['items'][0]); data['items'].append(app)
    app.update(id='mpbp-gousto-cuisto',slug='gousto-cuisto',category='software',name='My Gousto Cuisto',summary='Votre compagnon de cuisine dans le navigateur : idées de repas, inventaire et recettes. Application en développement, libre d’utilisation pour le moment, avec un mode local et des fonctions IA en ligne.',description='My Gousto Cuisto vous accompagne en cuisine avec une mascotte, des recettes, des idées à partir des ingrédients disponibles et un inventaire du frigo ou du placard. L’application est accessible dans le navigateur, libre d’utilisation pour le moment, et continue d’évoluer. L’inventaire, les préférences et le suivi sont conservés dans le stockage du navigateur sur l’appareil utilisé. Les fonctions IA utilisent un service en ligne : la discussion peut transmettre la question, les ingrédients, le prénom ou pseudo et l’historique récent au service IA ; l’analyse photo transmet une copie réduite de l’image après accord. Le service est présenté dans l’application comme utilisant Gemini. Le mode cuisine local reste prévu lorsque le réseau manque. La confidentialité ne doit donc pas être interprétée comme une absence totale d’envoi de données.',images=[{'src':'/assets/engineering/showcase-20261123/gousto-cuisto.webp','alt':'My Gousto Cuisto — accueil et mascotte de cuisine, prénom flouté sur la capture de présentation'}],demoVideo=None,features=['Recettes et idées de repas selon les ingrédients','Inventaire du frigo et du placard conservé sur l’appareil','Mode cuisine local et assistance IA en ligne','Scanner photo avec accord avant envoi','Interface pensée pour le navigateur et installation proposée selon compatibilité'],limitations=['Version en développement : les fonctions peuvent évoluer','Les données locales dépendent du navigateur et de l’appareil ; leur effacement peut supprimer le suivi','Internet nécessaire au premier chargement et aux fonctions IA ; mode hors ligne selon les ressources déjà mises en cache','Discussion IA : question, ingrédients, pseudo et historique récent peuvent être transmis ; analyse photo après accord','Compatibilité de la caméra, de la voix et de l’installation variable selon le navigateur','Les conseils et estimations nutritionnelles ne remplacent pas un avis professionnel'],useCases=['Préparer un repas avec ce qui reste dans le frigo','Retrouver des recettes et organiser ses ingrédients'],platforms=['Navigateur web sur ordinateur','Tablette et smartphone selon compatibilité'],requirements=['Navigateur récent avec JavaScript et stockage local','Connexion Internet pour les fonctions en ligne'],hosting='hybrid',status='En développement',version=None,updatedAt='2026-11-23',changelog=[],documentation=[{'label':'Ouvrir My Gousto Cuisto','url':APP}],license='Libre d’utilisation pour le moment selon le propriétaire. Cette indication ne constitue pas une licence open source.',cta={'kind':'open','url':APP,'verified':True},public=True,order=8,verification={'content':True,'access':True,'commercial':False,'checkedAt':'2026-11-23','source':'Site public et JavaScript v30 examinés le 23 novembre 2026. localStorage/IndexedDB et appels /api/gousto-ai identifiés ; accueil et navigation accessibles sans compte. Fonctions IA, scanner et conservation serveur non testés. Libre utilisation temporaire confirmée par le propriétaire.'})
    write(path,data)
    # Canonical schema; builder distributes it to preview and public copies.
    path=ROOT/'docs/v15/catalogue.schema.json'; schema=json.loads(path.read_text(encoding='utf-8'))
    kinds=schema['properties']['items']['items']['properties']['cta']['properties']['kind']['enum']
    if 'open' not in kinds:kinds.insert(2,'open')
    schema['properties']['items']['items']['properties']['demoVideoNotice']={'type':'string','maxLength':800}
    write(path,schema)
    write(ROOT/'preview/v15/data/catalogue.schema.json',schema)
