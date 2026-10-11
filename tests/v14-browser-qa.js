const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = process.env.MPBP_QA_BASE_URL || 'http://127.0.0.1:4173';
const screenshotDir = process.env.MPBP_QA_SCREENSHOTS || path.join(process.env.TEMP || process.cwd(), 'mpbp440-v14-qa');

const routes = [
  '/', '/a-venir/', '/actu/', '/application/', '/dashboard/', '/evenements/', '/galerie/', '/live/',
  '/members/', '/mon-espace/', '/mpbp-tv/', '/music/', '/notifications/', '/sortie/', '/telechargements/',
  '/artistes/sparetdee-simon.html', '/artistes/makeda-muse.html', '/artistes/juste-une-plume.html',
  '/lyrics/le-systeme.html', '/lyrics/je-sais-que-tu-sais.html', '/offline.html'
];

const widths = [375, 390, 430, 768, 1024, 1440, 1920];
const responsiveRoutes = ['/', '/a-venir/', '/music/', '/mpbp-tv/', '/artistes/sparetdee-simon.html', '/artistes/makeda-muse.html', '/artistes/juste-une-plume.html'];
const errors = [];

(async () => {
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.MPBP_QA_BROWSER_PATH || undefined
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });

async function inspect(route, width, screenshot = false) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: width <= 430 ? 900 : width <= 768 ? 1024 : 1000 });

  const local404s = [];
  page.on('response', response => {
    if (response.status() === 404 && response.url().startsWith(baseUrl)) local404s.push(response.url());
  });
  page.on('pageerror', error => errors.push(`${route} @${width}: ${error.message}`));

  const rawGitHackPreview = /raw(?:cdn)?\.githack\.com/.test(baseUrl);
  const previewRoute = rawGitHackPreview && route.endsWith('/') ? `${route}index.html` : route;
  let response = await page.goto(`${baseUrl}${previewRoute}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  if (rawGitHackPreview && (await page.title()).includes('External Content Notice')) {
    await page.getByRole('button', { name: /open the page/i }).click();
  }
  assert.equal(response?.status(), 200, `${route} @${width}: HTTP ${response?.status()}`);
  await page.waitForTimeout(rawGitHackPreview ? 1800 : 450);

  const metrics = await page.evaluate(() => ({
    title: document.title,
    bodyClass: document.body.className,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    v14Loaded: getComputedStyle(document.documentElement).getPropertyValue('--v14-night').trim(),
    brokenImages: [...document.images]
      .filter(image => image.getAttribute('src') && image.complete && image.naturalWidth === 0)
      .map(image => image.currentSrc || image.src)
  }));

  assert.ok(metrics.title, `${route} @${width}: titre absent`);
  assert.match(metrics.bodyClass, /v14-miami/, `${route} @${width}: classe V14 absente`);
  assert.equal(metrics.v14Loaded, '#030507', `${route} @${width}: tokens V14 non chargés`);
  assert.ok(metrics.overflow <= 2, `${route} @${width}: débordement horizontal ${metrics.overflow}px`);
  assert.deepEqual(local404s, [], `${route} @${width}: ressources 404`);
  assert.deepEqual(metrics.brokenImages, [], `${route} @${width}: images cassées`);

  if (screenshot) {
    fs.mkdirSync(screenshotDir, { recursive: true });
    const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[\/.]+/g, '-').replace(/-$/, '');
    await page.screenshot({ path: path.join(screenshotDir, `${slug}-${width}.png`), fullPage: true });
  }
  await page.close();
}

for (const route of routes) await inspect(route, 1440, ['/', '/a-venir/', '/music/', '/mpbp-tv/'].includes(route));
for (const route of responsiveRoutes) {
  for (const width of widths) await inspect(route, width, route === '/' && [390, 768, 1920].includes(width));
}

await browser.close();
assert.deepEqual(errors, [], `Erreurs JavaScript:\n${errors.join('\n')}`);
console.log(`V14 browser QA: ${routes.length} routes, ${widths.join('/')}px, aucun 404, débordement ou crash JS.`);
console.log(`Captures: ${screenshotDir}`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
