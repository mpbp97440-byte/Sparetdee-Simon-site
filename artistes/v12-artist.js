(() => {
  const config = {
    sparetdee:{clip:'../mpbp-tv/index.html#clip-dois-je-me-taire',clipTitle:'Dois-je me taire ?',poster:'../assets/clips/sparetdee-simon/dois-je-me-taire-cover.png',gallery:['../assets/artists/sparetdee-simon.webp','../assets/covers/le-systeme-pre-sortie-27-06-2026.webp']},
    jup:{clip:'../mpbp-tv/index.html#clip-je-sais-que-tu-sais',clipTitle:'Je sais que tu sais',poster:'../assets/covers/je-sais-juste-une-plume.webp',gallery:['../assets/artists/juste-une-plume.webp','../assets/events/je-sais-sortie-officielle.webp']},
    makeda:{clip:'../mpbp-tv/index.html#clip-j-existe',clipTitle:'J’existe',poster:'../assets/clips/makeda-muse/j-existe-cover.png',gallery:['../assets/makeda-muse/makeda-muse-profile.png','../assets/releases/makeda-muse/jour-de-pluie-pochette-officielle.png']}
  };
  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const labels = {spotify:'Spotify',deezer:'Deezer',apple:'Apple Music',youtube:'YouTube Music',tiktok:'TikTok',facebook:'Facebook'};
  document.addEventListener('DOMContentLoaded', async () => {
    const key = document.body.dataset.artistKey, artist = document.body.dataset.artist, details = config[key];
    if (!details) return;
    const main = document.querySelector('.artist-page');
    try {
      const releases = await fetch('../data/releases.json', {cache:'no-store'}).then(response => response.json());
      const artistReleases = releases.filter(item => item.artist === artist);
      const available = artistReleases.filter(item => item.status === 'Disponible').sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
      const newest = available[0];
      if (newest && !main.querySelector('.v12-latest-artist-release')) {
        const section = document.createElement('section'); section.className = 'section v12-latest-artist-release';
        const history = available.slice(1, 3).map(item => `<article class="release-card-artist release-card-artist--history"><img src="../${escape(item.promoCover || item.cover)}" alt="${escape(item.title)} — disponible maintenant" loading="lazy"><div><p>Sortie précédente disponible</p><h3>${escape(item.title)}</h3><p>${escape(item.description || '')}</p><div class="release-links">${Object.entries(item.links || {}).filter(([,url]) => url).map(([name,url]) => `<a class="btn ghost small" target="_blank" rel="noopener" href="${escape(url)}">${labels[name] || escape(name)}</a>`).join('')}</div></div></article>`).join('');
        section.innerHTML = `<p class="sup">Dernières sorties</p><h2>${escape(newest.title)}</h2><article class="release-card-artist"><img src="../${escape(newest.promoCover || newest.cover)}" alt="${escape(newest.title)} — disponible maintenant" loading="lazy"><div><p>${escape(newest.status || 'Sortie officielle')}</p><p>${escape(newest.description || '')}</p><div class="release-links">${Object.entries(newest.links || {}).filter(([,url]) => url).map(([name,url]) => `<a class="btn ghost small" target="_blank" rel="noopener" href="${escape(url)}">${labels[name] || escape(name)}</a>`).join('')}</div></div></article>${history ? `<div class="v12-artist-release-history"><p class="sup">Sorties récentes</p>${history}</div>` : ''}`;
        main.querySelector('.hero')?.insertAdjacentElement('afterend', section);
      }
    } catch (error) { console.warn('Dernière sortie artiste indisponible.', error); }
    const media = document.createElement('section'); media.className = 'section v12-artist-gallery';
    media.innerHTML = `<p class="sup">Clips et galerie</p><h2>L’univers visuel</h2><div class="v12-artist-media"><a href="${details.clip}"><img src="${details.poster}" alt="Poster ${details.clipTitle}" loading="lazy"><span>Voir le clip · ${details.clipTitle}</span></a>${details.gallery.map((src,index) => `<a href="../galerie/index.html"><img src="${src}" alt="Visuel officiel ${escape(artist)}" loading="lazy"><span>${index ? 'Explorer la galerie' : 'Profil officiel'}</span></a>`).join('')}</div></section>`;
    const platforms = document.createElement('section'); platforms.className = 'section';
    platforms.innerHTML = `<p class="sup">Liens officiels</p><h2>Écouter et suivre</h2><div class="v12-artist-platforms"><a href="../music/index.html#morceaux">Music Hub MPBP440</a><a href="${details.clip}">MPBP TV</a></div>`;
    main.append(media, platforms);
  }, {once:true});
})();
