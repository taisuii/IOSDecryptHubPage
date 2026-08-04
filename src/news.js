import './style.css';
import { $, el, renderChrome } from './layout.js';
import { NEWS_ITEMS } from './data.js';

/* ---------------- news timeline ---------------- */
function initNews() {
  const list = $('#news-list');
  const latest = $('#latest-version');
  if (latest && NEWS_ITEMS.length) latest.textContent = NEWS_ITEMS[0].version;

  NEWS_ITEMS.forEach((item, i) => {
    const entry = el('article', 'news-item' + (i === 0 ? ' news-item--latest' : ''));
    entry.innerHTML = `
      <div class="news-item__rail">
        <time datetime="${item.date}">${item.date}</time>
        ${i === 0 ? '<span class="news-item__tag">最新</span>' : ''}
      </div>
      <div class="news-item__body">
        <h2>${item.title}</h2>
        <div class="news-item__meta">
          <code>${item.version}</code>
        </div>
        <ul>${item.points.map((p) => `<li>${p}</li>`).join('')}</ul>
      </div>`;
    list.appendChild(entry);
  });
}

/* ---------------- boot ---------------- */
function boot() {
  renderChrome('news');
  initNews();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
