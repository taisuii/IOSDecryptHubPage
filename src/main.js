import './style.css';
import { initHero3D } from './scene/hero3d.js';
import {
  MARQUEE, CAPABILITIES, ALGO_GROUPS, DUMP_STEPS, DUMP_NOTES,
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

/* ---------------- interactive runtime console ---------------- */
const PANEL_TABS = [
  {
    key: 'crypto', label: '加解密', filter: '分类',
    rows: [
      { seq: 118, cat: 'symm', badge: '对称', algo: 'AES-128-CBC', op: 'encrypt', time: '14:32:18.481', inLen: 53, outLen: 64, preview: 'the answer is 42; this is a longer plaintext for AES', key: '00112233445566778899aabbccddeeff', iv: '101112131415161718191a1b1c1d1e1f', input: 'the answer is 42; this is a longer plaintext for AES', output: '8c7e63d05e8b7d0b72e1c8b863fe8ef0…', stack: '0  exercise_runner  test_aes + 0xb8\n1  exercise_runner  main + 0x54' },
      { seq: 117, cat: 'hmac', badge: 'HMAC', algo: 'HMAC-SHA256 (streaming)', op: 'digest', time: '14:32:18.436', inLen: 26, outLen: 32, preview: 'important transaction data', key: '7368617265642d7365637265742d6b6579', input: 'important transaction data', output: '270f6edcd7b2811fb982279661d143c8…', stack: '0  exercise_runner  test_hmac + 0x104\n1  exercise_runner  main + 0x4c' },
      { seq: 116, cat: 'hmac', badge: 'HMAC', algo: 'HMAC-SHA1', op: 'digest', time: '14:32:18.431', inLen: 26, outLen: 20, preview: 'important transaction data', key: '7368617265642d7365637265742d6b6579', input: 'important transaction data', output: '4eaef67d8a9f8c49523c7771d692370b…', stack: '0  exercise_runner  test_hmac + 0x98\n1  exercise_runner  main + 0x4c' },
      { seq: 115, cat: 'digest', badge: '摘要', algo: 'SHA256 (streaming)', op: 'digest', time: '14:32:18.420', inLen: 43, outLen: 32, preview: 'the quick brown fox jumps over the lazy dog', input: 'the quick brown fox jumps over the lazy dog', output: '05c6e08f1d9fdafa031a9ce2d9cafa01…', stack: '0  exercise_runner  test_digests + 0x1d8\n1  exercise_runner  main + 0x44' },
      { seq: 114, cat: 'digest', badge: '摘要', algo: 'SHA512', op: 'digest', time: '14:32:18.416', inLen: 43, outLen: 64, preview: 'the quick brown fox jumps over the lazy dog', input: 'the quick brown fox jumps over the lazy dog', output: '05c6e08f1d9fdafa031a9ce2d9cafa01…', stack: '0  exercise_runner  test_digests + 0x160\n1  exercise_runner  main + 0x44' },
      { seq: 113, cat: 'digest', badge: '摘要', algo: 'SHA256', op: 'digest', time: '14:32:18.412', inLen: 43, outLen: 32, preview: 'the quick brown fox jumps over the lazy dog', input: 'the quick brown fox jumps over the lazy dog', output: '05c6e08f1d9fdafa031a9ce2d9cafa01…', stack: '0  exercise_runner  test_digests + 0xf0\n1  exercise_runner  main + 0x44' },
      { seq: 112, cat: 'digest', badge: '摘要', algo: 'SHA1', op: 'digest', time: '14:32:18.409', inLen: 43, outLen: 20, preview: 'the quick brown fox jumps over the lazy dog', input: 'the quick brown fox jumps over the lazy dog', output: '2fd4e1c67a2d28fced849ee1bb76e739…', stack: '0  exercise_runner  test_digests + 0xb4\n1  exercise_runner  main + 0x44' },
      { seq: 111, cat: 'digest', badge: '摘要', algo: 'MD5', op: 'digest', time: '14:32:18.405', inLen: 43, outLen: 16, preview: 'the quick brown fox jumps over the lazy dog', input: 'the quick brown fox jumps over the lazy dog', output: '9e107d9d372bb6826bd81d3542a419d6', stack: '0  exercise_runner  test_digests + 0x58\n1  exercise_runner  main + 0x44' },
      { seq: 109, cat: 'asym', badge: '非对称', algo: 'RSA-2048', op: 'sign', time: '14:32:18.382', inLen: 19, outLen: 256, preview: 'transfer 100 to bob', input: 'transfer 100 to bob', output: '31fa882d443f150952469efd5b5d02fa…', stack: '0  Security  SecKeyCreateSignature + 0x0\n1  exercise_runner  test_rsa + 0xdc' },
      { seq: 107, cat: 'kdf', badge: 'KDF', algo: 'PBKDF2-HMAC-SHA256', op: 'derive (rounds=10000)', time: '14:32:18.320', inLen: 13, outLen: 32, preview: 'user-password', key: 'salt: 73616c7473616c74', input: 'user-password', output: '2f9cf975aac2c866762840d0d1e3b575…', stack: '0  CryptoTestHost  do_pbkdf + 0x60\n1  CryptoTestHost  -[ViewController onPBKDF] + 0x18' },
    ],
  },
  {
    key: 'sys', label: '系统', filter: '类型',
    rows: [
      { seq: 132, cat: 'file', badge: '文件', algo: 'mmap', op: '59 bytes · PROT_READ', time: '14:32:18.812', inLen: 59, outLen: 0, preview: '/tmp/dh_file_probe.bin', input: 'sekret-token=abc123; device_id=DEADBEEF; probe file content', output: '', stack: '0  exercise_runner  test_file + 0xe8\n1  exercise_runner  main + 0x68' },
      { seq: 131, cat: 'file', badge: '文件', algo: 'read', op: '59 bytes', time: '14:32:18.809', inLen: 59, outLen: 0, preview: '/tmp/dh_file_probe.bin', input: 'sekret-token=abc123; device_id=DEADBEEF; probe file content', output: '', stack: '0  exercise_runner  test_file + 0xb8\n1  exercise_runner  main + 0x68' },
      { seq: 130, cat: 'file', badge: '文件', algo: 'write', op: '59 bytes', time: '14:32:18.804', inLen: 59, outLen: 0, preview: '/tmp/dh_file_probe.bin', input: 'sekret-token=abc123; device_id=DEADBEEF; probe file content', output: '', stack: '0  exercise_runner  test_file + 0x58\n1  exercise_runner  main + 0x68' },
      { seq: 128, cat: 'sys', badge: '系统', algo: 'ptrace', op: '已空转', time: '14:32:18.780', inLen: 0, outLen: 0, preview: 'PT_DENY_ATTACH 被拦截（反调试绕过）', input: '', output: '', stack: '0  exercise_runner  test_env + 0xc4\n1  exercise_runner  main + 0x74' },
      { seq: 126, cat: 'sys', badge: '系统', algo: 'access', op: '已隐藏', time: '14:32:18.771', inLen: 0, outLen: 0, preview: '/bin/bash', input: '', output: '', stack: '0  exercise_runner  test_env + 0x24\n1  exercise_runner  main + 0x74' },
      { seq: 124, cat: 'sys', badge: '系统', algo: 'dlsym', op: '重定向', time: '14:32:18.739', inLen: 0, outLen: 0, preview: 'CCCrypt → hook_CCCrypt', input: '', output: '', stack: '0  CryptoTestHost  do_dlsym + 0x50\n1  CryptoTestHost  -[ViewController onDlsym] + 0x18' },
    ],
  },
  {
    key: 'net', label: '网络', filter: '方法',
    rows: [
      { seq: 141, cat: 'net', badge: '网络', algo: 'POST', op: '200 OK', time: '14:32:19.104', inLen: 34, outLen: 148, preview: 'http://127.0.0.1:8088/', input: '{"probe":"test","secret":"s3cr3t"}', output: 'HTTP/1.1 200 OK', stack: '0  Foundation  -[NSURLSession dataTaskWithRequest:]\n1  exercise_runner  test_network + 0xd4' },
      { seq: 140, cat: 'net', badge: '网络', algo: 'X-Validator', op: 'request header', time: '14:32:19.099', inLen: 32, outLen: 44, preview: 'base64(SHA256(body))', input: '{"probe":"test","secret":"s3cr3t"}', output: '0P0DMvVWMaRirWPYYNw0H9G3dKXxFq9O…', stack: '0  exercise_runner  test_network + 0x88\n1  exercise_runner  main + 0x80' },
    ],
  },
  {
    key: 'keychain', label: 'Keychain', filter: '操作',
    rows: [
      { seq: 138, cat: 'keychain', badge: 'Keychain', algo: 'SecItemDelete', op: 'status=0', time: '14:32:18.930', inLen: 0, outLen: 0, preview: 'service=com.dh.probe.service · account=probe-account', input: 'generic password attributes', output: 'errSecSuccess', stack: '0  exercise_runner  test_keychain + 0x230\n1  exercise_runner  main + 0x70' },
      { seq: 137, cat: 'keychain', badge: 'Keychain', algo: 'SecItemUpdate', op: 'status=0', time: '14:32:18.921', inLen: 17, outLen: 0, preview: 'kc-secret-ROTATED', input: 'kc-secret-ROTATED', output: 'errSecSuccess', stack: '0  exercise_runner  test_keychain + 0x1d4\n1  exercise_runner  main + 0x70' },
      { seq: 136, cat: 'keychain', badge: 'Keychain', algo: 'SecItemCopyMatching', op: 'status=0', time: '14:32:18.913', inLen: 0, outLen: 22, preview: 'kc-secret-token-9f8e7d', input: 'service=com.dh.probe.service', output: 'kc-secret-token-9f8e7d', stack: '0  exercise_runner  test_keychain + 0x154\n1  exercise_runner  main + 0x70' },
      { seq: 135, cat: 'keychain', badge: 'Keychain', algo: 'SecItemAdd', op: 'status=0', time: '14:32:18.904', inLen: 22, outLen: 0, preview: 'kc-secret-token-9f8e7d', input: 'kc-secret-token-9f8e7d', output: 'errSecSuccess', stack: '0  exercise_runner  test_keychain + 0xd0\n1  exercise_runner  main + 0x70' },
    ],
  },
  {
    key: 'files', label: '文件', filter: '路径',
    rows: [
      { seq: 6, cat: 'file', badge: '目录', algo: 'Documents', op: '目录', time: '刚刚', inLen: 0, outLen: 0, preview: 'iosdh_test.txt · 59 B', input: 'IOSDecryptHub file hook test - 文件操作测试数据', output: '', stack: '' },
      { seq: 5, cat: 'file', badge: '文件', algo: 'iosdh_test.txt', op: '59 B', time: '刚刚', inLen: 59, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'IOSDecryptHub file hook test - 文件操作测试数据', output: '', stack: '' },
    ],
  },
  { key: 'symbols', label: '符号', filter: '镜像', rows: [
    { seq: 4, cat: 'sys', badge: 'Mach-O', algo: 'CryptoTestHost', op: '42 imports', time: 'bound', inLen: 0, outLen: 0, preview: 'CCCrypt · CCHmac · CC_SHA256 · SecKeyCreateSignature', input: 'CCCrypt\nCCHmac\nCC_SHA256\nSecKeyCreateSignature\nSecItemAdd', output: 'fishhook rebindable', stack: '' },
    { seq: 3, cat: 'sys', badge: 'dylib', algo: 'decrypt_helper.dylib', op: '124 hooks', time: 'loaded', inLen: 0, outLen: 0, preview: 'all hook health checks passed', input: 'arm64 · Mach-O 64-bit dynamically linked shared library', output: '124 / 124 installed', stack: '' },
  ] },
  { key: 'dump', label: 'Dump', filter: '镜像', rows: [
    { seq: 2, cat: 'sys', badge: 'Mach-O', algo: 'CryptoTestHost', op: '可导出', time: 'ready', inLen: 0, outLen: 0, preview: 'cryptid=1 · 24.3 MB · arm64', input: 'load_address: 0x1029a8000\ncryptoff: 0x4000\ncryptsize: 0x16a0000', output: '裸解密二进制 / 可重签 IPA', stack: '' },
  ] },
];

function initMockPanel() {
  const host = $('#mock-panel');
  host.innerHTML = `
    <div class="rc__header">
      <div class="rc__brand"><span class="rc__mark">DH</span><b>IOSDecryptHub</b><span>Runtime Console</span></div>
      <div class="rc__stats"><i></i><b id="rc-total">141</b> 条 · hooks <b>124/124</b></div>
      <div class="rc__actions">
        <label><input type="checkbox" id="rc-auto" checked> 自动刷新</label>
        <button type="button" data-demo-action="download">下载全部日志</button>
        <button type="button" data-demo-action="diag">审查日志</button>
        <button type="button" data-demo-action="mcp">MCP</button>
        <button type="button" class="primary" data-demo-action="settings">设置</button>
      </div>
    </div>
    <div class="rc__proc"><span class="rc__appicon">CT</span><b>Crypto Test</b><span>com.taisuii.cryptotesthost</span><span>PID <b>73582</b></span><span>iOS <b>18.5</b></span><span>iPhone 16 Pro</span><span>RAM <b>8192 MB</b></span></div>
    <div class="rc__tabs" id="mock-tabs"></div>
    <div class="rc__toolbar">
      <div class="rc__filters"><label id="rc-filter-label">分类</label><select id="rc-cat"><option value="all">全部</option></select><input id="rc-search" type="search" placeholder="搜索本类: 算法/路径/明文/Hex…"><span class="rc__size"><label>输入大小</label><input id="rc-min" type="number" min="0" placeholder="0"><span>—</span><input id="rc-max" type="number" min="0" placeholder="不限"><span>B</span></span></div>
      <div class="rc__toolbar-actions"><button type="button" class="warn" id="rc-pause">暂停</button><button type="button" data-demo-action="tab-download">下载本类</button><button type="button" class="danger" id="rc-clear">清空本类</button><button type="button" id="rc-noise">查看噪声 <b>1</b></button><span id="rc-count"></span></div>
    </div>
    <div class="rc__workspace">
      <div class="rc__list" id="mock-list"></div>
      <div class="rc__splitter"></div>
      <div class="rc__detail" id="mock-detail"></div>
    </div>`;

  const tabsHost = $('#mock-tabs', host);
  const list = $('#mock-list', host);
  const detail = $('#mock-detail', host);
  const search = $('#rc-search', host);
  const catSelect = $('#rc-cat', host);
  const minInput = $('#rc-min', host);
  const maxInput = $('#rc-max', host);
  const count = $('#rc-count', host);
  let activeTab = PANEL_TABS[0];
  let selectedSeq = null;
  let paused = false;

  PANEL_TABS.forEach((tab, ti) => {
    const btn = el('button', 'rc__tab' + (ti === 0 ? ' active' : ''), `${tab.label}<b>${tab.rows.length}</b>`);
    btn.addEventListener('click', () => {
      $$('.rc__tab', tabsHost).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = tab;
      search.value = '';
      minInput.value = '';
      maxInput.value = '';
      $('#rc-filter-label', host).textContent = tab.filter;
      updateCategories(tab);
      loadTab(tab);
    });
    tabsHost.appendChild(btn);
  });

  function escapeText(value = '') {
    return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function hexDump(text) {
    if (!text) return '（无数据）';
    const bytes = new TextEncoder().encode(text).slice(0, 64);
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
    const rows = [];
    for (let i = 0; i < hex.length; i += 16) {
      const chunk = hex.slice(i, i + 16);
      const ascii = [...bytes.slice(i, i + 16)].map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      rows.push(`${i.toString(16).padStart(6, '0')}: ${chunk.join(' ').padEnd(47)}  |${ascii}|`);
    }
    return rows.join('\n');
  }

  function renderRowDetail(d) {
    detail.innerHTML = `
      <div class="rcd__head"><h4><i class="cat-${d.cat}"></i>#${d.seq} ${escapeText(d.algo)}</h4><p>${escapeText(d.op)} · ${escapeText(d.time)}</p><div><button type="button" data-copy-detail>复制整条</button>${d.input ? '<button type="button" data-copy-input>复制明文</button>' : ''}</div></div>
      ${d.key ? `<section class="rcd__kv"><b>KEY / IV</b><pre>${escapeText(d.key)}${d.iv ? `\n${escapeText(d.iv)}` : ''}</pre></section>` : ''}
      ${d.input ? `<section class="rcd__io input"><b>输入 / INPUT</b><span>${d.inLen} bytes</span><h5>UTF-8</h5><pre>${escapeText(d.input)}</pre><h5>HexDump</h5><pre>${escapeText(hexDump(d.input))}</pre></section>` : ''}
      ${d.output ? `<section class="rcd__io output"><b>输出 / OUTPUT</b><span>${d.outLen} bytes</span><pre>${escapeText(d.output)}</pre></section>` : ''}
      ${d.stack ? `<details class="rcd__stack"><summary>调用栈（${d.stack.split('\n').length} 帧）</summary><pre>${escapeText(d.stack)}</pre></details>` : ''}`;
    $('[data-copy-detail]', detail)?.addEventListener('click', (event) => copyDemo(`${d.algo}\n${d.input}\n${d.output}`, event.currentTarget));
    $('[data-copy-input]', detail)?.addEventListener('click', (event) => copyDemo(d.input, event.currentTarget));
  }

  function updateCategories(tab) {
    const cats = [...new Set(tab.rows.map((row) => row.cat))];
    catSelect.innerHTML = '<option value="all">全部</option>' + cats.map((cat) => `<option value="${cat}">${({ digest: '摘要', hmac: 'HMAC', symm: '对称', asym: '非对称', kdf: 'KDF', file: '文件', sys: '系统', net: '网络', keychain: 'Keychain' })[cat] || cat}</option>`).join('');
  }

  function filteredRows(tab) {
    const q = search.value.trim().toLowerCase();
    const min = Number(minInput.value || 0);
    const max = Number(maxInput.value || 0);
    return tab.rows.filter((row) => (catSelect.value === 'all' || row.cat === catSelect.value)
      && (!q || `${row.algo} ${row.op} ${row.preview} ${row.input} ${row.output}`.toLowerCase().includes(q))
      && row.inLen >= min && (!max || row.inLen <= max));
  }

  function loadTab(tab) {
    list.innerHTML = '';
    const rows = filteredRows(tab);
    count.textContent = `${rows.length} / ${tab.rows.length}`;
    if (!rows.length) {
      list.innerHTML = '<div class="rc__empty">没有匹配记录</div>';
      detail.innerHTML = '<div class="rc__empty">调整筛选条件后查看详情</div>';
      return;
    }
    rows.forEach((r, ri) => {
      const selected = selectedSeq === r.seq || (!selectedSeq && ri === 0);
      const row = el('button', `rcrow cat-${r.cat}${selected ? ' selected' : ''}`);
      row.innerHTML = `
        <span class="rcrow__top"><span class="rcrow__seq">#${r.seq}</span><span class="rcrow__pill ${r.cat}">${r.badge}</span><strong>${r.algo}</strong><span>${r.op}</span><time>${r.time}</time></span>
        <span class="rcrow__meta">in:${r.inLen}B · out:${r.outLen}B</span><span class="rcrow__preview">${r.preview}</span>`;
      row.addEventListener('click', () => {
        selectedSeq = r.seq;
        $$('.rcrow', list).forEach((n) => n.classList.remove('selected'));
        row.classList.add('selected');
        renderRowDetail(r);
      });
      list.appendChild(row);
    });
    const selected = rows.find((row) => row.seq === selectedSeq) || rows[0];
    selectedSeq = selected.seq;
    renderRowDetail(selected);
  }

  function copyDemo(text, button) {
    navigator.clipboard?.writeText(text).catch(() => {});
    const previous = button.textContent;
    button.textContent = '已复制';
    setTimeout(() => { button.textContent = previous; }, 1200);
  }

  [search, catSelect, minInput, maxInput].forEach((control) => control.addEventListener('input', () => { selectedSeq = null; loadTab(activeTab); }));
  $('#rc-pause', host).addEventListener('click', (event) => {
    paused = !paused;
    event.currentTarget.textContent = paused ? '继续' : '暂停';
    event.currentTarget.classList.toggle('active', paused);
    $('.rc__stats i', host).className = paused ? 'paused' : '';
  });
  $('#rc-clear', host).addEventListener('click', () => {
    list.innerHTML = '<div class="rc__empty">演示面板不会删除测试数据</div>';
    detail.innerHTML = '<div class="rc__empty">插件中清空仅影响内存，落盘日志仍可下载</div>';
    count.textContent = `0 / ${activeTab.rows.length}`;
  });
  $('#rc-noise', host).addEventListener('click', () => {
    search.value = 'MGCopyAnswer';
    list.innerHTML = '<button class="rcrow cat-digest selected"><span class="rcrow__top"><span class="rcrow__seq">#110</span><span class="rcrow__pill digest">摘要</span><strong>MD5</strong><span>噪声</span><time>14:32:18.407</time></span><span class="rcrow__preview">MGCopyAnswerapple-internal-install</span></button>';
    detail.innerHTML = '<div class="rc__empty">该事件命中默认噪声特征，已从主事件流分流。</div>';
    count.textContent = '1 / 1';
  });
  $$('[data-demo-action]', host).forEach((button) => button.addEventListener('click', () => {
    const label = button.dataset.demoAction;
    if (label === 'tab-download' || label === 'download') {
      const blob = new Blob([JSON.stringify(activeTab.rows, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = `iosdecrypthub-${activeTab.key}.json`; link.click();
      URL.revokeObjectURL(link.href);
      return;
    }
    detail.innerHTML = `<div class="rc__empty"><b>${button.textContent.trim()}</b><br>官网演示保留与插件一致的入口；连接设备后由 8088 服务返回真实内容。</div>`;
  }));

  updateCategories(PANEL_TABS[0]);
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
