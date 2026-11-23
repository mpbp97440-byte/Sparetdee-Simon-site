"""Validate the exact JSON Schema subset used by the architecture contract and review files."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse,unquote
import json,re,datetime,copy,hashlib,urllib.request
R=Path(__file__).resolve().parents[1];D=R/'docs/v15';E=R.parent/'evidence'
schema=json.loads((D/'catalogue.schema.json').read_text(encoding='utf-8'))
catalog=json.loads((D/'catalogue.candidats.json').read_text(encoding='utf-8'))
def validate(value,s,path='$'):
    types={'object':lambda v:isinstance(v,dict),'array':lambda v:isinstance(v,list),'string':lambda v:isinstance(v,str),'null':lambda v:v is None,'boolean':lambda v:isinstance(v,bool),'number':lambda v:isinstance(v,(int,float)) and not isinstance(v,bool),'integer':lambda v:isinstance(v,int) and not isinstance(v,bool)}
    allowed={'$schema','title','type','additionalProperties','required','properties','items','enum','pattern','format','minLength','maxLength','minimum'}
    assert not set(s)-allowed, 'Unsupported schema keyword'
    if 'type'in s:
        ts=s['type'] if isinstance(s['type'],list) else [s['type']]
        assert any(types[t](value) for t in ts),path+': type'
    if 'enum'in s:assert value in s['enum'],path+': enum'
    if isinstance(value,dict):
        assert set(s.get('required',[]))<=set(value),path+': required'
        props=s.get('properties',{})
        if s.get('additionalProperties') is False:assert set(value)<=set(props),path+': additional property'
        for k,v in value.items():
            if k in props:validate(v,props[k],path+'.'+k)
    if isinstance(value,list):
        for i,v in enumerate(value):validate(v,s['items'],f'{path}[{i}]')
    if isinstance(value,str):
        if 'pattern'in s:assert re.search(s['pattern'],value),path+': pattern'
        if 'minLength'in s:assert len(value)>=s['minLength'],path+': minLength'
        if 'maxLength'in s:assert len(value)<=s['maxLength'],path+': maxLength'
        if s.get('format')=='date':assert datetime.date.fromisoformat(value).isoformat()==value,path+': date'
    if isinstance(value,(int,float)) and not isinstance(value,bool) and 'minimum'in s:assert value>=s['minimum'],path+': minimum'
def check(data):
    validate(data,schema)
    for key in ('id','slug'):assert len({i[key] for i in data['items']})==len(data['items']),key+': unique'
    for item in data['items']:
        v=item['verification'];p=item['pricing'];cta=item['cta']
        if item['public']:assert item['status'] and v['content'] and item['summary'].strip(),'public content unverified'
        if cta['kind']!='none':assert cta['url'],'CTA missing URL'
        else:assert cta['url'] is None,'inactive CTA has URL'
        if cta['kind'] in ('demo','download','play','purchase'):assert cta['verified'] and v['access'],'access unverified'
        if p['enabled']:assert v['commercial'] and p['model']!='unconfirmed' and p['amount'] is not None and p['currency'] and p['taxInformation'] and item['license'],'commerce unverified'
results=[]
check(catalog);results.append({'test':'Contrat proposé / 6 candidats', 'status':'PASS'})
mutations=[('slug dupliqué',lambda d:d['items'][1].update(slug=d['items'][0]['slug'])),('état inventé',lambda d:d['items'][0].update(status='Déjà lancé')),('publication non vérifiée',lambda d:d['items'][0].update(public=True)),('achat non vérifié',lambda d:d['items'][0]['pricing'].update(enabled=True)),('URL dangereuse',lambda d:d['items'][0]['cta'].update(kind='download',url='javascript:alert(1)')),('date invalide',lambda d:d['items'][0].update(updatedAt='2026-02-31')),('champ manquant',lambda d:d['items'][0].pop('license')),('média sans alt',lambda d:d['items'][0]['images'].append({'src':'/assets/image.png','alt':''}))]
for name,mutation in mutations:
    candidate=copy.deepcopy(catalog);mutation(candidate)
    try:check(candidate)
    except (AssertionError,ValueError):results.append({'test':'Refus '+name,'status':'PASS'})
    else:raise AssertionError('Accepted invalid candidate: '+name)
baseline=json.loads((E/'protected-files-sha256.json').read_text())
changed=[f for f,sha in baseline['files'].items() if not (R/f).is_file() or hashlib.sha256((R/f).read_bytes()).hexdigest()!=sha]
assert not changed,changed
results.append({'test':'404 fichiers préexistants inchangés','status':'PASS'})
class Links(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.ids=set()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id'in a:self.ids.add(a['id'])
        for attr in ('src','href','poster'):
            if attr in a:self.refs.append(a[attr])
errors=[]; checked=0
for file in (R/'preview/v15').rglob('*.html'):
    parser=Links();parser.feed(file.read_text(encoding='utf-8'))
    for ref in parser.refs:
        parsed=urlparse(urljoin('http://local/'+file.relative_to(R).as_posix(),ref))
        if parsed.netloc!='local':continue
        path=R/unquote(parsed.path).lstrip('/')
        if path.is_dir():path=path/'index.html'
        if not path.is_file():errors.append(str(file.relative_to(R))+': '+ref)
        elif parsed.fragment and str(path).endswith('.html'):
            target=Links();target.feed(path.read_text(encoding='utf-8'))
            if parsed.fragment not in target.ids:errors.append('Anchor '+ref)
        checked+=1
assert not errors,errors
results.append({'test':f'{checked} références locales de maquettes résolues','status':'PASS'})
for route in ('index.html','musique.html','engineering.html','review.html','projets/brenda.html','projets/les-jardins-des-lumelys.html'):
    with urllib.request.urlopen('http://127.0.0.1:4415/preview/v15/'+route) as response:assert response.status==200
results.append({'test':'6 réponses HTTP locales de référence','status':'PASS'})
(E/'review-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False,indent=2))
