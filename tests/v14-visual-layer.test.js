const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const publicPages = [
  'index.html',
  'offline.html',
  'a-venir/index.html',
  'actu/index.html',
  'application/index.html',
  'dashboard/index.html',
  'evenements/index.html',
  'galerie/index.html',
  'live/index.html',
  'members/index.html',
  'mon-espace/index.html',
  'mpbp-tv/index.html',
  'music/index.html',
  'notifications/index.html',
  'sortie/index.html',
  'telechargements/index.html',
  'artistes/sparetdee-simon.html',
  'artistes/makeda-muse.html',
  'artistes/juste-une-plume.html',
  'lyrics/le-systeme.html',
  'lyrics/je-sais-que-tu-sais.html'
];

const styles = [
  'v14-tokens.css',
  'v14-shell.css',
  'v14-components.css',
  'v14-home.css',
  'v14-pages.css',
  'v14-responsive.css'
];

for (const page of publicPages) {
  const html = read(page);
  assert.match(html, /<body class="v14-miami(?:\s|\")/, `${page}: classe V14 absente`);
  for (const stylesheet of styles) {
    assert.equal((html.match(new RegExp(stylesheet.replace('.', '\\.'), 'g')) || []).length, 1, `${page}: ${stylesheet} doit être chargé une seule fois`);
  }
  assert.equal((html.match(/v14-motion\.js/g) || []).length, 1, `${page}: motion V14 doit être chargé une seule fois`);
  assert.equal((html.match(/v12-preview-basepath\.js/g) || []).length, 1, `${page}: support de preview doit être chargé une seule fois`);
}

for (const cmsPage of ['admin-440-mpbp-corp/index.html', 'admin-pro/index.html']) {
  const html = read(cmsPage);
  assert.doesNotMatch(html, /v14-(?:tokens|shell|components|home|pages|responsive|motion)/, `${cmsPage}: le CMS doit rester intact`);
}

for (const stylesheet of styles) {
  assert.ok(fs.statSync(path.join(root, 'assets/css', stylesheet)).size > 100, `${stylesheet}: feuille vide`);
}
assert.ok(fs.statSync(path.join(root, 'assets/js/v14-motion.js')).size > 100, 'v14-motion.js: fichier vide');

const tokens = read('assets/css/v14-tokens.css');
for (const token of ['--v14-night', '--v14-gold', '--v14-cyan', '--v14-warm-white', '--v14-heading']) {
  assert.ok(tokens.includes(token), `token absent: ${token}`);
}
assert.match(tokens, /prefers-reduced-motion:\s*reduce/, 'reduced motion doit être pris en charge');
assert.match(read('assets/css/v14-responsive.css'), /max-width:\s*430px/, 'palier mobile 430 px absent');
assert.match(read('assets/css/v14-responsive.css'), /max-width:\s*700px/, 'palier mobile absent');
assert.match(read('assets/css/v14-responsive.css'), /min-width:\s*1600px/, 'palier grand écran absent');

const home = read('index.html');
assert.match(home, /v14-hero-sky/, 'couche ciel du hero absente');
assert.match(home, /v14-hero-city/, 'couche ville du hero absente');
assert.match(home, /v14-hero-audio/, 'couche audio du hero absente');
assert.match(home, /MPBP440 Audio Lounge/, 'identité Audio Lounge absente');
assert.match(read('assets/css/v14-home.css'), /spotifyRadioBox/, 'lecteur Spotify Audio Lounge non composé');
assert.match(read('assets/css/v14-components.css'), /\.v14-artwork-frame/, 'cadre artwork V14 absent');

const previewPaths = read('assets/js/v12-preview-basepath.js');
assert.match(previewPaths, /raw\.githack\.com/, 'la preview publique V14 doit gérer raw.githack.com');
assert.match(previewPaths, /window\.fetch/, 'les données dynamiques doivent être rebasées en preview');

console.log(`V14 visual layer: ${publicPages.length} routes publiques validées, CMS intact.`);
