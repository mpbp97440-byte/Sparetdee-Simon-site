(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-v12-header], .site-header, .v12-content-header, .artist-page > .top');
  const measureHeader = () => {
    if (!header) return;
    document.documentElement.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
  };
  if (header) { new ResizeObserver(measureHeader).observe(header); measureHeader(); }
  document.fonts?.ready.then(measureHeader);
  addEventListener('resize', measureHeader, { passive: true });

  const mediaSelector = '.time-card > img, .release-card-artist > img, .makeda-release-card > img, .makeda-clip-card > img, .v12-artists-hall > img, #tracks .card > img';
  function hydrate(root) {
    const elements = root.querySelectorAll ? [...root.querySelectorAll(mediaSelector)] : [];
    if (root.matches?.(mediaSelector)) elements.push(root);
    elements.forEach(image => {
      if (image.closest('.v14-media-stage')) return;
      const stage = document.createElement('div');
      stage.className = 'v14-media-stage';
      image.before(stage); stage.append(image); image.classList.add('v14-artwork');
    });
    root.querySelectorAll?.('.v14-media-stage, .v14-artwork-frame').forEach(stage => {
      const image = stage.querySelector('img');
      if (!image) return;
      const update = () => {
        const src = image.currentSrc || image.src;
        stage.style.setProperty('--v14-artwork', `url("${src.replace(/"/g, '\\"')}")`);
        if (image.naturalWidth) stage.dataset.mediaRatio = (image.naturalWidth / image.naturalHeight).toFixed(3);
      };
      if (image.complete) update(); else image.addEventListener('load', update, { once:true });
    });
    root.querySelectorAll?.('.time-card .miniCountdown.is-available').forEach(timer => {
      timer.hidden = true;
      const status = timer.parentElement.querySelector('.countdownStatus');
      const message = 'Date annoncée passée · disponibilité à confirmer';
      if (status && status.textContent !== message) status.textContent = message;
    });
  }
  hydrate(document);
  let scheduled = false;
  const sync = () => {
    scheduled = false; hydrate(document); syncTvBackdrop();
    const bio = document.getElementById('artist-bio');
    const artistHero = document.querySelector('.artist-page .hero');
    if (bio && artistHero && !artistHero.contains(bio)) artistHero.prepend(bio);
    const nav = document.querySelector('.v14-artist-nav');
    if (nav && artistHero?.nextElementSibling !== nav) artistHero?.after(nav);
    const dock = document.getElementById('mpbpAudioControl');
    const footer = document.querySelector('body > footer');
    if (dock && footer && dock.nextElementSibling !== footer) footer.before(dock);
  };
  new MutationObserver(records => {
    if (scheduled || !records.some(record => record.addedNodes.length)) return;
    scheduled = true; requestAnimationFrame(sync);
  }).observe(document.body, { subtree:true, childList:true });

  const tvPanel = document.getElementById('mpbp-tv-player');
  const tvLibrary = document.getElementById('v13TvLibrary');
  function syncTvBackdrop() {
    const active = tvLibrary?.querySelector('[aria-current="true"] img, [aria-pressed="true"] img');
    const src = active?.currentSrc || active?.src || document.getElementById('v13YoutubePoster')?.src;
    if (tvPanel && src) tvPanel.style.setProperty('--v14-tv-backdrop', `url("${src.replace(/"/g, '\\"')}")`);
  }
  if (tvLibrary) new MutationObserver(syncTvBackdrop).observe(tvLibrary,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-current','aria-pressed']});
  syncTvBackdrop();
  addEventListener('load', sync, { once:true });

  const eventDate = document.getElementById('v14EventDate');
  if (eventDate) fetch(new URL('../data/events.json', document.baseURI), { cache:'no-store' }).then(response=>response.json()).then(events=>{
    const event = events.find(item => item.cover && document.querySelector('#roots-live-25-07-2026 img')?.src.endsWith(item.cover));
    if (!event) return;
    const date = new Date(event.datetime);
    if (Number.isNaN(date.getTime())) return;
    const parts = [date.toLocaleDateString('fr-FR',{day:'2-digit',timeZone:event.timezone || 'Europe/Paris'}),date.toLocaleDateString('fr-FR',{month:'short',timeZone:event.timezone || 'Europe/Paris'}),date.toLocaleDateString('fr-FR',{year:'numeric',timeZone:event.timezone || 'Europe/Paris'})];
    eventDate.replaceChildren(...parts.map((part,index)=>{const node=document.createElement(['strong','span','small'][index]);node.textContent=part;return node;}));
    if (date.getTime() < Date.now()) document.querySelector('#roots-live-25-07-2026 .sup').textContent='Archive événement';
  }).catch(()=>{});

  if (!reduced && matchMedia('(pointer:fine)').matches) {
    const hero = document.querySelector('.v14-hero-emblem');
    hero?.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      hero.style.transform = `perspective(1600px) rotateY(${((event.clientX - rect.left) / rect.width - .5) * 2}deg)`;
    }, { passive:true });
    hero?.addEventListener('pointerleave', () => { hero.style.transform = ''; });
    document.querySelectorAll('.v12-clip, .v12-artists-grid a, .v12-feature, .v14-hero-portrait').forEach(card => {
      card.style.transition = 'transform .3s ease, box-shadow .3s ease';
      card.addEventListener('pointerenter', () => { card.style.transform = 'translateY(-3px)'; });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }
})();
