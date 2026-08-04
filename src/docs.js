import './style.css';
import { $, $$, el, renderChrome, initCopyButtons } from './layout.js';
import { CAPABILITIES, ALGO_GROUPS, DUMP_STEPS, DUMP_NOTES, MCP_TOOLS } from './data.js';

/* ---------------- capabilities ---------------- */
function initCaps() {
  const grid = $('#caps-grid');
  CAPABILITIES.forEach((c, index) => {
    const card = el('article', 'cap reveal');
    card.innerHTML = `
      <div class="cap__bar">
        <span class="cap__num">0${index + 1}</span>
        <div class="cap__ico"><svg viewBox="0 0 24 24" fill="none">${c.icon}</svg></div>
      </div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="cap__tags">${c.tags.map((t) => `<span>${t}</span>`).join('')}</div>`;
    grid.appendChild(card);
  });
}

/* ---------------- algorithms ---------------- */
function initAlgorithms() {
  const grid = $('#algo-grid');
  ALGO_GROUPS.forEach((g) => {
    const col = el('div', 'acol reveal');
    col.innerHTML = `
      <div class="acol__h"><b>${g.title}</b><span>${g.items.length}</span></div>
      <div>${g.items.map((i) => `<span class="achip">${i}</span>`).join('')}</div>
      <div class="acol__foot">${g.note}</div>`;
    grid.appendChild(col);
  });
}

/* ---------------- dump pipeline ---------------- */
function initDump() {
  const pipe = $('#dump-pipe');
  DUMP_STEPS.forEach((s) => {
    const step = el('div', 'pstep reveal');
    step.innerHTML = `
      <div class="pstep__n">${s.n}</div>
      <div class="pstep__ico"><svg viewBox="0 0 24 24" fill="none">${s.icon}</svg></div>
      <h4>${s.title}</h4>
      <p>${s.desc}</p>
      <span class="pstep__arrow"><svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M5 12h13m0 0-5-5m5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    pipe.appendChild(step);
  });
  const notes = $('#dump-notes');
  DUMP_NOTES.forEach((n) => {
    const note = el('div', 'pnote reveal' + (n.good ? ' good' : ''));
    note.innerHTML = `<b>${n.label}</b><span>${n.text}</span>`;
    notes.appendChild(note);
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
    reqEl.textContent = 'required: ' + tool.req;
    descEl.textContent = tool.desc;
    inEl.innerHTML = highlightJSON(tool.in);
    outEl.innerHTML = highlightJSON(tool.out);
  }

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
  initDump();
  initMCP();
  initToc();
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
