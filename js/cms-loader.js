/* ============================================================
   INPETTO — CMS Data Loader
   Loads JSON data from _data/ and renders dynamic content
   ============================================================ */

(function () {
  'use strict';

  /* ── FETCH HELPER ── */
  async function fetchJSON(path) {
    try {
      const res = await fetch(path + '?v=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn('[CMS] Could not load:', path, e.message);
      return null;
    }
  }

  /* ── DATE FORMATTER ── */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ── TRUNCATE TEXT ── */
  function truncate(str, len = 120) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len).trim() + '…' : str;
  }

  /* ── SANITISE (basic, for static content) ── */
  function esc(str) {
    return (str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── RE-ATTACH REVEAL OBSERVERS after dynamic render ── */
  function initReveals(container) {
    if (!container) return;
    container.querySelectorAll('.reveal').forEach(el => {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.1 });
      obs.observe(el);
    });
  }

  /* ================================================================
     WORKS / CASE STUDIES
  ================================================================ */
  async function loadWorks() {
    const container = document.getElementById('works-container');
    if (!container) return;

    const data = await fetchJSON('/_data/works.json');
    if (!data || !data.works) return;

    const mode = container.dataset.mode || 'list'; // 'list' | 'grid' | 'preview'
    const limit = parseInt(container.dataset.limit, 10) || 999;
    const works = data.works.slice(0, limit);

    if (mode === 'list') {
      container.innerHTML = works.map((w, i) => `
        <a href="/works/${w.slug}" class="work-item reveal reveal-delay-${Math.min(i + 1, 4)}" data-tags="${esc(w.tags ? w.tags.join(' ') : '')}">
          <span class="work-item__num">0${i + 1}</span>
          <div class="work-item__info">
            <div class="work-item__title">${esc(w.client)}</div>
            <div class="work-item__client">${esc(w.location || w.category)}</div>
          </div>
          <div class="work-item__right">
            <div class="work-item__tags">
              ${(w.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
            </div>
            <div class="work-item__arrow">↗</div>
          </div>
          <div class="work-item__img-wrap">
            <div class="work-item__img-preview ${esc(w.placeholderClass || 'service-img--ecom')}" style="${w.image ? `background-image: url('${esc(w.image)}')` : ''}"></div>
          </div>
        </a>
      `).join('');
    }

    if (mode === 'grid') {
      container.innerHTML = works.map((w, i) => `
        <a href="/works/${w.slug}" class="work-card reveal" data-tags="${esc(w.tags ? w.tags.join(' ') : '')}">
          <div class="work-card__img-wrap">
            <div class="work-card__img ${esc(w.placeholderClass || 'service-img--ecom')}"
                 style="${w.image ? `background-image: url('${esc(w.image)}')` : ''}">
            </div>
          </div>
          <div class="work-card__info">
            <div>
              <div class="work-card__title">${esc(w.title)}</div>
              <div class="work-card__sub">${esc(w.client)} — ${esc((w.tags || []).join(', '))}</div>
            </div>
            <div class="work-card__arrow">↗</div>
          </div>
        </a>
      `).join('');
    }

    initReveals(container);
  }

  /* ================================================================
     BLOG POSTS
  ================================================================ */
  async function loadBlog() {
    const container = document.getElementById('blog-container');
    if (!container) return;

    const data = await fetchJSON('/_data/blog.json');
    if (!data || !data.posts) return;

    const mode  = container.dataset.mode || 'grid'; // 'grid' | 'preview'
    const limit = parseInt(container.dataset.limit, 10) || 999;
    const posts = data.posts.slice(0, limit);

    if (mode === 'grid') {
      container.innerHTML = posts.map((p, i) => {
        const isFeatured = i === 0;
        return `
          <a href="/blog/${p.slug}" class="blog-card${isFeatured ? ' blog-card--featured' : ''} reveal">
            <div class="blog-card__img-wrap">
              <div class="blog-card__img ${p.placeholderClass || 'blog-img--' + ((i % 4) + 1)}"
                   style="${p.image ? `background-image: url('${esc(p.image)}')` : ''}">
              </div>
            </div>
            <div class="blog-card__body">
              <div>
                <div class="blog-card__cat">${esc(p.category || 'Insights')}</div>
                <div class="blog-card__title">${esc(p.title)}</div>
                <div class="blog-card__excerpt">${esc(truncate(p.excerpt || p.description, isFeatured ? 200 : 120))}</div>
              </div>
              <div class="blog-card__meta">
                <span class="blog-card__author">${esc(p.author || 'Inpetto Team')}</span>
                <span class="blog-card__date">${formatDate(p.date)}</span>
              </div>
            </div>
          </a>
        `;
      }).join('');
    }

    if (mode === 'preview') {
      // Horizontal recent posts
      container.innerHTML = posts.map((p, i) => `
        <a href="/blog/${p.slug}" class="blog-card reveal reveal-delay-${i + 1}">
          <div class="blog-card__img-wrap">
            <div class="blog-card__img ${p.placeholderClass || 'blog-img--' + ((i % 4) + 1)}"
                 style="${p.image ? `background-image: url('${esc(p.image)}')` : ''}">
            </div>
          </div>
          <div class="blog-card__body">
            <div>
              <div class="blog-card__cat">${esc(p.category || 'Insights')}</div>
              <div class="blog-card__title">${esc(p.title)}</div>
            </div>
            <div class="blog-card__meta">
              <span class="blog-card__author">${esc(p.author || 'Inpetto Team')}</span>
              <span class="blog-card__date">${formatDate(p.date)}</span>
            </div>
          </div>
        </a>
      `).join('');
    }

    initReveals(container);
  }

  /* ================================================================
     TEAM MEMBERS
  ================================================================ */
  async function loadTeam() {
    const container = document.getElementById('team-container');
    if (!container) return;

    const data = await fetchJSON('/_data/team.json');
    if (!data || !data.team) return;

    container.innerHTML = data.team.map((m, i) => {
      const initials = m.name.split(' ').map(w => w[0]).join('');
      if (m.image) {
        return `
          <div class="team-card team-card--photo reveal reveal-delay-${Math.min(i + 1, 4)}">
            <div class="team-card__img-wrap">
              <div class="team-card__img"
                   style="background-image: url('${esc(m.image)}')">
              </div>
            </div>
            <div class="team-card__info">
              <div class="team-card__name">${esc(m.name)}</div>
              <div class="team-card__role">${esc(m.role)}</div>
            </div>
          </div>`;
      }
      return `
        <div class="team-card team-card--text reveal reveal-delay-${Math.min(i + 1, 4)}">
          <div class="team-card__initial-wrap ${m.placeholderClass || 'team-img--' + ((i % 3) + 1)}">
            <span class="team-card__initial">${esc(initials)}</span>
          </div>
          <div class="team-card__info">
            <div class="team-card__name">${esc(m.name)}</div>
            <div class="team-card__role">${esc(m.role)}</div>
            ${m.bio ? `<div class="team-card__bio">${esc(m.bio)}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    initReveals(container);
  }

  /* ================================================================
     SETTINGS (site-wide dynamic data)
  ================================================================ */
  async function loadSettings() {
    const data = await fetchJSON('/_data/settings.json');
    if (!data) return;

    // Update any [data-setting] elements
    document.querySelectorAll('[data-setting]').forEach(el => {
      const key = el.dataset.setting;
      const val = data[key];
      if (!val) return;
      if (el.tagName === 'A' && key.includes('email')) {
        el.href = 'mailto:' + val;
        el.textContent = val;
      } else if (el.tagName === 'A') {
        el.href = val;
      } else {
        el.textContent = val;
      }
    });
  }

  /* ================================================================
     SINGLE BLOG POST
  ================================================================ */
  async function loadBlogPost() {
    const postContainer = document.getElementById('blog-post-content');
    if (!postContainer) return;

    // Get slug from URL: /blog/why-reels-still-win
    const path  = window.location.pathname.replace(/\/+$/, '');
    const slug  = path.split('/').pop().replace('.html', '');
    const data  = await fetchJSON('/_posts/' + slug + '.json');
    if (!data) {
      postContainer.innerHTML = '<p class="text-muted" style="padding:40px 0">Post not found.</p>';
      return;
    }

    // Populate post elements
    const titleEl    = document.getElementById('post-title');
    const catEl      = document.getElementById('post-cat');
    const dateEl     = document.getElementById('post-date');
    const authorEl   = document.getElementById('post-author');
    const heroImgEl  = document.getElementById('post-hero-img');

    if (titleEl)   titleEl.textContent   = data.title || '';
    if (catEl)     catEl.textContent     = data.category || 'Insights';
    if (dateEl)    dateEl.textContent    = formatDate(data.date);
    if (authorEl)  authorEl.textContent  = data.author || 'Inpetto Team';
    if (heroImgEl && data.image) {
      heroImgEl.style.backgroundImage = `url('${esc(data.image)}')`;
    }

    // Convert markdown-ish content to HTML (basic)
    postContainer.innerHTML = markdownToHTML(data.body || data.content || '');

    // Update page title
    document.title = (data.title || 'Blog') + ' — Inpetto';

    // Load related posts
    loadRelatedPosts(slug, data.category);
  }

  /* Basic markdown → HTML parser */
  function markdownToHTML(md) {
    return md
      .split('\n\n')
      .map(block => {
        if (/^#{3}\s/.test(block)) return `<h3>${block.replace(/^###\s/, '')}</h3>`;
        if (/^#{2}\s/.test(block)) return `<h2>${block.replace(/^##\s/, '')}</h2>`;
        if (/^#{1}\s/.test(block)) return `<h2>${block.replace(/^#\s/, '')}</h2>`;
        if (/^>\s/.test(block))    return `<blockquote><p>${block.replace(/^>\s/, '')}</p></blockquote>`;
        if (/^[-*]\s/.test(block)) {
          const items = block.split('\n').filter(Boolean).map(l => `<li>${l.replace(/^[-*]\s/, '')}</li>`).join('');
          return `<ul>${items}</ul>`;
        }
        return `<p>${block.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>`;
      })
      .join('\n');
  }

  async function loadRelatedPosts(currentSlug, category) {
    const container = document.getElementById('related-container');
    if (!container) return;

    const data = await fetchJSON('/_data/blog.json');
    if (!data || !data.posts) return;

    const related = data.posts
      .filter(p => p.slug !== currentSlug && p.category === category)
      .slice(0, 3);

    if (!related.length) {
      container.closest('.related-posts')?.remove();
      return;
    }

    container.innerHTML = related.map((p, i) => `
      <a href="/blog/${p.slug}" class="blog-card reveal reveal-delay-${i + 1}">
        <div class="blog-card__img-wrap">
          <div class="blog-card__img ${p.placeholderClass || 'blog-img--' + ((i % 4) + 1)}"
               style="${p.image ? `background-image: url('${esc(p.image)}')` : ''}">
          </div>
        </div>
        <div class="blog-card__body">
          <div>
            <div class="blog-card__cat">${esc(p.category || 'Insights')}</div>
            <div class="blog-card__title">${esc(p.title)}</div>
          </div>
          <div class="blog-card__meta">
            <span class="blog-card__author">${esc(p.author || 'Inpetto Team')}</span>
            <span class="blog-card__date">${formatDate(p.date)}</span>
          </div>
        </div>
      </a>
    `).join('');
  }

  /* ================================================================
     INIT — run on DOM ready
  ================================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadWorks();
    loadBlog();
    loadTeam();
    loadBlogPost();
  });

})();
