// Reuse the unmodified V14 visual assertions at the explicitly relocated musical home.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');const native=fs.readFileSync.bind(fs);
const adaptedFs={...fs,readFileSync(file,...args){return native(path.resolve(String(file))===path.join(root,'index.html')?path.join(root,'musique/index.html'):file,...args);}};
const requireAdapted=id=>id==='node:fs'?adaptedFs:require(id);
vm.runInNewContext(native(path.join(root,'tests/v14-visual-layer.test.js'),'utf8'),{require:requireAdapted,__dirname:path.join(root,'tests'),console},{filename:'unmodified-v14-visual-layer-at-musique.js'});
