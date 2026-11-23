"""Prepare the proposed catalogue contract, without adding public product claims."""
from pathlib import Path
import json, shutil
R=Path(__file__).resolve().parents[1]; D=R/'docs/v15';D.mkdir(parents=True,exist_ok=True)
def string(nullable=False,**rules):return {'type':['string','null'] if nullable else 'string',**rules}
def obj(properties):return {'type':'object','additionalProperties':False,'required':list(properties),'properties':properties}
def arr(items):return {'type':'array','items':items}
url=string(True,pattern=r'^(https://|/|mailto:)[^\s]+$')
date=string(True,format='date')
properties={
 'id':string(pattern=r'^mpbp-[a-z0-9-]+$'), 'slug':string(pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 'category':{'enum':['software','agent','module','game','service','plan','demo','technical-news']},
 'name':string(minLength=1,maxLength=120),'summary':string(maxLength=300),'description':string(),
 'images':arr(obj({'src':string(pattern=r'^(?:/assets/|https://)[^\s]+$'),'alt':string(minLength=1)})),
 'demoVideo':url,'features':arr(string()),'limitations':arr(string()),'useCases':arr(string()),
 'platforms':arr(string()),'requirements':arr(string()),'hosting':{'enum':[None,'local','cloud','hybrid','not-applicable']},
 'status':{'enum':[None,'En conception','En développement','Bêta','Démonstration disponible','Disponible','Maintenance','Retiré']},
 'version':string(True),'updatedAt':date,'changelog':arr(obj({'version':string(minLength=1),'date':string(format='date'),'notes':string(minLength=1)})),
 'documentation':arr(obj({'label':string(minLength=1),'url':string(pattern=r'^(https://|/)[^\s]+$')})),
 'pricing':obj({'model':{'enum':['unconfirmed','one-time','license','monthly','annual','credits','quote']},'amount':{'type':['number','null'],'minimum':0},'currency':{'enum':[None,'EUR']},'taxInformation':string(True),'enabled':{'type':'boolean'}}),
 'license':string(True),'cta':obj({'kind':{'enum':['none','contact','demo','download','play','purchase']},'url':url,'verified':{'type':'boolean'}}),
 'public':{'type':'boolean'},'order':{'type':'integer','minimum':0},
 'verification':obj({'content':{'type':'boolean'},'access':{'type':'boolean'},'commercial':{'type':'boolean'},'checkedAt':date,'source':string(True)})
}
schema={'$schema':'http://json-schema.org/draft-07/schema#','title':'MPBP440 V15 catalogue proposé',**obj({'schemaVersion':{'enum':[1]},'items':arr(obj(properties))})}
(D/'catalogue.schema.json').write_text(json.dumps(schema,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
items=[]
for order,(slug,name,category) in enumerate([('office','MPBP 440 Office','software'),('studio-os','MPBP Studio OS','software'),('render-nexus','MPBP 440 Render Nexus','software'),('audio-forensics-lab','MPBP 440 Audio Forensics Lab','software'),('brenda','Brenda','agent'),('les-jardins-des-lumelys','Les Jardins des Lumélys','game')]):
    items.append(dict(id='mpbp-'+slug,slug=slug,category=category,name=name,summary='',description='',images=[],demoVideo=None,features=[],limitations=[],useCases=[],platforms=[],requirements=[],hosting=None,status=None,version=None,updatedAt=None,changelog=[],documentation=[],pricing=dict(model='unconfirmed',amount=None,currency=None,taxInformation=None,enabled=False),license=None,cta=dict(kind='none',url=None,verified=False),public=False,order=order,verification=dict(content=False,access=False,commercial=False,checkedAt=None,source='Noms fournis dans le brief V15 ; spécifications non vérifiées')))
(D/'catalogue.candidats.json').write_text(json.dumps({'schemaVersion':1,'items':items},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
proofs=D/'preuves';proofs.mkdir(exist_ok=True)
for file in (R.parent/'evidence').iterdir():
    if file.is_file():shutil.copy2(file,proofs/file.name)
print('Proposed schema, 6 non-public candidates and evidence prepared.')
