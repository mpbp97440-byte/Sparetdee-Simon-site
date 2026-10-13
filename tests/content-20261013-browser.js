const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.MPBP_CONTENT_BASE||'http://localhost:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const errors=[],missing=[],legacy=[],report=[];
 try{
  const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce',viewport:{width:1440,height:900}});
  await context.addInitScript(()=>{try{sessionStorage.setItem('mpbpIntroPlayed','1')}catch(_){}});
  await context.route(/google-analytics\.com|googletagmanager\.com/,r=>r.fulfill({status:200,body:''}));
  context.on('page',p=>{
   p.on('pageerror',e=>errors.push(e.message));
   p.on('response',r=>{if(r.url().startsWith(base)&&r.status()===404)missing.push(r.url());});
   p.on('request',r=>{if(/supabase\.co|mpbp440-supabase\.js/.test(r.url()))legacy.push(r.url());});
  });
  for(const route of ['/','/music/','/a-venir/','/actu/','/mpbp-tv/','/artistes/sparetdee-simon.html','/artistes/makeda-muse.html','/admin-440-mpbp-corp/']){
   const p=await context.newPage(),r=await p.goto(base+route+'?content-check=20261013',{waitUntil:'load',timeout:45000});assert.equal(r.status(),200,route);
   if(route==='/'){
    await p.waitForSelector('#v12LatestRelease article');
    assert.match(await p.locator('#v12LatestRelease > article h3').textContent(),/^Prince des étoiles Remix$/);
    assert.match(await p.locator('#v12Featured').textContent(),/Prince des étoiles Remix/);
    assert.equal(await p.locator('#v12UpcomingGrid article').count(),1);
    assert.match(await p.locator('#v12UpcomingGrid').textContent(),/Le Bizz c'est bon 2.0/);
    assert.ok(Number(await p.locator('#v12UpcomingGrid [data-date] strong').first().textContent())>0);
   }
   if(route==='/music/'){await p.waitForSelector('#tracks > *');const text=await p.locator('#tracks').textContent();for(const name of ['Prince des étoiles Remix','BrainRot Society Remix','Légalize La Kalité Remix','Le Tribunal des Maux','Sous Le Même Toit'])assert.ok(text.includes(name),name);}
   if(route==='/a-venir/'){await p.waitForSelector('#upcomingGrid article');assert.equal(await p.locator('#upcomingGrid article').count(),1);assert.match(await p.locator('#upcomingGrid').textContent(),/Le Bizz c'est bon 2.0/);assert.ok(Number(await p.locator('#upcomingGrid [data-date] strong').first().textContent())>0);}
   if(route==='/actu/'){await p.waitForSelector('#v12NewsCards article');const text=await p.locator('#v12NewsCards').textContent();for(const name of ['Prince des étoiles Remix','Sous Le Même Toit','Le Bizz c\'est bon 2.0','BrainRot Society Remix','Légalize La Kalité Remix'])assert.ok(text.includes(name));assert.ok(!text.includes('arrive le 26 septembre'));}
   if(route==='/mpbp-tv/'){
    await p.waitForSelector('#v13TvLibrary button');
    for(const [id,youtubeId]of [['sous-le-meme-toit-version-long','API0lavRLeY'],['prince-des-etoiles-remix-clip','cotFluUcc3g']]){
     await p.locator('#v13TvLibrary button[data-v12-clip="'+id+'"]').click();
     await p.locator('#v13YoutubeStart').click();assert.ok((await p.locator('#v13YoutubePlayer').getAttribute('src')).includes(youtubeId));
    }
   }
   if(route.includes('/artistes/')){
    await p.waitForSelector('#artistDiscography article');const ids=route.includes('sparetdee')?['sous-le-meme-toit-version-long','prince-des-etoiles-remix-clip']:['sous-le-meme-toit-version-long'];
    for(const id of ids)assert.equal(await p.locator('a[href="/mpbp-tv/index.html#'+id+'"]').isVisible(),true);
    if(route.includes('sparetdee')){assert.match(await p.locator('.v12-latest-artist-release h2').textContent(),/Prince des étoiles Remix/);assert.match(await p.locator('.v12-artist-upcoming-release').textContent(),/Le Bizz c'est bon 2.0/);}
   }
   if(route.includes('/admin-'))assert.equal(await p.locator('#adminLoginForm').isVisible(),true);
   await p.evaluate(()=>[...document.images].forEach(i=>i.loading='eager'));
   await p.waitForFunction(()=>[...document.images].every(i=>!i.src||i.complete),null,{timeout:30000});
   assert.deepEqual(await p.evaluate(()=>[...document.images].filter(i=>i.src&&!i.naturalWidth).map(i=>i.src)),[],route);
   report.push({route,status:200,content:'PASS',images:'PASS'});await p.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.deepEqual(legacy,[]);
  console.log(JSON.stringify({report,criticalJsErrors:errors.length,internal404:missing.length,supabaseRequests:legacy.length},null,2));
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
