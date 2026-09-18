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
  const sousLeMemeToitId = 'sous-le-meme-toit';
  const brainrotRemixId = 'brainrot-society-remix';
  const legalizeRemixId = 'legalize-la-kalite-remix';
  const petit = site.tracks.find(item => item.id === petitId);
  const tribunal = site.tracks.find(item => item.id === tribunalId);
  const petitLinks = {
    spotify: 'https://open.spotify.com/intl-fr/track/1YIOeU2i9lvaUPQh56qA1q?si=7f6289acab7c4035',
    deezer: 'https://link.deezer.com/s/34fz5ZbJHKmCiyeoqNDa9',
    apple: 'https://music.apple.com/fr/album/petit-d%C3%A9mon/6805402159?i=6805402650',
    youtube: 'https://music.youtube.com/playlist?list=OLAK5uy_k7BBXMm3QYMqUldptDELFQcV3GR6lJ67I&si=EOonO68VJtzpYcfK'
  };
  const tribunalLinks = {
    spotify: 'https://open.spotify.com/intl-fr/album/1KQRfymOK0hmSUEiMASQ7K?si=XfbfHG3bQgaV8AupiY5Wqw',
    deezer: 'https://link.deezer.com/s/34mAWHoh5CYieWMQUPVxi',
    apple: 'https://music.apple.com/fr/album/le-tribunal-des-maux-feat-mak%C3%A9da-muse/6807806481',
    youtube: 'https://music.youtube.com/playlist?list=OLAK5uy_lcsXv84cFXPcv80RA8TVdbBpFEW7PaU-w&si=9EM_0kr66hHMa1rD'
  };
  const sousLeMemeToitLinks = {
    spotify: 'https://open.spotify.com/intl-fr/album/6Mf9hv60u1L3sZP585UVoM?si=aM1-c5FZS3-t3JIeDezhzA',
    deezer: 'https://link.deezer.com/s/34qSWklejnRpkrk7octZJ',
    youtube: 'https://music.youtube.com/playlist?list=OLAK5uy_k64HBzkuh16CdUMhxnNoFg9Fc703nBmBY&si=E1FQImMeZ_8pemJz',
    apple: 'https://music.apple.com/fr/album/sous-le-m%C3%AAme-toit-feat-mak%C3%A9da-muse-single/6810645594',
    tiktok: 'https://www.tiktok.com/@simonsparet',
    facebook: 'https://www.facebook.com/Sparetdee.simon'
  };

  assert.equal(petit.status, 'Disponible');
  assert.equal(petit.date, '2026-08-29');
  assert.deepEqual(petit.links, petitLinks);
  assert.ok(Object.values(petit.links).every(url => url.startsWith('https://')));
  assert.equal(site.upcoming.some(item => item.id === petitId), false);
  assert.equal(site.countdowns.some(item => item.id === petitId), false);
  assert.equal(countdowns.some(item => item.id === petitId), false);
  assert.equal(news.filter(item => item.id === `${petitId}-available`).length, 1);
  assert.equal(library.filter(item => item.id === petitId && item.status === 'Disponible').length, 1);
  assert.equal(releases.filter(item => item.id === petitId && item.status === 'Disponible').length, 1);

  assert.equal(tribunal.status, 'Disponible');
  assert.equal(tribunal.type, 'Album');
  assert.equal(tribunal.date, '2026-09-05');
  assert.deepEqual(tribunal.artists, ['Sparetdee Simon', 'Makéda Muse']);
  assert.deepEqual(tribunal.links, tribunalLinks);
  assert.ok(Object.values(tribunal.links).every(url => url.startsWith('https://')));
  assert.equal(tribunal.cover, 'assets/releases/sparetdee-simon/le-tribunal-des-maux-cover-officielle.png');
  assert.equal(site.featured.id, tribunalId);
  assert.deepEqual(site.featured.links, tribunalLinks);
  assert.equal(site.upcoming.some(item => item.id === tribunalId), false);
  assert.equal(site.countdowns.some(item => item.id === tribunalId), false);
  assert.equal(countdowns.some(item => item.id === tribunalId), false);
  assert.equal(library.filter(item => item.id === tribunalId && item.status === 'Disponible').length, 1);
  assert.equal(releases.filter(item => item.id === tribunalId && item.status === 'Disponible').length, 1);
  assert.equal(news.filter(item => item.id === `${tribunalId}-available`).length, 1);

  const sousLeMemeToit = site.tracks.find(item => item.id === sousLeMemeToitId);
  assert.equal(sousLeMemeToit.status, 'Disponible');
  assert.equal(sousLeMemeToit.date, '2026-09-16');
  assert.deepEqual(sousLeMemeToit.artists, ['Sparetdee Simon', 'Makéda Muse']);
  assert.deepEqual(sousLeMemeToit.links, sousLeMemeToitLinks);
  assert.ok(Object.values(sousLeMemeToit.links).every(url => url.startsWith('https://')));
  assert.equal(sousLeMemeToit.cover, 'assets/releases/sparetdee-simon/sous-le-meme-toit-cover-officielle.png');
  assert.equal(site.upcoming.some(item => item.id === sousLeMemeToitId), false);
  assert.equal(site.countdowns.some(item => item.id === sousLeMemeToitId), false);
  assert.equal(countdowns.some(item => item.id === sousLeMemeToitId), false);
  assert.equal(site.tracks.filter(item => item.id === sousLeMemeToitId).length, 1);
  assert.equal(library.filter(item => item.id === sousLeMemeToitId && item.status === 'Disponible').length, 1);
  assert.equal(releases.filter(item => item.id === sousLeMemeToitId && item.status === 'Disponible').length, 1);
  assert.equal(news.filter(item => item.id === `${sousLeMemeToitId}-available`).length, 1);
  assert.equal(news.filter(item => item.id === 'sous-le-meme-toit-presortie-20260916').length, 0);
  assert.equal(site.featured.id, tribunalId);
  assert.equal(site.tracks.filter(item => item.status === 'Disponible').sort((a, b) => new Date(b.date) - new Date(a.date))[0].id, sousLeMemeToitId);
  const belongsToArtist = (item, artist) => item.artist === artist || item.artists?.includes(artist);
  assert.equal(belongsToArtist(sousLeMemeToit, 'Sparetdee Simon'), true);
  assert.equal(belongsToArtist(sousLeMemeToit, 'Makéda Muse'), true);

  for (const id of [brainrotRemixId, legalizeRemixId]) {
    assert.equal(site.tracks.filter(item => item.id === id && item.status === 'À venir').length, 1);
    assert.equal(site.upcoming.filter(item => item.id === id).length, 1);
    assert.equal(site.countdowns.filter(item => item.id === id).length, 1);
    assert.equal(countdowns.filter(item => item.id === id).length, 1);
    assert.equal(library.filter(item => item.id === id).length, 1);
    assert.equal(releases.filter(item => item.id === id).length, 1);
  }
  assert.deepEqual(site.tracks.find(item => item.id === brainrotRemixId).artists, ['Sparetdee Simon']);
  assert.deepEqual(site.tracks.find(item => item.id === legalizeRemixId).artists, ['Sparetdee Simon']);
  assert.equal(belongsToArtist(site.tracks.find(item => item.id === legalizeRemixId), 'Makéda Muse'), false);
  assert.deepEqual(site.upcoming.map(item => item.id), [brainrotRemixId, legalizeRemixId]);
  assert.deepEqual(site.countdowns.map(item => item.id), [brainrotRemixId, legalizeRemixId]);
  assert.deepEqual(countdowns.map(item => item.id), [brainrotRemixId, legalizeRemixId]);
  assert.equal(site.countdowns[0].date, '2026-09-26');
  assert.equal(site.countdowns[1].date, '2026-09-26');
  assert.notEqual(site.countdowns[0].id, site.countdowns[1].id);
  assert.equal(news.filter(item => item.id === 'brainrot-society-remix-presortie-20260926').length, 1);
  assert.equal(news.filter(item => item.id === 'legalize-la-kalite-remix-presortie-20260926').length, 1);
  assert.equal(news.filter(item => item.id === 'neons-carnivores-clip-20260910').length, 1);

  const videos = json('data/videos.json');
  const neons = videos.find(item => item.id === 'neons-carnivores');
  assert.equal(neons.youtubeId, 'GRPAsRzQTB0');
  assert.equal(neons.url, 'https://youtu.be/GRPAsRzQTB0?si=DJdNh8QAJHk2IEQY');
  assert.equal(neons.poster, 'assets/videos/neons-carnivores-video-poster.jpg');
  assert.equal(videos.filter(item => item.id === 'neons-carnivores').length, 1);
  assert.equal(new Set(videos.map(item => item.youtubeId).filter(Boolean)).size, videos.map(item => item.youtubeId).filter(Boolean).length);

  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  assert.equal(hash('assets/releases/juste-une-plume/petit-demon-cover-officielle.jpeg'), 'a012bb4875fc7d209b29881f0347e65a15fc2f930dd68c9eb3a5686b3f0fb3f5');
  assert.equal(hash('assets/releases/sparetdee-simon/le-tribunal-des-maux-cover-officielle.png'), 'b4c640208eadb1dfc9635ccd4506f5e8b936aeaefceaace56efee5f7086322fe');
  assert.equal(hash('assets/releases/sparetdee-simon/sous-le-meme-toit-cover-officielle.png'), 'a9298b1e8ce1dd8602892b98db5d715281100825eefe0e846308ba3b7640e8ab');
  assert.equal(hash('assets/releases/sparetdee-simon/brainrot-society-remix-presortie.png'), 'db0f2f7e0a8c655c327e7043f9f507c79c6dd6a4ac4a0066bf95764d3af9b86d');
  assert.equal(hash('assets/releases/sparetdee-simon/legalize-la-kalite-remix-presortie.png'), '8d0c424481f820610cdcf0cec8d5ca7d8d7b9b8214de6b1bf7556299dd353ef3');
  assert.equal(hash('assets/videos/neons-carnivores-video-poster.jpg'), '58651378c38b22775f6cc3c4cde55850e17ed14e4dff0ddea434e193fd9f1f58');
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
    'globalThis.__homepageTest={date,validDate,links};'
  );
  vm.runInContext(homepageSource, homepage);
  assert.equal(vm.runInContext(`__homepageTest.date('29/08/2026').getFullYear()`, homepage), 2026);
  assert.equal(vm.runInContext(`__homepageTest.date('29/08/2026').getMonth()`, homepage), 7);
  assert.equal(vm.runInContext(`__homepageTest.validDate('2026-08-29')`, homepage), true);
  assert.equal(vm.runInContext(`__homepageTest.validDate('31/02/2026')`, homepage), false);
  assert.equal(vm.runInContext(`__homepageTest.date('29/08/2026') > __homepageTest.date('2026-08-13')`, homepage), true);
  assert.match(vm.runInContext(`__homepageTest.links({links:{spotify:'https://spotify.test',deezer:'https://deezer.test',youtube:'https://youtube.test',apple:'https://apple.test',tiktok:'https://tiktok.test',facebook:'https://facebook.test'}})`, homepage), /YouTube Music/);
  assert.match(vm.runInContext(`__homepageTest.links({links:{spotify:'https://spotify.test',deezer:'https://deezer.test',youtube:'https://youtube.test',apple:'https://apple.test',tiktok:'https://tiktok.test',facebook:'https://facebook.test'}})`, homepage), /TikTok/);
  assert.match(vm.runInContext(`__homepageTest.links({links:{spotify:'https://spotify.test',deezer:'https://deezer.test',youtube:'https://youtube.test',apple:'https://apple.test',tiktok:'https://tiktok.test',facebook:'https://facebook.test'}})`, homepage), /Facebook/);

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
  assert.equal(vm.runInContext(`parseReleaseDate('2026-09-16').getDate()`, mainScript), 16);
  assert.equal(vm.runInContext(`parseReleaseDate('16/09/2026').getDate()`, mainScript), 16);
  assert.equal(vm.runInContext(`parseReleaseDate('31/02/2026')`, mainScript), null);
  assert.equal(vm.runInContext(`isUpcomingTrack({status:'À venir'})`, mainScript), true);
  assert.match(vm.runInContext(`trackBadgesHtml({status:'À venir',title:'Le Tribunal des Maux'})`, mainScript), /À venir/);
  assert.doesNotMatch(vm.runInContext(`trackBadgesHtml({status:'À venir',title:'Le Tribunal des Maux'})`, mainScript), /Disponible/);

  const tvHtml = read('mpbp-tv/index.html');
  const tvScript = read('assets/js/v12-mpbp-tv.js');
  assert.match(tvHtml, /data-v13-video-filter="youtube"/);
  assert.match(tvHtml, /data-v13-video-filter="exclusive"/);
  assert.match(tvHtml, /id="v13YoutubePlayer"/);
  assert.match(tvScript, /youtube-nocookie\.com\/embed/);
  assert.doesNotMatch(tvScript, /youtube-nocookie\.com\/embed\/[^\n]+autoplay=1/);
  for (const id of ['clip-karma','clip-mon-influence','clip-que-restera-t-il-de-moi','l-argent','clip-je-sais-que-tu-sais','clip-j-existe','clip-dois-je-me-taire']) {
    assert.match(tvScript, new RegExp(`id: '${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
}

runBackofficeTests();
runRendererTests();
runPublishedContentTests();
console.log('release-hardening: all assertions passed');
