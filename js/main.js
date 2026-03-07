/* ============================================================
   INPETTO — Main JavaScript
   Preloader · Navigation · Scroll Animations · Cursor
   ============================================================ */

(function () {
  'use strict';

  /* ── UTILS ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ================================================================
     PRELOADER
  ================================================================ */
  function initPreloader() {
    const preloader = $('#preloader');
    if (!preloader) return;

    const counter   = $('#preloader-counter');
    const barFill   = $('#preloader-bar-fill');
    const words     = $$('.preloader__word');
    let count       = 0;
    let wordIdx     = 0;

    // Show first word
    if (words[0]) words[0].classList.add('active');

    // Counter animation
    const counterInterval = setInterval(() => {
      count += Math.floor(Math.random() * 4) + 1;
      if (count >= 100) {
        count = 100;
        clearInterval(counterInterval);
        // Small delay then hide preloader
        setTimeout(hidePreloader, 400);
      }
      if (counter) counter.textContent = String(count).padStart(3, '0');
      if (barFill) barFill.style.width = count + '%';

      // Cycle through words
      const threshold = Math.floor(100 / words.length);
      const nextIdx   = Math.floor(count / threshold);
      if (nextIdx !== wordIdx && nextIdx < words.length) {
        words[wordIdx]?.classList.remove('active');
        wordIdx = nextIdx;
        words[wordIdx]?.classList.add('active');
      }
    }, 28);

    function hidePreloader() {
      preloader.classList.add('hidden');
      document.body.classList.remove('no-scroll');
      // Trigger hero animations
      revealHero();
      // Start scroll observer
      initScrollReveal();
    }
  }

  /* ================================================================
     HERO TEXT REVEAL
  ================================================================ */
  function revealHero() {
    const inners = $$('.hero__line-inner');
    inners.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('revealed');
      }, i * 120);
    });
  }

  /* ================================================================
     SCROLL REVEAL (IntersectionObserver)
  ================================================================ */
  function initScrollReveal() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  /* ================================================================
     NAVIGATION
  ================================================================ */
  function initNav() {
    const nav         = $('.nav');
    const hamburger   = $('.nav__hamburger');
    const drawer      = $('.nav__drawer');
    const drawerLinks = $$('.nav__drawer-link');

    if (!nav) return;

    // Scroll class
    const handleScroll = () => {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Hamburger toggle
    if (hamburger && drawer) {
      hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('open');
        drawer.classList.toggle('open', isOpen);
        document.body.classList.toggle('no-scroll', isOpen);
      });

      // Close on link click
      drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('open');
          drawer.classList.remove('open');
          document.body.classList.remove('no-scroll');
        });
      });
    }

    // Active link based on path
    const path = window.location.pathname.split('/').pop() || 'index.html';
    $$('.nav__link').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  /* ================================================================
     BACK TO TOP
  ================================================================ */
  function initBackToTop() {
    const btn = $('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================================================================
     CURSOR (desktop only)
  ================================================================ */
  function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursorDot  = $('.cursor__dot');
    const cursorRing = $('.cursor__ring');
    const cursor     = $('.cursor');
    if (!cursor) return;

    let mouseX = -100, mouseY = -100;
    let ringX  = -100, ringY  = -100;
    let rafId;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      if (cursorDot) {
        cursorDot.style.left   = mouseX + 'px';
        cursorDot.style.top    = mouseY + 'px';
      }
      // Ring follows with easing
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (cursorRing) {
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top  = ringY + 'px';
      }
      rafId = requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover state
    const hoverEls = $$('a, button, [data-cursor-hover]');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
    });
  }

  /* ================================================================
     COUNTER ANIMATION (stats)
  ================================================================ */
  function initCounters() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const dur    = parseInt(el.dataset.dur, 10) || 2000;
        let start    = 0;
        const step   = target / (dur / 16);
        const tick   = () => {
          start = Math.min(start + step, target);
          el.textContent = prefix + Math.round(start) + suffix;
          if (start < target) requestAnimationFrame(tick);
        };
        tick();
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  /* ================================================================
     MARQUEE (clone for seamless loop)
  ================================================================ */
  function initMarquee() {
    $$('.marquee-track').forEach(track => {
      // Clone items for seamless loop
      const items = [...track.children];
      items.forEach(item => {
        const clone = item.cloneNode(true);
        track.appendChild(clone);
      });
    });
  }

  /* ================================================================
     SMOOTH SCROLL for anchor links
  ================================================================ */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;
        const target = $(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ================================================================
     WORKS PAGE FILTERS
  ================================================================ */
  function initWorkFilters() {
    const filterBtns = $$('.filter-btn');
    const workCards  = $$('.work-card');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter || 'all';
        workCards.forEach(card => {
          const tags = (card.dataset.tags || '').toLowerCase();
          if (filter === 'all' || tags.includes(filter)) {
            card.style.display = '';
            card.style.opacity = '1';
          } else {
            card.style.opacity = '0';
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* ================================================================
     CONTACT FORM HANDLING
  ================================================================ */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      if (btn) {
        btn.textContent = 'Sending…';
        btn.disabled = true;
      }

      // Simulate submission (replace with actual endpoint)
      await new Promise(r => setTimeout(r, 1200));
      showToast('Message sent! We\'ll be in touch soon.');
      form.reset();
      if (btn) {
        btn.textContent = 'Send Message';
        btn.disabled = false;
      }
    });
  }

  /* ================================================================
     TOAST NOTIFICATION
  ================================================================ */
  function showToast(msg) {
    let toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  /* ================================================================
     PAGE TRANSITION (fade in on load)
  ================================================================ */
  function initPageTransition() {
    document.documentElement.style.opacity = '0';
    document.documentElement.style.transition = 'opacity 0.4s ease';
    window.addEventListener('load', () => {
      setTimeout(() => {
        document.documentElement.style.opacity = '1';
      }, 50);
    });

    // Fade out on navigation
    $$('a:not([target="_blank"]):not([href^="#"]):not([href^="mailto"]):not([href^="tel"])').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.documentElement.style.opacity = '0';
        setTimeout(() => {
          window.location.href = href;
        }, 350);
      });
    });
  }

  /* ================================================================
     INIT
  ================================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('no-scroll');

    initPreloader();
    initNav();
    initBackToTop();
    initCursor();
    initCounters();
    initMarquee();
    initSmoothScroll();
    initWorkFilters();
    initContactForm();
  });

})();
