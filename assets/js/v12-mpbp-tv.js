(() => {
  'use strict';

  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const mediaUrl = value => {
    const source = String(value || '').trim();
    if (!source) return '';
    if (/^(https?:|data:|blob:)/i.test(source)) return source;
    return new URL(`../${source.replace(/^(\.\.\/|\.\/|\/)+/, '')}`, document.baseURI).href;
  };
  const artistUrl = artist => {
    const name = String(artist || '').toLowerCase();
    if (name.includes('makéda') && !name.includes('sparetdee')) return '/artistes/makeda-muse.html';
    if (name.includes('juste une plume')) return '/artistes/juste-une-plume.html';
    return '/artistes/sparetdee-simon.html';
  };
  const localVideos = [
    { id: 'clip-karma', title: 'Karma', artist: 'Makéda Muse', description: 'Clip exclusif web de Makéda Muse, disponible dès maintenant sur MPBP TV.', src: 'assets/clips/makeda-muse/makeda-muse-karma-clip-exclusif-web.mp4', poster: 'assets/clips/makeda-muse/makeda-muse-karma-clip-exclusif.png' },
    { id: 'clip-mon-influence', title: 'Mon Influence', artist: 'Sparetdee Simon feat. Makéda Muse', description: 'Clip exclusif web de Sparetdee Simon feat. Makéda Muse.', src: 'assets/clips/sparetdee-simon/sparetdee-simon-feat-makeda-muse-mon-influence-clip-exclusif-web.mp4', poster: 'assets/clips/sparetdee-simon/sparetdee-simon-feat-makeda-muse-mon-influence-clip-exclusif.png' },
    { id: 'clip-que-restera-t-il-de-moi', title: 'Que restera-t-il de moi ?', artist: 'Sparetdee Simon', description: 'Clip exclusif web de Sparetdee Simon.', src: 'assets/clips/sparetdee-simon/sparetdee-simon-que-restera-t-il-de-moi-clip-exclusif-web.mp4', poster: 'assets/clips/sparetdee-simon/sparetdee-simon-que-restera-t-il-de-moi-clip-exclusif.png' },
    { id: 'l-argent', title: 'L’Argent', artist: 'Sparetdee Simon', description: 'Clip exclusif disponible uniquement sur le site officiel et l’application MPBP440.', src: 'assets/videos/l-argent.mp4', poster: 'assets/covers/largent-officiel.webp' },
    { id: 'clip-je-sais-que-tu-sais', title: 'Je sais que tu sais', artist: 'Juste Une Plume', description: 'Un clip exclusif MPBP TV signé Juste Une Plume.', src: 'assets/videos/juste-une-plume/je-sais-que-tu-sais-clip-exclusif-2026.mp4', poster: 'assets/covers/je-sais-juste-une-plume.webp' },
    { id: 'clip-j-existe', title: 'J’existe', artist: 'Makéda Muse', description: 'Une immersion visuelle sensible et intense dans l’univers de Makéda Muse.', src: 'assets/clips/makeda-muse/j-existe-clip-exclusif-2026.mp4', poster: 'assets/clips/makeda-muse/j-existe-cover.png' },
    { id: 'clip-dois-je-me-taire', title: 'Dois-je me taire ?', artist: 'Sparetdee Simon', description: 'Clip officiel exclusif de Sparetdee Simon, disponible sur MPBP440.com.', src: 'assets/clips/sparetdee-simon/dois-je-me-taire-clip-exclusif.mp4', poster: 'assets/clips/sparetdee-simon/dois-je-me-taire-cover.png' }
  ].map(item => ({ ...item, kind: 'exclusive', category: 'Exclusif MPBP440', artistUrl: artistUrl(item.artist) }));

  const youtubeVideo = item => {
    const youtubeId = String(item.youtubeId || '').trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) return null;
    const id = String(item.id || `youtube-${youtubeId}`).trim();
    if (!id) return null;
    return {
      id,
      title: item.title || id,
      artist: item.artist || 'MPBP440',
      description: item.description || (item.album ? `Extrait de l’album ${item.album}.` : 'Vidéo officielle MPBP440.'),
      kind: 'youtube',
      category: item.category || 'Clip officiel YouTube',
      youtubeId,
      url: item.url || `https://youtu.be/${youtubeId}`,
      poster: mediaUrl(item.poster) || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      artistUrl: artistUrl(item.artist)
    };
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const panel = document.getElementById('mpbp-tv-player');
    const player = document.getElementById('v12TvPlayer');
    const youtubePlayer = document.getElementById('v13YoutubePlayer');
    const youtubeStart = document.getElementById('v13YoutubeStart');
    const youtubePoster = document.getElementById('v13YoutubePoster');
    const library = document.getElementById('v13TvLibrary');
    if (!panel || !player || !youtubePlayer || !library) return;

    const title = document.getElementById('mpbpTvPlayerTitle');
    const artist = document.getElementById('v12TvPlayerArtist');
    const description = document.getElementById('v12TvPlayerDescription');
    const kind = document.getElementById('v13TvPlayerKind');
    const artistLink = document.getElementById('v12TvPlayerArtistLink');
    const youtubeLink = document.getElementById('v13YoutubeLink');
    const status = document.getElementById('v13TvLibraryStatus');
    const filters = [...document.querySelectorAll('[data-v13-video-filter]')];
    const feedback = document.querySelector('[data-v12-player-feedback]');
    const toggle = document.querySelector('[data-v12-player-toggle]');
    const share = document.querySelector('[data-v12-player-share]');
    const like = document.querySelector('[data-v12-like]');
    const viewCount = document.querySelector('[data-v12-view-count]');
    const likeCount = document.querySelector('[data-v12-like-count]');
    const commentsList = document.querySelector('[data-v12-comments-list]');
    const commentsStatus = document.querySelector('[data-v12-comments-status]');
    const commentsForm = document.querySelector('[data-v12-comments-form]');
    const commentCount = document.querySelector('[data-v12-comment-count]');
    const commentsRetry = document.querySelector('[data-v12-comments-retry]');
    const analytics = window.MPBP440Analytics;
    let videos = [...localVideos];
    let selected = null;
    let currentFilter = 'all';
    let watched = 0;
    let lastPosition = null;
    let viewSent = false;

    try {
      const response = await fetch(new URL('../data/videos.json', document.baseURI), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = await response.json();
      const ids = new Set(videos.map(item => item.id));
      const youtubeIds = new Set();
      source.forEach(item => {
        if (item.hidden) return;
        const video = youtubeVideo(item);
        if (!video || ids.has(video.id) || youtubeIds.has(video.youtubeId)) return;
        ids.add(video.id);
        youtubeIds.add(video.youtubeId);
        videos.push(video);
      });
    } catch (_) {
      if (status) status.textContent = 'Les archives YouTube sont temporairement indisponibles. Les exclusivités MPBP440 restent accessibles.';
    }

    const videoById = id => videos.find(item => item.id === id);
    const canonical = id => `${location.origin}/mpbp-tv/index.html#${encodeURIComponent(id)}`;
    const setCommentsStatus = message => { if (commentsStatus) commentsStatus.textContent = message; };
    const setCommentFormAvailable = available => {
      const submit = commentsForm?.querySelector('button[type="submit"]');
      if (submit) submit.disabled = !available;
    };
    const commentDate = value => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
    const setStats = stats => {
      if (!stats) {
        if (viewCount) viewCount.textContent = 'Statistiques temporairement indisponibles';
        if (like) { like.disabled = true; like.setAttribute('aria-label', 'J’aime indisponible : statistiques temporairement indisponibles'); }
        return;
      }
      if (viewCount) viewCount.textContent = analytics.format(stats.views, 'vue');
      if (likeCount) likeCount.textContent = analytics.format(stats.likes, 'J’aime');
      if (like) {
        like.disabled = false;
        like.setAttribute('aria-pressed', String(Boolean(stats.liked)));
        like.setAttribute('aria-label', stats.liked ? 'Retirer mon J’aime' : 'J’aime cette vidéo');
      }
    };
    const refreshStats = async () => {
      try { setStats(await analytics?.videoEngagement(selected?.id)); }
      catch (_) { setStats(null); }
    };
    const loadComments = async () => {
      if (!selected || !commentsList || !analytics) {
        setCommentsStatus('Les commentaires sont momentanément indisponibles.');
        setCommentFormAvailable(false);
        if (commentsRetry) commentsRetry.hidden = false;
        return;
      }
      setCommentsStatus('Chargement des commentaires…');
      commentsList.replaceChildren();
      if (commentsRetry) commentsRetry.hidden = true;
      try {
        const comments = await analytics.commentsForClip(selected.id);
        if (!comments?.length) {
          setCommentsStatus('Aucun commentaire approuvé pour cette vidéo.');
          setCommentFormAvailable(true);
          return;
        }
        comments.forEach(comment => {
          const article = document.createElement('article');
          article.className = 'v12-tv-comment';
          const meta = document.createElement('p');
          meta.className = 'v12-tv-comment__meta';
          meta.textContent = `${comment.display_name} · ${commentDate(comment.created_at)}`;
          const message = document.createElement('p');
          message.textContent = comment.message;
          article.append(meta, message);
          commentsList.append(article);
        });
        setCommentsStatus(`${comments.length} commentaire(s) approuvé(s).`);
        setCommentFormAvailable(true);
      } catch (_) {
        setCommentsStatus('Les commentaires sont momentanément indisponibles.');
        setCommentFormAvailable(false);
        if (commentsRetry) commentsRetry.hidden = false;
      }
    };
    const resetWatch = () => { watched = 0; lastPosition = null; viewSent = false; };
    const sendView = async () => {
      if (viewSent || !analytics || !selected) return;
      viewSent = true;
      const result = await analytics.videoView(selected.id);
      if (result === null && !analytics.isPreview) viewSent = false;
      await refreshStats();
    };
    const renderLibrary = () => {
      const visible = videos.filter(item => currentFilter === 'all' || item.kind === currentFilter);
      library.innerHTML = visible.map(item => `<button type="button" data-v12-clip="${escape(item.id)}" data-video-kind="${item.kind}" aria-pressed="${String(selected?.id === item.id)}"${selected?.id === item.id ? ' aria-current="true"' : ''}><img src="${escape(mediaUrl(item.poster))}" alt="" loading="lazy" decoding="async"><span class="v12-tv-playlist__copy"><strong>${escape(item.title)}</strong><span>${escape(item.artist)} · ${item.kind === 'youtube' ? 'YouTube' : 'Exclusif'}</span></span></button>`).join('');
      if (status) status.textContent = `${visible.length} vidéo${visible.length > 1 ? 's' : ''} · aucune lecture automatique`;
      library.querySelectorAll('[data-v12-clip]').forEach(button => button.addEventListener('click', () => {
        const item = videoById(button.dataset.v12Clip);
        if (!item) return;
        history.replaceState(null, '', `#${encodeURIComponent(item.id)}`);
        select(item, { autoplay: item.kind === 'exclusive', scroll: true });
      }));
    };
    const select = (item, { autoplay = false, scroll = false } = {}) => {
      if (!item) return;
      selected = item;
      resetWatch();
      player.pause();
      player.hidden = item.kind !== 'exclusive';
      youtubePlayer.hidden = item.kind !== 'youtube';
      if (item.kind === 'youtube') {
        player.removeAttribute('src');
        player.load();
        youtubePlayer.removeAttribute('src');
        youtubePlayer.hidden = true;
        if (youtubeStart) { youtubeStart.hidden = false; youtubeStart.setAttribute('aria-label', `Charger le lecteur YouTube pour ${item.title}`); }
        if (youtubePoster) { youtubePoster.src = mediaUrl(item.poster); youtubePoster.alt = `Poster ${item.title}`; }
        if (toggle) toggle.hidden = true;
        if (youtubeLink) { youtubeLink.hidden = false; youtubeLink.href = item.url; }
      } else {
        youtubePlayer.removeAttribute('src');
        if (youtubeStart) youtubeStart.hidden = true;
        if (player.src !== mediaUrl(item.src)) {
          player.src = mediaUrl(item.src);
          player.load();
        }
        player.poster = mediaUrl(item.poster);
        if (toggle) { toggle.hidden = false; toggle.textContent = 'Lecture'; }
        if (youtubeLink) youtubeLink.hidden = true;
        if (autoplay) player.play().catch(() => {});
      }
      if (kind) kind.textContent = item.category;
      if (title) title.textContent = item.title;
      if (artist) artist.textContent = `${item.artist} — M.P.B.P 440 Corp. 2026`;
      if (description) description.textContent = item.description;
      if (artistLink) artistLink.href = item.artistUrl;
      renderLibrary();
      refreshStats();
      loadComments();
      if (scroll) panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    };

    filters.forEach(button => button.addEventListener('click', () => {
      currentFilter = button.dataset.v13VideoFilter;
      filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      renderLibrary();
    }));
    toggle?.addEventListener('click', () => {
      if (!selected || selected.kind !== 'exclusive') return;
      if (player.paused) player.play().catch(() => {});
      else player.pause();
    });
    youtubeStart?.addEventListener('click', () => {
      if (!selected || selected.kind !== 'youtube') return;
      youtubePlayer.src = `https://www.youtube-nocookie.com/embed/${selected.youtubeId}?rel=0&modestbranding=1`;
      youtubePlayer.hidden = false;
      youtubeStart.hidden = true;
    });
    player.addEventListener('play', () => { if (toggle) toggle.textContent = 'Pause'; lastPosition = player.currentTime; });
    player.addEventListener('pause', () => { if (toggle) toggle.textContent = 'Lecture'; lastPosition = null; });
    player.addEventListener('timeupdate', () => {
      if (lastPosition !== null) {
        const delta = player.currentTime - lastPosition;
        if (delta > 0 && delta <= 2.5) watched += delta;
      }
      lastPosition = player.currentTime;
      const threshold = Number.isFinite(player.duration) && player.duration > 0 && player.duration < 50 ? player.duration * .2 : 10;
      if (watched >= threshold) sendView();
    });
    player.addEventListener('ended', sendView);
    like?.addEventListener('click', async () => {
      if (!analytics || like.disabled || !selected) return;
      like.disabled = true;
      const liked = await analytics.toggleLike(selected.id);
      if (liked === null && !analytics.isPreview) { setStats(null); return; }
      await refreshStats();
    });
    commentsForm?.addEventListener('submit', async event => {
      event.preventDefault();
      const data = new FormData(commentsForm);
      const name = String(data.get('displayName') || '').trim();
      const message = String(data.get('message') || '').trim();
      const submit = commentsForm.querySelector('button[type="submit"]');
      if (data.get('website') || !name || !message || !analytics || !selected) { setCommentsStatus('Vérifiez les informations saisies.'); return; }
      if (submit) submit.disabled = true;
      setCommentsStatus('Envoi pour modération…');
      try {
        const result = await analytics.submitComment(selected.id, name, message);
        if (result === null && analytics.isPreview) { setCommentsStatus('L’envoi est désactivé sur la prévisualisation.'); return; }
        commentsForm.reset();
        if (commentCount) commentCount.textContent = '0 / 1000';
        setCommentsStatus('Merci. Votre commentaire sera publié après validation.');
      } catch (_) {
        setCommentsStatus('Envoi impossible pour le moment. Réessayez plus tard.');
      } finally {
        if (submit) submit.disabled = false;
      }
    });
    commentsForm?.elements.message?.addEventListener('input', event => {
      if (commentCount) commentCount.textContent = `${event.target.value.length} / 1000`;
    });
    commentsRetry?.addEventListener('click', loadComments);
    share?.addEventListener('click', async () => {
      if (!selected) return;
      const data = { title: `${selected.title} — ${selected.artist} | MPBP TV`, text: selected.description, url: canonical(selected.id) };
      try {
        if (navigator.share) await navigator.share(data);
        else if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.url);
          if (feedback) feedback.textContent = 'Lien de la vidéo copié.';
        }
      } catch (_) {}
    });
    const fromHash = () => {
      const item = videoById(decodeURIComponent(location.hash.slice(1)));
      if (item) select(item, { scroll: true });
    };
    window.addEventListener('hashchange', fromHash);
    const initial = videoById(decodeURIComponent(location.hash.slice(1))) || videoById('neons-carnivores') || videos[0];
    select(initial);
  }, { once: true });
})();
