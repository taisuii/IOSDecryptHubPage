import {
  PANEL_DUMP_IMAGES,
  PANEL_FILES,
  PANEL_SYMBOL_IMAGES,
  PANEL_SYMBOLS,
  PANEL_TABS,
} from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const LOG_TABS = PANEL_TABS.filter((tab) => Array.isArray(tab.rows));
const CAT_NAMES = {
  digest: '摘要', hmac: 'HMAC', symm: '对称', asym: '非对称', kdf: 'KDF',
  file: '文件', sys: '系统', net: '网络', keychain: 'Keychain',
};

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function textToHex(value = '') {
  return [...new TextEncoder().encode(value)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexDump(hex = '') {
  if (!/^[0-9a-f]+$/i.test(hex)) return '';
  const rows = [];
  for (let offset = 0; offset < hex.length; offset += 32) {
    const chunk = hex.slice(offset, offset + 32);
    const bytes = chunk.match(/.{1,2}/g) || [];
    const grouped = bytes.map((byte, index) => `${index === 4 || index === 8 || index === 12 ? ' ' : ''}${byte}`).join(' ');
    const ascii = bytes.map((byte) => {
      const code = Number.parseInt(byte, 16);
      return code >= 32 && code < 127 ? String.fromCharCode(code) : '.';
    }).join('');
    rows.push(`${String(offset / 2).padStart(6, '0')}: ${grouped.padEnd(51)} |${ascii}|`);
  }
  return rows.join('\n');
}

function ioBody(byteLength, raw) {
  const value = raw || '';
  const completeHex = /^[0-9a-f]+$/i.test(value) && value.length % 2 === 0;
  const truncatedHex = /^[0-9a-f]+\.\.\.$/i.test(value);
  const hex = completeHex || truncatedHex ? value : textToHex(value);
  let html = `<div class="rc__io-meta">${byteLength} bytes</div>`;
  if (value && !completeHex && !truncatedHex) {
    html += `<h3>UTF-8</h3><pre class="rc__pre">${escapeHTML(value)}</pre>`;
  }
  html += `<h3>Hex</h3><pre class="rc__pre rc__pre--hex">${escapeHTML(hex)}</pre>`;
  const dump = completeHex ? hexDump(hex) : hexDump(textToHex(value));
  if (dump) html += `<h3>HexDump</h3><pre class="rc__pre rc__pre--hex rc__pre--dump">${escapeHTML(dump)}</pre>`;
  return html;
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
}

export function initMockPanel() {
  const host = $('#mock-panel');
  if (!host) return;

  host.innerHTML = `
    <nav class="rc__tabs" role="tablist" aria-label="运行时面板页签"></nav>
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
    <div class="rc__log-pane">
      <div class="rc__workspace">
        <div class="rc__list"></div>
        <div class="rc__splitter" aria-hidden="true"></div>
        <div class="rc__detail"></div>
      </div>
    </div>
    <div class="rc__special-pane" hidden></div>`;

  const tabsEl = $('.rc__tabs', host);
  const toolbar = $('.rc__toolbar', host);
  const logPane = $('.rc__log-pane', host);
  const specialPane = $('.rc__special-pane', host);
  const search = $('.rc__search', host);
  const filterButton = $('.rc__filter-toggle', host);
  const advancedFilters = $('.rc__adv-filters', host);
  const categorySelect = $('.rc__cat-sel', host);
  const minInput = $('.rc__size-min', host);
  const maxInput = $('.rc__size-max', host);
  const sizeHint = $('.rc__size-hint', host);
  const sizeReset = $('.rc__size-reset', host);
  const list = $('.rc__list', host);
  const detail = $('.rc__detail', host);
  const revealed = new Map(LOG_TABS.map((tab) => [tab.key, 1]));
  const tabButtons = new Map();
  let activeTab = PANEL_TABS[0];
  let selectedSeq = null;
  let animationStarted = false;

  function visibleRows(tab) {
    const count = revealed.get(tab.key) || 0;
    return tab.rows.slice(Math.max(0, tab.rows.length - count));
  }

  function filteredRows(tab) {
    const query = search.value.trim().toLowerCase();
    const min = Number(minInput.value || 0);
    const max = Number(maxInput.value || 0);
    return visibleRows(tab).filter((row) => (
      (categorySelect.value === 'all' || row.cat === categorySelect.value)
      && (!query || `${row.algo} ${row.op} ${row.preview} ${row.input} ${row.output}`.toLowerCase().includes(query))
      && row.inLen >= min
      && (!max || row.inLen <= max)
    ));
  }

  function updateTabCount(tab) {
    const badge = $('.rc__tab-n', tabButtons.get(tab.key));
    if (badge) badge.textContent = String(revealed.get(tab.key) || 0);
  }

  function updateCategories(tab) {
    const categories = [...new Set(tab.rows.map((row) => row.cat))];
    categorySelect.innerHTML = '<option value="all">全部</option>' + categories
      .map((category) => `<option value="${category}">${CAT_NAMES[category] || category}</option>`).join('');
  }

  function updateSizeHint() {
    const min = minInput.value || '0';
    const max = maxInput.value || '';
    sizeHint.textContent = max ? `${min}–${max} B` : (minInput.value ? `≥ ${min} B` : '不限');
  }

  function renderDetail(row) {
    let html = `<div class="rc__detail-head">
      <h2><span class="rc__cat-dot ${row.cat}"></span>#${row.seq} ${escapeHTML(row.algo)}</h2>
      <div class="rc__detail-sub">${escapeHTML(row.op)} · ${escapeHTML(row.time)}</div>
      <div class="rc__detail-actions"><button type="button" data-copy="all">复制整条</button>${row.input ? '<button type="button" data-copy="input">复制明文</button>' : ''}</div>
    </div>`;
    if (row.key) html += `<div class="rc__io-section rc__io-kv"><div class="rc__io-label rc__io-label--kv">KEY</div><pre class="rc__pre rc__pre--hex">${escapeHTML(row.key)}</pre></div>`;
    if (row.iv) html += `<div class="rc__io-section rc__io-kv"><div class="rc__io-label rc__io-label--kv">IV</div><pre class="rc__pre rc__pre--hex">${escapeHTML(row.iv)}</pre></div>`;
    html += `<div class="rc__io-section rc__io-in"><div class="rc__io-label rc__io-label--in">输入 / INPUT</div>${ioBody(row.inLen, row.input)}</div>`;
    html += `<div class="rc__io-section rc__io-out"><div class="rc__io-label rc__io-label--out">输出 / OUTPUT</div>${ioBody(row.outLen, row.output)}</div>`;
    html += `<details class="rc__callstack"><summary>调用栈 (${row.stack.split('\n').filter(Boolean).length} 帧)</summary><pre class="rc__pre rc__pre--stack">${escapeHTML(row.stack)}</pre></details>`;
    detail.innerHTML = html;
    $$('[data-copy]', detail).forEach((button) => button.addEventListener('click', () => {
      const value = button.dataset.copy === 'input' ? row.input : JSON.stringify(row, null, 2);
      navigator.clipboard?.writeText(value).catch(() => {});
      const label = button.textContent;
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = label; }, 1000);
    }));
  }

  function renderLogTab(tab) {
    const rows = filteredRows(tab);
    list.innerHTML = '';
    if (!rows.length) {
      list.innerHTML = '<div class="rc__empty">没有匹配记录</div>';
      detail.innerHTML = '<div class="rc__detail-empty">调整筛选条件后查看详情</div>';
      return;
    }
    if (!rows.some((row) => row.seq === selectedSeq)) selectedSeq = rows[0].seq;
    rows.forEach((row) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `rcrow cat-${row.cat}${selectedSeq === row.seq ? ' selected' : ''}`;
      button.innerHTML = `<span class="rcrow__top">
        <span class="rcrow__seq">#${row.seq}</span><span class="rcrow__pill ${row.cat}">${row.badge}</span>
        <strong>${escapeHTML(row.algo)}</strong><span class="rcrow__op">${escapeHTML(row.op)}</span><time>${escapeHTML(row.time)}</time>
      </span><span class="rcrow__meta">in:${row.inLen}B · out:${row.outLen}B</span><span class="rcrow__preview">${escapeHTML(row.preview)}</span>`;
      button.addEventListener('click', () => {
        selectedSeq = row.seq;
        $$('.rcrow', list).forEach((item) => item.classList.remove('selected'));
        button.classList.add('selected');
        renderDetail(row);
      });
      list.appendChild(button);
    });
    renderDetail(rows.find((row) => row.seq === selectedSeq));
  }

  function renderFiles() {
    const defaultFile = PANEL_FILES.find((entry) => entry.path === 'Documents/iosdh_test.txt');
    specialPane.innerHTML = `<div class="rc__files-workspace">
      <aside class="rc__tree-pane"><div class="rc__files-head">沙盒根</div><div class="rc__file-tree"></div></aside>
      <div class="rc__splitter" aria-hidden="true"></div>
      <div class="rc__file-preview"><div class="rc__files-preview-head"><span class="path"></span><span class="meta"></span></div><pre class="rc__files-preview-body"></pre></div>
    </div>`;
    const tree = $('.rc__file-tree', specialPane);
    const previewPath = $('.rc__files-preview-head .path', specialPane);
    const previewMeta = $('.rc__files-preview-head .meta', specialPane);
    const previewBody = $('.rc__files-preview-body', specialPane);
    const selectFile = (entry, button) => {
      if (entry.type !== 'file') return;
      $$('.rc__file-row', tree).forEach((row) => row.classList.remove('selected'));
      button.classList.add('selected');
      previewPath.textContent = entry.path;
      previewMeta.textContent = formatSize(entry.size);
      previewBody.textContent = entry.content;
    };
    PANEL_FILES.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `rc__file-row${entry.path === defaultFile.path ? ' selected' : ''}`;
      button.style.setProperty('--depth', entry.depth);
      button.innerHTML = `<span class="rc__file-icon ${entry.type}">${entry.type === 'dir' ? 'DIR' : 'FILE'}</span><span class="name">${escapeHTML(entry.name)}</span>${entry.size ? `<span class="size">${formatSize(entry.size)}</span>` : ''}`;
      button.addEventListener('click', () => selectFile(entry, button));
      tree.appendChild(button);
    });
    previewPath.textContent = defaultFile.path;
    previewMeta.textContent = formatSize(defaultFile.size);
    previewBody.textContent = defaultFile.content;
  }

  function renderSymbols() {
    specialPane.innerHTML = `<div class="rc__symbols-workspace">
      <aside class="rc__image-pane"><div class="rc__images-head">image 列表 (导入符号均为 fishhook 候选)</div><div class="rc__image-list"></div></aside>
      <div class="rc__splitter" aria-hidden="true"></div>
      <div class="rc__symbol-detail"><div class="rc__symbol-controls"><input type="search" placeholder="过滤符号 (如 SSL / CC / open)…"><span></span></div><div class="rc__symbol-table"></div></div>
    </div>`;
    const imageList = $('.rc__image-list', specialPane);
    const symbolInput = $('.rc__symbol-controls input', specialPane);
    const symbolCount = $('.rc__symbol-controls span', specialPane);
    const symbolTable = $('.rc__symbol-table', specialPane);
    let selectedImage = PANEL_SYMBOL_IMAGES[0];
    const renderTable = () => {
      const query = symbolInput.value.trim().toLowerCase();
      const symbols = (PANEL_SYMBOLS[selectedImage.idx] || []).filter((symbol) => symbol.toLowerCase().includes(query));
      symbolCount.textContent = `${symbols.length} / ${selectedImage.imports} 个`;
      symbolTable.innerHTML = `<table class="rc__table"><thead><tr><th>#</th><th>导入符号 (均为 fishhook 候选)</th></tr></thead><tbody>${symbols.map((symbol, index) => `<tr><td>${index + 1}</td><td class="symbol">${escapeHTML(symbol)}</td></tr>`).join('')}</tbody></table>`;
    };
    PANEL_SYMBOL_IMAGES.forEach((image) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `rc__image-row${image.idx === selectedImage.idx ? ' selected' : ''}`;
      button.innerHTML = `<span class="top"><strong>${escapeHTML(image.name)}</strong><span>${image.kind}</span></span><small>${image.imports} 个导入符号</small>`;
      button.addEventListener('click', () => {
        selectedImage = image;
        $$('.rc__image-row', imageList).forEach((row) => row.classList.remove('selected'));
        button.classList.add('selected');
        symbolInput.value = '';
        renderTable();
      });
      imageList.appendChild(button);
    });
    symbolInput.addEventListener('input', renderTable);
    renderTable();
  }

  function renderDump() {
    specialPane.innerHTML = `<div class="rc__dump-pane"><div class="rc__dump-wrap">
      <h2>应用砸壳 (脱壳 / dump)</h2>
      <p>当前进程已加载的 App Bundle Mach-O 镜像</p>
      <table class="rc__table rc__dump-table"><thead><tr><th>镜像</th><th>类型</th><th>大小</th><th>cryptid</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>${PANEL_DUMP_IMAGES.map((image) => `<tr><td class="symbol">${escapeHTML(image.name)}</td><td>${image.kind}</td><td>${formatSize(image.size)}</td><td>${image.cryptid}</td><td>${image.encrypted ? '已加密' : '未加密'}</td><td><span class="rc__table-action">下载</span></td></tr>`).join('')}</tbody></table>
    </div></div>`;
  }

  function renderSpecial(tab) {
    if (tab.kind === 'files') renderFiles();
    else if (tab.kind === 'symbols') renderSymbols();
    else renderDump();
  }

  function switchTab(tab) {
    activeTab = tab;
    selectedSeq = null;
    $$('.rc__tab', tabsEl).forEach((button) => button.classList.toggle('active', button.dataset.tab === tab.key));
    const isLog = Array.isArray(tab.rows);
    toolbar.hidden = !isLog;
    logPane.hidden = !isLog;
    specialPane.hidden = isLog;
    if (isLog) {
      search.value = '';
      minInput.value = '';
      maxInput.value = '';
      categorySelect.value = 'all';
      updateCategories(tab);
      updateSizeHint();
      renderLogTab(tab);
    } else {
      renderSpecial(tab);
    }
  }

  PANEL_TABS.forEach((tab) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `rc__tab${tab === activeTab ? ' active' : ''}`;
    button.dataset.tab = tab.key;
    button.setAttribute('role', 'tab');
    button.innerHTML = `${tab.label}${Array.isArray(tab.rows) ? `<span class="rc__tab-n">${revealed.get(tab.key)}</span>` : ''}`;
    button.addEventListener('click', () => switchTab(tab));
    tabsEl.appendChild(button);
    tabButtons.set(tab.key, button);
  });

  filterButton.addEventListener('click', () => {
    const open = filterButton.getAttribute('aria-expanded') !== 'true';
    filterButton.setAttribute('aria-expanded', String(open));
    $('.rc__chevron', filterButton).textContent = open ? '⌃' : '⌄';
    advancedFilters.hidden = !open;
  });
  [search, categorySelect, minInput, maxInput].forEach((control) => control.addEventListener('input', () => {
    selectedSeq = null;
    updateSizeHint();
    renderLogTab(activeTab);
  }));
  sizeReset.addEventListener('click', () => {
    minInput.value = '';
    maxInput.value = '';
    selectedSeq = null;
    updateSizeHint();
    renderLogTab(activeTab);
  });

  const splitter = $('.rc__log-pane .rc__splitter', host);
  const workspace = $('.rc__workspace', host);
  let dragging = false;
  splitter.addEventListener('pointerdown', (event) => {
    dragging = true;
    splitter.setPointerCapture(event.pointerId);
    splitter.classList.add('dragging');
  });
  splitter.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const bounds = workspace.getBoundingClientRect();
    const width = Math.max(220, Math.min(bounds.width - 260, event.clientX - bounds.left));
    list.style.width = `${width}px`;
  });
  splitter.addEventListener('pointerup', () => {
    dragging = false;
    splitter.classList.remove('dragging');
  });

  function revealAll() {
    LOG_TABS.forEach((tab) => {
      revealed.set(tab.key, tab.rows.length);
      updateTabCount(tab);
    });
    if (Array.isArray(activeTab.rows)) renderLogTab(activeTab);
  }

  function startCaptureAnimation() {
    if (animationStarted) return;
    animationStarted = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealAll();
      return;
    }
    const pending = LOG_TABS.flatMap((tab) => tab.rows.slice(0, -1).map((row) => ({ tab, row })))
      .sort((a, b) => a.row.time.localeCompare(b.row.time));
    let index = 0;
    const timer = window.setInterval(() => {
      const next = pending[index];
      if (!next) {
        window.clearInterval(timer);
        return;
      }
      revealed.set(next.tab.key, Math.min(next.tab.rows.length, (revealed.get(next.tab.key) || 0) + 1));
      updateTabCount(next.tab);
      if (activeTab.key === next.tab.key) renderLogTab(activeTab);
      index += 1;
    }, 130);
  }

  updateCategories(activeTab);
  updateSizeHint();
  renderLogTab(activeTab);
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      startCaptureAnimation();
      observer.disconnect();
    }
  }, { threshold: 0.25 });
  observer.observe(host);
}
