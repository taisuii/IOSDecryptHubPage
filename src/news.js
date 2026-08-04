import './style.css';
import { $, el, renderChrome } from './layout.js';
import { t, initI18n } from './i18n.js';
import { NEWS_ARTICLES } from './news-data.js';
import { renderMarkdown } from './markdown.js';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------------- article list ---------------- */
function renderList() {
  const root = $('#news-root');
  root.className = 'articles';
  root.innerHTML = '';
  NEWS_ARTICLES.forEach((a, i) => {
    const card = el('a', 'article-card' + (i === 0 ? ' article-card--latest' : ''));
    card.href = `#/${a.slug}`;
    card.innerHTML = `
      <div class="article-card__rail">
        <time datetime="${a.date}">${a.date}</time>
        ${i === 0 ? `<span class="article-card__tag">${t('news.latest')}</span>` : ''}
      </div>
      <div class="article-card__body">
        <h2>${escapeHtml(a.title)}</h2>
        <p>${escapeHtml(a.summary)}</p>
        <div class="article-card__meta">
          ${a.tags.map((tag) => `<code>${escapeHtml(tag)}</code>`).join('')}
          <span class="article-card__more">${t('news.readmore')}</span>
        </div>
      </div>`;
    root.appendChild(card);
  });
}

/* ---------------- article detail ---------------- */
function renderArticle(slug) {
  const a = NEWS_ARTICLES.find((x) => x.slug === slug);
  const root = $('#news-root');
  if (!a) { renderList(); return; }
  root.className = 'article';
  root.innerHTML = `
    <a class="article__back" href="#/">${t('news.back')}</a>
    <header class="article__head">
      <div class="article-card__rail">
        <time datetime="${a.date}">${a.date}</time>
        <span class="article-card__tag">${t('news.article')}</span>
      </div>
      <h1>${escapeHtml(a.title)}</h1>
      <div class="article-card__meta">${a.tags.map((tag) => `<code>${escapeHtml(tag)}</code>`).join('')}</div>
    </header>
    <div class="article__body">${renderMarkdown(a.content)}</div>`;
  root.querySelector('.article__back').addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = '#/';
  });
}

/* ---------------- hash router ---------------- */
function route() {
  const slug = location.hash.replace(/^#\//, '');
  if (slug && NEWS_ARTICLES.some((a) => a.slug === slug)) {
    renderArticle(slug);
  } else {
    renderList();
  }
  window.scrollTo(0, 0);
}

/* ---------------- boot ---------------- */
function boot() {
  renderChrome('news');
  initI18n();
  route();
  window.addEventListener('hashchange', route);
  document.addEventListener('idh:langchange', route);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
