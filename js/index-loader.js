(async function () {
  function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function url(str) { return esc((str || '').trim()); }

  const STAR_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

  function renderAvisSlide(a) {
    const stars = Array.from({ length: a.note || 0 }, () => STAR_SVG).join('');
    return `<li class="carousel__slide carousel__slide--presse">
      <div class="avis-card">
        <div class="avis-card__stars">${stars}</div>
        <blockquote class="avis-card__quote">« ${esc(a.texte)} »</blockquote>
        <div class="avis-card__author">
          <span class="avis-card__name">${esc(a.auteur)}</span>
        </div>
      </div>
    </li>`;
  }

  function renderPresseSlide(a) {
    const imgHtml = a.image_url
      ? `<div class="presse-card__img-wrap"><img src="${url(a.image_url)}" alt="${esc(a.auteur)}" loading="lazy" onerror="this.style.display='none'"></div>`
      : '';
    const card = `<div class="presse-card">
        ${imgHtml}
        <div class="presse-card__body">
          <span class="presse-card__badge">Article</span>
          <p class="presse-card__source">${esc(a.auteur)}</p>
          <p class="presse-card__issue">${esc(a.texte)}</p>
        </div>
      </div>`;
    const linked = a.lien_externe
      ? `<a href="${esc(a.lien_externe)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:block;">${card}</a>`
      : card;
    return `<li class="carousel__slide carousel__slide--presse">${linked}</li>`;
  }

  // Clones the .carousel wrapper to strip all accumulated event listeners,
  // clears the stored autoplay timer, then re-runs initCarousel (from main.js).
  function reinitCarousel(cfg) {
    const track = document.getElementById(cfg.trackId);
    if (!track) return;
    if (track._autoplayTimer) clearInterval(track._autoplayTimer);
    const wrap = track.closest('.carousel');
    if (wrap) wrap.replaceWith(wrap.cloneNode(true));
    initCarousel(cfg);
  }

  const CATEGORY_PAGES = {
    'identite-visuelle': 'identite-visuelle.html',
    'print': 'communication-print.html',
    'digital': 'communication-digitale.html'
  };

  // Ne lit que les vidéos réellement visibles dans le carrousel.
  function playVisibleVideos(root) {
    const videos = root ? root.querySelectorAll('video') : [];
    if (!videos.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.play().catch(() => {});
        else e.target.pause();
      });
    }, { threshold: 0.5 });
    videos.forEach(v => io.observe(v));
  }

  const [projResult, avisResult] = await Promise.allSettled([
    supabaseClient.from('projets').select('titre, image_url, video_url, categorie').eq('afficher_accueil', true).order('ordre'),
    supabaseClient.from('avis').select('*').order('ordre')
  ]);

  // ---- Réalisations carousel ----
  const realTrack = document.getElementById('realTrack');
  if (realTrack && projResult.status === 'fulfilled') {
    const { data, error } = projResult.value;
    if (!error && data?.length) {
      realTrack.innerHTML = data.map(p => {
        const media = p.video_url
          ? `<video src="${url(p.video_url)}" poster="${url(p.image_url)}" muted loop playsinline preload="none" aria-label="${esc(p.titre)}"></video>`
          : `<img src="${url(p.image_url)}" alt="${esc(p.titre)}" loading="lazy" onerror="this.style.display='none'">`;
        const href = CATEGORY_PAGES[p.categorie];
        return `<li class="carousel__slide">${href ? `<a class="carousel__link" href="${href}" aria-label="${esc(p.titre)}">${media}</a>` : media}</li>`;
      }).join('');
      reinitCarousel({ trackId: 'realTrack', prevId: 'realPrev', nextId: 'realNext', dotsId: 'realDots', autoplay: 4500 });
      playVisibleVideos(realTrack.closest('.carousel'));
    }
  }

  // ---- Avis + Presse carousel ----
  const presseTrack = document.getElementById('presseTrack');
  if (presseTrack && avisResult.status === 'fulfilled') {
    const { data, error } = avisResult.value;
    if (!error && data?.length) {
      presseTrack.innerHTML = data.map(a =>
        a.note !== null ? renderAvisSlide(a) : renderPresseSlide(a)
      ).join('');
      reinitCarousel({ trackId: 'presseTrack', prevId: 'pressePrev', nextId: 'presseNext', dotsId: 'presseDots', forceVisible: 1, autoplay: 6000 });
    }
  }
})();
