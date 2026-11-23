from pathlib import Path
import re
R3_ROOT=Path(__file__).resolve().parents[1];R3_OUT=R3_ROOT/'preview/v15'
hero="""<section class="r3-hero" aria-label="Univers visuel MPBP Engineering"><div class="wrap"><div class="r3-hero-copy"><p class="eyebrow">MPBP 440 / Design & Software Engineering</p><h1>Le code prend<br><em>une autre<br>dimension.</em></h1><p>Logiciels, agents IA et expériences interactives. Un univers de création numérique, signé MPBP.</p><div class="actions"><a class="button" href="#projets">Explorer les projets</a><a class="button secondary" href="demos.html">Démos & essais</a></div><div class="hero-caption"><span>SOFTWARE</span><span>INTELLIGENCE IA</span><span>GAME STUDIO</span></div></div><div class="r3-brand-seal"><img src="/assets/brand/v15/mpbp440-engineering-concept-v1.png" alt="Logo Engineering validé" width="1536" height="1024"><span>LA PRÉCISION TECHNIQUE<br>LA LIBERTÉ DE CRÉER</span></div></div><div class="r3-hero-floor"><span>CONCEPTION</span><span>LOGICIELS & APPLICATIONS</span><span>AGENTS IA</span><span>JEUX & EXPÉRIENCES</span></div></section>"""
for file in R3_OUT.rglob('*.html'):
    doc=file.read_text(encoding='utf-8')
    if '<body class="engineering r2">' not in doc:continue
    relative='../' if file.parent.name=='projets' else ''
    doc=doc.replace('<body class="engineering r2">','<body class="engineering r2 r3">')
    doc=doc.replace('</head>',f'<link rel="stylesheet" href="{relative}fonts-r3.css"><link rel="stylesheet" href="{relative}atelier-r3.css"></head>')
    if file.name=='engineering.html':doc=re.sub(r'<section class="wrap eng-hero">.*?</section>(?=<div class="capability-band">)',lambda match:hero,doc,flags=re.S)
    if file.name=='boutique.html':doc=doc.replace('Des outils pour<br><span>vos prochaines idées.</span>','Les outils de demain.<br><span>La signature MPBP.</span>')
    if file.name=='demos.html':doc=doc.replace('Voir les idées<br><span>prendre vie.</span>','Entrez dans<br><span>le laboratoire.</span>')
    file.write_text(doc,encoding='utf-8')
review=R3_OUT/'review.html';doc=review.read_text(encoding='utf-8').replace('Direction V15 · Révision 2','Direction V15 · Révision 3').replace('Trois identités.<br>Une seule entreprise.','Engineering.<br>Un univers à part entière.')
for screen in ('engineering','shop','demos'):doc=doc.replace('captures-r2/'+screen+'-','captures-r3/'+screen+'-')
review.write_text(doc,encoding='utf-8')
print('R3 Engineering: cinematic atelier, specific typography and sculpted controls.')
