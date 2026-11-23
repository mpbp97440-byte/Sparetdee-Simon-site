/* Local review content only. No remote publication, authentication or payment. */
(() => {
  'use strict';
  const script=document.currentScript;
  const base=new URL('.',script.src);
  const draftKey='mpbp440.v15.engineering.review.r2';
  const local=['127.0.0.1','localhost','::1'].includes(location.hostname);
  const categories={software:'Logiciels & applications',agent:'Agents IA',game:'MPBP Game Studio',module:'Modules',service:'Services',plan:'Formules',demo:'Démonstrations','technical-news':'Actualités techniques'};
  let catalog,schema,selected=0,demoCategory='all';
  const $=s=>document.querySelector(s);
  const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
  const urlSafe=value=>{if(typeof value!=='string'||!value.trim())return false;try{const u=new URL(value,base);return ['https:','mailto:'].includes(u.protocol)||(u.origin===location.origin&&u.protocol===location.protocol&&!value.startsWith('//'));}catch{return false;}};
  function valid(value,rule,path='$'){
    const type={object:v=>v!==null&&typeof v==='object'&&!Array.isArray(v),array:Array.isArray,string:v=>typeof v==='string',null:v=>v===null,boolean:v=>typeof v==='boolean',number:v=>typeof v==='number'&&Number.isFinite(v),integer:Number.isInteger};
    const assert=(condition,label)=>{if(!condition)throw new Error(path+' : '+label);};
    if(rule.type){const types=Array.isArray(rule.type)?rule.type:[rule.type];assert(types.some(t=>type[t](value)),'type invalide');}
    if(rule.enum)assert(rule.enum.includes(value),'valeur non autorisée');
    if(value&&typeof value==='object'&&!Array.isArray(value)){
      for(const key of rule.required||[])assert(Object.hasOwn(value,key),'champ requis '+key);
      for(const [key,entry]of Object.entries(value)){if(rule.additionalProperties===false)assert(Object.hasOwn(rule.properties,key),'champ inconnu '+key);if(rule.properties?.[key])valid(entry,rule.properties[key],path+'.'+key);}
    }
    if(Array.isArray(value))value.forEach((entry,i)=>valid(entry,rule.items,path+'['+i+']'));
    if(typeof value==='string'){
      if(rule.pattern)assert(new RegExp(rule.pattern).test(value),'format invalide');
      if(rule.minLength!==undefined)assert(value.length>=rule.minLength,'texte trop court');
      if(rule.maxLength!==undefined)assert(value.length<=rule.maxLength,'texte trop long');
      if(rule.format==='date'){const parsed=new Date(value+'T00:00:00Z');assert(/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value,'date invalide');}
    }
    if(typeof value==='number'&&rule.minimum!==undefined)assert(value>=rule.minimum,'nombre trop petit');
  }
  function validate(data){
    valid(data,schema);
    if(data.items.length<1||data.items.length>200)throw new Error('Le catalogue doit contenir entre 1 et 200 fiches.');
    for(const field of ['id','slug'])if(new Set(data.items.map(i=>i[field])).size!==data.items.length)throw new Error('Chaque '+field+' doit être unique.');
    for(const item of data.items){
      if(item.pricing.enabled)throw new Error('Les ventes sont désactivées pour cette version.');
      if(item.cta.kind==='purchase')throw new Error('Aucun lien d’achat autorisé.');
      if(item.public&&(!item.verification.content||!item.summary.trim()))throw new Error(item.name+' : vérifier les informations et renseigner le résumé avant affichage.');
      if(item.cta.kind!=='none'&&!urlSafe(item.cta.url))throw new Error(item.name+' : URL d’accès non autorisée.');
      if(item.cta.kind==='none'&&item.cta.url!==null)throw new Error(item.name+' : retirer l’URL si aucun accès n’est prévu.');
      if(['demo','play','download'].includes(item.cta.kind)&&(!item.cta.verified||!item.verification.access))throw new Error(item.name+' : accès non vérifié.');
      if(item.demoVideo&&!urlSafe(item.demoVideo))throw new Error(item.name+' : URL vidéo invalide.');
      if(item.demoVideo&&!item.demoVideo.startsWith('https://'))throw new Error('La vidéo doit utiliser HTTPS.');
    }
    return data;
  }
  function displayed(){return catalog.items.filter(i=>i.public&&i.status!=='Retiré').sort((a,b)=>a.order-b.order);}
  function link(label,path,className){const a=el('a',label,className);a.href=new URL(path,base).href;return a;}
  function publicCard(item,demo=false){
    const card=el('article',undefined,'public-item'),copy=el('div');copy.append(el('p',categories[item.category]||item.category,'eyebrow'),el('h3',item.name),el('p',item.summary));
    if(demo){const isVideo=!['demo','play'].includes(item.cta.kind);const target=isVideo?item.demoVideo:item.cta.url;const action=link(isVideo?'Voir la présentation':item.cta.kind==='play'?'Accéder au jeu':'Ouvrir la démonstration',target,'button secondary');action.target='_blank';action.rel='noopener noreferrer';copy.append(el('p',item.limitations.join(' · ')||'Consulter les conditions et prérequis de la fiche.','editorial-note'));card.append(copy,action);}
    else{copy.append(el('p','Vente non ouverte','editorial-note'));card.append(copy,link('Consulter le projet','projets/'+item.slug+'.html','button secondary'));}
    return card;
  }
  function renderProjects(){
    const list=$('[data-project-list]');if(!list)return;list.replaceChildren();
    for(const item of displayed()){
      const row=el('article',undefined,'project-row');row.dataset.product='';row.dataset.category=item.category;
      const content=el('div');content.append(el('h3',item.name),el('p',item.summary));
      const action=link('Voir le projet','projets/'+item.slug+'.html');action.setAttribute('aria-label','Découvrir '+item.name);
      const image=item.images.find(image=>urlSafe(image.src));
      if(image){const preview=el('img',undefined,'project-preview');preview.src=new URL(image.src,base).href;preview.alt=image.alt;preview.loading='lazy';preview.decoding='async';row.classList.add('has-screenshot');row.append(preview);}
      row.append(el('div',categories[item.category]||item.category,'project-category'),content,el('span',item.status||'Informations à venir','project-status'),action);list.append(row);
    }
    $('#catalog-search')?.dispatchEvent(new Event('input'));
  }
  function renderStore(){const list=$('[data-store-list]');if(!list)return;const items=displayed().filter(i=>['software','agent','game','module','plan'].includes(i.category));if(items.length){list.replaceChildren(...items.map(i=>publicCard(i)));} }
  const normalized=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function renderDemos(){
    const list=$('[data-demo-list]');if(!list)return;
    const query=normalized($('#demo-search')?.value||'');
    const entries=displayed().filter(i=>i.verification.access&&(i.demoVideo||(['demo','play'].includes(i.cta.kind)&&i.cta.verified))).filter(i=>(demoCategory==='all'||i.category===demoCategory)&&normalized(i.name+' '+i.summary).includes(query));
    $('#demo-count').textContent=entries.length+' démonstration'+(entries.length===1?'':'s')+' disponible'+(entries.length===1?'':'s');
    if(entries.length)list.replaceChildren(...entries.map(i=>publicCard(i,true)));
    else{const empty=el('div',undefined,'store-empty');empty.append(el('span','▷','demo-glyph'),el('h3','Aucune démonstration publique vérifiée pour cette sélection.'),el('p','Les premiers essais d’applications, d’agents IA et de jeux seront proposés ici avec leurs liens officiels.'),link('Découvrir les projets','engineering.html#projets','button secondary'));list.replaceChildren(empty);}
  }
  function message(text,error=false){const m=$('#editor-message');if(m){m.textContent=text;m.style.color=error?'#ffc2ac':'#b9c8cd';}}
  function save(){validate(catalog);if(!local)throw new Error('Édition disponible uniquement sur le serveur local de revue.');localStorage.setItem(draftKey,JSON.stringify(catalog));}
  function renderEditor(){
    const list=$('#editor-items');if(!list)return;
    list.replaceChildren();catalog.items.forEach((item,index)=>{const button=el('button',undefined,'editor-item');button.type='button';button.setAttribute('aria-pressed',String(index===selected));button.append(el('span',item.name||'Nouvelle fiche'),el('small',item.public?'Affichée dans le catalogue préparé':'Masquée / brouillon'));button.addEventListener('click',()=>{selected=index;renderEditor();});list.append(button);});
    const item=catalog.items[selected],form=$('#editor-form');
    for(const name of ['name','id','slug','category','summary','description','status','version','updatedAt','license','order','demoVideo'])form.elements.namedItem(name).value=item[name]??'';
    for(const name of ['features','platforms'])form.elements.namedItem(name).value=item[name].join('\n');
    form.elements.ctaKind.value=item.cta.kind;form.elements.ctaUrl.value=item.cta.url||'';
    form.elements.contentVerified.checked=item.verification.content;form.elements.accessVerified.checked=item.verification.access;form.elements.public.checked=item.public;
  }
  function collectForm(){
    const form=$('#editor-form'),previous=catalog.items[selected],item=structuredClone(previous),get=name=>form.elements.namedItem(name).value.trim();
    for(const name of ['name','id','slug','category','summary','description'])item[name]=get(name);
    for(const name of ['status','version','updatedAt','license','demoVideo'])item[name]=get(name)||null;
    for(const name of ['features','platforms'])item[name]=get(name).split('\n').map(x=>x.trim()).filter(Boolean);
    item.order=Number(get('order'));item.public=form.elements.public.checked;
    item.verification.content=form.elements.contentVerified.checked;item.verification.access=form.elements.accessVerified.checked;
    item.cta={kind:get('ctaKind'),url:get('ctaUrl')||null,verified:form.elements.accessVerified.checked};
    if(item.verification.content)item.verification.checkedAt=new Date().toISOString().slice(0,10);
    if(item.id!==previous.id&&previous.verification.content)throw new Error('L’identifiant stable d’une fiche existante ne peut pas être changé.');
    if(item.slug!==previous.slug&&previous.verification.content)throw new Error('Le slug d’une fiche existante est conservé pour préserver ses liens.');
    const next=structuredClone(catalog);next.items[selected]=item;validate(next);return next;
  }
  function installEditor(){
    const form=$('#editor-form');if(!form)return;
    if(!local){form.querySelectorAll('input,select,textarea,button').forEach(n=>n.disabled=true);message('Ouvrir cet outil sur localhost pour préparer les contenus.',true);return;}
    renderEditor();message('Catalogue chargé. Brouillons locaux uniquement ; aucune publication distante.');
    form.addEventListener('submit',event=>{event.preventDefault();try{catalog=collectForm();save();renderEditor();message('Brouillon enregistré sur cet appareil. Exporter puis régénérer les pages pour conserver la mise à jour dans les sources.');}catch(error){message(error.message,true);}});
    $('#editor-add').addEventListener('click',()=>{const item=structuredClone(catalog.items[0]);let suffix=1;while(catalog.items.some(i=>i.id==='mpbp-nouveau-projet-'+suffix))suffix++;Object.assign(item,{id:'mpbp-nouveau-projet-'+suffix,slug:'nouveau-projet-'+suffix,name:'Nouveau projet',category:'software',summary:'',description:'',images:[],features:[],limitations:[],useCases:[],platforms:[],requirements:[],hosting:null,status:null,version:null,updatedAt:null,changelog:[],documentation:[],license:null,demoVideo:null,public:false,order:catalog.items.length});item.cta={kind:'none',url:null,verified:false};item.pricing={model:'unconfirmed',amount:null,currency:null,taxInformation:null,enabled:false};item.verification={content:false,access:false,commercial:false,checkedAt:null,source:null};catalog.items.push(item);selected=catalog.items.length-1;renderEditor();message('Nouvelle fiche en brouillon. Renseigner puis enregistrer.');});
    $('#catalog-import').addEventListener('change',async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>2*1024*1024)throw new Error('Catalogue limité à 2 Mio.');const candidate=JSON.parse(await file.text());validate(candidate);if(!candidate.items.length)throw new Error('Conserver au moins une fiche dans ce catalogue de préparation.');catalog=candidate;selected=0;save();renderEditor();message('Catalogue importé et validé localement. Aucune donnée distante modifiée.');}catch(error){message(error.message,true);}});
    $('#catalog-export').addEventListener('click',()=>{try{catalog=collectForm();save();const blob=new Blob([JSON.stringify(catalog,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='engineering.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Catalogue exporté. Copier le fichier dans les sources puis régénérer ; rien n’a été publié.');}catch(error){message(error.message,true);}});
  }
  async function start(){
    if(!document.querySelector('[data-project-list],[data-store-list],[data-demo-list],#editor-form'))return;
    try{
      const [data,contract]=await Promise.all(['data/engineering.json','data/catalogue.schema.json'].map(path=>fetch(new URL(path,base),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Catalogue indisponible : '+r.status);return r.json();})));
      schema=contract;catalog=validate(data);
      if(local){try{const draft=localStorage.getItem(draftKey);if(draft)catalog=validate(JSON.parse(draft));}catch{message('Brouillon local invalide ignoré ; catalogue source chargé.',true);}}
      renderProjects();renderStore();renderDemos();installEditor();
      document.querySelectorAll('[data-demo-filter]').forEach(button=>button.addEventListener('click',()=>{demoCategory=button.dataset.demoFilter;document.querySelectorAll('[data-demo-filter]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));renderDemos();}));
      $('#demo-search')?.addEventListener('input',renderDemos);
    }catch(error){message(error.message,true);const target=$('#catalog-count')||$('#demo-count');if(target)target.textContent='Contenu indisponible : '+error.message;}
  }
  start();
})();
