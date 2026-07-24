import './style.css';
import { initHero3D } from './scene/hero3d.js';
import {
  MARQUEE, CAPABILITIES, CAPTURES, ALGO_GROUPS, DUMP_STEPS, DUMP_NOTES,
  MCP_TOOLS, START_STEPS, START_TABS, TERM_LINES,
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
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  $$('.hero__stats dt').forEach((n) => io.observe(n));
}

/* ---------------- typing terminal ---------------- */
function initTerminal() {
  const body = $('#term-body');
  if (!body) return;
  if (reduce) {
    body.innerHTML = TERM_LINES.map((l) => `<span class="${l.c}">${l.t || ' '}</span>`).join('\n');
    return;
  }
  let li = 0, ci = 0;
  const cursor = '<span class="term__cursor"></span>';
  function tick() {
    if (li >= TERM_LINES.length) {
      // hold, then restart
      setTimeout(() => { body.innerHTML = ''; li = 0; ci = 0; tick(); }, 4200);
      return;
    }
    const line = TERM_LINES[li];
    const done = TERM_LINES.slice(0, li).map((l) => `<span class="${l.c}">${l.t || ' '}</span>`).join('\n');
    const partial = line.t.slice(0, ci);
    body.innerHTML = (done ? done + '\n' : '') + `<span class="${line.c}">${partial}</span>` + cursor;
    ci++;
    if (ci > line.t.length) {
      li++; ci = 0;
      setTimeout(tick, 380);
    } else {
      setTimeout(tick, 18 + Math.random() * 26);
    }
  }
  tick();
}

/* ---------------- marquee ---------------- */
function initMarquee() {
  const track = $('#marquee-track');
  const one = MARQUEE.map((m) => `<span class="marquee__item">${m}</span>`).join('');
  track.innerHTML = one + one; // duplicate for seamless loop
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

/* ---------------- capture feed ---------------- */
function renderDetail(host, c) {
  host.innerHTML = `
    <div class="det__head"><span class="fcard__badge b-${c.cat}">${c.badge}</span><h4>${c.algo}</h4></div>
    <div class="det__body">
      ${c.fields.map(([k, v, cls]) => `
        <div class="det__row"><span class="det__k">${k}</span><span class="det__v ${cls || ''}">${v}</span></div>`).join('')}
      <div class="det__block">
        <div class="det__blabel">HEXDUMP</div>
        <pre class="det__hex">${c.hex}</pre>
      </div>
      <div class="det__block">
        <div class="det__blabel">调用栈 · backtrace</div>
        <pre class="det__stack">${c.stack.join('\n')}</pre>
      </div>
    </div>`;
}
function initFeed() {
  const stream = $('#feed-stream');
  const detail = $('#feed-detail');
  let seq = 87;
  let activeIdx = 0;
  renderDetail(detail, CAPTURES[0]);

  function makeCard(c, idx) {
    const card = el('div', 'fcard');
    card.innerHTML = `
      <span class="fcard__badge b-${c.cat}">${c.badge}</span>
      <div class="fcard__main">
        <div class="fcard__algo">${c.algo}</div>
        <div class="fcard__meta">#${seq}  ·  ${c.meta}</div>
      </div>
      <span class="fcard__size">${c.size}</span>`;
    card.addEventListener('click', () => {
      $$('.fcard', stream).forEach((n) => n.classList.remove('active'));
      card.classList.add('active');
      renderDetail(detail, c);
    });
    return card;
  }

  // seed
  CAPTURES.slice(0, 5).forEach((c, i) => stream.appendChild(makeCard(c, i)));
  $('.fcard', stream)?.classList.add('active');

  if (reduce) return;
  let i = 0;
  setInterval(() => {
    seq++;
    i = (i + 1) % CAPTURES.length;
    const card = makeCard(CAPTURES[i], i);
    stream.prepend(card);
    while (stream.children.length > 7) stream.lastElementChild.remove();
  }, 2600);
}

/* ---------------- interactive mock panel ---------------- */
const PANEL_TABS = [
  {
    key: 'crypto', label: '加解密', count: 67,
    rows: [
      { seq: 92, op: 'AES-256-GCM', badge: 'symm', sub: 'EVP_EncryptUpdate · 128 B', time: '18:45:31.204',
        detail: { title: 'AES-256-GCM · encrypt', fields: [['algo', 'AES-256-GCM (AEAD)'], ['key', 'kck_2f…9a (32 B)'], ['iv', 'random 12 B nonce'], ['tag', '4c1a…9f (16 B)'], ['plain', '{"cmd":"unlock","door":7}']], hex: '000000: 7b 22 63 6d 64 22 3a 22  75 6e 6c 6f 63 6b 22 2c  |{"cmd":"unlock",|' } },
      { seq: 90, op: 'HMAC-SHA256', badge: 'hmac', sub: 'CCHmac · 32 B', time: '18:45:30.902',
        detail: { title: 'HMAC-SHA256', fields: [['algo', 'HMAC-SHA256'], ['key', 'server_secret_v3'], ['plain', 'GET/v2/orders?ts=175323']], hex: '000000: 47 45 54 2f 76 32 2f 6f  72 64 65 72 73 3f 74 73  |GET/v2/orders?ts|' } },
      { seq: 86, op: 'RSA-2048 sign', badge: 'asym', sub: 'SecKeyCreateSignature · 256 B', time: '18:45:30.464',
        detail: { title: 'RSA-2048 · sign', fields: [['algo', 'RSA-2048 PKCS1v15-SHA256'], ['key', 'SecKeyRef 0x2803… (private)'], ['plain', 'nonce=8f3a;device=iPhone16']], hex: '000000: 6e 6f 6e 63 65 3d 38 66  33 61 3b 64 65 76 69 63  |nonce=8f3a;devic|' } },
      { seq: 80, op: 'PBKDF2', badge: 'kdf', sub: 'CCKeyDerivationPBKDF · 100000 it', time: '18:45:26.917',
        detail: { title: 'PBKDF2-HMAC-SHA256', fields: [['pass', 'hunter2 (明文口令)'], ['salt', 'f0e1d2c3b4a5 (8 B)'], ['iter', '100000'], ['dk', '2f9c…be (32 B)']], hex: '000000: 68 75 6e 74 65 72 32                              |hunter2|' } },
    ],
  },
  {
    key: 'file', label: '文件', count: 10,
    rows: [
      { seq: 91, op: 'write', badge: 'symm', sub: 'Documents/session.dat · 512 B', time: '18:45:31.010',
        detail: { title: 'write()', fields: [['path', '.../Documents/session.dat'], ['bytes', '512'], ['fd', '7'], ['preview', 'AES blob (base64) …']], hex: '000000: 65 79 4a 30 62 32 74 6c  62 69 49 36 49 6e 4e 72  |eyJ0b2tlbiI6InNr|' } },
      { seq: 88, op: 'unlink', badge: 'kdf', sub: 'tmp/upload_cache.tmp', time: '18:45:30.551',
        detail: { title: 'unlink()', fields: [['path', '.../tmp/upload_cache.tmp'], ['result', '0 (ok)']], hex: '（无数据段）' } },
      { seq: 84, op: 'rename', badge: 'hmac', sub: 'a.part → a.mp4', time: '18:45:29.220',
        detail: { title: 'rename()', fields: [['from', '.../Caches/a.part'], ['to', '.../Caches/a.mp4']], hex: '（无数据段）' } },
      { seq: 79, op: 'open', badge: 'digest', sub: 'Library/keychain.db · O_RDWR', time: '18:45:25.700',
        detail: { title: 'open()', fields: [['path', '.../Library/keychain.db'], ['flags', 'O_RDWR | O_CREAT'], ['fd', '9']], hex: '（无数据段）' } },
    ],
  },
  {
    key: 'system', label: '系统', count: 25,
    rows: [
      { seq: 89, op: 'dlopen', badge: 'evp', sub: '/usr/lib/libcrypto.dylib', time: '18:45:30.700',
        detail: { title: 'dlopen()', fields: [['path', '/usr/lib/libcrypto.dylib'], ['handle', '0x2a1f0'], ['note', '触发 OpenSSL EVP hook 安装']], hex: '（模块加载事件）' } },
      { seq: 83, op: 'dlsym', badge: 'symm', sub: '"CCCrypt" → wrapper', time: '18:45:28.310',
        detail: { title: 'dlsym() · 重定向', fields: [['symbol', 'CCCrypt'], ['returned', 'hook_CCCrypt (wrapper)'], ['reason', '已 hook 符号，堵函数指针旁路']], hex: '（符号解析事件）' } },
      { seq: 78, op: 'dlsym', badge: 'digest', sub: '"CC_MD5" → wrapper', time: '18:45:24.900',
        detail: { title: 'dlsym() · 重定向', fields: [['symbol', 'CC_MD5'], ['returned', 'hook_CC_MD5 (wrapper)']], hex: '（符号解析事件）' } },
    ],
  },
  {
    key: 'symbol', label: '符号', count: 42,
    rows: [
      { seq: '—', op: 'CCCrypt', badge: 'symm', sub: 'import · rebindable', time: 'bound',
        detail: { title: 'CCCrypt', fields: [['kind', 'undefined import'], ['status', 'fishhook rebound'], ['image', 'MyApp']], hex: '__DATA,__la_symbol_ptr' } },
      { seq: '—', op: 'CCHmac', badge: 'hmac', sub: 'import · rebindable', time: 'bound',
        detail: { title: 'CCHmac', fields: [['kind', 'undefined import'], ['status', 'fishhook rebound']], hex: '__DATA,__la_symbol_ptr' } },
      { seq: '—', op: 'SecKeyCreateSignature', badge: 'asym', sub: 'import · rebindable', time: 'bound',
        detail: { title: 'SecKeyCreateSignature', fields: [['kind', 'undefined import'], ['status', 'fishhook rebound']], hex: '__DATA,__got' } },
    ],
  },
  {
    key: 'dump', label: 'Dump', count: 2,
    rows: [
      { seq: '—', op: 'MyApp', badge: 'evp', sub: 'cryptid=1 · encrypted · 24.3 MB', time: 'ready',
        detail: { title: '主程序 · MyApp', fields: [['load_address', '0x1029a8000'], ['cryptid', '1 (encrypted)'], ['action', '导出裸解密二进制 / 重打包 IPA']], hex: 'POST /api/dump?mode=ipa' } },
      { seq: '—', op: 'Core.dylib', badge: 'symm', sub: 'cryptid=1 · Frameworks · 6.1 MB', time: 'ready',
        detail: { title: 'Frameworks/Core.dylib', fields: [['load_address', '0x10a1c0000'], ['cryptid', '1 (encrypted)']], hex: 'POST /api/dump?mode=bin' } },
    ],
  },
];

function initMockPanel() {
  const host = $('#mock-panel');
  host.innerHTML = `
    <div class="mock__top">
      <span class="mock__logo">IOSDecryptHub</span>
      <span class="mock__run">运行中</span>
      <div class="mock__proc">
        <span>Crypto Test · <b>com.taisuii.cryptotesthost</b></span>
        <span>PID <b>73582</b></span>
        <span>iOS <b>26.3.1</b></span>
        <span>arm64 · <b>16 GB</b></span>
      </div>
    </div>
    <div class="mock__tabs" id="mock-tabs"></div>
    <div class="mock__body">
      <div class="mock__list" id="mock-list"></div>
      <div class="mock__detail" id="mock-detail"></div>
    </div>`;

  const tabsHost = $('#mock-tabs', host);
  const list = $('#mock-list', host);
  const detail = $('#mock-detail', host);

  PANEL_TABS.forEach((tab, ti) => {
    const btn = el('button', 'mtab' + (ti === 0 ? ' active' : ''), `${tab.label}<b>${tab.count}</b>`);
    btn.addEventListener('click', () => {
      $$('.mtab', tabsHost).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadTab(tab);
    });
    tabsHost.appendChild(btn);
  });

  function renderRowDetail(d) {
    detail.innerHTML = `
      <div class="det__head"><h4>${d.title}</h4></div>
      <div class="det__body">
        ${d.fields.map(([k, v]) => `<div class="det__row"><span class="det__k">${k}</span><span class="det__v ${k === 'plain' || k === 'pass' || k === 'preview' ? 'plain' : ''}">${v}</span></div>`).join('')}
        <div class="det__block"><div class="det__blabel">HEXDUMP / 数据</div><pre class="det__hex">${d.hex}</pre></div>
      </div>`;
  }

  function loadTab(tab) {
    list.innerHTML = '';
    tab.rows.forEach((r, ri) => {
      const row = el('div', 'mrow' + (ri === 0 ? ' active' : ''));
      row.innerHTML = `
        <div class="mrow__top">
          <span class="mrow__seq">${r.seq === '—' ? '' : '#' + r.seq}</span>
          <span class="fcard__badge b-${r.badge}">${tab.label}</span>
          <span class="mrow__op">${r.op}</span>
          <span class="mrow__time">${r.time}</span>
        </div>
        <div class="mrow__sub">${r.sub}</div>`;
      row.addEventListener('click', () => {
        $$('.mrow', list).forEach((n) => n.classList.remove('active'));
        row.classList.add('active');
        renderRowDetail(r.detail);
      });
      list.appendChild(row);
    });
    renderRowDetail(tab.rows[0].detail);
  }

  loadTab(PANEL_TABS[0]);
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

/* ---------------- get started ---------------- */
function initStart() {
  const steps = $('#start-steps');
  START_STEPS.forEach((s) => {
    steps.appendChild(el('li', null, `<b>${s.b}</b><p>${s.p}</p>`));
  });

  const tabsHost = $('#start-tabs');
  const codeHost = $('#start-code');
  const copyBtn = $('#start-copy');

  function show(tab, btn) {
    $$('.stab', tabsHost).forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    codeHost.innerHTML = tab.code;
  }
  START_TABS.forEach((tab, i) => {
    const btn = el('button', 'stab' + (i === 0 ? ' active' : ''), tab.name);
    btn.addEventListener('click', () => show(tab, btn));
    tabsHost.appendChild(btn);
  });
  codeHost.innerHTML = START_TABS[0].code;

  copyBtn.addEventListener('click', async () => {
    const text = codeHost.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = '已复制';
      setTimeout(() => { copyBtn.textContent = '复制命令'; }, 1600);
    } catch {
      copyBtn.textContent = '复制失败';
      setTimeout(() => { copyBtn.textContent = '复制命令'; }, 1600);
    }
  });
}

/* ---------------- boot ---------------- */
function boot() {
  initNav();
  initMarquee();
  initCaps();
  initFeed();
  initMockPanel();
  initAlgorithms();
  initDump();
  initMCP();
  initStart();
  initTerminal();
  initCounters();
  initReveal();
  initHero3D($('#hero-canvas'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
