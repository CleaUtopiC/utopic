/* =============================================
   UTOPI'C — main.js
   ============================================= */

/* ---- Header : scroll shadow ---- */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('navMenu');
const dropItem  = document.querySelector('.header-nav__item--dropdown');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('site-header--scrolled', window.scrollY > 10);
}, { passive: true });

/* ---- Hamburger ---- */
hamburger?.addEventListener('click', () => {
  const open = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', String(!open));
  hamburger.classList.toggle('is-open');
  navMenu.classList.toggle('is-open');
});

/* ---- Dropdown mobile ---- */
dropItem?.querySelector('.header-nav__link')?.addEventListener('click', (e) => {
  if (window.innerWidth <= 768) {
    e.preventDefault();
    dropItem.classList.toggle('is-open');
  }
});

/* ---- Fermer menu si clic hors header ---- */
document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target)) {
    hamburger?.classList.remove('is-open');
    hamburger?.setAttribute('aria-expanded', 'false');
    navMenu?.classList.remove('is-open');
  }
});


/* =============================================
   CAROUSEL FACTORY
   ============================================= */
function initCarousel({ trackId, prevId, nextId, dotsId, forceVisible, autoplay }) {
  const track  = document.getElementById(trackId);
  const prev   = document.getElementById(prevId);
  const next   = document.getElementById(nextId);
  const dotsEl = document.getElementById(dotsId);
  if (!track) return;

  const slides      = Array.from(track.children);
  let current       = 0;
  let slidesVisible = getSlidesVisible();

  function getSlidesVisible() {
    if (forceVisible) return forceVisible;
    if (window.innerWidth <= 768)  return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function totalPages() {
    return Math.ceil(slides.length / slidesVisible);
  }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    for (let i = 0; i < totalPages(); i++) {
      const btn = document.createElement('button');
      btn.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
      btn.setAttribute('aria-label', `Page ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(btn);
    }
  }

  function updateDots() {
    dotsEl?.querySelectorAll('.carousel__dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
    });
  }

  function goTo(page) {
    const pages = totalPages();
    /* Infinite loop: wrap around both directions */
    current = ((page % pages) + pages) % pages;

    const slideW = slides[0].offsetWidth;
    const gap    = 24; // 1.5rem
    const offset = current * slidesVisible * (slideW + gap);
    track.style.transform = `translateX(-${offset}px)`;

    updateDots();
    /* Buttons always enabled (infinite loop) */
    if (prev) prev.disabled = false;
    if (next) next.disabled = false;
  }

  prev?.addEventListener('click', () => goTo(current - 1));
  next?.addEventListener('click', () => goTo(current + 1));

  /* Touch swipe */
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
  });

  window.addEventListener('resize', () => {
    slidesVisible = getSlidesVisible();
    buildDots();
    goTo(0);
  }, { passive: true });

  buildDots();
  goTo(0);

  /* Autoplay */
  if (autoplay) {
    const wrap = track.closest('.carousel');
    let timer = setInterval(() => goTo(current + 1), autoplay);
    wrap?.addEventListener('mouseenter', () => clearInterval(timer), { passive: true });
    wrap?.addEventListener('mouseleave', () => {
      timer = setInterval(() => goTo(current + 1), autoplay);
    }, { passive: true });
  }
}

/* ---- Init carousels ---- */
initCarousel({ trackId: 'realTrack',   prevId: 'realPrev',   nextId: 'realNext',   dotsId: 'realDots' });
initCarousel({ trackId: 'presseTrack', prevId: 'pressePrev', nextId: 'presseNext', dotsId: 'presseDots', forceVisible: 1, autoplay: 6000 });

/* ---- Scroll to top ---- */
const scrollBtn = document.getElementById('scrollTop');
if (scrollBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.style.opacity = '1';
      scrollBtn.style.visibility = 'visible';
    } else {
      scrollBtn.style.opacity = '0';
      scrollBtn.style.visibility = 'hidden';
    }
  }, { passive: true });
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
