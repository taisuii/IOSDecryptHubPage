import './style.css';
import { $, $$, el, renderChrome, initCopyButtons } from './layout.js';
import { t, tpl, getLang, initI18n } from './i18n.js';
import { CAPABILITIES, ALGO_GROUPS, MCP_TOOLS } from './data.js';

const isEn = () => getLang() === 'en';

/* ---------------- capabilities ---------------- */
function initCaps() {
  const grid = $('#caps-grid');
  if (!grid) return;
  grid.innerHTML = '';
  CAPABILITIES.forEach((c, index) => {
    const d = isEn() ? c.en : c;
    const card = el('article', 'cap');
    card.innerHTML = `
      <div class="cap__bar">
        <span class="cap__num">0${index + 1}</span>
        <div class="cap__ico"><svg viewBox="0 0 24 24" fill="none">${c.icon}</svg></div>
      </div>
      <h3>${d.title}</h3>
      <p>${d.desc}</p>
      <div class="cap__tags">${d.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>`;
    grid.appendChild(card);
  });
}

/* ---------------- algorithms ---------------- */
function initAlgorithms() {
  const grid = $('#algo-grid');
  if (!grid) return;
  grid.innerHTML = '';
  ALGO_GROUPS.forEach((g) => {
    const col = el('div', 'acol');
    col.innerHTML = `
      <div class="acol__h"><b>${isEn() ? g.enTitle : g.title}</b><span>${g.items.length}</span></div>
      <div>${g.items.map((i) => `<span class="achip">${i}</span>`).join('')}</div>
      <div class="acol__foot">${isEn() ? g.enNote : g.note}</div>`;
    grid.appendChild(col);
  });
}

/* ---------------- mcp ---------------- */
function highlightJSON(str) {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)"(\s*:)/g, '<span class="j-key">"$1"</span>$2')
    .replace(/:\s*"([^"]*)"/g, ': <span class="j-str">"$1"</span>')
    .replace(/:\s*(\d+)/g, ': <span class="j-num">$1</span>')
    .replace(/(true|false)/g, '<span class="j-num">$1</span>');
}
function initMCP() {
  const listHost = $('#mcp-list');
  if (!listHost) return;
  const nameEl = $('#mcp-name');
  const reqEl = $('#mcp-req');
  const descEl = $('#mcp-desc');
  const inEl = $('#mcp-in');
  const outEl = $('#mcp-out');

  function select(tool, item) {
    $$('.mcp__item', listHost).forEach((n) => n.classList.remove('active'));
    item.classList.add('active');
    item.setAttribute('aria-selected', 'true');
    nameEl.textContent = tool.name;
    reqEl.textContent = tpl('docs.mcp.req', { r: tool.req });
    descEl.textContent = isEn() && tool.desc_en ? tool.desc_en : tool.desc;
    inEl.innerHTML = highlightJSON(tool.in);
    outEl.innerHTML = highlightJSON(tool.out);
  }

  listHost.innerHTML = '';
  MCP_TOOLS.forEach((tool, i) => {
    const item = el('li', 'mcp__item' + (i === 0 ? ' active' : ''));
    item.setAttribute('role', 'tab');
    item.innerHTML = `<span class="mcp__tier">${tool.tier}</span><span class="mcp__tool">${tool.name}</span>`;
    item.addEventListener('click', () => select(tool, item));
    listHost.appendChild(item);
  });
  select(MCP_TOOLS[0], $('.mcp__item', listHost));
}

/* ---------------- toc scrollspy ---------------- */
function initToc() {
  const links = [...$$('.toc a')];
  if (!links.length) return;
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) setActive(e.target.id);
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach((s) => io.observe(s));
  links.forEach((a) => a.addEventListener('click', () => {
    links.forEach((n) => n.classList.remove('active'));
    a.classList.add('active');
  }));
}

/* ---------------- reveal on scroll ---------------- */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((n) => io.observe(n));
}

/* ---------------- boot ---------------- */
function boot() {
  renderChrome('docs');
  initCopyButtons();
  initCaps();
  initAlgorithms();
  initMCP();
  initToc();
  initReveal();
  initI18n();
  document.addEventListener('idh:langchange', () => {
    initCaps();
    initAlgorithms();
    initMCP();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
