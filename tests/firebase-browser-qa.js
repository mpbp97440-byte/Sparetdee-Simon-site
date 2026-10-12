/* Isolated browser tests. SDK/Worker are mocked before any page loads. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MPBP_QA_BASE_URL||'http://localhost:4173';
const worker='https://mpbp440-cms-worker.mpbp97440.workers.dev';
function installMock(options){
  const timestamp=()=>({toDate:()=>new Date('2026-10-13T12:00:00Z')});
  const records=new Map([
    ['content_registry/clip-karma',{active:true,title:'Karma'}],
    ['content_registry/neons-carnivores',{active:true,title:'Néons Carnivores'}],
    ['comments/approved',{contentId:'clip-karma',contentType:'clip',displayName:'Approved',message:'Visible',status:'approved',createdAt:timestamp()}],
    ['comments/pending',{contentId:'clip-karma',contentType:'clip',displayName:'Pending',message:'Not public',status:'pending',createdAt:timestamp()}]
  ]);
  const auth={currentUser:null,authStateReady:async()=>{}},listeners=[];
  let counter=0;
  const snapshot=(path)=>({id:path.split('/').at(-1),exists:()=>records.has(path),data:()=>records.get(path)});
  const matching=q=>[...records].filter(([path,data])=>path.startsWith(q.path+'/')&&path.split('/').length===q.path.split('/').length+1&&(q.filters||[]).every(f=>!f.key||data[f.key]===f.value));
  const account=anonymous=>({uid:anonymous?'anonymous-qa':'admin-qa',isAnonymous:anonymous,getIdToken:async()=>{if(options.expired)throw new Error('Token expiré');return 'MOCK-ONLY-NOT-A-REAL-TOKEN';}});
  window.__fbMock={
    events:[],records,auth,options,
    initializeApp:()=>({}),getAuth:()=>auth,getFirestore:()=>({}),
    signInAnonymously:async()=>{auth.currentUser=account(true);return {user:auth.currentUser};},
    signInWithEmailAndPassword:async()=>{
      if(options.badLogin)throw Object.assign(new Error('Invalid credentials'),{code:'auth/invalid-credential'});
      auth.currentUser=account(false);listeners.forEach(fn=>fn(auth.currentUser));return {user:auth.currentUser};
    },
    onAuthStateChanged:(_auth,fn)=>{listeners.push(fn);Promise.resolve().then(()=>fn(auth.currentUser));return ()=>{};},
    signOut:async()=>{auth.currentUser=null;listeners.forEach(fn=>fn(null));},
    doc:(_db,...parts)=>parts.join('/'),collection:(_db,...parts)=>({path:parts.join('/')}),
    getDoc:async path=>{
      if(path.startsWith('admins/'))return {exists:()=>options.role!==false,data:()=>({active:options.role!==false,role:'admin'})};
      if(options.missingRegistry&&path.startsWith('content_registry/'))return {exists:()=>false};
      return snapshot(path);
    },
    getDocs:async q=>({docs:matching(q).slice(0,(q.filters||[]).find(f=>f.limit)?.limit||Infinity).map(([path])=>snapshot(path))}),
    where:(key,_op,value)=>({key,value}),limit:value=>({limit:value}),
    query:(collection,...filters)=>({...collection,filters}),
    getCountFromServer:async q=>({data:()=>({count:matching(q).length})}),
    serverTimestamp:timestamp,
    addDoc:async(collection,data)=>{const id='mock-'+(++counter);records.set(collection.path+'/'+id,data);return {id};},
    updateDoc:async(path,data)=>{records.set(path,{...records.get(path),...data});},
    runTransaction:async(_db,callback)=>callback({get:async path=>snapshot(path),set:(path,data)=>records.set(path,data),delete:path=>records.delete(path)}),
    isSupported:async()=>true,initializeAnalytics:()=>({}),logEvent:(_instance,name,params)=>window.__fbMock.events.push({name,params})
  };
  try{sessionStorage.setItem('mpbpIntroPlayed','1');}catch(_){/* Third-party sandbox frames deny storage. */}
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.MPBP_QA_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const report={routes:[],public:[],admin:[],consoleErrors:[],resource404:[]};
 async function context(options={}){
   const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
   await ctx.addInitScript(installMock,options);
   await ctx.route('https://www.gstatic.com/firebasejs/13.0.0/*',route=>{
     const module=route.request().url().match(/firebase-([a-z]+)\.js/)[1];
     const names={app:['initializeApp'],auth:['getAuth','signInAnonymously','signInWithEmailAndPassword','onAuthStateChanged','signOut'],firestore:['getFirestore','doc','collection','getDoc','getDocs','where','query','limit','getCountFromServer','serverTimestamp','addDoc','updateDoc','runTransaction'],analytics:['isSupported','initializeAnalytics','logEvent']}[module];
     return route.fulfill({status:200,contentType:'application/javascript',body:names.map(name=>'export const '+name+'=(...args)=>window.__fbMock.'+name+'(...args);').join('\n')});
   });
   await ctx.route(worker+'/**',route=>{
     const name=route.request().url().split('/').at(-1),status=options.workerStatus||(name==='admin-bootstrap-registry'&&options.bootstrapError?500:((name==='admin-media-upload'&&options.uploadError)||(name==='admin-publish-site'&&options.publishError)?413:200));
     return route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{ok:true,sha:'simulated-sha',url:base+'/assets/covers/largent-officiel.webp',path:'assets/covers/largent-officiel.webp'}:{message:'MOCK Worker error '+status})});
   });
   ctx.on('page',p=>{
     p.on('pageerror',e=>report.consoleErrors.push(e.message));
     p.on('response',r=>{if(r.url().startsWith(base)&&r.status()===404)report.resource404.push(r.url());});
   });
   return ctx;
 }
 try{
   const ctx=await context();
   for(const route of [...require('./v14-preservation-manifest.json').routes,'/admin-440-mpbp-corp/']){
     const page=await ctx.newPage(),res=await page.goto(base+route,{waitUntil:'load'});
     assert.equal(res.status(),200,route);await page.waitForTimeout(100);
     report.routes.push(route);await page.close();
   }
   const tv=await ctx.newPage();await tv.goto(base+'/mpbp-tv/',{waitUntil:'load'});
   await tv.waitForSelector('#v13TvLibrary button');await tv.locator('#v13TvLibrary button[data-v12-clip="clip-karma"]').click();
   await tv.waitForFunction(()=>!document.querySelector('[data-v12-like]').disabled);
   assert.match(await tv.locator('[data-v12-comments-list]').textContent(),/Visible/);
   assert.doesNotMatch(await tv.locator('[data-v12-comments-list]').textContent(),/Not public/);
   await tv.locator('[data-v12-like]').click();await tv.waitForFunction(()=>document.querySelector('[data-v12-like]').getAttribute('aria-pressed')==='true');
   await tv.locator('[data-v12-like]').click();await tv.waitForFunction(()=>document.querySelector('[data-v12-like]').getAttribute('aria-pressed')==='false');
   const views=await tv.evaluate(async()=>{await MPBP440Analytics.videoView('clip-karma');await MPBP440Analytics.videoView('clip-karma');return (await MPBP440Analytics.videoEngagement('clip-karma')).views;});
   assert.equal(views,1);
   await tv.locator('[name="displayName"]').fill('Local QA');await tv.locator('[name="message"]').fill('Mock comment only');
   await tv.locator('[data-v12-comments-form] button').click();await tv.waitForFunction(()=>document.querySelector('[data-v12-comments-status]').textContent.includes('après validation'));
   assert.equal(await tv.evaluate(()=>[...__fbMock.records.values()].filter(d=>d.message==='Mock comment only'&&d.status==='pending').length),1);
   await tv.evaluate(async()=>{for(const [n,m] of [['A','x'],['Valid','x'.repeat(1001)]]){try{await MPBP440Analytics.submitComment('clip-karma',n,m);throw Error('accepted invalid')}catch(e){if(e.message==='accepted invalid')throw e;}}});
   const events=await tv.evaluate(()=>__fbMock.events);
   assert.ok(!JSON.stringify(events).includes('Mock comment only'));
   report.public.push('unique views','like/unlike','approved-only comments','pending submission','length validation','GA without comment/name/UID');
   await ctx.close();
   async function login(ctx){
     const page=await ctx.newPage();await page.goto(base+'/admin-440-mpbp-corp/',{waitUntil:'load'});
     await page.locator('#adminEmail').fill('qa@example.invalid');await page.locator('#adminPass').fill('mock-only-password');
     await page.locator('#loginSubmit').click();return page;
   }
   for(const [label,options]of [['invalid login',{badLogin:true}],['inactive admin',{role:false}],['expired token',{expired:true}],['Worker 401',{workerStatus:401}],['Worker 403',{workerStatus:403}]]){
     const ctx=await context(options),page=await login(ctx);
     await page.waitForFunction(()=>document.querySelector('#loginMsg').textContent&&!document.querySelector('#loginMsg').textContent.includes('Connexion Firebase'));
     assert.equal(await page.locator('#adminBox').isVisible(),false,label);
     report.admin.push(label+': denied');await ctx.close();
   }
   const adminContext=await context(),admin=await login(adminContext);
   await admin.waitForSelector('#adminBox:not([hidden])');await admin.waitForFunction(()=>state.ready);
   await admin.waitForFunction(()=>document.querySelector('#analyticsStatus').textContent.includes('Google Analytics 4'));
   assert.match(await admin.locator('#adminCommentsList').textContent(),/Not public/);
   await admin.locator('.tab[data-tab="comments"]').click();
   await admin.locator('#adminCommentsList button').getByText('Approuver',{exact:true}).click();
   await admin.waitForFunction(()=>__fbMock.records.get('comments/pending').status==='approved');
   await admin.evaluate(async()=>{await MPBP440Admin.rpc('admin_delete_comment',{p_comment_id:'pending'});});
   assert.equal(await admin.evaluate(()=>__fbMock.records.get('comments/pending').status),'deleted');
   const draft=await admin.evaluate(async()=>{await MPBP440Admin.rpc('cms_save_draft',{p_payload:{version:2,files:{'data/news.json':[]}}});return JSON.parse(localStorage.getItem('mpbp440.cms.draft.firebase.v1'));});
   assert.equal(draft.uid,'admin-qa');assert.ok(draft.savedAt&&draft.payload);assert.ok(!JSON.stringify(draft).includes('TOKEN'));
   await admin.evaluate(()=>{state.data.news=[...currentNews(),{id:'qa-local-only',title:'Mock only',text:'Not written to repository'}];renderCmsStatus();});
   await admin.locator('#saveDraftBtn').click();
   await admin.waitForFunction(()=>document.querySelector('#cmsStatus').textContent==='Brouillon enregistré sur cet appareil.');
   const calls=[];adminContext.on('request',request=>{if(request.url().startsWith(worker))calls.push({url:request.url(),type:request.headers()['content-type'],auth:request.headers().authorization});});
   const results=await admin.evaluate(async()=>{const form=new FormData();form.append('folder','covers');form.append('file',new Blob(['mock'],{type:'image/png'}),'test.png');return [await MPBP440Admin.invoke('admin-media-upload',form),await MPBP440Admin.invoke('admin-publish-site',{payload:{version:2,files:{}}})];});
   assert.equal(results[1].sha,'simulated-sha');assert.match(calls[0].type,/multipart\/form-data; boundary=/);assert.match(calls[1].type,/application\/json/);assert.ok(calls.every(c=>c.auth==='Bearer MOCK-ONLY-NOT-A-REAL-TOKEN'));
   await admin.evaluate(()=>MPBP440Admin.signOut());assert.equal(await admin.locator('#adminBox').isVisible(),false);
   report.admin.push('login/logout','Firestore analytics real-count shape / GA link','moderation / soft delete','versioned local draft','media FormData','publish JSON / Bearer (mock only)');
   await adminContext.close();
   for(const [name,options]of [['admin-media-upload',{uploadError:true}],['admin-publish-site',{publishError:true}]]){
     const ctx=await context(options),p=await login(ctx);await p.waitForSelector('#adminBox:not([hidden])');
     const result=await p.evaluate(async name=>{try{await MPBP440Admin.invoke(name,{});return false}catch(e){return /413/.test(e.message)}},name);
     assert.equal(result,true);report.admin.push(name+': error propagated');await ctx.close();
   }
   const absent=await context({missingRegistry:true}),p=await absent.newPage();await p.goto(base+'/mpbp-tv/',{waitUntil:'load'});
   assert.equal(await p.evaluate(()=>MPBP440Analytics.videoEngagement('clip-karma')),null);
   assert.equal(await p.evaluate(()=>MPBP440Analytics.toggleLike('clip-karma')),null);
   assert.deepEqual(await p.evaluate(()=>MPBP440Analytics.commentsForClip('clip-karma')),[]);
   report.public.push('missing registry: safe no writes');await absent.close();
   const warningContext=await context({bootstrapError:true}),warningPage=await login(warningContext);
   await warningPage.waitForSelector('#registryWarning');assert.equal(await warningPage.locator('#adminBox').isVisible(),true);
   report.admin.push('registry failure warns without blocking login');await warningContext.close();
   assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.resource404,[]);
   console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
