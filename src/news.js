import './style.css';
import { $, el, renderChrome } from './layout.js';
import { t, getLang, initI18n } from './i18n.js';
import { NEWS_ARTICLES } from './news-data.js';
import { renderMarkdown } from './markdown.js';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const pick = (a) => {
  const d = getLang() === 'en' && a.en ? a.en : a;
  return { title: d.title, summary: d.summary, content: d.content };
};

/* ---------------- article list ---------------- */
function renderList() {
  const root = $('#news-root');
  root.className = 'articles';
  root.innerHTML = '';
  NEWS_ARTICLES.forEach((a, i) => {
    const d = pick(a);
    const card = el('a', 'article-card' + (i === 0 ? ' article-card--latest' : ''));
    card.href = `#/${a.slug}`;
    card.innerHTML = `
      <div class="article-card__rail">
        <time datetime="${a.date}">${a.date}</time>
        ${i === 0 ? `<span class="article-card__tag">${t('news.latest')}</span>` : ''}
      </div>
      <div class="article-card__body">
        <h2>${escapeHtml(d.title)}</h2>
        <p>${escapeHtml(d.summary)}</p>
        <span class="article-card__more" aria-hidden="true">→</span>
      </div>`;
    root.appendChild(card);
  });
}

/* ---------------- article detail ---------------- */
function renderArticle(slug) {
  const a = NEWS_ARTICLES.find((x) => x.slug === slug);
  const root = $('#news-root');
  if (!a) { renderList(); return; }
  const d = pick(a);
  root.className = 'article';
  root.innerHTML = `
    <a class="article__back" href="#/">${t('news.back')}</a>
    <header class="article__head">
      <div class="article-card__rail">
        <time datetime="${a.date}">${a.date}</time>
      </div>
      <h1>${escapeHtml(d.title)}</h1>
    </header>
    <div class="article__body">${renderMarkdown(d.content)}</div>`;
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
