const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const removedPublicSurfaces = [
  'admin.html',
  'admin.js',
  'admin.css',
  'analytics/index.html',
  'analytics/analytics.js',
  'analytics/analytics.css',
  'analytics/tracker.js',
  'preview/index.html',
  'refonte/admin-hide.css',
  'refonte/admin-hide.js',
  'refonte/refonte.css',
  'refonte/refonte.js',
  'refonte/safe-restore.css',
  'refonte/safe-restore.js',
  'admin-pro/admin-pro.css',
  'admin-pro/admin-pro.js',
  'SNIPPET_AJOUT_PAGES_ARTISTES.html',
  'SNIPPET_LIEN_GALERIE_ARTISTES.html',
  'SNIPPET_LIEN_GALERIE_INDEX.html',
  'SNIPPET_LIEN_LIVE_INDEX.html'
];

for (const file of removedPublicSurfaces) {
  assert.equal(fs.existsSync(path.join(root, file)), false, `${file} doit rester supprimé`);
}

const legacyRedirect = read('admin-pro/index.html');
assert.match(legacyRedirect, /noindex,nofollow,noarchive,nosnippet/i);
assert.match(legacyRedirect, /url=\//i);
assert.doesNotMatch(legacyRedirect, /<script\b/i);

const backOffice = read('admin-440-mpbp-corp/index.html');
assert.match(backOffice, /noindex,nofollow,noarchive,nosnippet/i);
assert.match(backOffice, /id="adminLoginForm"/);
assert.match(backOffice, /auth\.js/);
assert.ok(backOffice.indexOf('auth.js') < backOffice.indexOf('backoffice.js'), 'auth.js doit être chargé avant le CMS');

const auth = read('admin-440-mpbp-corp/auth.js');
assert.match(auth, /signInWithPassword/);
assert.match(auth, /\/auth\/v1\/user/);
assert.match(auth, /get_admin_dashboard_summary/);
assert.doesNotMatch(auth, /SUPABASE_SERVICE_ROLE_KEY|GITHUB_ADMIN_TOKEN/);

const sharedAdmin = read('supabase/functions/_shared/admin.ts');
assert.match(sharedAdmin, /requireAdmin/);
assert.match(sharedAdmin, /auth\.getUser\(\)/);
assert.match(sharedAdmin, /role\.role !== 'admin'/);

const publishFunction = read('supabase/functions/admin-publish-site/index.ts');
assert.match(publishFunction, /requireAdmin\(request\)/);
assert.match(publishFunction, /const allowedFiles = new Set/);
assert.match(publishFunction, /Deno\.env\.get\('GITHUB_ADMIN_TOKEN'\)/);

const robots = read('robots.txt');
for (const route of ['/admin', '/admin.html', '/admin-pro/', '/admin-440-mpbp-corp/', '/analytics/', '/preview/']) {
  assert.match(robots, new RegExp(`Disallow: ${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
}

console.log('security-surface: all assertions passed');
