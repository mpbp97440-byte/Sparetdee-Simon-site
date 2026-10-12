const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const manifest = require('./v14-preservation-manifest.json');
const base = process.env.MPBP_QA_BASE_URL || 'http://127.0.0.1:4173';
const output = process.env.MPBP_QA_SCREENSHOTS || path.join(process.env.TEMP, 'mpbp440-v14-final');
const remote = /githack\.com/.test(base);
const shots = [
  ['hero','/','#home'],['now-playing','/','#sortie'],['spotlight','/','#alaune'],['roadmap','/','#avenir'],
  ['cinema','/mpbp-tv/','#mpbp-tv-player'],['sparetdee','/artistes/sparetdee-simon.html','.artist-page .hero'],
  ['makeda','/artistes/makeda-muse.html','.artist-page .hero'],['plume','/artistes/juste-une-plume.html','.artist-page .hero'],
  ['events','/evenements/','#roots-live-25-07-2026'],['news','/','#actus'],['gallery','/','#galerie'],['radio','/','#radio']
];
const mobileShots = [['home-mobile','/','#home'],['cinema-mobile','/mpbp-tv/','#mpbp-tv-player'],['artist-mobile','/artistes/sparetdee-simon.html','.artist-page .hero'],['radio-mobile','/','#radio']];

async function installFixtures(context) {
  // Exercise the original RPC client without writing likes/comments/analytics to production.
  let liked=false;
  const requests=[];
  await context.route('**/rest/v1/rpc/**', async route => {
    const rpc=route.request().url().split('/').at(-1);
    requests.push({rpc,args:route.request().postDataJSON()});
    let body=true;
    if(rpc==='get_video_engagement')body=[{views:42,likes:liked?8:7,liked}];
    if(rpc==='toggle_video_like'){liked=!liked;body=liked;}
    if(rpc==='get_approved_comments')body=[{display_name:'QA MPBP440',message:'Contrôle local de la présentation des commentaires.',created_at:'2026-10-12T10:00:00Z'}];
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  return requests;
}
async function ready(page, route) {
  const target=remote&&route.endsWith('/')?route+'index.html':route;
  const response=await page.goto(base+target,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200,`Route ${route}`);
  if((await page.title()).includes('External Content Notice'))await page.getByRole('button',{name:/open the page/i}).click();
  await page.waitForFunction(()=>!!getComputedStyle(document.documentElement).getPropertyValue('--v14-heading').trim());
  await page.evaluate(()=>document.fonts.ready);
  if(route==='/')await page.waitForSelector('#v12LatestRelease article');
  if(route.includes('mpbp-tv'))await page.waitForSelector('#v13TvLibrary button');
  if(route.includes('artistes'))await page.waitForSelector('#artistDiscography article');
  if(route.includes('/galerie/'))await page.waitForSelector('[data-gallery-index]');
  if(route.includes('/a-venir/'))await page.waitForSelector('#upcomingGrid article');
  if(route.includes('/actu/'))await page.waitForSelector('#v12NewsCards article');
    if(route==='/') await page.locator('#radio iframe').evaluate(frame=>frame.loading='eager');
  await page.waitForTimeout(300);
}
async function loadImages(page, selector='body') {
  await page.locator(selector).evaluate(element=>element.querySelectorAll('img').forEach(img=>img.loading='eager'));
  await page.waitForFunction(selector=>[...document.querySelector(selector).querySelectorAll('img')].every(img=>!img.src||img.complete),selector,{timeout:20000});
}
async function artworkMetrics(page, selector) {
  return page.locator(selector).evaluate(target=>{
    const images=[...target.querySelectorAll('img')].filter(img=>img.getClientRects().length && !img.classList.contains('v14-dock-logo'));
    return images.map(img=>{
      const style=getComputedStyle(img),r=img.getBoundingClientRect();
      const naturalRatio=img.naturalWidth/img.naturalHeight;
      const scale=style.objectFit==='contain'?Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight):r.width/img.naturalWidth;
      const paintedWidth=img.naturalWidth*scale,paintedHeight=img.naturalHeight*scale;
      const painted={x:r.left+(r.width-paintedWidth)/2,y:r.top+(r.height-paintedHeight)/2,width:paintedWidth,height:paintedHeight};
      const clipping=[];
      for(let parent=img.parentElement;parent&&parent!==target.parentElement;parent=parent.parentElement){
        const s=getComputedStyle(parent),pr=parent.getBoundingClientRect();
        if(/hidden|clip/.test(s.overflowX+s.overflowY)&& (painted.x<pr.left-2||painted.y<pr.top-2||painted.x+painted.width>pr.right+2||painted.y+painted.height>pr.bottom+2))clipping.push(parent.className);
      }
      const official=!!img.closest('.v14-media-stage,.v14-artwork-frame,.v12-upcoming-card,.time-card,.v13-tv-stage,.v12-gallery-item,.v14-hero-portrait');
      return {src:img.getAttribute('src'),natural:[img.naturalWidth,img.naturalHeight],naturalRatio,box:[Math.round(r.width),Math.round(r.height)],painted:[Math.round(paintedWidth),Math.round(paintedHeight)],fit:style.objectFit,official,thumbnail:!!img.closest('.v12-release-history'),clipping};
    });
  });
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.MPBP_QA_BROWSER_PATH});
  const context=await browser.newContext({viewport:{width:1600,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(()=>{try{sessionStorage.setItem('mpbpIntroPlayed','1');}catch(_){/* Third-party sandboxed player frames do not expose storage. */}});
  const rpcRequests=await installFixtures(context);
  const errors=[],report={routes:[],captures:[],responsive:[],interactions:[],errors};
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  for(const route of (process.argv.includes('--captures-only') || process.argv.includes('--interactions-only') ? [] : manifest.routes)){
    const page=await context.newPage(),missing=[];
    page.on('response',response=>{if(new URL(response.url()).origin===new URL(base).origin&&response.status()===404&&!response.url().includes('favicon'))missing.push(response.url());});
    await ready(page,route);
    await loadImages(page);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=2,`${route}: overflow ${overflow}`);assert.deepEqual(missing,[],`${route}: ressources 404`);
    const bad=await page.evaluate(()=>[...document.images].filter(img=>img.src&&img.complete&&!img.naturalWidth).map(img=>img.src));
    assert.deepEqual(bad,[],`${route}: images cassées`);
    report.routes.push({route,status:200,overflow}); await page.close();
  }
  for(const [name,route,selector]of (process.argv.includes('--interactions-only') ? [] : [...(process.argv.includes('--mobile-only') ? [] : shots),...mobileShots])){
    const mobile=name.includes('mobile');
    const page=await context.newPage();await page.setViewportSize({width:mobile?390:1600,height:mobile?844:900});
    await ready(page,route);await loadImages(page,selector);
    await page.locator(selector).evaluate(target=>target.scrollIntoView({block:'start',behavior:'instant'}));
    await page.waitForTimeout(200);
    if (selector==='#radio') {
      const spotify = await page.locator('#radio iframe').elementHandle();
      const frame = await spotify.contentFrame();
      await frame.waitForFunction(()=>document.body?.innerText.includes('Radio MPBP440'),{timeout:20000});
    }
    const layout=await page.locator(selector).evaluate(target=>{
      const r=target.getBoundingClientRect(), header=document.querySelector('[data-v12-header],.site-header,.v12-content-header,.artist-page > .top');
      return {top:r.top,height:r.height,width:r.width,headerBottom:header?.getBoundingClientRect().bottom||0,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert.ok(layout.top>=layout.headerBottom-2,`${name}: contenu masqué par le header ${JSON.stringify(layout)}`);
    assert.ok(layout.overflow<=2,`${name}: overflow`);
    const media=await artworkMetrics(page,selector);
    media.forEach(img=>{
      assert.ok(img.natural[0]>0,`${name}: image cassée ${img.src}`);
      if(img.official){assert.notEqual(img.fit,'cover',`${name}: artwork en cover ${img.src}`);assert.deepEqual(img.clipping,[],`${name}: artwork coupé ${img.src}`);}
      if(img.src?.includes('releases')&&!img.thumbnail&&selector!=='#actus')assert.ok(img.painted[0]>= (mobile?200:280),`${name}: artwork trop petit ${img.src}: ${img.painted}`);
    });
    await page.screenshot({path:path.join(output,`${name}.png`)});
    report.captures.push({name,viewport:mobile?'390x844':'1600x900',layout,media});await page.close();
  }
  for(const width of (process.argv.includes('--captures-only') || process.argv.includes('--interactions-only') ? [] : [375,430,768,1024,1440,1920]))for(const route of ['/','/a-venir/','/music/','/mpbp-tv/','/artistes/makeda-muse.html']){
    const page=await context.newPage();await page.setViewportSize({width,height:900});await ready(page,route);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=2,`${route} ${width}: overflow ${overflow}`);report.responsive.push({route,width,overflow});await page.close();
  }
  const home=await context.newPage();await home.setViewportSize({width:390,height:844});await ready(home,'/');
  await home.locator('[data-v12-menu-toggle]').click();assert.equal(await home.locator('#v12MobileMenu').isVisible(),true);
  await home.locator('#v12MobileMenu a[href$="#radio"]').click();await home.waitForTimeout(400);assert.equal(await home.locator('#v12MobileMenu').isVisible(),false);
  const radioTop=await home.locator('#radio').evaluate(el=>el.getBoundingClientRect().top);assert.ok(radioTop>=60,'Ancre radio sous header');
  assert.equal(await home.locator('#radio iframe').count(),1,'Spotify doit être unique');
  await home.locator('#mpbpAudioControl').scrollIntoViewIfNeeded();
  const dock=await home.locator('#mpbpAudioControl').boundingBox();assert.ok(dock.width<=320&&dock.height<=58,'Dock compact');
  report.interactions.push('menu mobile, ancre radio, Spotify unique, dock 320x56');await home.close();
  const gallery=await context.newPage();await ready(gallery,'/galerie/');await gallery.locator('[data-gallery-index]').first().click();assert.equal(await gallery.locator('#v12Lightbox').isVisible(),true);await gallery.keyboard.press('Escape');assert.equal(await gallery.locator('#v12Lightbox').isVisible(),false);await gallery.locator('[data-filter="artiste"]').click();assert.equal(await gallery.locator('.v12-gallery-card').count(),3);report.interactions.push('galerie, lightbox, filtres');await gallery.close();
  const tv=await context.newPage();await ready(tv,'/mpbp-tv/');
  await tv.locator('[data-v13-video-filter="youtube"]').click();assert.ok(await tv.locator('#v13TvLibrary [data-video-kind="youtube"]').count()>0);assert.equal(await tv.locator('#v13TvLibrary [data-video-kind="exclusive"]').count(),0);
  await tv.locator('#v13YoutubeStart').click();assert.match(await tv.locator('#v13YoutubePlayer').getAttribute('src'),/youtube-nocookie\.com/);
  await tv.locator('[data-v13-video-filter="exclusive"]').click();await tv.locator('#v13TvLibrary button[data-v12-clip="clip-karma"]').click();assert.equal(await tv.locator('#v12TvPlayer').isVisible(),true);assert.match(await tv.locator('#v12TvPlayer').getAttribute('src'),/\.mp4/);
  await tv.waitForFunction(()=>!document.querySelector('[data-v12-like]').disabled);await tv.locator('[data-v12-like]').click();await tv.waitForFunction(()=>document.querySelector('[data-v12-like]').getAttribute('aria-pressed')==='true');
  await tv.locator('[name="displayName"]').fill('QA locale');await tv.locator('[name="message"]').fill('Test local sans écriture en production.');await tv.locator('[data-v12-comments-form] button[type="submit"]').click();await tv.waitForFunction(()=>document.querySelector('[data-v12-comments-status]').textContent.includes('après validation'));
  await tv.locator('#v12TvPlayer').evaluate(player=>player.dispatchEvent(new Event('ended')));await tv.waitForTimeout(200);
  assert.ok(rpcRequests.some(item=>item.rpc==='increment_video_view'));assert.ok(rpcRequests.some(item=>item.rpc==='submit_comment'));assert.ok(rpcRequests.some(item=>item.rpc==='toggle_video_like'));
  report.interactions.push('YouTube, MP4, filtres, likes, vues, commentaires (RPC simulés, aucun write production)');await tv.close();
  const members=await context.newPage();await ready(members,'/members/');await members.locator('#pseudo').fill('QA locale V14');await members.getByRole('button',{name:'Enregistrer mon compte'}).click();assert.match(await members.locator('#profileName').textContent(),/QA locale V14/);report.interactions.push('profil membre local enregistré');await members.close();
  if (!remote && !process.argv.includes('--captures-only')) {
    const pwa=await browser.newContext({serviceWorkers:'allow'});await installFixtures(pwa);
    await pwa.addInitScript(()=>{try{sessionStorage.setItem('mpbpIntroPlayed','1');}catch(_){}});
    const page=await pwa.newPage();await ready(page,'/');
    await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.active),null,{timeout:20000});
    const manifestResponse=await page.request.get(base+'/manifest.webmanifest');assert.equal(manifestResponse.status(),200);assert.ok((await manifestResponse.json()).start_url);
    report.interactions.push('service worker actif, manifeste PWA valide');await pwa.close();
  }
  assert.deepEqual(errors,[],'Erreurs JS');
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  await browser.close();
  console.log(`V14 final QA: ${report.routes.length} routes; ${report.captures.filter(item=>item.viewport==='1600x900').length} captures desktop; ${report.captures.filter(item=>item.viewport==='390x844').length} captures mobile; ${report.responsive.length} contrôles responsive; interactions vertes; artworks intacts; aucune erreur JS.`);
  console.log(output);
})().catch(error=>{console.error(error);process.exitCode=1;});
