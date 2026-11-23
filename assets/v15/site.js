(() => {
  'use strict';
  const toggle=document.querySelector('.menu'), nav=document.querySelector('#navigation');
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});
  nav?.addEventListener('click',event=>{if(event.target.closest('a')){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');}});
  let category='all';const search=document.querySelector('#catalog-search');
  function filter(){let count=0;const query=(search?.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();document.querySelectorAll('[data-product]').forEach(card=>{const text=card.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();card.hidden=!(category==='all'||card.dataset.category===category)||!text.includes(query);if(!card.hidden)count++;});const result=document.querySelector('#catalog-count');if(result)result.textContent=count+' projet'+(count===1?'':'s')+' affiché'+(count===1?'':'s');const empty=document.querySelector('#catalog-empty');if(empty)empty.hidden=count>0;}
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));filter();}));
  search?.addEventListener('input',filter);
  if(search)filter();
})();
