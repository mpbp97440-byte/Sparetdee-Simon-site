const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(__dirname, 'v14-preservation-manifest.json');
const files = execFileSync('git', ['ls-files'], { cwd:root, encoding:'utf8' }).trim().split(/\r?\n/);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const uniq = values => [...new Set(values)].sort();
const attrs = (html, name) => uniq([...html.matchAll(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'gi'))].map(match => match[1]));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const pages = files.filter(file => file.endsWith('.html') && /<body[^>]*v14-miami/.test(read(file)));
const immutable = files.filter(file => /^(data\/.*\.json$|data\.json$|admin[^/]*\/|supabase\/|assets\/js\/mpbp440-supabase\.js$|sw\.js$|manifest\.webmanifest$|CNAME$)/.test(file));
function inventory() {
  const html = Object.fromEntries(pages.map(file => {
    const source = read(file);
    const anchors = [...source.matchAll(/<a\b[^>]*>/gi)].flatMap(match => attrs(match[0], 'href'));
    const data = uniq([...source.matchAll(/\b(data-[\w-]+)(?:\s*=\s*(["'])(.*?)\2)?/g)].map(match => `${match[1]}=${match[3] || ''}`));
    return [file, { hrefs:uniq(anchors), internal:uniq(anchors.filter(href => !/^(https?:|mailto:|tel:)/.test(href))), external:uniq(anchors.filter(href => /^https?:/.test(href))), ids:attrs(source,'id'), data, media:uniq(attrs(source,'src').filter(src => !/\.js(?:\?|$)/.test(src))), scripts:attrs(source,'src').filter(src => /\.js(?:\?|$)/.test(src)) }];
  }));
  const jsonContracts = {};
  for (const file of files.filter(file => /(?:^data\.json$|^data\/.*\.json$)/.test(file))) {
    const values = { links:[], media:[], ids:[] };
    const walk = (value, key='') => {
      if (Array.isArray(value)) return value.forEach(item => walk(item,key));
      if (value && typeof value === 'object') return Object.entries(value).forEach(([name,item]) => walk(item,name));
      if (typeof value !== 'string') return;
      if (/^https?:\/\//.test(value) || /^(url|href|spotify|apple|deezer|youtube|facebook|tiktok|link)/i.test(key)) values.links.push(value);
      if (/^(cover|image|poster|src|promoCover|video|audio)$/i.test(key)) values.media.push(value);
      if (/^(id|content_id|registry_id|artist_id)$/.test(key)) values.ids.push(value);
    };
    walk(JSON.parse(read(file)));
    jsonContracts[file] = Object.fromEntries(Object.entries(values).map(([key,value])=>[key,uniq(value)]));
  }
  const jsContracts = Object.fromEntries(files.filter(file=>/\.js$/.test(file) && !/^tests\//.test(file)).map(file=>[file,{
    data:uniq([...read(file).matchAll(/data-[a-z][\w-]+/g)].map(match=>match[0])),
    registry:uniq([...read(file).matchAll(/(?:content_registry|supabase|content_id|registry_id|v12Tv\w+|v13Tv\w+)/g)].map(match=>match[0]))
  }]));
  return { version:1, baselineSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(), routes:pages.map(file=>file==='index.html'?'/':`/${file.replace(/index\.html$/,'')}`), html, jsonContracts, jsContracts, immutableHashes:Object.fromEntries(immutable.map(file=>[file,hash(file)])) };
}
if (process.argv.includes('--record')) {
  assert.ok(!fs.existsSync(manifestPath), 'Le manifeste initial ne doit jamais être écrasé.');
  fs.writeFileSync(manifestPath, JSON.stringify(inventory(), null, 2)+'\n');
  console.log('Manifeste de préservation initial généré.');
} else {
  const baseline = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const current = inventory();
  const failures = [];
  const contains = (before,after,label) => before.forEach(value=>{if(!after.includes(value)) failures.push(`${label}: ${value}`);});
  contains(baseline.routes,current.routes,'route disparue');
  for (const [file,contracts] of Object.entries(baseline.html)) for (const key of ['hrefs','ids','data','media','scripts']) {
    // Cache versions may change; the script route itself must remain identical.
    const normalize = values => ['scripts','media'].includes(key) ? values.map(value=>{
      const url = new URL(value,`https://contract.local/${file}`);
      return url.origin==='https://contract.local' ? url.pathname + (key==='media' ? url.search : '') : url.href;
    }) : values;
    contains(normalize(contracts[key]),normalize(current.html[file]?.[key] || []),`${file}: ${key} disparu`);
  }
  for (const [file,contracts] of Object.entries(baseline.jsonContracts)) for (const [key,values] of Object.entries(contracts)) contains(values,current.jsonContracts[file]?.[key] || [],`${file}: ${key} disparu`);
  for (const [file,contracts] of Object.entries(baseline.jsContracts)) for (const [key,values] of Object.entries(contracts)) contains(values,current.jsContracts[file]?.[key] || [],`${file}: contrat JS ${key} disparu`);
  for (const [file,digest] of Object.entries(baseline.immutableHashes)) if (hash(file)!==digest) failures.push(`${file}: fichier protégé modifié`);
  assert.deepEqual(failures,[],`HARD FAIL préservation:\n${failures.join('\n')}`);
  const count=Object.values(baseline.html).reduce((total,page)=>total+page.hrefs.length,0)+Object.values(baseline.jsonContracts).reduce((total,contracts)=>total+contracts.links.length,0);
  console.log(`Préservation: ${baseline.routes.length} routes, ${count} références de liens, ${Object.keys(baseline.immutableHashes).length} fichiers protégés intacts.`);
}
