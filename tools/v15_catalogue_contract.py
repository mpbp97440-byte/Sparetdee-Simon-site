"""Catalogue structure and V15 no-sale policy shared by the local builder and checks."""
import re,datetime
from urllib.parse import urlparse
def validate(value,s,path='$'):
    types={'object':lambda v:isinstance(v,dict),'array':lambda v:isinstance(v,list),'string':lambda v:isinstance(v,str),'null':lambda v:v is None,'boolean':lambda v:isinstance(v,bool),'number':lambda v:isinstance(v,(int,float))and not isinstance(v,bool),'integer':lambda v:isinstance(v,int)and not isinstance(v,bool)}
    if 'type'in s:
        allowed=s['type']if isinstance(s['type'],list)else[s['type']]
        if not any(types[t](value)for t in allowed):raise ValueError(path+': type invalide')
    if 'enum'in s and value not in s['enum']:raise ValueError(path+': valeur interdite')
    if isinstance(value,dict):
        if not set(s.get('required',[]))<=set(value):raise ValueError(path+': champ requis manquant')
        props=s.get('properties',{})
        if s.get('additionalProperties')is False and not set(value)<=set(props):raise ValueError(path+': champ inconnu')
        for key,entry in value.items():
            if key in props:validate(entry,props[key],path+'.'+key)
    if isinstance(value,list):
        for i,entry in enumerate(value):validate(entry,s['items'],f'{path}[{i}]')
    if isinstance(value,str):
        if 'pattern'in s and not re.search(s['pattern'],value):raise ValueError(path+': format invalide')
        if len(value)<s.get('minLength',0)or len(value)>s.get('maxLength',float('inf')):raise ValueError(path+': longueur invalide')
        if s.get('format')=='date'and datetime.date.fromisoformat(value).isoformat()!=value:raise ValueError(path+': date invalide')
    if isinstance(value,(int,float))and not isinstance(value,bool)and value<s.get('minimum',float('-inf')):raise ValueError(path+': valeur trop petite')
def validate_catalogue(data,schema):
    validate(data,schema)
    if not 1<=len(data['items'])<=200:raise ValueError('Le catalogue doit contenir entre 1 et 200 fiches.')
    for field in ('id','slug'):
        if len({i[field]for i in data['items']})!=len(data['items']):raise ValueError(field+': doublon')
    for item in data['items']:
        if item['pricing']['enabled']or item['cta']['kind']=='purchase':raise ValueError('Vente désactivée dans la V15 actuelle')
        if item['public']and(not item['summary'].strip()or not item['verification']['content']):raise ValueError('Présentation publique non vérifiée')
        kind=item['cta']['kind'];url=item['cta']['url']
        if kind=='none'and url is not None:raise ValueError('URL sans accès')
        if kind!='none'and not url:raise ValueError('Accès sans URL')
        if kind in ('open','demo','play','download')and(not item['cta']['verified']or not item['verification']['access']):raise ValueError('Accès non vérifié')
        for link in [url,item['demoVideo']]:
            if link:
                parsed=urlparse(link)
                if link.startswith('//')or parsed.scheme not in ('https','mailto','')or(not parsed.scheme and not link.startswith('/')):raise ValueError('URL non autorisée')
                if parsed.scheme=='https'and not parsed.hostname:raise ValueError('URL HTTPS invalide')
        if item['demoVideo']and not item['demoVideo'].startswith('https://'):raise ValueError('Vidéo HTTPS requise')
    return data
