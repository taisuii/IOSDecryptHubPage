// Shared chrome (nav + footer) for all pages. Zero-dependency vanilla JS.
import { t, getLang, setLang, initI18n } from './i18n.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

const NAV_LINKS = [
  { href: '/', label: 'nav.home', key: 'home' },
  { href: '/docs.html', label: 'nav.docs', key: 'docs' },
  { href: '/news.html', label: 'nav.news', key: 'news' },
];

const BRAND_SVG = `<svg viewBox="0 0 281 251" width="20" height="18" fill="currentColor" aria-hidden="true">
  <g fill-rule="evenodd">
    <path d="M8,36L4,46L19,45L33,48L41,48L50,50L50,52L53,51L55,53L54,56L58,57L57,65L59,66L58,72L54,78L56,77L60,78L56,90L54,93L49,97L53,97L57,95L60,92L60,95L58,98L55,107L55,112L54,114L56,110L60,109L58,115L58,129L61,138L62,127L64,121L66,119L68,121L68,132L70,141L77,158L82,165L80,156L81,137L84,147L90,158L92,160L100,177L101,181L101,188L103,182L103,169L101,163L102,159L106,164L110,172L109,166L111,165L124,178L127,184L127,189L110,205L106,207L96,206L90,207L86,211L86,215L89,212L95,213L125,212L128,211L154,211L165,212L169,214L168,210L165,207L146,204L156,196L163,189L164,194L167,186L169,188L171,180L175,180L184,183L191,187L205,202L223,227L232,236L238,240L247,244L257,246L266,246L268,245L268,242L264,237L267,236L276,237L276,233L263,220L236,189L239,189L247,193L249,193L256,197L265,200L273,201L258,185L228,157L231,156L234,158L239,159L239,156L237,151L224,134L207,115L196,95L188,84L176,73L160,64L158,62L155,61L150,56L145,46L147,46L139,37L142,36L146,38L129,21L127,20L130,19L128,17L122,14L120,12L106,6L95,4L79,5L69,8L61,15L50,17L44,17L27,22L16,28Z"/>
    <path d="M151,180L153,184L153,189L138,204L135,206L123,207L118,205L125,198L131,194L140,186L143,179L147,176Z"/>
    <path d="M97,114L104,135L98,129L96,125L95,116Z"/>
    <path d="M125,68L140,68L147,71L130,72L126,73L122,75L119,78L115,86L115,99L117,108L122,118L128,127L133,133L148,147L146,148L135,140L123,128L114,114L114,113L111,108L108,98L108,88L110,81L113,76L117,72Z"/>
    <path d="M88,53L100,60L104,66L103,70L99,64L101,77L99,80L97,76L97,72L95,68L95,79L90,94L89,101L87,98L87,83L82,93L81,98L82,113L81,116L76,107L75,102L76,86L70,96L69,92L71,88L71,84L68,85L68,83L73,79L74,73L76,69L78,72L78,78L80,71L79,67L80,64L84,70L84,77L84,64L83,59L86,62L89,68L89,71L89,67L87,62L92,62L87,55Z"/>
    <path d="M28,38L34,38L42,36L59,36L66,37L69,41Z"/>
    <path d="M10,40L16,33L24,27L40,22L47,23L43,26L47,26L50,28L49,30L57,30L65,32L71,35L73,37L70,38L65,36L57,35L43,35L21,38L13,41Z"/>
    <path d="M89,20L92,23L92,28L89,31L84,32L80,29L79,27L87,28L89,25L85,24L85,22L87,20Z"/>
  </g>
</svg>`;

/**
 * Render shared nav + footer into #nav / #foot.
 * @param {'home'|'docs'|'news'} active
 */
export function renderChrome(active) {
  const nav = $('#nav');
  if (nav) {
    nav.innerHTML = `
      <a class="nav__brand" href="/" aria-label="IOSDecryptHub">
        <span class="nav__mark" aria-hidden="true">${BRAND_SVG}</span>
        <span class="nav__word">IOSDecrypt<b>Hub</b></span>
      </a>
      <nav class="nav__links" aria-label="navigation">
        ${NAV_LINKS.map((l) => `<a href="${l.href}"${l.key === active ? ' class="active"' : ''}>${t(l.label)}</a>`).join('')}
      </nav>
      <button type="button" class="nav__lang" id="lang-btn" aria-label="${t('lang.label')}">${t('lang.switch')}</button>
      <button class="nav__burger" id="burger" aria-label="menu" type="button">
        <span></span><span></span><span></span>
      </button>`;
    $('#lang-btn')?.addEventListener('click', () => {
      setLang(getLang() === 'zh' ? 'en' : 'zh');
    });
    $('#burger')?.addEventListener('click', () => nav.classList.toggle('open'));
    $$('.nav__links a', nav).forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
    // keep links + switch label in sync when language changes
    document.addEventListener('idh:langchange', () => {
      const linksEl = $('.nav__links', nav);
      if (linksEl) {
        linksEl.innerHTML = NAV_LINKS
          .map((l) => `<a href="${l.href}"${l.key === active ? ' class="active"' : ''}>${t(l.label)}</a>`)
          .join('');
        $$('.nav__links a', nav).forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
      }
      const btn = $('#lang-btn');
      if (btn) {
        btn.textContent = t('lang.switch');
        btn.setAttribute('aria-label', t('lang.label'));
      }
    });
  }

  const foot = $('#foot');
  if (foot) {
    const renderFoot = () => {
      foot.innerHTML = `
        <div class="wrap foot__grid">
          <div class="foot__brand">
            <span class="nav__word">IOSDecrypt<b>Hub</b></span>
            <p>${t('foot.desc')}</p>
            <p class="foot__author">${t('foot.author')} · <a href="https://decrypthub.com">decrypthub.com</a></p>
          </div>
          <div class="foot__links">
            <a href="/docs.html">${t('nav.docs')}</a>
            <a href="/news.html">${t('nav.news')}</a>
            <a href="https://github.com/taisuii/IOSDecryptHub">GitHub</a>
            <a href="https://github.com/taisuii/ios-decrypt-helper/releases">Releases</a>
          </div>
        </div>
        <div class="wrap foot__base">
          <span>${t('foot.copy')}</span>
          <span>${t('foot.built')}</span>
        </div>`;
    };
    renderFoot();
    document.addEventListener('idh:langchange', renderFoot);
  }

  initI18n();
}

export function initCopyButtons() {
  $$('.install-copy[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    const originalLabel = button.getAttribute('aria-label');
    const status = $('.sr-only', button);
    const copyText = async (text) => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
      const input = el('textarea');
      input.value = text;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      if (!copied) throw new Error('copy failed');
    };
    try {
      await copyText(button.dataset.copy);
      button.classList.add('copied');
      button.setAttribute('aria-label', '已复制');
      if (status) status.textContent = '已复制';
    } catch {
      button.classList.add('copy-failed');
      button.setAttribute('aria-label', '复制失败');
      if (status) status.textContent = '复制失败';
    }
    setTimeout(() => {
      button.classList.remove('copied', 'copy-failed');
      button.setAttribute('aria-label', originalLabel);
      if (status) status.textContent = '';
    }, 1400);
  }));
}
