const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='68e2b07fee838fa90a61b8f914172d79881b3b1e';
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const old=f=>execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
const json=f=>JSON.parse(read(f));
const data=json('data.json'),target=new Set(['brainrot-society-remix','legalize-la-kalite-remix']);
const prince=data.tracks.find(x=>x.id==='prince-des-etoiles-remix'),bizz=data.upcoming.find(x=>x.id==='le-bizz-cest-bon-2-0');
assert.equal(prince.title,'Prince des étoiles Remix');assert.equal(prince.date,'2026-10-13');assert.equal(prince.status,'Disponible');
assert.deepEqual(prince.links,{"youtube":"https://youtu.be/IJxt7Sju9cA?si=mmP6waO1yOWvip0y","spotify":"https://open.spotify.com/intl-fr/album/7yjm4wkEaKeUCmZIELM1gi?si=u3aLo0eXRumWC6yjiegoag","deezer":"https://link.deezer.com/s/34EYFKIHRH5g1ZtShbxGQ","apple":"https://music.apple.com/fr/album/prince-des-%C3%A9toiles-remix-single/6818615955"});
assert.equal(data.featured.id,prince.id);assert.deepEqual(json('data/featured.json'),prince);
assert.equal([...data.tracks].filter(x=>x.status==='Disponible'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)).sort((a,b)=>b.date.localeCompare(a.date))[0].id,prince.id);
for(const list of [data.upcoming,data.countdowns,json('data/countdowns.json')]){assert.deepEqual(list.map(x=>x.id),[bizz.id]);assert.equal(list[0].date,'2026-10-24');assert.equal(list[0].status,'À venir');assert.deepEqual(list[0].links,{});}
for(const file of ['data.json','data/releases.json','data/music-library.json']){
 const current=file==='data.json'?data.tracks:json(file),before=file==='data.json'?JSON.parse(old(file)).tracks:JSON.parse(old(file));
 for(const entry of before){
  const found=current.find(x=>x.id===entry.id||(!entry.id&&x.title===entry.title));assert.ok(found,'Ancienne sortie conservée : '+entry.title);
  if(!target.has(entry.id))assert.deepEqual(found,entry,file+': sortie non ciblée intacte');
  else{assert.equal(found.status,'Disponible');assert.equal(found.date,'2026-09-26');assert.equal(found.cover,entry.cover);assert.deepEqual(found.links,entry.links);assert.match(found.description,/disponible depuis le 26\/09\/2026/);}
 }
 for(const id of [prince.id,bizz.id])assert.equal(current.filter(x=>x.id===id).length,1);
}
for(const list of [data.tracks,data.upcoming,data.countdowns,data.videos,json('data/releases.json'),json('data/music-library.json'),json('data/videos.json'),json('data/news.json')]){const ids=list.map(x=>x.id).filter(Boolean);assert.equal(new Set(ids).size,ids.length);}
for(const [id,youtubeId]of [['sous-le-meme-toit-version-long','API0lavRLeY'],['prince-des-etoiles-remix-clip','cotFluUcc3g']]){
 for(const list of [data.videos,json('data/videos.json')]){const c=list.find(x=>x.id===id);assert.equal(c.youtubeId,youtubeId);assert.equal(c.url,'https://youtu.be/'+youtubeId);}
 assert.ok(read('artistes/sparetdee-simon.html').includes('/mpbp-tv/index.html#'+id));
}
assert.ok(read('artistes/makeda-muse.html').includes('/mpbp-tv/index.html#sous-le-meme-toit-version-long'));
const news=json('data/news.json');assert.equal(news.filter(x=>x.date==='2026-10-13').length,6);assert.ok(!news.some(x=>/BrainRot Society Remix|Légalize La Kalité Remix/.test(x.title)&&/arrive le 26 septembre|sortira le 26\/09\/2026/.test(x.title+x.text)));
for(const file of ['data.json','data/videos.json']){const before=JSON.parse(old(file)),after=json(file);for(const c of (file==='data.json'?before.videos:before))assert.deepEqual((file==='data.json'?after.videos:after).find(x=>x.youtubeId===c.youtubeId||x.id&&x.id===c.id),c,'Ancienne vidéo intacte');}
assert.equal(read('admin-440-mpbp-corp/auth.js'),old('admin-440-mpbp-corp/auth.js').replace('mpbp440.registry.firebase.v1.','mpbp440.registry.firebase.v2.'));
assert.equal(read('assets/js/mpbp440-firebase.js'),old('assets/js/mpbp440-firebase.js'));
for(const f of fs.readdirSync(path.join(root,'assets/css')).filter(x=>x.startsWith('v14-')))assert.equal(read('assets/css/'+f),old('assets/css/'+f));
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
for(const f of files.filter(f=>/\.(js|html)$/.test(f)&&!f.startsWith('tests/')&&!f.startsWith('supabase/')&&fs.existsSync(path.join(root,f))))assert.doesNotMatch(read(f),/eneuejomsrpdwvvpgvgl|mpbp440-supabase\.js/);
for(const cover of [prince.cover,bizz.cover,'assets/clips/sparetdee-simon/sous-le-meme-toit-version-long-poster.png'])assert.ok(fs.statSync(path.join(root,cover)).size>1000);
console.log('Content 2026-10-13: catalogues, dates, liens exacts, featured/latest, countdown, clips/artistes/news, anciens contenus et backend inchangés : PASS.');
