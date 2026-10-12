const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const baseline='54b72c0c3b11ab3293c2a757bf25c5625fc8bad0';
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n').trimEnd();
const original=file=>execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n').trimEnd();
const manifest=require('./v14-preservation-manifest.json');
const withoutScripts=html=>html.replace(/<script\b[^>]*src=[^>]*><\/script>/gi,'');
for(const file of Object.keys(manifest.html)){
  assert.equal(withoutScripts(read(file)),withoutScripts(original(file)),file+': V14 markup unchanged');
  assert.equal((read(file).match(/mpbp440-firebase\.js/g)||[]).length,1,file+': Firebase once');
}
for(const file of Object.keys(manifest.jsonContracts))assert.equal(read(file),original(file),file+': content unchanged');
for(const file of fs.readdirSync(path.join(root,'assets/css')).filter(f=>f.startsWith('v14-')))assert.equal(read('assets/css/'+file),original('assets/css/'+file),file+': CSS unchanged');
const admin='admin-440-mpbp-corp/index.html';
assert.equal(withoutScripts(read(admin)),withoutScripts(original(admin)).replace('Authentification Supabase sécurisée.','Authentification Firebase sécurisée.').replace('une fonction Supabase sécurisée','un Worker Cloudflare sécurisé'),'CMS structure unchanged');
const client=read('assets/js/mpbp440-firebase.js');
for(const method of ['isPreview','siteVisit','artistVisit','eventVisit','videoView','toggleLike','videoEngagement','commentsForClip','submitComment','format','visitorId','sessionId'])assert.ok(client.includes(method),method);
for(const module of ['app','auth','firestore','analytics'])assert.ok(client.includes('https://www.gstatic.com/firebasejs/13.0.0/firebase-'+module+'.js'));
assert.ok(client.includes("projectId:'mpbp440-site'"));
assert.ok(read('admin-440-mpbp-corp/auth.js').includes('https://mpbp440-cms-worker.mpbp97440.workers.dev'));
const files=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/))].filter(f=>fs.existsSync(path.join(root,f)));
for(const file of files.filter(f=>/\.(js|html|json|md|txt|rules|yml|ts)$/.test(f))){
  const source=read(file);
  assert.doesNotMatch(source,/(?:ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|-----BEGIN (?:RSA )?PRIVATE KEY-----/,file+': secret detected');
  if(!/^(tests|supabase|docs)\//.test(file)&&/\.(html|js)$/.test(file))assert.doesNotMatch(source,/eneuejomsrpdwvvpgvgl|\/rest\/v1\/rpc\/|mpbp440-supabase\.js|admin-supabase\.js/,file+': legacy runtime');
}
for(const file of files.filter(f=>/\.html$/.test(f))){
  for(const match of read(file).matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)){
    if(/^https?:/.test(match[1]))continue;
    const url=new URL(match[1],'https://test.local/'+file);
    assert.ok(fs.existsSync(path.join(root,decodeURIComponent(url.pathname).slice(1))),file+': dead script '+match[1]);
  }
}
assert.ok(!read('sw.js').includes('mpbp440-mon-influence-long-20260811'));
assert.doesNotMatch(read('firestore.rules'),/allow read, write: if true/);
assert.ok(fs.existsSync(path.join(root,'supabase')),'legacy history retained');
console.log('Firebase migration: 21 public markup/CSS/content contracts, CMS structure, API compatibility, pinned SDK, no runtime Supabase, no secrets, no dead scripts: PASS.');
