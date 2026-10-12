const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.MPBP_QA_BASE_URL || 'http://127.0.0.1:4173';
const output = process.env.MPBP_QA_SCREENSHOTS || path.join(process.env.TEMP || process.cwd(), 'mpbp440-v14-captures');
const shots = [
  ['home-hero', '/', '#home'],
  ['home-latest', '/', '#sortie'],
  ['home-featured', '/', '#alaune'],
  ['mpbp-tv', '/mpbp-tv/', '#mpbp-tv-player'],
  ['artist-sparetdee', '/artistes/sparetdee-simon.html', '.artist-page .hero'],
  ['artist-makeda', '/artistes/makeda-muse.html', '.artist-page .hero'],
  ['events', '/evenements/', '#roots-live-25-07-2026'],
  ['home-radio', '/', '#radio']
];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless:true, executablePath:process.env.MPBP_QA_BROWSER_PATH || undefined });
  const context = await browser.newContext({ viewport:{ width:1600, height:900 }, reducedMotion:'reduce' });
  await context.addInitScript(() => sessionStorage.setItem('mpbpIntroPlayed', '1'));
  const report = [];
  for (const [name, route, selector] of shots) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`${base}${route}`, { waitUntil:'networkidle', timeout:30000 });
    assert.equal(response?.status(), 200, `${name}: HTTP ${response?.status()}`);
    await page.locator(selector).waitFor({ state:'visible', timeout:15000 });
    if (selector !== '#home') await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const metrics = await page.evaluate(sel => {
      const target = document.querySelector(sel);
      const rect = target.getBoundingClientRect();
      const dock = document.getElementById('mpbpAudioControl')?.getBoundingClientRect();
      const frames = [...target.querySelectorAll('.v14-artwork-frame img')].map(img => ({ fit:getComputedStyle(img).objectFit, natural:[img.naturalWidth,img.naturalHeight], box:[Math.round(img.clientWidth),Math.round(img.clientHeight)] }));
      return { rect:{ x:Math.round(rect.x), y:Math.round(rect.y), width:Math.round(rect.width), height:Math.round(rect.height) }, overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth, dock:dock?{width:Math.round(dock.width),height:Math.round(dock.height),bottom:Math.round(dock.bottom)}:null, frames };
    }, selector);
    assert.ok(metrics.overflow <= 2, `${name}: overflow ${metrics.overflow}`);
    assert.ok(metrics.frames.every(frame => frame.fit === 'contain'), `${name}: artwork non contain`);
    assert.deepEqual(errors, [], `${name}: ${errors.join('; ')}`);
    await page.screenshot({ path:path.join(output, `${name}-1600x900.png`) });
    report.push({ name, ...metrics, consoleErrors:errors.length });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`V14 capture QA: ${shots.length} captures 1600x900, artwork contain, aucun overflow ni crash JS.`);
  console.log(`Captures: ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
