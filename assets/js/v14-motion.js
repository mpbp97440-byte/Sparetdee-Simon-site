(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-v12-header], .topbar, .site-header');
  const compactHeader = () => header?.classList.toggle('is-compact', scrollY > 28);
  compactHeader(); addEventListener('scroll', compactHeader, { passive: true });

  const hydrateArtwork = root => {
    root.querySelectorAll?.('.v14-artwork-frame').forEach(frame => {
      const image = frame.querySelector('img');
      const source = image?.currentSrc || image?.src;
      if (source) frame.style.setProperty('--v14-artwork', `url("${source.replace(/"/g, '\\"')}")`);
    });
  };
  hydrateArtwork(document);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === 1) hydrateArtwork(node.matches?.('.v14-artwork-frame') ? node.parentElement : node);
  }))).observe(document.body, { childList: true, subtree: true });

  const reveal = root => {
    const targets = root.querySelectorAll?.('.v12-home-section, .v12-latest-release__lead, .v12-feature, .v12-upcoming-card, .v12-news-card, .v12-clip, .v12-artists-grid > *, .artist-page > .section, .tvPage > .section') || [];
    if (reduced || !('IntersectionObserver' in window)) return targets.forEach(element => element.classList.add('is-visible'));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -7% 0px', threshold: .06 });
    targets.forEach(element => { if (element.dataset.v14Reveal) return; element.dataset.v14Reveal = '1'; element.classList.add('v14-reveal'); observer.observe(element); });
  };
  reveal(document);

  const hero = document.querySelector('.v12-home-hero');
  if (hero && !reduced && matchMedia('(pointer:fine)').matches) hero.addEventListener('pointermove', event => {
    hero.style.setProperty('--v14-hero-x', `${(event.clientX / innerWidth - .5) * 12}px`);
    hero.style.setProperty('--v14-hero-y', `${(event.clientY / innerHeight - .5) * 8}px`);
  }, { passive: true });

  if (!reduced && matchMedia('(pointer:fine)').matches) document.addEventListener('pointermove', event => {
    const card = event.target.closest('.v12-upcoming-card, .v12-artists-grid > a, .v12-gallery-item');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--v14-tilt-x', `${((event.clientY - rect.top) / rect.height - .5) * -2}deg`);
    card.style.setProperty('--v14-tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 2}deg`);
  }, { passive: true });

  const tvPanel = document.getElementById('mpbp-tv-player');
  const tvLibrary = document.getElementById('v13TvLibrary');
  const syncTvBackdrop = () => {
    const active = tvLibrary?.querySelector('[aria-current="true"] img');
    const source = active?.currentSrc || active?.src;
    if (tvPanel && source) tvPanel.style.setProperty('--v14-tv-backdrop', `url("${source.replace(/"/g, '\\"')}")`);
  };
  if (tvLibrary && tvPanel) { new MutationObserver(syncTvBackdrop).observe(tvLibrary, { subtree:true, attributes:true, childList:true }); syncTvBackdrop(); }
})();
