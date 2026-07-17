(() => {
  const pauseOthers = active => document.querySelectorAll('.v12-tv video').forEach(video => { if (video !== active) video.pause(); });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.v12-tv video').forEach(video => video.addEventListener('play', () => pauseOthers(video)));
    document.querySelectorAll('[data-v12-play]').forEach(button => button.addEventListener('click', () => {
      const section = document.querySelector(button.dataset.v12Play);
      const video = section?.querySelector('video');
      section?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center'});
      if (video) { pauseOthers(video); video.play().catch(() => {}); }
    }));
  });
})();
