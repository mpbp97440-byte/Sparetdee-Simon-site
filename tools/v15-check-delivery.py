from pathlib import Path
import json,subprocess,hashlib
R=Path(__file__).resolve().parents[1];E=R.parent/'evidence'
results={};syntax=[]
for file in R.rglob('*.js'):
    p=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
    syntax.append({'file':file.relative_to(R).as_posix(),'status':'PASS' if p.returncode==0 else 'FAIL','error':p.stderr if p.returncode else None})
results['javascriptSyntax']=syntax
json_files=list(R.rglob('*.json'))+[R/'manifest.webmanifest']
fail=[]
for file in json_files:
    try:json.loads(file.read_text(encoding='utf-8-sig'))
    except Exception as error:fail.append({'file':file.relative_to(R).as_posix(),'error':str(error)})
results['jsonSyntax']={'files':len(json_files),'failures':fail}
baseline=json.loads((E/'protected-files-sha256.json').read_text())
results['preservation']={'files':len(baseline['files']),'changed':[f for f,sha in baseline['files'].items() if not (R/f).is_file() or hashlib.sha256((R/f).read_bytes()).hexdigest()!=sha]}
results['mainHead']=subprocess.check_output(['git','-C',str(R),'rev-parse','main'],text=True).strip()
results['branch']=subprocess.check_output(['git','-C',str(R),'branch','--show-current'],text=True).strip()
results['sourceMainStatus']=subprocess.check_output(['git','-C',str(R.parent/'source'),'status','--porcelain'],text=True)
results['changedTrackedFiles']=subprocess.check_output(['git','-C',str(R),'diff','--name-only','HEAD'],text=True).splitlines()
(E/'delivery-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
assert all(x['status']=='PASS' for x in syntax)
assert not fail and not results['preservation']['changed']
assert results['mainHead']==baseline['head'] and not results['sourceMainStatus']
print(f"Syntax PASS: {len(syntax)} JS, {len(json_files)} JSON/manifest. Protected {len(baseline['files'])} unchanged. Main unchanged and clean.")
