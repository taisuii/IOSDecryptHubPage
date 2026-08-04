import './style.css';
import { $, $$, renderChrome, initCopyButtons } from './layout.js';
import { tpl } from './i18n.js';
import { initHero3D } from './scene/hero3d.js';
import { initMockPanel } from './panel.js';
import { DYLIB_DOWNLOAD } from './data.js';

/* ---------------- nav scroll state ---------------- */
function initNav() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------------- dylib download ---------------- */
function initDownload() {
  const card = $('.hero-command--download');
  if (!card) return;
  const link = $('.install-copy--download', card);
  const fileEl = $('.hero-command__line code', card);
  const titleEl = $('.hero-command__meta strong', card);
  const renderTitle = () => { titleEl.textContent = tpl('hero.dl.title', { ver: DYLIB_DOWNLOAD.version }); };
  link.href = DYLIB_DOWNLOAD.url;
  link.setAttribute('download', DYLIB_DOWNLOAD.filename);
  link.setAttribute('aria-label', tpl('hero.dl.title', { ver: DYLIB_DOWNLOAD.version }));
  link.title = `SHA-256: ${DYLIB_DOWNLOAD.sha256}`;
  fileEl.textContent = DYLIB_DOWNLOAD.filename;
  renderTitle();
  document.addEventListener('idh:langchange', renderTitle);
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
  renderChrome('home');
  initNav();
  initCopyButtons();
  initDownload();
  initMockPanel();
  initReveal();
  initHero3D($('#hero-canvas'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
