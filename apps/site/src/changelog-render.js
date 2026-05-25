/**
 * Shared rendering for the changelog — used by both the client app
 * (changelog-app.js, for the feed page) and the build script
 * (scripts/build-changelog.mjs, for per-entry static HTML pages).
 *
 * Everything here is pure: no DOM access, no globals. The functions return
 * strings of HTML / SVG you can interpolate anywhere.
 */

// ─── Tiny escape helpers ─────────────────────────────────────────────────
export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
export function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

// ─── Date + text helpers ─────────────────────────────────────────────────
export function formatLongDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function wrapText(text, charsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > charsPerLine) {
      if (cur) lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3); // hard cap so the OG title fits
}

function hueFromString(s) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  return h % 360;
}

// ─── Avatar SVG (inline, for the page) ──────────────────────────────────
export function avatarMarkup(author, size = 28) {
  if (author.avatar) {
    return `<img src="${escapeAttr(author.avatar)}" alt="${escapeAttr(author.name)}" width="${size}" height="${size}">`;
  }
  return avatarSvg(author, size);
}

export function avatarSvg(author, size = 28) {
  const seed = author.initials || author.name || 'NA';
  const hue = hueFromString(seed);
  const id = `g${hue}-${size}`;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${hue}, 65%, 55%)"/>
          <stop offset="1" stop-color="hsl(${(hue + 40) % 360}, 65%, 45%)"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size / 2}" fill="url(#${id})"/>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
            fill="#fff" font-family="system-ui, sans-serif" font-weight="600"
            font-size="${Math.round(size * 0.42)}">
        ${escapeHtml(author.initials || author.name?.[0] || '?')}
      </text>
    </svg>`;
}

// ─── OG card SVG (1200×630, self-contained) ─────────────────────────────
// Palette matches the landing page hero: light gradient + subtle radial
// blue glow, dark text, WP-admin-blue accent for the section eyebrow and
// "AdminCSS" wordmark. Avatar is the visitor-visible warmth: a real
// person's photo (Gravatar) clipped to a circle, with a generated
// gradient fallback for SVG rasterizers that drop external image refs.
export function renderOgSvg(entry) {
  const accent = entry.accent || '#2271b1';
  const date = formatLongDate(entry.date);
  const title = wrapText(entry.title, 24);
  const lineHeight = 72;

  const author = entry.author;
  const hue = hueFromString(author.initials || author.name || 'NA');
  const hasAvatarUrl = Boolean(author.avatar);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6f8fb"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="0%" r="60%" fx="50%" fy="0%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accentStripe" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue}, 65%, 55%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 40) % 360}, 65%, 45%)"/>
    </linearGradient>
    <clipPath id="avatarClip">
      <circle cx="32" cy="32" r="32"/>
    </clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="360" fill="url(#glow)"/>
  <rect x="0" y="0" width="1200" height="4" fill="url(#accentStripe)"/>

  <!-- Brand wordmark, top-left -->
  <g transform="translate(64, 80)">
    <text font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#14181f" letter-spacing="-0.5">
      Plugin <tspan fill="${accent}">SDK</tspan>
    </text>
  </g>

  <!-- Version + date eyebrow -->
  <text x="64" y="200" font-family="ui-monospace, monospace" font-size="14"
        fill="${accent}" font-weight="600" letter-spacing="3">
    v${escapeHtml(entry.version)} · ${date.toUpperCase()}
  </text>

  <!-- Title (wraps over up to 3 lines) -->
  ${title.map((line, i) => `
    <text x="64" y="${260 + i * lineHeight}" font-family="system-ui, sans-serif"
          font-size="56" font-weight="700" fill="#14181f" letter-spacing="-1.5">
      ${escapeHtml(line)}
    </text>
  `).join('')}

  <!-- Author block: avatar + name + handle -->
  <g transform="translate(64, 540)">
    <!-- Fallback gradient + initials painted underneath so the card still
         looks correct if a crawler doesn't follow the external image href. -->
    <circle cx="32" cy="32" r="32" fill="url(#avatarGrad)"/>
    <text x="32" y="32" text-anchor="middle" dominant-baseline="middle"
          fill="#fff" font-family="system-ui, sans-serif" font-weight="600" font-size="24">
      ${escapeHtml(author.initials || '?')}
    </text>
    ${hasAvatarUrl ? `<image href="${escapeAttr(author.avatar)}"
           x="0" y="0" width="64" height="64"
           clip-path="url(#avatarClip)"
           preserveAspectRatio="xMidYMid slice"/>` : ''}
    <text x="84" y="28" font-family="system-ui, sans-serif" font-size="20"
          font-weight="600" fill="#14181f">
      ${escapeHtml(author.name)}
    </text>
    <text x="84" y="52" font-family="system-ui, sans-serif" font-size="16"
          fill="#50575e">
      ${escapeHtml(author.handle || '')}
    </text>
  </g>

  <!-- Tag pills, bottom-right. Light-card aesthetic to match the landing
       page's component cards: white fill, soft border, dark text. -->
  ${(entry.tags || []).slice(0, 3).map((tag, i) => `
    <g transform="translate(${1136 - i * 130}, 555)">
      <rect x="-90" y="-18" width="90" height="32" rx="16"
            fill="#ffffff" stroke="#dcdcde"/>
      <text x="-45" y="0" text-anchor="middle" dominant-baseline="middle"
            font-family="ui-monospace, monospace" font-size="13" fill="#50575e">
        ${escapeHtml(tag)}
      </text>
    </g>
  `).join('')}
</svg>`;
}

// ─── Entry article HTML (the body of an entry on the feed or focus page) ─
/**
 * @param {object} entry
 * @param {{ permalink?: string, includeShareUi?: boolean, ogPreviewSrc?: string }} options
 *   - permalink: absolute URL to the entry's own page (for the "Copy link" button)
 *   - includeShareUi: render the Copy link / Show OG / Download buttons (client-only)
 *   - ogPreviewSrc: src URL for the OG preview <img>. If omitted, the SVG is inlined.
 */
export function renderEntryArticleHtml(entry, options = {}) {
  const { permalink = '#/' + entry.id, includeShareUi = true, ogPreviewSrc = null } = options;

  const ogPreview = ogPreviewSrc
    ? `<img src="${escapeAttr(ogPreviewSrc)}" alt="Open Graph card for ${escapeAttr(entry.title)}" loading="lazy" width="1200" height="630">`
    : renderOgSvg(entry);

  const shareUi = includeShareUi ? `
    <div class="entry-share">
      <div class="entry-share-summary">
        <strong>Share</strong>
        <button class="share-btn" data-action="copy-url" data-url="${escapeAttr(permalink)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span class="label">Copy link</span>
        </button>
        <button class="share-btn" data-action="toggle-og">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
          <span class="label">Show OG card</span>
        </button>
        <button class="share-btn" data-action="download-svg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span class="label">Download SVG</span>
        </button>
      </div>
      <div class="og-preview" hidden>
        ${ogPreview}
        <div class="og-preview-caption">
          <span>1200×630 — also hosted at <code>/og/${escapeHtml(entry.id)}.png</code></span>
        </div>
      </div>
    </div>` : '';

  return `<article class="entry" id="${escapeAttr(entry.id)}" data-entry="${escapeAttr(entry.id)}">
    <div class="entry-meta">
      <span class="avatar">${avatarMarkup(entry.author, 28)}</span>
      <span class="author-name">${escapeHtml(entry.author.name)}</span>
      <span class="dot">·</span>
      <span class="date">${formatLongDate(entry.date)}</span>
      <span class="dot">·</span>
      <span class="version-tag">v${escapeHtml(entry.version)}</span>
    </div>

    <h2><a href="${escapeAttr(permalink)}">${escapeHtml(entry.title)}</a></h2>

    <div class="entry-body">${entry.body_html}</div>

    ${entry.tags?.length ? `
      <div class="entry-tags">
        ${entry.tags.map(t => `<span class="entry-tag">${escapeHtml(t)}</span>`).join('')}
      </div>` : ''}

    ${shareUi}
  </article>`;
}
