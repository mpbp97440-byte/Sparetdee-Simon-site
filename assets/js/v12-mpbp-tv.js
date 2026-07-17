(() => {
  const clips = {
    "l-argent": { title: "L’Argent", artist: "Sparetdee Simon", description: "Clip exclusif disponible uniquement sur le site officiel et l’application MPBP440.", src: "/assets/videos/l-argent.mp4", poster: "/assets/covers/largent-officiel.webp", artistUrl: "/artistes/sparetdee-simon.html" },
    "clip-je-sais-que-tu-sais": { title: "Je sais que tu sais", artist: "Juste Une Plume", description: "Un clip exclusif MPBP TV signé Juste Une Plume, entre sensibilité, tension poétique et vérité intérieure.", src: "/assets/videos/juste-une-plume/je-sais-que-tu-sais-clip-exclusif-2026.mp4", poster: "/assets/covers/je-sais-juste-une-plume.webp", artistUrl: "/artistes/juste-une-plume.html" },
    "clip-j-existe": { title: "J’existe", artist: "Makéda Muse", description: "Une immersion visuelle sensible et intense dans l’univers de Makéda Muse.", src: "/assets/clips/makeda-muse/j-existe-clip-exclusif-2026.mp4", poster: "/assets/clips/makeda-muse/j-existe-cover.png", artistUrl: "/artistes/makeda-muse.html" },
    "clip-dois-je-me-taire": { title: "Dois-je me taire ?", artist: "Sparetdee Simon", description: "Clip officiel exclusif de Sparetdee Simon, disponible sur MPBP440.com.", src: "/assets/clips/sparetdee-simon/dois-je-me-taire-clip-exclusif.mp4", poster: "/assets/clips/sparetdee-simon/dois-je-me-taire-cover.png", artistUrl: "/artistes/sparetdee-simon.html" }
  };
  const youtube = [
    ["Le Réseau Fantôme", "HKzweo2V-iw"], ["Climat sous contrôle Remix", "GiGwGXqL1DY"], ["Prince Des étoiles", "EzsriXQY-04"], ["Fiainana Tsotra", "RV87WDHFjKE"], ["Monde Alternatif", "0YEqshdl7jI"], ["BrainRot Society", "zHx-OHSAKcs"]
  ];
  const canonical = key => `${location.origin}/mpbp-tv/index.html#${key}`;
  document.addEventListener("DOMContentLoaded", () => {
    const player = document.getElementById("v12TvPlayer");
    const title = document.getElementById("mpbpTvPlayerTitle");
    const artist = document.getElementById("v12TvPlayerArtist");
    const description = document.getElementById("v12TvPlayerDescription");
    const artistLink = document.getElementById("v12TvPlayerArtistLink");
    const feedback = document.querySelector("[data-v12-player-feedback]");
    const toggle = document.querySelector("[data-v12-player-toggle]");
    const share = document.querySelector("[data-v12-player-share]");
    const buttons = [...document.querySelectorAll("[data-v12-clip]")];
    const panel = document.getElementById("mpbp-tv-player");
    if (!player || !panel) return;
    let selected = "l-argent";
    const select = (key, { autoplay = false, scroll = false } = {}) => {
      const clip = clips[key] || clips["l-argent"];
      selected = clips[key] ? key : "l-argent";
      player.pause();
      if (player.getAttribute("src") !== clip.src) { player.removeAttribute("src"); player.load(); player.src = clip.src; }
      player.poster = clip.poster;
      title.textContent = clip.title;
      artist.textContent = `${clip.artist} — M.P.B.P 440 Corp. 2026`;
      description.textContent = clip.description;
      artistLink.href = clip.artistUrl;
      buttons.forEach(button => { const isSelected = button.dataset.v12Clip === selected; button.setAttribute("aria-pressed", String(isSelected)); if (isSelected) button.setAttribute("aria-current", "true"); else button.removeAttribute("aria-current"); });
      if (scroll) panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      if (autoplay) player.play().catch(() => {});
    };
    buttons.forEach(button => button.addEventListener("click", () => { history.replaceState(null, "", `#${button.dataset.v12Clip}`); select(button.dataset.v12Clip, { autoplay: true, scroll: true }); }));
    toggle?.addEventListener("click", () => { if (player.paused) player.play().catch(() => {}); else player.pause(); });
    player.addEventListener("play", () => { toggle.textContent = "Pause"; });
    player.addEventListener("pause", () => { toggle.textContent = "Lecture"; });
    share?.addEventListener("click", async () => { const clip = clips[selected]; const data = { title: `${clip.title} — ${clip.artist} | MPBP TV`, text: clip.description, url: canonical(selected) }; try { if (navigator.share) await navigator.share(data); else if (navigator.clipboard) { await navigator.clipboard.writeText(data.url); if (feedback) feedback.textContent = "Lien du clip copié."; } } catch (_) {} });
    const fromHash = () => { const key = location.hash.slice(1); if (clips[key]) select(key, { scroll: true }); };
    window.addEventListener("hashchange", fromHash);
    fromHash();
    const grid = document.getElementById("v12YoutubeGrid");
    if (grid) grid.innerHTML = youtube.map(([name, id]) => `<article class="v12-tv-youtube__card"><div class="v12-tv-youtube__frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${name} — MPBP440" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="btn ghost" href="https://youtu.be/${id}" target="_blank" rel="noopener noreferrer">${name} sur YouTube</a></article>`).join("");
  });
})();
