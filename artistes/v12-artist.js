(() => {
  const config = {
    sparetdee:{clip:'../mpbp-tv/index.html#clip-mon-influence',clipTitle:'Mon Influence',poster:'../assets/clips/sparetdee-simon/sparetdee-simon-feat-makeda-muse-mon-influence-clip-exclusif.png',gallery:['../assets/artists/sparetdee-simon.webp','../assets/covers/le-systeme-pre-sortie-27-06-2026.webp']},
    jup:{clip:'../mpbp-tv/index.html#clip-je-sais-que-tu-sais',clipTitle:'Je sais que tu sais',poster:'../assets/covers/je-sais-juste-une-plume.webp',gallery:['../assets/artists/juste-une-plume.webp','../assets/events/je-sais-sortie-officielle.webp']},
    makeda:{clip:'../mpbp-tv/index.html#clip-j-existe',clipTitle:'J’existe',poster:'../assets/clips/makeda-muse/j-existe-cover.png',gallery:['../assets/makeda-muse/makeda-muse-profile.png','../assets/releases/makeda-muse/sixieme-sens-pochette-officielle.png']}
  };
  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const artistMediaUrl = value => /^(https?:|data:|blob:)/i.test(String(value || '')) ? String(value) : `../${String(value || '').replace(/^\.\.\//,'')}`;
  const releaseDate = value => {
    const raw=String(value||'').trim(); let match=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/); let year,month,day;
    if(match){[,year,month,day]=match;}else{match=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(!match)return new Date(raw);[,day,month,year]=match;}
    const parsed=new Date(Number(year),Number(month)-1,Number(day));
    return parsed.getFullYear()===Number(year)&&parsed.getMonth()===Number(month)-1&&parsed.getDate()===Number(day)?parsed:new Date(NaN);
  };
  const labels = {spotify:'Spotify',deezer:'Deezer',apple:'Apple Music',youtube:'YouTube Music',tiktok:'TikTok',facebook:'Facebook'};
  const linkButtons = item => Object.entries(item.links || {}).filter(([,url]) => url).map(([name,url]) => `<a class="btn ghost small" target="_blank" rel="noopener" href="${escape(url)}">${labels[name] || escape(name)}</a>`).join('');
  document.addEventListener('DOMContentLoaded', async () => {
    const key = document.body.dataset.artistKey, artist = document.body.dataset.artist, details = config[key];
    if (!details) return;
    const main = document.querySelector('.artist-page');
    try {
      const data = await fetch('../data.json?v=makeda-sparetdee-20260808', {cache:'no-store'}).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      });
      const artistReleases = (data.tracks || []).filter(item => item.artist === artist || item.artists?.includes(artist));
      const available = artistReleases.filter(item => item.status === 'Disponible' && !Number.isNaN(releaseDate(item.date).getTime())).sort((a,b) => releaseDate(b.date).getTime() - releaseDate(a.date).getTime());
      const newest = available[0];
      if (newest && !main.querySelector('.v12-latest-artist-release')) {
        const section = document.createElement('section'); section.className = 'section v12-latest-artist-release';
        const history = available.slice(1, 3).map(item => `<article class="release-card-artist release-card-artist--history"><img src="${escape(artistMediaUrl(item.promoCover || item.cover))}" alt="${escape(item.title)} — disponible maintenant" loading="lazy"><div><p>Sortie précédente disponible</p><h3>${escape(item.title)}</h3><p>${escape(item.description || '')}</p><div class="release-links">${linkButtons(item)}</div></div></article>`).join('');
        section.innerHTML = `<p class="sup">Dernières sorties</p><h2>${escape(newest.title)}</h2><article class="release-card-artist"><img src="${escape(artistMediaUrl(newest.promoCover || newest.cover))}" alt="${escape(newest.title)} — disponible maintenant" loading="lazy"><div><p>${escape(newest.status || 'Sortie officielle')}</p><p>${escape(newest.description || '')}</p><div class="release-links">${linkButtons(newest)}</div></div></article>${history ? `<div class="v12-artist-release-history"><p class="sup">Sorties récentes</p>${history}</div>` : ''}`;
        main.querySelector('.hero')?.insertAdjacentElement('afterend', section);
      }
      const upcomingReleases = (data.upcoming || [])
        .filter(item => (item.artist === artist || item.artists?.includes(artist)) && releaseDate(item.date).getTime() > Date.now())
        .sort((a, b) => releaseDate(a.date) - releaseDate(b.date));
      if (upcomingReleases.length && !main.querySelector('.v12-artist-upcoming-release')) {
        const section = document.createElement('section'); section.className = 'section v12-artist-upcoming-release';
        section.innerHTML = `<p class="sup">${upcomingReleases.length > 1 ? 'Prochaines sorties' : 'Prochaine sortie'}</p><h2>${upcomingReleases.length > 1 ? 'À venir' : escape(upcomingReleases[0].title)}</h2>${upcomingReleases.map(nextRelease => `<article class="release-card-artist"><img src="${escape(artistMediaUrl(nextRelease.cover))}" alt="${escape(nextRelease.title)} — bientôt disponible" loading="lazy"><div><p>${escape(nextRelease.label || nextRelease.status || 'Bientôt disponible')}</p><h3>${escape(nextRelease.title)}</h3><p>${escape(nextRelease.description || '')}</p><div class="miniCountdown" data-date="${escape(nextRelease.date)}" aria-label="Compte à rebours avant ${escape(nextRelease.title)}"><div><strong>00</strong><span>Jours</span></div><div><strong>00</strong><span>Heures</span></div><div><strong>00</strong><span>Minutes</span></div><div><strong>00</strong><span>Secondes</span></div></div><p class="countdownStatus" aria-live="polite"></p></div></article>`).join('')}`;
        main.querySelector('.hero')?.insertAdjacentElement('afterend', section);
        window.initAllCountdowns?.(section);
      }
    } catch (error) { console.warn('Dernière sortie artiste indisponible.', error); }
    const media = document.createElement('section'); media.className = 'section v12-artist-gallery';
    media.innerHTML = `<p class="sup">Clips et galerie</p><h2>L’univers visuel</h2><div class="v12-artist-media"><a href="${details.clip}"><img src="${details.poster}" alt="Poster ${details.clipTitle}" loading="lazy"><span>Voir le clip · ${details.clipTitle}</span></a>${details.gallery.map((src,index) => `<a href="../galerie/index.html"><img src="${src}" alt="Visuel officiel ${escape(artist)}" loading="lazy"><span>${index ? 'Explorer la galerie' : 'Profil officiel'}</span></a>`).join('')}</div></section>`;
    const platforms = document.createElement('section'); platforms.className = 'section';
    platforms.innerHTML = `<p class="sup">Liens officiels</p><h2>Écouter et suivre</h2><div class="v12-artist-platforms"><a href="../music/index.html#morceaux">Music Hub MPBP440</a><a href="${details.clip}">MPBP TV</a></div>`;
    main.append(media, platforms);
  }, {once:true});
})();
