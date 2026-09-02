const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Language switcher ---------- */
const langToggle = document.getElementById('langToggle');
const langDropdown = document.getElementById('langDropdown');
const langCurrent = document.getElementById('langCurrent');
if (langToggle && langDropdown) {
  const LANG_LABELS = { en: 'EN', fr: 'FR', es: 'ES', ar: 'AR', it: 'IT', hi: 'HI' };

  function syncLangUI(lang) {
    if (langCurrent) langCurrent.textContent = LANG_LABELS[lang] || 'EN';
    langDropdown.querySelectorAll('button[data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  langToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = langDropdown.classList.contains('open');
    langDropdown.classList.toggle('open', !isOpen);
    langToggle.setAttribute('aria-expanded', String(!isOpen));
  });
  langDropdown.querySelectorAll('button[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (window.HOTEL261_I18N) window.HOTEL261_I18N.setLang(lang);
      syncLangUI(lang);
      langDropdown.classList.remove('open');
      langToggle.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('click', (e) => {
    if (!langToggle.contains(e.target) && !langDropdown.contains(e.target)) {
      langDropdown.classList.remove('open');
      langToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('i18n:ready', (e) => syncLangUI(e.detail.lang));
  if (window.HOTEL261_I18N) syncLangUI(window.HOTEL261_I18N.lang);
}

/* ---------- Dark / light mode toggle ---------- */
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const current = document.documentElement.getAttribute('data-theme') || (systemDark ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
}

/* ---------- Header solid-on-scroll + hide-on-scroll-down + scroll progress ---------- */
const header = document.getElementById('header');
if (header && getComputedStyle(header).position === 'fixed') {
  const progressBar = document.getElementById('scrollProgress');
  const menuOverlayEl = document.getElementById('menuOverlay');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('solid', y > 40);

    const menuOpen = menuOverlayEl && menuOverlayEl.classList.contains('open');
    if (menuOpen || y <= 80) {
      header.classList.remove('nav-hidden');
    } else if (y > lastY + 4) {
      header.classList.add('nav-hidden');
    } else if (y < lastY - 4) {
      header.classList.remove('nav-hidden');
    }
    lastY = y;

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      progressBar.style.width = pct + '%';
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

/* ---------- Subtle hero parallax (on the media wrapper, not the img itself —
   the img already has its own CSS zoom animation on transform, so parallax
   is applied one level up to avoid the two fighting over the same property) ---------- */
const heroMediaWrap = document.querySelector('.hero-media');
const heroEl = document.querySelector('.hero');
if (heroMediaWrap && heroEl && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const onParallax = () => {
    const rect = heroEl.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const shift = window.scrollY * 0.12;
    heroMediaWrap.style.transform = `translateY(${shift}px)`;
  };
  onParallax();
  window.addEventListener('scroll', onParallax, { passive: true });
}

/* ---------- Mobile / full-screen menu ---------- */
const menuBtn = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
if (menuBtn && menuOverlay) {
  function closeMenu() {
    menuBtn.classList.remove('open');
    menuOverlay.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  menuBtn.addEventListener('click', () => {
    const open = menuOverlay.classList.toggle('open');
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menuOverlay.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
}

/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 70 + 'ms';
  revealObserver.observe(el);
});

/* ---------- Animated stat counters ---------- */
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const duration = 1400;
  const start = performance.now();
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('.stat-num').forEach(el => statObserver.observe(el));

/* ---------- Accordion ---------- */
document.querySelectorAll('.acc-trigger').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.acc-item');
    const panel = item.querySelector('.acc-panel');
    const isOpen = item.classList.contains('open');
    item.parentElement.querySelectorAll('.acc-item.open').forEach(other => {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.acc-panel').style.maxHeight = null;
      }
    });
    item.classList.toggle('open', !isOpen);
    panel.style.maxHeight = !isOpen ? panel.scrollHeight + 'px' : null;
  });
});

/* ---------- Testimonial slider (guarded: only on pages that have one) ---------- */
const testiTrack = document.getElementById('testiTrack');
if (testiTrack) {
  const testiSlides = Array.from(testiTrack.children);
  const testiDots = document.getElementById('testiDots');
  let testiIndex = 0;

  if (testiDots) {
    testiSlides.forEach((_, i) => {
      const dot = document.createElement('span');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToTesti(i));
      testiDots.appendChild(dot);
    });
  }

  function goToTesti(i) {
    testiIndex = (i + testiSlides.length) % testiSlides.length;
    testiTrack.style.transform = `translateX(-${testiIndex * 100}%)`;
    if (testiDots) Array.from(testiDots.children).forEach((d, idx) => d.classList.toggle('active', idx === testiIndex));
  }
  testiTrack.style.transition = 'transform .5s var(--ease, ease)';

  const testiPrev = document.getElementById('testiPrev');
  const testiNext = document.getElementById('testiNext');
  if (testiPrev) testiPrev.addEventListener('click', () => goToTesti(testiIndex - 1));
  if (testiNext) testiNext.addEventListener('click', () => goToTesti(testiIndex + 1));

  if (testiSlides.length > 1) {
    let testiTimer = null;
    function startTesti() {
      clearInterval(testiTimer);
      testiTimer = setInterval(() => goToTesti(testiIndex + 1), 6000);
    }
    function stopTesti() {
      clearInterval(testiTimer);
      testiTimer = null;
    }
    startTesti();
    const slider = document.querySelector('.testimonial-slider');
    if (slider) {
      slider.addEventListener('mouseenter', stopTesti);
      slider.addEventListener('mouseleave', startTesti);
    }
  }
}

/* ---------- Gallery: bento grid + lightbox (guarded: only on pages with #bentoGrid) ---------- */
const allGalleryFiles = [
  'images/site/hero-exterior.jpg', 'images/site/family-room.jpg',
  '17913754.jpg', '17913758.jpg', '17913759.jpg',
  '198048347.jpg', '198048452.jpg', '198048631.jpg', '198048733.jpg',
  '198049395.jpg', '198049455.jpg', '198049461.jpg', '198049480.jpg',
  '198049502.jpg', '198049513.jpg', '198049528.jpg', '198049563.jpg',
  '198060689.jpg', '198062262.jpg', '198062707.jpg', '198063065.jpg',
  '198063562.jpg', '198063719.jpg', '198064127.jpg', '198064242.jpg',
  '198064459.jpg', '198064533.jpg', '198064841.jpg', '33184368.jpg'
].map(f => (f.startsWith('images/') ? f : 'images/rooms/' + f));

const bentoGrid = document.getElementById('bentoGrid');
if (bentoGrid) {
  const limit = parseInt(bentoGrid.dataset.limit || String(allGalleryFiles.length), 10);
  const files = allGalleryFiles.slice(0, limit);
  const bentoPattern = ['g-big', 'g-norm', 'g-tall', 'g-norm', 'g-wide', 'g-norm', 'g-norm', 'g-tall', 'g-wide', 'g-norm', 'g-norm', 'g-big'];

  files.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Hotel 261 photo ' + (i + 1);
    img.loading = 'lazy';
    img.className = bentoPattern[i % bentoPattern.length];
    img.dataset.index = i;
    bentoGrid.appendChild(img);
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  if (lightbox && lightboxImg) {
    let currentIndex = 0;

    function openLightbox(index) {
      currentIndex = index;
      lightboxImg.src = files[currentIndex];
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
    function showDelta(delta) {
      currentIndex = (currentIndex + delta + files.length) % files.length;
      lightboxImg.src = files[currentIndex];
    }

    bentoGrid.addEventListener('click', e => {
      if (e.target.tagName === 'IMG') openLightbox(Number(e.target.dataset.index));
    });

    const allPhotosBtn = document.getElementById('allPhotosBtn');
    if (allPhotosBtn) allPhotosBtn.addEventListener('click', () => openLightbox(0));

    const lbClose = document.getElementById('lightboxClose');
    const lbPrev = document.getElementById('lightboxPrev');
    const lbNext = document.getElementById('lightboxNext');
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', () => showDelta(-1));
    if (lbNext) lbNext.addEventListener('click', () => showDelta(1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showDelta(-1);
      if (e.key === 'ArrowRight') showDelta(1);
    });
  }
}

/* ---------- Magnetic buttons (desktop pointer only) ---------- */
if (window.matchMedia('(pointer:fine)').matches) {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* ---------- Hero image rotation (homepage only, via data-images) ---------- */
const heroImg = document.getElementById('heroImg');
if (heroImg && heroImg.dataset.images) {
  let heroSlides;
  try {
    heroSlides = JSON.parse(heroImg.dataset.images);
  } catch (e) {
    heroSlides = null;
  }
  if (heroSlides && heroSlides.length > 1) {
    // Preload the other slides so the crossfade doesn't stall on a slow network.
    heroSlides.slice(1).forEach((slide) => { new Image().src = slide.src; });
    let heroIndex = 0;
    setInterval(() => {
      heroImg.classList.add('fading');
      setTimeout(() => {
        heroIndex = (heroIndex + 1) % heroSlides.length;
        heroImg.src = heroSlides[heroIndex].src;
        heroImg.alt = heroSlides[heroIndex].alt;
        heroImg.classList.remove('fading');
      }, 800);
    }, 6000);
  }
}
