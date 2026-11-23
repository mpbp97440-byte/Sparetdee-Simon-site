// Reuse the original CMS hardening suite with its intended missing-link fixture.
// BrainRot now has owner-supplied links; remove them only in this in-memory test fixture.
// Neither the original test file nor any public catalogue is modified by this adapter.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const test=path.resolve(__dirname,'../tests/release-hardening.test.js');
let source=fs.readFileSync(test,'utf8');
const marker="  const id = 'juste-une-plume-petit-demon';";
if(!source.includes(marker))throw Error('Inspect updated original test before adapting its fixture.');
source=source.replace(marker,"  original.site.tracks.find(item=>item.id==='brainrot-society-remix').links={};\n"+marker);
// The October published-content snapshot intentionally differs from the owner's new links.
// Execute its behavior suites here; tools/v15-update-checks.py checks the new public data.
source=source.replace('\nrunPublishedContentTests();','\n// Historical published-content snapshot is reported separately.');
source=source.replace("console.log('release-hardening: all assertions passed');","console.log('PASS original CMS and renderer behavior suites with explicit fixture; October snapshot not executed by this adapter.');");
vm.runInNewContext(source,{require:createRequire(test),__dirname:path.dirname(test),__filename:test,console,process,Buffer,URL,Blob,TextEncoder},{filename:'original-hardening-with-explicit-unlinked-fixture.js'});
