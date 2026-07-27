import './style.css';
import { initHero3D } from './scene/hero3d.js';
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
/* ---------------- interactive runtime console (web-panel replica) ---------------- */
const PANEL_TABS = [
  {
    key: 'crypto', label: '加解密', count: 14,
    rows: [
      { seq: 2713, cat: 'digest', badge: '摘要', algo: 'MD5', op: 'digest', time: '2026-07-25 01:13:04.686', inLen: 6, outLen: 16, preview: '(null)', input: '(null)', output: 'd41d8cd98f00b204e9800998ecf8427e', key: '', iv: '', stack: '0  CryptoTestHost  -[TestVC onMD5] + 0x38\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64\n2  UIKitCore  -[UIApplication sendAction:to:from:forEvent:] + 0x9c' },
      { seq: 2712, cat: 'symm', badge: '对称', algo: 'AES-128-CBC-NoPad', op: 'decrypt', time: '2026-07-25 01:13:04.181', inLen: 64, outLen: 64, preview: '8407bb3e9014f1b56d9b0d90219ad21e49332eda12298df6a316ba1db5031cd5', input: '8407bb3e9014f1b56d9b0d90219ad21e49332eda12298df6a316ba1db5031cd58c7e63d05e8b7d0b72e1c8b863fe8ef0', output: 'the answer is 42; this is a longer plaintext for AES\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c', key: '00112233445566778899aabbccddeeff', iv: '101112131415161718191a1b1c1d1e1f', stack: '0  CryptoTestHost  -[TestVC onAES] + 0xc8\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2711, cat: 'symm', badge: '对称', algo: 'AES-128-CBC-NoPad', op: 'encrypt', time: '2026-07-25 01:13:04.086', inLen: 1040, outLen: 1040, preview: '1f8b08000000000000138d544d6fdb461095646b6dc931e2c4c5de0204861124', input: '1f8b08000000000000138d544d6fdb461095646b6dc931e2c4c5de0204861124...(1040B)', output: '8407bb3e9014f1b56d9b0d90219ad21e...(1040B)', key: '00112233445566778899aabbccddeeff', iv: '101112131415161718191a1b1c1d1e1f', stack: '0  CryptoTestHost  -[TestVC onAES] + 0x88\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2710, cat: 'symm', badge: '对称', algo: 'DES-CBC-PKCS7', op: 'decrypt', time: '2026-07-25 01:13:04.084', inLen: 4128, outLen: 4125, preview: '7908420b76d90b2070f7ecd4387b295db8d0486769129cdd4ccb70a56c72eec5', input: '7908420b76d90b2070f7ecd4387b295d...(4128B)', output: 'decrypt-helper interactive test sample...(4125B)', key: '0001020304050607', iv: '1011121314151617', stack: '0  CryptoTestHost  -[TestVC onDES] + 0xa4\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2709, cat: 'symm', badge: '对称', algo: 'DES-CBC-PKCS7', op: 'encrypt', time: '2026-07-25 01:13:04.083', inLen: 4125, outLen: 4128, preview: '62706c6973743030d40001000200030004000500060007002858247665727369', input: 'decrypt-helper interactive test sample...(4125B)', output: '62706c6973743030d400010002000300...(4128B)', key: '0001020304050607', iv: '1011121314151617', stack: '0  CryptoTestHost  -[TestVC onDES] + 0x68\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2708, cat: 'digest', badge: '摘要', algo: 'MD5', op: 'digest', time: '2026-07-25 01:13:03.935', inLen: 38, outLen: 16, preview: 'decrypt-helper interactive test sample', input: 'decrypt-helper interactive test sample', output: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', key: '', iv: '', stack: '0  CryptoTestHost  -[TestVC onMD5] + 0x38\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2707, cat: 'symm', badge: '对称', algo: '3DES-CBC-PKCS7', op: 'encrypt', time: '2026-07-25 01:13:03.820', inLen: 38, outLen: 48, preview: 'f3a8b1c2d4e5f6a7b8c9d0e1f2a3b4c5', input: 'decrypt-helper interactive test sample', output: 'f3a8b1c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', key: '000102030405060708090a0b0c0d0e0f1011121314151617', iv: '1011121314151617', stack: '0  CryptoTestHost  -[TestVC on3DES] + 0x68\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2706, cat: 'hmac', badge: 'HMAC', algo: 'HMAC-SHA256', op: 'digest', time: '2026-07-25 01:13:03.710', inLen: 38, outLen: 32, preview: 'decrypt-helper interactive test sample', input: 'decrypt-helper interactive test sample', output: '270f6edcd7b2811fb9822796a4e3c8d1e5f7a9b0c2d4e6f8a1b3c5d7e9f0a2b4', key: '7365637265742d6b6579', iv: '', stack: '0  CryptoTestHost  -[TestVC onHMAC] + 0x48\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2705, cat: 'digest', badge: '摘要', algo: 'SHA-256', op: 'digest', time: '2026-07-25 01:13:03.605', inLen: 38, outLen: 32, preview: 'decrypt-helper interactive test sample', input: 'decrypt-helper interactive test sample', output: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', key: '', iv: '', stack: '0  CryptoTestHost  -[TestVC onSHA256] + 0x38\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2704, cat: 'digest', badge: '摘要', algo: 'SHA-1', op: 'digest', time: '2026-07-25 01:13:03.502', inLen: 38, outLen: 20, preview: 'decrypt-helper interactive test sample', input: 'decrypt-helper interactive test sample', output: 'da39a3ee5e6b4b0d3255bfef95601890afd80709', key: '', iv: '', stack: '0  CryptoTestHost  -[TestVC onSHA1] + 0x38\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2703, cat: 'asym', badge: '非对称', algo: 'RSA-2048', op: 'sign', time: '2026-07-25 01:13:03.380', inLen: 38, outLen: 256, preview: 'decrypt-helper interactive test sample', input: 'decrypt-helper interactive test sample', output: '31fa882d443f150952469efd5b5d02fa8c7e63d05e8b7d0b72e1c8b863fe8ef0...(256B)', key: '', iv: '', stack: '0  Security  SecKeyCreateSignature + 0x0\n1  CryptoTestHost  -[TestVC onRSASign] + 0xdc' },
      { seq: 2702, cat: 'asym', badge: '非对称', algo: 'RSA-2048', op: 'encrypt', time: '2026-07-25 01:13:03.210', inLen: 38, outLen: 256, preview: 'decrypt-helper interactive test sample', input: 'decrypt-helper interactive test sample', output: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8...(256B)', key: '', iv: '', stack: '0  Security  SecKeyCreateEncryptedData + 0x0\n1  CryptoTestHost  -[TestVC onRSAEnc] + 0xe4' },
      { seq: 2701, cat: 'kdf', badge: 'KDF', algo: 'PBKDF2-HMAC-SHA256', op: 'derive (rounds=10000)', time: '2026-07-25 01:13:03.105', inLen: 13, outLen: 32, preview: 'user-password', input: 'user-password', output: '2f9cf975aac2c866762840d0d1e3b575a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', key: 'salt: 73616c7473616c74', iv: '', stack: '0  CryptoTestHost  -[TestVC onPBKDF] + 0x60\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2700, cat: 'symm', badge: '对称', algo: 'RC4', op: 'encrypt', time: '2026-07-25 01:13:03.002', inLen: 38, outLen: 38, preview: 'decrypt-helper interactive test sample', input: 'decrypt-helper interactive test sample', output: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7', key: '000102030405060708090a0b0c0d0e0f', iv: '', stack: '0  CryptoTestHost  -[TestVC onRC4] + 0x68\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
    ],
  },
  {
    key: 'sys', label: '系统', count: 8,
    rows: [
      { seq: 2720, cat: 'sys', badge: '系统', algo: 'dlopen', op: 'loaded', time: '2026-07-25 01:13:05.120', inLen: 0, outLen: 0, preview: '/usr/lib/libz.1.dylib', input: '/usr/lib/libz.1.dylib', output: 'handle=0x1a2b3c4d', stack: '0  CryptoTestHost  -[TestVC onDlopen] + 0x48\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2719, cat: 'sys', badge: '系统', algo: 'dlsym', op: '重定向', time: '2026-07-25 01:13:05.080', inLen: 0, outLen: 0, preview: 'CCCrypt → hook_CCCrypt', input: 'CCCrypt', output: 'hook_CCCrypt (redirected)', stack: '0  CryptoTestHost  -[TestVC onDlsym] + 0x50\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2718, cat: 'sys', badge: '系统', algo: 'ptrace', op: '已空转', time: '2026-07-25 01:13:05.040', inLen: 0, outLen: 0, preview: 'PT_DENY_ATTACH 被拦截（反调试绕过）', input: '', output: '', stack: '0  CryptoTestHost  -[TestVC onChkAnti] + 0xc4\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2717, cat: 'sys', badge: '系统', algo: 'access', op: '已隐藏', time: '2026-07-25 01:13:05.020', inLen: 0, outLen: 0, preview: '/Applications/Cydia.app', input: '/Applications/Cydia.app', output: 'ENOENT (hidden)', stack: '0  CryptoTestHost  chk_jailbreak_files + 0x24\n1  CryptoTestHost  -[TestVC onChkJB] + 0x38' },
      { seq: 2716, cat: 'sys', badge: '系统', algo: 'sysctlbyname', op: '伪装', time: '2026-07-25 01:13:04.980', inLen: 0, outLen: 0, preview: 'hw.machine → iPhone15,2', input: 'hw.machine', output: 'iPhone15,2 (spoofed)', stack: '0  CryptoTestHost  chk_device_info + 0x48\n1  CryptoTestHost  -[TestVC onChkDevice] + 0x38' },
      { seq: 2715, cat: 'file', badge: '文件', algo: 'write', op: '49 bytes', time: '2026-07-25 01:13:04.920', inLen: 49, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'IOSDecryptHub file hook test - 文件操作测试数据\n', output: '', stack: '0  CryptoTestHost  -[TestVC onFWrite] + 0x58\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2714, cat: 'file', badge: '文件', algo: 'read', op: '49 bytes', time: '2026-07-25 01:13:04.880', inLen: 49, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'IOSDecryptHub file hook test - 文件操作测试数据\n', output: '', stack: '0  CryptoTestHost  -[TestVC onFRead] + 0xb8\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2713, cat: 'file', badge: '文件', algo: 'unlink', op: 'deleted', time: '2026-07-25 01:13:04.840', inLen: 0, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'Documents/iosdh_test.txt', output: '0 (success)', stack: '0  CryptoTestHost  -[TestVC onFDel] + 0x48\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
    ],
  },
  {
    key: 'net', label: '网络', count: 2,
    rows: [
      { seq: 2722, cat: 'net', badge: '网络', algo: 'POST', op: '200 OK', time: '2026-07-25 01:13:05.310', inLen: 34, outLen: 148, preview: 'http://127.0.0.1:8088/', input: '{"probe":"test","secret":"s3cr3t"}', output: 'HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n...', stack: '0  Foundation  -[NSURLSession dataTaskWithRequest:]\n1  CryptoTestHost  -[TestVC onNetProbe] + 0xd4' },
      { seq: 2721, cat: 'net', badge: '网络', algo: 'X-Validator', op: 'request header', time: '2026-07-25 01:13:05.290', inLen: 32, outLen: 44, preview: 'base64(SHA256(body))', input: '{"probe":"test","secret":"s3cr3t"}', output: '0P0DMvVWMaRirWPYYNw0H9G3dKXxFq9O…', stack: '0  CryptoTestHost  -[TestVC onNetProbe] + 0x88\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
    ],
  },
  {
    key: 'keychain', label: 'Keychain', count: 4,
    rows: [
      { seq: 2726, cat: 'keychain', badge: 'Keychain', algo: 'SecItemDelete', op: 'status=0', time: '2026-07-25 01:13:05.530', inLen: 0, outLen: 0, preview: 'service=com.dh.probe.service · account=probe-account', input: 'generic password attributes', output: 'errSecSuccess', stack: '0  CryptoTestHost  -[TestVC onKCDel] + 0x230\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2725, cat: 'keychain', badge: 'Keychain', algo: 'SecItemUpdate', op: 'status=0', time: '2026-07-25 01:13:05.510', inLen: 17, outLen: 0, preview: 'kc-secret-ROTATED', input: 'kc-secret-ROTATED', output: 'errSecSuccess', stack: '0  CryptoTestHost  -[TestVC onKCUpdate] + 0x1d4\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2724, cat: 'keychain', badge: 'Keychain', algo: 'SecItemCopyMatching', op: 'status=0', time: '2026-07-25 01:13:05.490', inLen: 0, outLen: 22, preview: 'kc-secret-token-9f8e7d', input: 'service=com.dh.probe.service', output: 'kc-secret-token-9f8e7d', stack: '0  CryptoTestHost  -[TestVC onKCRead] + 0x154\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
      { seq: 2723, cat: 'keychain', badge: 'Keychain', algo: 'SecItemAdd', op: 'status=0', time: '2026-07-25 01:13:05.470', inLen: 22, outLen: 0, preview: 'kc-secret-token-9f8e7d', input: 'kc-secret-token-9f8e7d', output: 'errSecSuccess', stack: '0  CryptoTestHost  -[TestVC onKCAdd] + 0x108\n1  CryptoTestHost  -[TestVC triggerByKey:] + 0x64' },
    ],
  },
  { key: 'files', label: '文件', count: 0, rows: [], isSpecial: true, specialMsg: '文件浏览器：连接设备后展示沙盒 Documents / Library / tmp 目录树。' },
  { key: 'symbols', label: '符号', count: 0, rows: [], isSpecial: true, specialMsg: '符号分析：连接设备后展示已加载镜像的函数列表与交叉引用。' },
  { key: 'dump', label: 'Dump', count: 0, rows: [], isSpecial: true, specialMsg: '砸壳 / 脱壳：连接设备后可触发 FairPlay 解密镜像导出。' },
];

function initMockPanel() {
  const host = $('#mock-panel');
  if (!host) return;

  /* ---- build DOM ---- */
  host.innerHTML = `
    <nav class="rc__tabs" role="tablist"></nav>
    <div class="rc__toolbar">
      <div class="rc__toolbar-main">
        <input type="search" class="rc__search" placeholder="搜索本类: 算法/路径/明文/Hex…">
        <button type="button" class="rc__filter-toggle" aria-expanded="false">筛选<span class="rc__chevron">⌄</span></button>
      </div>
      <div class="rc__adv-filters" hidden>
        <span class="rc__filter-field"><label>分类</label><select class="rc__cat-sel"><option value="all">全部</option></select></span>
        <span class="rc__size-filter">
          <label>输入大小</label>
          <input type="number" class="rc__size-min" min="0" placeholder="0">
          <span class="rc__size-sep">—</span>
          <input type="number" class="rc__size-max" min="0" placeholder="不限">
          <span class="rc__size-unit">B</span>
          <span class="rc__size-hint">不限</span>
          <button type="button" class="rc__size-reset">清除</button>
        </span>
      </div>
    </div>
    <div class="rc__workspace">
      <div class="rc__list"></div>
      <div class="rc__splitter"></div>
      <div class="rc__detail"><div class="rc__detail-empty">← 选择左侧一条记录查看详情</div></div>
    </div>`;

  const tabsEl   = $('.rc__tabs', host);
  const search   = $('.rc__search', host);
  const filterBtn = $('.rc__filter-toggle', host);
  const advFilters = $('.rc__adv-filters', host);
  const catSelect = $('.rc__cat-sel', host);
  const minInput  = $('.rc__size-min', host);
  const maxInput  = $('.rc__size-max', host);
  const sizeHint  = $('.rc__size-hint', host);
  const sizeReset = $('.rc__size-reset', host);
  const list      = $('.rc__list', host);
  const detail    = $('.rc__detail', host);

  let activeTab = PANEL_TABS[0];
  let selectedSeq = null;
  let filtersOpen = false;

  /* ---- tab bar ---- */
  PANEL_TABS.forEach((tab) => {
    const btn = el('button', 'rc__tab' + (tab === activeTab ? ' active' : ''));
    btn.setAttribute('role', 'tab');
    btn.innerHTML = `${tab.label}${tab.count ? `<span class="rc__tab-n">${tab.count}</span>` : ''}`;
    btn.addEventListener('click', () => {
      activeTab = tab;
      selectedSeq = null;
      $$('.rc__tab', tabsEl).forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      updateCategories(tab);
      loadTab(tab);
    });
    tabsEl.appendChild(btn);
  });

  /* ---- filter toggle ---- */
  filterBtn.addEventListener('click', () => {
    filtersOpen = !filtersOpen;
    advFilters.hidden = !filtersOpen;
    filterBtn.setAttribute('aria-expanded', String(filtersOpen));
    $('.rc__chevron', filterBtn).textContent = filtersOpen ? '⌃' : '⌄';
  });

  /* ---- size hint ---- */
  function updateSizeHint() {
    const mn = minInput.value || '0';
    const mx = maxInput.value || '';
    sizeHint.textContent = mx ? `${mn}–${mx} B` : (minInput.value ? `≥ ${mn} B` : '不限');
  }

  /* ---- categories ---- */
  function updateCategories(tab) {
    const cats = [...new Set(tab.rows.map((r) => r.cat))];
    const catMap = { digest: '摘要', hmac: 'HMAC', symm: '对称', asym: '非对称', kdf: 'KDF', file: '文件', sys: '系统', net: '网络', keychain: 'Keychain' };
    catSelect.innerHTML = '<option value="all">全部</option>' + cats.map((c) => `<option value="${c}">${catMap[c] || c}</option>`).join('');
  }

  /* ---- filtering ---- */
  function filteredRows(tab) {
    if (tab.isSpecial) return [];
    const q = search.value.trim().toLowerCase();
    const min = Number(minInput.value || 0);
    const max = Number(maxInput.value || 0);
    return tab.rows.filter((r) =>
      (catSelect.value === 'all' || r.cat === catSelect.value)
      && (!q || `${r.algo} ${r.op} ${r.preview} ${r.input} ${r.output}`.toLowerCase().includes(q))
      && r.inLen >= min && (!max || r.inLen <= max));
  }

  /* ---- hex helpers ---- */
  function _isHex(s) { return s && /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0; }
  function _hex2str(hex) {
    let s = '';
    for (let i = 0; i < hex.length; i += 2) {
      const b = parseInt(hex.substring(i, i + 2), 16);
      if (b < 32 || b > 126) return null; // not printable
      s += String.fromCharCode(b);
    }
    return s;
  }
  function _str2hex(s) {
    let h = '';
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c < 128) h += c.toString(16).padStart(2, '0');
      else if (c < 2048) h += ((c >> 6) | 0xc0).toString(16).padStart(2, '0') + ((c & 0x3f) | 0x80).toString(16).padStart(2, '0');
      else h += ((c >> 12) | 0xe0).toString(16).padStart(2, '0') + (((c >> 6) & 0x3f) | 0x80).toString(16).padStart(2, '0') + ((c & 0x3f) | 0x80).toString(16).padStart(2, '0');
    }
    return h;
  }
  function _hex2dump(hex) {
    let r = '';
    for (let i = 0; i < hex.length; i += 32) {
      const off = (i / 2).toString(16).padStart(6, '0') + ': ';
      const chunk = hex.substring(i, i + 32);
      let h = '', a = '';
      for (let j = 0; j < chunk.length; j += 2) {
        if (j > 0 && j % 8 === 0) h += ' ';
        h += chunk[j] + chunk[j + 1] + ' ';
        const b = parseInt(chunk.substring(j, j + 2), 16);
        a += (b >= 32 && b < 127) ? String.fromCharCode(b) : '.';
      }
      r += off + h.padEnd(40, ' ') + ' |' + a + '|\n';
    }
    return r.trimEnd();
  }
  function _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function _ioBody(byteLen, raw) {
    if (!raw && byteLen === 0) return '<div class="rc__io-meta">0 bytes</div>';
    const isHex = _isHex(raw);
    const hex = isHex ? raw : _str2hex(raw || '');
    const utf8 = isHex ? _hex2str(raw) : raw;
    const dump = _hex2dump(hex);
    let b = '<div class="rc__io-meta">' + byteLen + ' bytes</div>';
    if (utf8) b += '<h3>UTF-8</h3><pre class="rc__pre">' + _esc(utf8) + '</pre>';
    b += '<h3>Hex</h3><pre class="rc__pre rc__pre--hex">' + _esc(hex) + '</pre>';
    if (dump) b += '<h3>HexDump</h3><pre class="rc__pre rc__pre--hex rc__pre--dump">' + _esc(dump) + '</pre>';
    return b;
  }

  /* ---- render detail ---- */
  function renderDetail(r) {
    const catCls = r.cat;
    let html = '<div class="rc__detail-head">' +
      '<h2><span class="rc__cat-dot ' + catCls + '"></span>#' + r.seq + '  ' + _esc(r.algo) + '</h2>' +
      '<div class="rc__detail-sub">' + _esc(r.op) + ' · ' + _esc(r.time) + '</div>' +
      '<div class="rc__detail-actions">' +
        '<button type="button" class="rc__copy-btn" data-copyall="' + r.seq + '">复制整条</button>' +
        (r.input ? '<button type="button" class="rc__copy-btn" data-copyfield="input">复制明文</button>' : '') +
        (r.input ? '<button type="button" class="rc__copy-btn" data-copyfield="input-hex">复制 Hex</button>' : '') +
      '</div></div>';

    if (r.key) html += '<div class="rc__io-section rc__io-kv"><div class="rc__io-label rc__io-label--kv">KEY</div><pre class="rc__pre rc__pre--hex">' + _esc(r.key) + '</pre></div>';
    if (r.iv)  html += '<div class="rc__io-section rc__io-kv"><div class="rc__io-label rc__io-label--kv">IV</div><pre class="rc__pre rc__pre--hex">' + _esc(r.iv) + '</pre></div>';
    html += '<div class="rc__io-section rc__io-in"><div class="rc__io-label rc__io-label--in">输入 / INPUT</div>' + _ioBody(r.inLen, r.input) + '</div>';
    html += '<div class="rc__io-section rc__io-out"><div class="rc__io-label rc__io-label--out">输出 / OUTPUT</div>' + _ioBody(r.outLen, r.output) + '</div>';
    html += '<details class="rc__callstack"><summary>调用栈 (' + (r.stack || '').split('\n').filter(Boolean).length + ' 帧)</summary><pre class="rc__pre rc__pre--stack">' + _esc(r.stack) + '</pre></details>';
    detail.innerHTML = html;

    /* copy buttons */
    detail.querySelectorAll('.rc__copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        let text = '';
        if (btn.dataset.copyall) {
          text = JSON.stringify(r, null, 2);
        } else if (btn.dataset.copyfield === 'input') {
          text = _isHex(r.input) ? (_hex2str(r.input) || r.input) : (r.input || '');
        } else if (btn.dataset.copyfield === 'input-hex') {
          text = _isHex(r.input) ? r.input : _str2hex(r.input || '');
        }
        navigator.clipboard?.writeText(text).catch(() => {});
        const prev = btn.textContent;
        btn.textContent = '已复制';
        setTimeout(() => { btn.textContent = prev; }, 1200);
      });
    });
  }

  /* ---- render list ---- */
  function loadTab(tab) {
    list.innerHTML = '';
    if (tab.isSpecial) {
      list.innerHTML = `<div class="rc__empty">${tab.specialMsg}</div>`;
      detail.innerHTML = '<div class="rc__detail-empty">← 选择左侧一条记录查看详情</div>';
      return;
    }
    const rows = filteredRows(tab);
    if (!rows.length) {
      list.innerHTML = '<div class="rc__empty">没有匹配记录</div>';
      detail.innerHTML = '<div class="rc__detail-empty">调整筛选条件后查看详情</div>';
      return;
    }
    rows.forEach((r, ri) => {
      const sel = selectedSeq === r.seq;
      const row = el('button', `rcrow cat-${r.cat}${sel ? ' selected' : ''}`);
      row.innerHTML = `
        <span class="rcrow__top">
          <span class="rcrow__seq">#${r.seq}</span>
          <span class="rcrow__pill ${r.cat}">${r.badge}</span>
          <strong>${r.algo}</strong>
          <span class="rcrow__op">${r.op}</span>
          <time>${r.time}</time>
        </span>
        <span class="rcrow__meta">in:${r.inLen}B · out:${r.outLen}B</span>
        <span class="rcrow__preview">${r.preview}</span>`;
      row.addEventListener('click', () => {
        selectedSeq = r.seq;
        $$('.rcrow', list).forEach((n) => n.classList.remove('selected'));
        row.classList.add('selected');
        renderDetail(r);
      });
      list.appendChild(row);
    });
    const first = rows.find((r) => r.seq === selectedSeq);
    if (first) { selectedSeq = first.seq; }
    if (first) { renderDetail(first); } else { detail.innerHTML = '<div class="rc__detail-empty">← 选择左侧一条记录查看详情</div>'; }
  }

  /* ---- events ---- */
  [search, catSelect, minInput, maxInput].forEach((c) => c.addEventListener('input', () => {
    selectedSeq = null;
    updateSizeHint();
    loadTab(activeTab);
  }));
  sizeReset.addEventListener('click', () => {
    minInput.value = '';
    maxInput.value = '';
    updateSizeHint();
    selectedSeq = null;
    loadTab(activeTab);
  });

  /* ---- splitter drag ---- */
  const splitter = $('.rc__splitter', host);
  const listPane = $('.rc__list', host);
  const workspace = $('.rc__workspace', host);
  let dragging = false;
  splitter.addEventListener('mousedown', (e) => {
    dragging = true;
    splitter.classList.add('dragging');
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = workspace.getBoundingClientRect();
    const w = Math.max(220, Math.min(rect.width - 260, e.clientX - rect.left));
    listPane.style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; splitter.classList.remove('dragging'); document.body.style.userSelect = ''; }
  });

  /* ---- keyboard nav (j/k) ---- */
  host.setAttribute('tabindex', '0');
  host.addEventListener('keydown', (e) => {
    if (activeTab.isSpecial) return;
    const rows = filteredRows(activeTab);
    if (!rows.length) return;
    const idx = rows.findIndex((r) => r.seq === selectedSeq);
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = idx < 0 ? 0 : Math.min(rows.length - 1, idx + 1);
      selectedSeq = rows[next].seq;
      loadTab(activeTab);
      const selRow = $('.rcrow.selected', list);
      if (selRow) selRow.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = idx < 0 ? 0 : Math.max(0, idx - 1);
      selectedSeq = rows[prev].seq;
      loadTab(activeTab);
      const selRow = $('.rcrow.selected', list);
      if (selRow) selRow.scrollIntoView({ block: 'nearest' });
    }
  });

  /* ---- init ---- */
  updateCategories(PANEL_TABS[0]);
  updateSizeHint();
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


/* ---------------- boot ---------------- */
function boot() {
  initNav();
  initMarquee();
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
