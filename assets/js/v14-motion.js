(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-v12-header], .topbar, .site-header');
  const compactHeader = () => header?.classList.toggle('is-compact', scrollY > 28);
  compactHeader();
  addEventListener('scroll', compactHeader, { passive: true });

  const revealTargets = document.querySelectorAll(
    '.v12-home-section, .v12-latest-release__lead, .v12-feature, .v12-upcoming-card, .v12-news-card, .v12-clip, .v12-artists-grid > *, .artist-page > .section, .v12-content-section, .musicPage > .section, .tvPage > .section'
  );
  if (reduced || !('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('is-visible'));
  } else {
    revealTargets.forEach(element => element.classList.add('v14-reveal'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealTargets.forEach(element => observer.observe(element));
  }

  const hero = document.querySelector('.v12-home-hero');
  if (hero && !reduced && matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('pointermove', event => {
      const x = (event.clientX / innerWidth - .5) * 10;
      const y = (event.clientY / innerHeight - .5) * 8;
      hero.style.setProperty('--v14-hero-x', `${x}px`);
      hero.style.setProperty('--v14-hero-y', `${y}px`);
      const logo = hero.querySelector('.v12-home-hero__logo');
      if (logo) logo.style.translate = `${x * -.45}px ${y * -.45}px`;
    }, { passive: true });
  }

  const tvPanel = document.getElementById('mpbp-tv-player');
  const tvLibrary = document.getElementById('v13TvLibrary');
  const syncTvBackdrop = () => {
    const active = tvLibrary?.querySelector('[aria-current="true"] img');
    const source = active?.currentSrc || active?.src;
    if (tvPanel && source) tvPanel.style.setProperty('--v14-tv-backdrop', `url("${source.replace(/"/g, '\\"')}")`);
  };
  if (tvLibrary && tvPanel) {
    new MutationObserver(syncTvBackdrop).observe(tvLibrary, { subtree: true, attributes: true, childList: true });
    syncTvBackdrop();
  }
})();
