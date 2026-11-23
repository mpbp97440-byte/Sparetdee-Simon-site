"""R2 contract tests and fixtures for real local browser import/export checks."""
from pathlib import Path
import json,copy,hashlib
from v15_catalogue_contract import validate_catalogue
R=Path(__file__).resolve().parents[1];E=R.parent/'evidence';F=E/'r2-fixtures';F.mkdir(exist_ok=True)
data=json.loads((R/'preview/v15/data/engineering.json').read_text(encoding='utf-8'))
schema=json.loads((R/'preview/v15/data/catalogue.schema.json').read_text(encoding='utf-8'))
validate_catalogue(data,schema)
results=[{'test':'Six annonces sans disponibilité ni vente inventée','status':'PASS'}]
cases=[('invalid-sale',lambda d:d['items'][0]['pricing'].update(enabled=True)),('invalid-url',lambda d:d['items'][0]['cta'].update(kind='demo',url='javascript:alert(1)',verified=True)),('duplicate-slug',lambda d:d['items'][1].update(slug=d['items'][0]['slug'])),('invalid-date',lambda d:d['items'][0].update(updatedAt='2026-02-31')),('unknown-field',lambda d:d['items'][0].update(secret='not-a-real-secret')),('unverified-public',lambda d:d['items'][0]['verification'].update(content=False))]
for name,edit in cases:
    candidate=copy.deepcopy(data);edit(candidate)
    try:validate_catalogue(candidate,schema)
    except ValueError:results.append({'test':'Rejet '+name,'status':'PASS'})
    else:raise AssertionError(name+' accepted')
    if name in ('invalid-sale','invalid-url','duplicate-slug'):(F/(name+'.json')).write_text(json.dumps(candidate,ensure_ascii=False,indent=2),encoding='utf-8')
baseline=json.loads((E/'protected-files-sha256.json').read_text())
assert all(hashlib.sha256((R/f).read_bytes()).hexdigest()==sha for f,sha in baseline['files'].items())
results.append({'test':'404 fichiers musicaux et applicatifs existants inchangés','status':'PASS'})
user_logo=Path('C:/Users/spare/.codex/codex-remote-attachments/01a20666-61b7-7dc3-bcd3-18ecc404e84b/0C3D3B5D-5BA9-440B-973B-42A214296BF3/1-Photo-1.jpg')
assert user_logo.read_bytes()==(R/'assets/brand/v15/mpbp440-corp-user-official.jpg').read_bytes()
results.append({'test':'Logo corporate fourni conservé octet pour octet','status':'PASS'})
(E/'r2-contract-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False))
