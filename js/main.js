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
    e.stopPropagation();
    window.location.href = 'portfolio.html';
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

  let resetAutoplay = null;

  prev?.addEventListener('click', () => { goTo(current - 1); resetAutoplay?.(); });
  next?.addEventListener('click', () => { goTo(current + 1); resetAutoplay?.(); });

  /* Touch swipe */
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); resetAutoplay?.(); }
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
    let timer;
    function startTimer() { timer = setInterval(() => goTo(current + 1), autoplay); }
    resetAutoplay = function() { clearInterval(timer); startTimer(); };
    startTimer();
    wrap?.addEventListener('mouseenter', () => clearInterval(timer), { passive: true });
    wrap?.addEventListener('mouseleave', startTimer, { passive: true });
  }
}

/* ---- Init carousels ---- */
initCarousel({ trackId: 'realTrack',   prevId: 'realPrev',   nextId: 'realNext',   dotsId: 'realDots', autoplay: 4500 });
initCarousel({ trackId: 'presseTrack', prevId: 'pressePrev', nextId: 'presseNext', dotsId: 'presseDots', forceVisible: 1, autoplay: 6000 });

/* ---- Scroll to top ---- */
var scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
      scrollTopBtn.style.opacity = '1';
      scrollTopBtn.style.visibility = 'visible';
    } else {
      scrollTopBtn.style.opacity = '0';
      scrollTopBtn.style.visibility = 'hidden';
    }
  });
  scrollTopBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Fix skills-expanded height sur mobile
function fixSkillsHeight() {
  const skillsExpanded = document.querySelector('.skills-expanded');
  if (!skillsExpanded) return;
  if (window.innerWidth <= 900) {
    skillsExpanded.style.height = 'auto';
    skillsExpanded.style.overflow = 'visible';
    skillsExpanded.style.maxHeight = 'none';
  }
  document.querySelectorAll('.skill-entry__desc').forEach(el => {
    el.style.height = 'auto';
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
  });
}
fixSkillsHeight();
window.addEventListener('resize', fixSkillsHeight, { passive: true });

// 20.3 — Portfolio : clic toujours cliquable sur mobile
document.querySelectorAll('.header-nav__link[href="portfolio.html"]').forEach(link => {
  link.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      e.stopPropagation();
      window.location.href = 'portfolio.html';
    }
  });
});

// 20.6 — Galerie : contrôle des flèches via Web Animations API
window.galleryNav = function(btn, dir) {
  const grid = btn.closest('.sub-gallery__inner').querySelector('.sub-gallery__grid');
  const anim = grid && grid.getAnimations()[0];
  if (!anim) return;
  anim.pause();
  const duration = anim.effect.getTiming().duration;
  anim.currentTime = ((anim.currentTime + dir * (duration / 8)) % duration + duration) % duration;
  anim.play();
};

// Curseur personnalisé fleur + cercle décalé
(function() {
  const flower = document.createElement('div');
  flower.id = 'cursor-flower';
  flower.textContent = '✿';
  flower.style.visibility = 'hidden';
  document.body.appendChild(flower);

  const circle = document.createElement('div');
  circle.id = 'cursor-circle';
  circle.style.visibility = 'hidden';
  document.body.appendChild(circle);

  let mouseX = 24, mouseY = 24;
  let circleX = 24, circleY = 24;

  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    flower.style.left = mouseX + 'px';
    flower.style.top = mouseY + 'px';
    flower.style.visibility = 'visible';
    circle.style.visibility = 'visible';
  });

  function animateCircle() {
    circleX += (mouseX - circleX) * 0.12;
    circleY += (mouseY - circleY) * 0.12;
    circle.style.left = circleX + 'px';
    circle.style.top = circleY + 'px';
    requestAnimationFrame(animateCircle);
  }
  animateCircle();
})();
