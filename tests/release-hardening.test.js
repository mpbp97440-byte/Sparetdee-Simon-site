const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const plain = value => JSON.parse(JSON.stringify(value));

function browserContext() {
  const elements = new Map();
  return vm.createContext({
    console, URL, Blob, TextEncoder, Uint8Array, Date, Map, Set, Object, Array, JSON,
    location: { pathname: '/', origin: 'https://www.mpbp440.com' },
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      baseURI: 'https://www.mpbp440.com/',
      body: { addEventListener: () => {} },
      addEventListener: () => {}, dispatchEvent: () => {}, querySelectorAll: () => [],
      getElementById: id => elements.get(id) || null
    },
    window: {}, navigator: {}, history: { pushState: () => {} },
    CustomEvent: function CustomEvent() {}, confirm: () => true, alert: () => {},
    setInterval: () => 1, clearInterval: () => {}, setTimeout: () => {}
  });
}

function runBackofficeTests() {
  const context = browserContext();
  vm.runInContext(read('admin-440-mpbp-corp/backoffice.js'), context);
  const run = source => vm.runInContext(source, context);

  assert.equal(run(`normalizeCmsDate('29/08/2026')`), '2026-08-29');
  assert.equal(run(`normalizeCmsDate('2026-08-29')`), '2026-08-29');
  assert.equal(run(`parseCmsDate('31/02/2026')`), null);
  assert.deepEqual(plain(run(`normalizePlatformLinks({'Spotify':'https://spotify.test','Apple Music':'https://apple.test','YouTube Music':'https://youtube.test','Autre':'https://other.test'})`)), {
    spotify: 'https://spotify.test', apple: 'https://apple.test', youtube: 'https://youtube.test', other: 'https://other.test'
  });
  assert.equal(run(`hasOfficialStreamingLink({links:{'YouTube Music':'https://youtube.test'}})`), true);
  assert.equal(run(`hasOfficialStreamingLink({links:{spotify:'http://spotify.test'}})`), false);

  const original = {
    site: json('data.json'), music: json('data/music-library.json'), releases: json('data/releases.json'),
    countdowns: json('data/countdowns.json'), videos: json('data/videos.json'), gallery: json('data/gallery.json'),
    events: json('data/events.json'), news: json('data/news.json')
  };
  const id = 'juste-une-plume-petit-demon';
  const before = plain(original);
  run(`state.data=${JSON.stringify(original)};state.original=clone(state.data);state.ready=false;`);
  assert.deepEqual(plain(run(`validateCmsData()`)), []);
  const index = run(`currentTracks().findIndex(item=>item.id==='${id}')`);
  run(`{
    const fixture={...clone(currentTracks()[${index}]),date:'29/08/2026',status:'À venir',links:{'Spotify':'https://open.spotify.com/test'}};
    currentTracks()[${index}]=fixture;
    state.data.site.upcoming=[clone(fixture),...state.data.site.upcoming];
    state.data.site.countdowns=[clone(fixture),...state.data.site.countdowns];
    state.data.countdowns=[clone(fixture),...state.data.countdowns];
    state.data.site.featured=clone(fixture);
    markTrackAvailable(${index});
  }`);

  const after = plain(run('state.data'));
  const target = after.site.tracks.find(item => item.id === id);
  assert.equal(target.status, 'Disponible');
  assert.equal(target.date, '2026-08-29');
  assert.deepEqual(target.links, { spotify: 'https://open.spotify.com/test' });
  assert.equal(after.site.upcoming.some(item => item.id === id), false);
  assert.equal(after.site.countdowns.some(item => item.id === id), false);
  assert.equal(after.countdowns.some(item => item.id === id), false);
  assert.equal(after.music.filter(item => item.id === id).length, 1);
  assert.equal(after.releases.filter(item => item.id === id).length, 1);
  assert.equal(after.site.featured.id, id);
  assert.equal(after.site.featured.status, 'Disponible');
  assert.equal(after.news.filter(item => item.id === `${id}-available`).length, 1);

  run(`syncTrackRelations(currentTracks()[${index}],clone(currentTracks()[${index}]));`);
  assert.equal(run(`currentNews().filter(item=>item.id==='${id}-available').length`), 1);

  const withoutTarget = list => list.filter(item => item.id !== id).map(item => item.id || `${item.artist || ''}|${item.title || ''}`);
  assert.deepEqual(withoutTarget(after.site.tracks), withoutTarget(before.site.tracks));
  assert.deepEqual(withoutTarget(after.site.upcoming), withoutTarget(before.site.upcoming));
  assert.deepEqual(withoutTarget(after.site.countdowns), withoutTarget(before.site.countdowns));
  assert.deepEqual(withoutTarget(after.music), withoutTarget(before.music));
  assert.deepEqual(withoutTarget(after.releases), withoutTarget(before.releases));
  assert.deepEqual(withoutTarget(after.countdowns), withoutTarget(before.countdowns));
  assert.deepEqual(after.news.filter(item => item.id !== `${id}-available`).map(item => item.id), before.news.filter(item => item.id !== `${id}-available`).map(item => item.id));

  const karma = list => list.find(item => item.id === 'makeda-karma');
  assert.deepEqual(karma(after.site.tracks), karma(before.site.tracks));
  assert.deepEqual(karma(after.music), karma(before.music));
  assert.deepEqual(karma(after.releases), karma(before.releases));
  assert.equal(target.cover, 'assets/releases/juste-une-plume/petit-demon-cover-officielle.jpeg');

  run(`state.data=${JSON.stringify(before)};state.original=clone(state.data);state.ready=false;`);
  const blockedIndex = run(`currentTracks().findIndex(item=>item.id==='${id}')`);
  run(`currentTracks()[${blockedIndex}].status='À venir';currentTracks()[${blockedIndex}].links={};markTrackAvailable(${blockedIndex});`);
  assert.equal(run(`currentTracks()[${blockedIndex}].status`), 'À venir');
}

function runPublishedContentTests() {
  const site = json('data.json');
  const library = json('data/music-library.json');
  const releases = json('data/releases.json');
  const countdowns = json('data/countdowns.json');
  const news = json('data/news.json');
  const petitId = 'juste-une-plume-petit-demon';
  const tribunalId = 'le-tribunal-des-maux';
  const petit = site.tracks.find(item => item.id === petitId);
  const tribunal = site.tracks.find(item => item.id === tribunalId);
  const expectedLinks = {
    spotify: 'https://open.spotify.com/intl-fr/track/1YIOeU2i9lvaUPQh56qA1q?si=7f6289acab7c4035',
    deezer: 'https://link.deezer.com/s/34fz5ZbJHKmCiyeoqNDa9',
    apple: 'https://music.apple.com/fr/album/petit-d%C3%A9mon/6805402159?i=6805402650',
    youtube: 'https://music.youtube.com/playlist?list=OLAK5uy_k7BBXMm3QYMqUldptDELFQcV3GR6lJ67I&si=EOonO68VJtzpYcfK'
  };

  assert.equal(petit.status, 'Disponible');
  assert.equal(petit.date, '2026-08-29');
  assert.deepEqual(petit.links, expectedLinks);
  assert.ok(Object.values(petit.links).every(url => url.startsWith('https://')));
  assert.equal(site.featured.id, petitId);
  assert.deepEqual(site.featured.links, expectedLinks);
  assert.equal(site.upcoming.some(item => item.id === petitId), false);
  assert.equal(site.countdowns.some(item => item.id === petitId), false);
  assert.equal(countdowns.some(item => item.id === petitId), false);
  assert.equal(news.filter(item => item.id === `${petitId}-available`).length, 1);
  assert.equal(library.filter(item => item.id === petitId && item.status === 'Disponible').length, 1);
  assert.equal(releases.filter(item => item.id === petitId && item.status === 'Disponible').length, 1);

  assert.equal(tribunal.status, 'À venir');
  assert.equal(tribunal.type, 'Album');
  assert.equal(tribunal.date, '2026-09-05');
  assert.deepEqual(tribunal.artists, ['Sparetdee Simon', 'Makéda Muse']);
  assert.equal(tribunal.artists.includes('Sparetdee Simon'), true);
  assert.equal(tribunal.artists.includes('Makéda Muse'), true);
  assert.equal(site.upcoming.filter(item => item.id === tribunalId).length, 1);
  assert.equal(site.countdowns.filter(item => item.id === tribunalId).length, 1);
  assert.equal(countdowns.filter(item => item.id === tribunalId).length, 1);
  assert.equal(site.tracks.filter(item => item.id === tribunalId && item.status === 'Disponible').length, 0);
  assert.equal(site.featured.id, petitId);

  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  assert.equal(hash('assets/releases/juste-une-plume/petit-demon-cover-officielle.jpeg'), 'a012bb4875fc7d209b29881f0347e65a15fc2f930dd68c9eb3a5686b3f0fb3f5');
  assert.equal(hash('assets/releases/sparetdee-simon/le-tribunal-des-maux-pre-sortie-2026-09-05.png'), '68da5f4da0df083fbf318bfe83d3e5c79a5ad4b36159c59946085a700aed5f4c');
}

function runRendererTests() {
  const music = browserContext();
  vm.runInContext(read('music/music.js'), music);
  assert.equal(vm.runInContext(`mediaUrl('https://cdn.test/cover.png')`, music), 'https://cdn.test/cover.png');
  assert.match(vm.runInContext(`platformButtons({'Spotify':'https://spotify.test','Apple Music':'https://apple.test','YouTube Music':'https://youtube.test'})`, music), /spotify\.test/);
  assert.match(vm.runInContext(`platformButtons({'Spotify':'https://spotify.test','Apple Music':'https://apple.test','YouTube Music':'https://youtube.test'})`, music), /apple\.test/);
  assert.match(vm.runInContext(`platformButtons({'Spotify':'https://spotify.test','Apple Music':'https://apple.test','YouTube Music':'https://youtube.test'})`, music), /youtube\.test/);

  const artist = browserContext();
  vm.runInContext(read('artistes/artist.js'), artist);
  assert.equal(vm.runInContext(`artistMediaUrl('https://cdn.test/cover.png')`, artist), 'https://cdn.test/cover.png');
  assert.match(vm.runInContext(`linkButtons({'Deezer':'https://deezer.test','Amazon':'https://amazon.test'})`, artist), /deezer\.test/);
  assert.match(vm.runInContext(`linkButtons({'Deezer':'https://deezer.test','Amazon':'https://amazon.test'})`, artist), /amazon\.test/);

  const gallery = browserContext();
  vm.runInContext(read('galerie/galerie.js'), gallery);
  assert.equal(vm.runInContext(`galleryMediaUrl('https://cdn.test/image.png')`, gallery), 'https://cdn.test/image.png');

  const homepage = browserContext();
  const homepageSource = read('assets/js/v12-homepage.js').replace(
    'document.addEventListener("DOMContentLoaded", render, {once:true});',
    'globalThis.__homepageTest={date,validDate};'
  );
  vm.runInContext(homepageSource, homepage);
  assert.equal(vm.runInContext(`__homepageTest.date('29/08/2026').getFullYear()`, homepage), 2026);
  assert.equal(vm.runInContext(`__homepageTest.date('29/08/2026').getMonth()`, homepage), 7);
  assert.equal(vm.runInContext(`__homepageTest.validDate('2026-08-29')`, homepage), true);
  assert.equal(vm.runInContext(`__homepageTest.validDate('31/02/2026')`, homepage), false);
  assert.equal(vm.runInContext(`__homepageTest.date('29/08/2026') > __homepageTest.date('2026-08-13')`, homepage), true);

  const v12Artist = browserContext();
  const artistSource = read('artistes/v12-artist.js').replace(
    "const labels = {spotify:'Spotify'",
    "globalThis.__artistV12Test={artistMediaUrl,releaseDate}; const labels = {spotify:'Spotify'"
  );
  vm.runInContext(artistSource, v12Artist);
  assert.equal(vm.runInContext(`__artistV12Test.releaseDate('29/08/2026').getMonth()`, v12Artist), 7);
  assert.equal(vm.runInContext(`__artistV12Test.releaseDate('2026-08-29').getDate()`, v12Artist), 29);
  assert.equal(vm.runInContext(`__artistV12Test.artistMediaUrl('https://cdn.test/cover.png')`, v12Artist), 'https://cdn.test/cover.png');

  const mainScript = browserContext();
  mainScript.window.addEventListener = () => {};
  mainScript.window.matchMedia = () => ({matches:false});
  mainScript.window.sessionStorage = {getItem:()=>null,setItem:()=>{}};
  mainScript.scrollY = 0;
  mainScript.scrollTo = () => {};
  vm.runInContext(read('script.js'), mainScript);
  assert.equal(vm.runInContext(`isUpcomingTrack({status:'À venir'})`, mainScript), true);
  assert.match(vm.runInContext(`trackBadgesHtml({status:'À venir',title:'Le Tribunal des Maux'})`, mainScript), /À venir/);
  assert.doesNotMatch(vm.runInContext(`trackBadgesHtml({status:'À venir',title:'Le Tribunal des Maux'})`, mainScript), /Disponible/);
}

runBackofficeTests();
runRendererTests();
runPublishedContentTests();
console.log('release-hardening: all assertions passed');
