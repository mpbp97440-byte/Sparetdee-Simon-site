(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value || "").replace(/[&<>\"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  const media = path => path ? new URL(path.replace(/^\.\//, ""), document.baseURI).href : "";
  const releaseArtwork = (path, alt) => {
    const source = media(path);
    return source ? `<img src="${source}" alt="${esc(alt)}" width="1254" height="1254" loading="lazy" decoding="async">` : '<p class="v12-upcoming-card__missing-artwork" role="status">Visuel officiel indisponible.</p>';
  };
  const date = value => new Date(value);
  const validDate = value => !Number.isNaN(date(value).getTime());
  const displayDate = value => validDate(value) ? date(value).toLocaleDateString("fr-FR", {day:"numeric",month:"long",year:"numeric"}) : "";
  const links = item => Object.entries(item.links || {}).filter(([, url]) => url).map(([name, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(({spotify:"Spotify", deezer:"Deezer", apple:"Apple Music", youtube:"YouTube Music"}[name] || name))}</a>`).join("");
  const countdown = (target, root) => {
    let timer;
    const tick = () => {
      const distance = Math.max(0, date(target).getTime() - Date.now());
      if (!distance) { root.innerHTML = '<p class="v12-countdown__available">Disponible maintenant</p>'; clearInterval(timer); return; }
      const values = [Math.floor(distance / 86400000), Math.floor(distance / 3600000) % 24, Math.floor(distance / 60000) % 60, Math.floor(distance / 1000) % 60];
      root.innerHTML = values.map((value, index) => `<div><strong>${String(value).padStart(2,"0")}</strong><span>${["Jours","Heures","Minutes","Secondes"][index]}</span></div>`).join("");
    };
    tick(); timer = setInterval(tick, 1000);
  };
  const render = async () => {
    try {
      const [data, news, events, gallery] = await Promise.all([fetch(new URL("data.json?v=12-1-1-jour-de-pluie-fix-20260721", document.baseURI), {cache:"no-store"}).then(r => r.json()), fetch(new URL("data/news.json", document.baseURI), {cache:"no-store"}).then(r => r.json()), fetch(new URL("data/events.json", document.baseURI), {cache:"no-store"}).then(r => r.json()), fetch(new URL("data/gallery.json", document.baseURI), {cache:"no-store"}).then(r => r.json())]);
      const recentMakedaReleases = (data.tracks || []).filter(item => item.artist === "Makéda Muse" && item.status === "Disponible").sort((a,b) => date(b.date).getTime() - date(a.date).getTime());
      const latest = recentMakedaReleases[0];
      const latestRoot = $("#v12LatestRelease");
      if (latest && latestRoot) { const history = recentMakedaReleases.slice(1, 3).map(item => `<article class="v12-release-history__item"><img src="${media(item.promoCover || item.cover)}" alt="${esc(item.title)} — sortie récente" width="600" height="600" loading="lazy"><div><span class="v12-badge">Sortie récente</span><h3>${esc(item.title)}</h3><p>${esc(item.artist)}</p><div class="v12-platform-links">${links(item)}</div></div></article>`).join(""); latestRoot.innerHTML = `<article class="v12-latest-release__lead"><img src="${media(latest.promoCover || latest.cover)}" alt="${esc(latest.title)} — disponible maintenant" width="1200" height="1200"><div class="v12-latest-release__body"><span class="v12-badge">Disponible maintenant</span><h3>${esc(latest.title)}</h3><p class="v12-feature__artist">${esc(latest.artist)}</p><p>${esc(latest.description)}</p><div class="v12-platform-links">${links(latest)}</div></div></article>${history ? `<div class="v12-release-history"><p class="v12-eyebrow">Sorties récentes</p>${history}</div>` : ""}`; }
      const titles = ["Je laisse la porte ouverte / J'existe", "Dois-je me taire ?"];
      const upcoming = (data.upcoming || []).filter(item => titles.includes(item.title));
      const upcomingRoot = $("#v12UpcomingGrid");
      if (upcomingRoot) { upcomingRoot.innerHTML = upcoming.map(item => `<article class="v12-upcoming-card">${releaseArtwork(item.cover, `Pochette ${item.title}`)}<div class="v12-upcoming-card__body"><span class="v12-badge">${date(item.date).getTime() <= Date.now() ? "Disponible maintenant" : "À venir"}</span><h3>${esc(item.title)}</h3><p>${esc(item.artist)} · ${displayDate(item.date)}</p><div class="v12-countdown" data-date="${esc(item.date)}"></div></div></article>`).join(""); upcomingRoot.querySelectorAll("[data-date]").forEach(node => countdown(node.dataset.date, node)); }
      const newsRoot = $("#v12NewsGrid");
      if (newsRoot) newsRoot.innerHTML = news.filter(item => !item.hidden && !/Live TikTok/.test(item.title)).slice(0,4).map((item, index) => `<article class="v12-news-card ${index === 0 ? "v12-news-card--lead" : ""}"><span class="v12-eyebrow">${esc(item.type || "actualité")}</span><time datetime="${esc(item.date)}">${displayDate(item.date)}</time><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p><a href="${esc(item.url || "/#actus")}">${esc(item.buttonText || "Lire l’actualité")}</a></article>`).join("");
      const futureEvents = events.filter(item => validDate(item.datetime || item.date) && date(item.datetime || item.date).getTime() >= Date.now());
      const eventSection = $("#events"), eventRoot = $("#v12Event");
      if (futureEvents.length && eventSection && eventRoot) { const item = futureEvents.sort((a,b) => date(a.datetime || a.date) - date(b.datetime || b.date))[0]; eventSection.hidden = false; eventRoot.innerHTML = `<img src="${media(item.cover)}" alt="${esc(item.title)}" width="1200" height="1200" loading="lazy"><div><span class="v12-badge">Événement à venir</span><h3>${esc(item.title)}</h3><p>${displayDate(item.datetime || item.date)}${item.time ? ` · ${esc(item.time)}` : ""}</p><p>${esc(item.description)}</p><a class="v12-button v12-button--primary" href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.buttonText || "En savoir plus")}</a></div>`; }
      const galleryRoot = $("#v12GalleryGrid");
      if (galleryRoot) galleryRoot.innerHTML = gallery.slice(0,5).map(item => `<img src="${media(item.image)}" alt="${esc(item.title)}" width="900" height="900" loading="lazy">`).join("");
      const platformsRoot = $("#v12Platforms");
      if (platformsRoot) { const source = latest?.links || {}; platformsRoot.innerHTML = links(source === latest?.links ? latest : {links: source}); }
    } catch (error) { console.warn("Le contenu V12 de la page d’accueil est indisponible.", error); }
  };
  document.addEventListener("DOMContentLoaded", render, {once:true});
})();
