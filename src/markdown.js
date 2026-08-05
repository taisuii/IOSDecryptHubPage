// Minimal zero-dependency markdown renderer for news articles.
// Supports: #..#### headings, ``` code blocks, inline `code`,
// **bold**, [links](https://...), -/* unordered lists, 1. ordered lists,
// > blockquotes, paragraphs, blank-line separated.

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inCode = false;
  let codeBuf = [];

  const flushCode = () => {
    if (codeBuf.length) out.push(`<pre class="article__code">${escapeHtml(codeBuf.join('\n'))}</pre>`);
    codeBuf = [];
  };

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    if (t.startsWith('```')) {
      if (inCode) { flushCode(); inCode = false; }
      else { inCode = true; }
      i++;
      continue;
    }
    if (inCode) { codeBuf.push(raw); i++; continue; }

    if (!t) { i++; continue; }

    const heading = t.match(/^(#{1,4}) (.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level + 1}>${inline(heading[2])}</h${level + 1}>`);
      i++;
      continue;
    }

    if (/^[-*] /.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().slice(2))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(t)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    if (/^\|.*\|$/.test(t) && i + 1 < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i + 1].trim())) {
      const rows = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        rows.push(cells);
        i++;
      }
      if (rows.length >= 2) {
        const head = rows[0];
        const body = rows.slice(2);
        out.push(
          `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>` +
          `<tbody>${body.map((row) => `<tr>${row.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        );
      }
      continue;
    }

    if (t.startsWith('>')) {
      out.push(`<blockquote>${inline(t.slice(1).trim())}</blockquote>`);
      i++;
      continue;
    }

    out.push(`<p>${inline(t)}</p>`);
    i++;
  }
  if (inCode) flushCode();
  return out.join('\n');
}
