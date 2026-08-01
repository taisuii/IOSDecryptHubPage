import './style.css';
import { initHero3D } from './scene/hero3d.js';
import { initMockPanel } from './panel.js';
import {
  MARQUEE, CAPABILITIES, ALGO_GROUPS, DUMP_STEPS, DUMP_NOTES,
  MCP_TOOLS,
} from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- nav ---------------- */
function initNav() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  $('#burger').addEventListener('click', () => nav.classList.toggle('open'));
  $$('.nav__links a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
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

/* ---------------- animated counters ---------------- */
function initCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const node = e.target;
      const end = +node.dataset.count;
      const suffix = node.dataset.suffix || '';
      const text = node.dataset.text;
      if (text) { node.textContent = text; return; }
      if (reduce) { node.textContent = end + suffix; return; }
      const dur = 1200; const t0 = performance.now();
      const step = (now) => {
        const p = Math.max(0, Math.min((now - t0) / dur, 1));
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  $$('.hero__stats dt').forEach((n) => io.observe(n));
}


/* ---------------- marquee ---------------- */
function initMarquee() {
  const track = $('#marquee-track');
  const one = MARQUEE.map((m) => `<span class="marquee__item">${m}</span>`).join('');
  track.innerHTML = one + one; // duplicate for seamless loop
}

/* ---------------- install ---------------- */
function initInstall() {
  $$('.install-copy').forEach((button) => button.addEventListener('click', async () => {
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = '已复制';
    } catch {
      button.textContent = '复制失败';
    }
    setTimeout(() => { button.textContent = label; }, 1200);
  }));
}

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

/* ---------------- interactive runtime console ---------------- */
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


/* ---------------- boot ---------------- */
function boot() {
  initNav();
  initMarquee();
  initInstall();
  initCaps();
  initMockPanel();
  initAlgorithms();
  initDump();
  initMCP();
  initCounters();
  initReveal();
  initHero3D($('#hero-canvas'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
