(() => {
  'use strict';

  const clips = {
    'l-argent': { title: 'L’Argent', artist: 'Sparetdee Simon', description: 'Clip exclusif disponible uniquement sur le site officiel et l’application MPBP440.', src: '/assets/videos/l-argent.mp4', poster: '/assets/covers/largent-officiel.webp', artistUrl: '/artistes/sparetdee-simon.html' },
    'clip-je-sais-que-tu-sais': { title: 'Je sais que tu sais', artist: 'Juste Une Plume', description: 'Un clip exclusif MPBP TV signé Juste Une Plume, entre sensibilité, tension poétique et vérité intérieure.', src: '/assets/videos/juste-une-plume/je-sais-que-tu-sais-clip-exclusif-2026.mp4', poster: '/assets/covers/je-sais-juste-une-plume.webp', artistUrl: '/artistes/juste-une-plume.html' },
    'clip-j-existe': { title: 'J’existe', artist: 'Makéda Muse', description: 'Une immersion visuelle sensible et intense dans l’univers de Makéda Muse.', src: '/assets/clips/makeda-muse/j-existe-clip-exclusif-2026.mp4', poster: '/assets/clips/makeda-muse/j-existe-cover.png', artistUrl: '/artistes/makeda-muse.html' },
    'clip-dois-je-me-taire': { title: 'Dois-je me taire ?', artist: 'Sparetdee Simon', description: 'Clip officiel exclusif de Sparetdee Simon, disponible sur MPBP440.com.', src: '/assets/clips/sparetdee-simon/dois-je-me-taire-clip-exclusif.mp4', poster: '/assets/clips/sparetdee-simon/dois-je-me-taire-cover.png', artistUrl: '/artistes/sparetdee-simon.html' }
  };
  const youtube = [['Le Réseau Fantôme', 'HKzweo2V-iw'], ['Climat sous contrôle Remix', 'GiGwGXqL1DY'], ['Prince Des étoiles', 'EzsriXQY-04'], ['Fiainana Tsotra', 'RV87WDHFjKE'], ['Monde Alternatif', '0YEqshdl7I'], ['BrainRot Society', 'zHx-OHSAKcs']];
  const canonical = (key) => `${location.origin}/mpbp-tv/index.html#${key}`;

  document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('v12TvPlayer');
    const title = document.getElementById('mpbpTvPlayerTitle');
    const artist = document.getElementById('v12TvPlayerArtist');
    const description = document.getElementById('v12TvPlayerDescription');
    const artistLink = document.getElementById('v12TvPlayerArtistLink');
    const feedback = document.querySelector('[data-v12-player-feedback]');
    const toggle = document.querySelector('[data-v12-player-toggle]');
    const share = document.querySelector('[data-v12-player-share]');
    const like = document.querySelector('[data-v12-like]');
    const viewCount = document.querySelector('[data-v12-view-count]');
    const likeCount = document.querySelector('[data-v12-like-count]');
    const buttons = [...document.querySelectorAll('[data-v12-clip]')];
    const panel = document.getElementById('mpbp-tv-player');
    const analytics = window.MPBP440Analytics;
    const commentsList = document.querySelector('[data-v12-comments-list]');
    const commentsStatus = document.querySelector('[data-v12-comments-status]');
    const commentsForm = document.querySelector('[data-v12-comments-form]');
    const commentCount = document.querySelector('[data-v12-comment-count]');
    const commentsRetry = document.querySelector('[data-v12-comments-retry]');
    if (!player || !panel) return;

    let selected = 'l-argent'; let watched = 0; let lastPosition = null; let viewSent = false;
    const commentDate = (value) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
    const setCommentsStatus = (message) => { if (commentsStatus) commentsStatus.textContent = message; };
    const setCommentFormAvailable = (available) => { const submit = commentsForm?.querySelector('button[type="submit"]'); if (submit) submit.disabled = !available; };
    const loadComments = async () => {
      if (!commentsList || !analytics) { setCommentsStatus('Les commentaires sont momentanément indisponibles.'); setCommentFormAvailable(false); if (commentsRetry) commentsRetry.hidden = false; return; }
      setCommentsStatus('Chargement des commentaires…'); commentsList.replaceChildren(); if (commentsRetry) commentsRetry.hidden = true;
      try {
        const comments = await analytics.commentsForClip(selected);
        if (!comments?.length) { setCommentsStatus('Aucun commentaire approuvé pour ce clip.'); setCommentFormAvailable(true); return; }
        comments.forEach((comment) => {
          const article = document.createElement('article'); article.className = 'v12-tv-comment';
          const meta = document.createElement('p'); meta.className = 'v12-tv-comment__meta'; meta.textContent = `${comment.display_name} · ${commentDate(comment.created_at)}`;
          const message = document.createElement('p'); message.textContent = comment.message;
          article.append(meta, message); commentsList.append(article);
        });
        setCommentsStatus(`${comments.length} commentaire(s) approuvé(s).`); setCommentFormAvailable(true);
      } catch (_) { setCommentsStatus('Les commentaires sont momentanément indisponibles.'); setCommentFormAvailable(false); if (commentsRetry) commentsRetry.hidden = false; }
    };
    const setStats = (stats) => {
      if (!stats) { if (viewCount) viewCount.textContent = 'Statistiques temporairement indisponibles'; if (like) { like.disabled = true; like.setAttribute('aria-label', 'J’aime indisponible : statistiques temporairement indisponibles'); } return; }
      if (viewCount) viewCount.textContent = analytics.format(stats.views, 'vue');
      if (likeCount) likeCount.textContent = analytics.format(stats.likes, 'J’aime');
      if (like) { like.disabled = false; like.setAttribute('aria-pressed', String(Boolean(stats.liked))); like.setAttribute('aria-label', stats.liked ? 'Retirer mon J’aime' : 'J’aime ce clip'); }
    };
    const refreshStats = async () => { try { setStats(await analytics?.videoEngagement(selected)); } catch (_) { setStats(null); } };
    const refreshCardStats = async () => {
      if (!analytics) return;
      await Promise.all(Object.keys(clips).map(async (key) => {
        try {
          const stats = await analytics.videoEngagement(key); const card = buttons.find((button) => button.dataset.v12Clip === key);
          if (!card || !stats) return;
          let target = card.querySelector('.v12-tv-playlist__stats');
          if (!target) { target = document.createElement('small'); target.className = 'v12-tv-playlist__stats'; card.querySelector('.v12-tv-playlist__copy')?.append(target); }
          target.textContent = `${analytics.format(stats.views, 'vue')} · ${analytics.format(stats.likes, 'J’aime')}`;
        } catch (_) {}
      }));
    };
    const sendView = async () => { if (viewSent || !analytics) return; viewSent = true; const result = await analytics.videoView(selected); if (result === null && !analytics.isPreview) viewSent = false; await refreshStats(); };
    const resetWatch = () => { watched = 0; lastPosition = null; viewSent = false; };
    const select = (key, { autoplay = false, scroll = false } = {}) => {
      const clip = clips[key] || clips['l-argent']; selected = clips[key] ? key : 'l-argent'; resetWatch();
      player.pause();
      if (player.getAttribute('src') !== clip.src) { player.removeAttribute('src'); player.load(); player.src = clip.src; }
      player.poster = clip.poster; title.textContent = clip.title; artist.textContent = `${clip.artist} — M.P.B.P 440 Corp. 2026`; description.textContent = clip.description; artistLink.href = clip.artistUrl;
      buttons.forEach((button) => { const active = button.dataset.v12Clip === selected; button.setAttribute('aria-pressed', String(active)); if (active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current'); });
      refreshStats();
      loadComments();
      if (scroll) panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      if (autoplay) player.play().catch(() => {});
    };
    buttons.forEach((button) => button.addEventListener('click', () => { history.replaceState(null, '', `#${button.dataset.v12Clip}`); select(button.dataset.v12Clip, { autoplay: true, scroll: true }); }));
    toggle?.addEventListener('click', () => { if (player.paused) player.play().catch(() => {}); else player.pause(); });
    player.addEventListener('play', () => { if (toggle) toggle.textContent = 'Pause'; lastPosition = player.currentTime; });
    player.addEventListener('pause', () => { if (toggle) toggle.textContent = 'Lecture'; lastPosition = null; });
    player.addEventListener('timeupdate', () => {
      if (lastPosition !== null) { const delta = player.currentTime - lastPosition; if (delta > 0 && delta <= 2.5) watched += delta; }
      lastPosition = player.currentTime;
      const threshold = Number.isFinite(player.duration) && player.duration > 0 && player.duration < 50 ? player.duration * .2 : 10;
      if (watched >= threshold) sendView();
    });
    player.addEventListener('ended', sendView);
    like?.addEventListener('click', async () => {
      if (!analytics || like.disabled) return; like.disabled = true;
      const liked = await analytics.toggleLike(selected);
      if (liked === null && !analytics.isPreview) { setStats(null); return; }
      await refreshStats();
    });
    commentsForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(commentsForm); const name = String(data.get('displayName') || '').trim(); const message = String(data.get('message') || '').trim();
      const submit = commentsForm.querySelector('button[type="submit"]');
      if (data.get('website') || !name || !message || !analytics) { setCommentsStatus('Vérifiez les informations saisies.'); return; }
      if (submit) submit.disabled = true; setCommentsStatus('Envoi pour modération…');
      try { const result = await analytics.submitComment(selected, name, message); if (result === null && analytics.isPreview) { setCommentsStatus('L’envoi est désactivé sur la prévisualisation.'); return; } commentsForm.reset(); if (commentCount) commentCount.textContent = '0 / 1000'; setCommentsStatus('Merci. Votre commentaire sera publié après validation.'); }
      catch (_) { setCommentsStatus('Envoi impossible pour le moment. Réessayez plus tard.'); }
      finally { if (submit) submit.disabled = false; }
    });
    commentsForm?.elements.message?.addEventListener('input', (event) => { if (commentCount) commentCount.textContent = `${event.target.value.length} / 1000`; });
    commentsRetry?.addEventListener('click', loadComments);
    share?.addEventListener('click', async () => { const clip = clips[selected]; const data = { title: `${clip.title} — ${clip.artist} | MPBP TV`, text: clip.description, url: canonical(selected) }; try { if (navigator.share) await navigator.share(data); else if (navigator.clipboard) { await navigator.clipboard.writeText(data.url); if (feedback) feedback.textContent = 'Lien du clip copié.'; } } catch (_) {} });
    const fromHash = () => { const key = location.hash.slice(1); if (clips[key]) select(key, { scroll: true }); };
    window.addEventListener('hashchange', fromHash); if (clips[location.hash.slice(1)]) fromHash(); else select(selected); refreshCardStats();
    const grid = document.getElementById('v12YoutubeGrid');
    if (grid) grid.innerHTML = youtube.map(([name, id]) => `<article class="v12-tv-youtube__card"><div class="v12-tv-youtube__frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${name} — MPBP440" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="btn ghost" href="https://youtu.be/${id}" target="_blank" rel="noopener noreferrer">${name} sur YouTube</a></article>`).join('');
  });
})();
