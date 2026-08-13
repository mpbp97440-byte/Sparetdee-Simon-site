/* CMS V2.1 visual layer.  It reuses the secured V2 editor state and never
   writes public data directly: drafts and publication stay in backoffice.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const lists = {
    track: () => currentTracks(), video: () => currentVideos(), artist: () => currentArtists(),
    gallery: () => currentGallery(), event: () => currentEvents(), news: () => currentNews(), upcoming: () => currentUpcoming()
  };
  const labels = {track:'Morceaux',video:'MPBP TV',artist:'Artistes',gallery:'Galerie',event:'Événements',news:'Actualités',upcoming:'Sorties'};
  const mediaPath = item => item.cover || item.poster || item.image || item.photo || '';
  const status = item => item.hidden ? 'Masqué' : item.status || item.category || item.type || 'Publié';
  const artist = item => item.artist || item.name || '';
  const date = item => item.date || item.datetime || '';
  const showTab = name => document.querySelector(`.tab[data-tab="${name}"]`)?.click();

  function card(type,item,index){
    const img=mediaPath(item);
    const available=type==='track' && /venir|bientot|bientôt/i.test(String(item.status||''));
    return `<article class="admin-content-card ${item.hidden?'is-hidden':''}" data-cms-card="${type}">
      <div class="admin-content-card__image">${img?`<img src="${esc(img.startsWith('http')?img:'../'+img.replace(/^\//,''))}" alt="" loading="lazy">`:'<span>MPBP440</span>'}</div>
      <div class="admin-content-card__body"><span class="status-pill">${esc(status(item))}</span><h3>${esc(item.title || item.name || 'Sans titre')}</h3><p>${esc(artist(item))}${date(item)?` · ${esc(date(item))}`:''}</p>
      <div class="admin-content-card__actions"><button class="btn ghost" data-visual-action="edit" data-type="${type}" data-index="${index}">Modifier</button><button class="btn ghost" data-visual-action="hide" data-type="${type}" data-index="${index}">${item.hidden?'Afficher':'Masquer'}</button><button class="btn ghost" data-visual-action="duplicate" data-type="${type}" data-index="${index}">Dupliquer</button>${available?`<button class="btn primary" data-visual-action="available" data-type="${type}" data-index="${index}">Marquer disponible</button>`:''}<button class="btn danger" data-visual-action="delete" data-type="${type}" data-index="${index}">Supprimer</button></div></div></article>`;
  }
  function controls(type){
    const artists=[...new Set(lists[type]().map(artist).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
    return `<div class="admin-collection-controls" data-controls="${type}"><input type="search" data-filter="search" placeholder="Rechercher dans ${labels[type].toLowerCase()}…" aria-label="Rechercher"><select data-filter="artist"><option value="">Tous les artistes</option>${artists.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select><select data-filter="status"><option value="">Tous les statuts</option><option>Disponible</option><option>À venir</option><option>Masqué</option></select><select data-filter="sort"><option value="date-desc">Plus récent</option><option value="date-asc">Date</option><option value="title">A–Z</option></select><button class="btn ghost" data-view="cards">Vue cartes</button><button class="btn ghost" data-view="list">Vue liste</button></div>`;
  }
  function renderCollection(type){
    const host=document.querySelector(`[data-visual-collection="${type}"]`); if(!host) return;
    const form=host.closest('.tabPanel')?.querySelector('.panel');
    const control=host.previousElementSibling;
    const filters=control ? Object.fromEntries([...control.querySelectorAll('[data-filter]')].map(node=>[node.dataset.filter,node.value])) : {};
    let items=lists[type]().map((item,index)=>({item,index})); const q=(filters.search||'').toLocaleLowerCase('fr');
    if(q) items=items.filter(({item})=>`${item.title||item.name||''} ${artist(item)} ${item.description||item.text||''}`.toLocaleLowerCase('fr').includes(q));
    if(filters.artist) items=items.filter(({item})=>artist(item)===filters.artist);
    if(filters.status) items=items.filter(({item})=>status(item)===filters.status);
    items.sort((a,b)=>filters.sort==='title'?String(a.item.title||a.item.name).localeCompare(String(b.item.title||b.item.name),'fr'):filters.sort==='date-asc'?String(date(a.item)).localeCompare(String(date(b.item))):String(date(b.item)).localeCompare(String(date(a.item))));
    host.innerHTML=items.length?items.map(({item,index})=>card(type,item,index)).join(''):`<p class="muted">Aucun contenu ne correspond à ces filtres.</p>`;
    if(form) form.querySelector('h2')?.setAttribute('tabindex','-1');
  }
  function installCollection(type,tab){
    const panel=$(`tab-${tab}`); if(!panel || panel.querySelector(`[data-visual-collection="${type}"]`)) return;
    const table=panel.querySelector('.table-wrap'); if(!table) return;
    table.classList.add('admin-list-view');
    table.insertAdjacentHTML('beforebegin',controls(type)+`<div class="admin-card-grid" data-visual-collection="${type}"></div>`);
    renderCollection(type);
  }
  function installTrackWizard(){
    const grid=$('trackTitle')?.closest('.form-grid'); if(!grid || $('trackFeaturing')) return;
    const artistLabel=$('trackArtist').closest('label');
    artistLabel.insertAdjacentHTML('afterend','<label>Featuring éventuel <input id="trackFeaturing" placeholder="Artiste invité"></label>');
    const input=$('trackStatus'); input.outerHTML='<label>Statut <select id="trackStatus"><option value="À venir">À venir</option><option value="Disponible">Disponible</option><option value="Masqué">Masqué</option></select></label>';
    $('trackTiktok').closest('label').insertAdjacentHTML('afterend','<label>Facebook <input id="trackFacebook" type="url" placeholder="https://…"></label><label>Autre lien <input id="trackOther" type="url" placeholder="https://…"></label>');
    const media=$('trackMedia'); media.closest('label').classList.add('cms-upload-label'); media.closest('label').insertAdjacentHTML('beforeend','<span class="cms-upload-hint">Glissez une pochette ici ou choisissez un fichier.</span><div class="cms-file-preview" data-preview-for="trackMedia"></div>');
    const panel=grid.closest('.panel'); panel.querySelector('h2').textContent='Assistant : ajouter un morceau';
    panel.querySelector('.actions')?.insertAdjacentHTML('afterbegin','<button class="btn primary" type="button" data-visual-action="new-track">+ Nouveau morceau</button>');
  }
  function setupDropzones(){
    document.querySelectorAll('input[type="file"]').forEach(input=>{
      const label=input.closest('label'); if(!label || label.dataset.dropReady) return; label.dataset.dropReady='1'; label.classList.add('cms-upload-label');
      label.addEventListener('dragover',event=>{event.preventDefault(); label.classList.add('is-dragging');});
      label.addEventListener('dragleave',()=>label.classList.remove('is-dragging'));
      label.addEventListener('drop',event=>{event.preventDefault(); label.classList.remove('is-dragging'); const file=event.dataTransfer.files?.[0]; if(!file) return; const transfer=new DataTransfer(); transfer.items.add(file); input.files=transfer.files; input.dispatchEvent(new Event('change',{bubbles:true}));});
      input.addEventListener('change',()=>{const preview=label.querySelector('[data-preview-for]') || (()=>{const node=document.createElement('span'); node.dataset.previewFor=input.id; node.className='cms-file-preview'; label.append(node); return node;})(); const file=input.files?.[0]; preview.textContent=file?`${file.name} · ${Math.ceil(file.size/1024)} Ko`:'Glissez votre fichier ici ou choisissez un fichier.';});
    });
  }
  function renderMedia(){
    const root=$('mediaLibrary'); if(!root || !state.ready) return;
    const refs=new Map(); const walk=(value,owner)=>{ if(typeof value==='string' && /^(assets\/|https:\/\/)/.test(value)){const entry=refs.get(value)||{count:0,owners:[]};entry.count++;entry.owners.push(owner);refs.set(value,entry);}else if(Array.isArray(value))value.forEach(item=>walk(item,owner));else if(value&&typeof value==='object')Object.values(value).forEach(item=>walk(item,owner));};
    Object.entries(state.data).forEach(([owner,value])=>walk(value,owner)); state.media.forEach((_,path)=>{if(!refs.has(path))refs.set(path,{count:0,owners:['brouillon local']});});
    root.innerHTML=[...refs.entries()].map(([path,info])=>`<article class="admin-media-card"><div>${/\.(png|jpe?g|webp)$/i.test(path)?`<img src="${esc(path.startsWith('http')?path:'../'+path)}" alt="">`:'<span>MEDIA</span>'}</div><strong>${esc(path.split('/').pop())}</strong><small>${info.count} contenu(s) : ${esc([...new Set(info.owners)].join(', '))}</small><div class="actions"><button class="btn ghost" data-copy-url="${esc(path)}">Copier URL</button><a class="btn ghost" href="${esc(path.startsWith('http')?path:'../'+path)}" target="_blank" rel="noopener">Voir</a><button class="btn danger" disabled title="Ce média est référencé par ${info.count} contenu(s)">Supprimer</button></div></article>`).join('') || '<p class="muted">Aucun média référencé.</p>';
  }
  function previewModal(){
    const featured=state.data.site.featured||{}; const cardHtml=card('track',featured,0); openModal('Aperçu interne',`<p>Ce rendu utilise uniquement le brouillon local ; aucun commit ne sera créé.</p><div class="admin-card-grid">${cardHtml}</div>`);
  }
  function openModal(title,html){
    let modal=$('cmsVisualModal'); if(!modal){modal=document.createElement('dialog');modal.id='cmsVisualModal';modal.className='cms-modal';document.body.append(modal);}
    modal.innerHTML=`<article><button class="cms-modal__close" aria-label="Fermer">×</button><h2>${esc(title)}</h2><div>${html}</div></article>`; modal.querySelector('button').addEventListener('click',()=>modal.close()); modal.showModal();
  }
  function bind(){
    document.body.addEventListener('input',event=>{const type=event.target.closest('[data-controls]')?.dataset.controls;if(type)renderCollection(type);});
    document.body.addEventListener('change',event=>{const type=event.target.closest('[data-controls]')?.dataset.controls;if(type)renderCollection(type);});
    document.body.addEventListener('click',async event=>{
      const button=event.target.closest('[data-visual-action]'); if(button){const {visualAction:action,type,index}=button.dataset;
        if(action==='edit'){editItem(type,Number(index)); showTab(({track:'tracks',video:'tv',artist:'artists',gallery:'gallery',event:'events',news:'news',upcoming:'upcoming'})[type]);}
        if(action==='hide')hideItem(type,Number(index)); if(action==='delete')deleteItem(type,Number(index));
        if(action==='duplicate'){const source=clone(lists[type]()[Number(index)]); source.id=source.id?`${source.id}-copie`:undefined; source.title=`${source.title || source.name} (copie)`; lists[type]().unshift(source); markChanged(`${source.title} : dupliqué`);}
        if(action==='available')markTrackAvailable(Number(index)); if(action==='new-track'){clearTrack(); $('trackTitle')?.focus();}
        return;
      }
      const view=event.target.closest('[data-view]'); if(view){const type=view.closest('[data-controls]').dataset.controls; const host=document.querySelector(`[data-visual-collection="${type}"]`); host.hidden=view.dataset.view==='list'; host.parentElement.querySelector('.table-wrap')?.classList.toggle('is-visible',view.dataset.view==='list');}
      const copy=event.target.closest('[data-copy-url]'); if(copy){await navigator.clipboard?.writeText(copy.dataset.copyUrl); copy.textContent='URL copiée';}
    });
    $('previewChangesBtn')?.addEventListener('click',previewModal);
  }
  function init(){
    installTrackWizard(); [['track','tracks'],['video','tv'],['artist','artists'],['gallery','gallery'],['event','events'],['news','news'],['upcoming','upcoming']].forEach(([type,tab])=>installCollection(type,tab));
    if(!$('tab-media')){document.querySelector('.tabs')?.insertAdjacentHTML('beforeend','<button class="tab" data-tab="media">Médiathèque</button>'); document.querySelector('.admin-page')?.insertAdjacentHTML('beforeend','<section class="tabPanel" id="tab-media"><article class="panel"><h2>Médiathèque</h2><div id="mediaLibrary" class="admin-card-grid"></div></article></section>');}
    setupDropzones(); renderMedia(); bind();
    document.addEventListener('mpbp-cms-changed',()=>{Object.keys(lists).forEach(renderCollection);renderMedia();});
  }
  document.addEventListener('mpbp-admin-ready',init,{once:true});
})();
