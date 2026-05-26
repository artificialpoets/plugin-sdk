/**
 * build-changelog.mjs
 *
 * Pre-build step that turns the changelog catalog into:
 *   - public/og/<id>.png          ← one OG image per entry (1200×630)
 *                                  rasterized from the SVG so it works on
 *                                  LinkedIn, Facebook, and every other
 *                                  social platform that won't render SVG
 *   - src/changelog/<id>.html     ← one static page per entry, with proper
 *                                  per-entry Open Graph meta tags baked
 *                                  into the <head>
 *
 * Vite's `rollupOptions.input` then includes every src/changelog/*.html
 * as a build target, so each gets a stable URL like /changelog/v0.3.0.html.
 *
 * Avatars referenced via external https URLs (e.g. Gravatar) are fetched
 * once at build time and inlined into the SVG as base64 data URLs before
 * rasterization, so the resulting PNG is fully self-contained.
 *
 * Runs automatically via `npm run prebuild` and `npm run predev` (see
 * package.json). Re-run it whenever changelog-data.js changes.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';

import { Resvg } from '@resvg/resvg-js';

import { entries, authors } from '../src/changelog-data.js';
import { renderEntryArticleHtml, renderOgSvg, formatLongDate, escapeHtml, escapeAttr } from '../src/changelog-render.js';

// The author block on static-page OGs — reuses the canonical author config
// (Gravatar URL, name, handle) so every card across the site carries the
// same signature.
const SITE_AUTHOR = authors.matias;

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '../src');
const PUBLIC = resolve(__dirname, '../public');

// ─── Static-page OG card config ──────────────────────────────────────────
// Source of truth for both the rasterized PNGs in /og/<id>.png AND the
// matching <meta> tags hard-coded into each HTML file's <head>. Keep these
// in sync — if you change a title/description here, also update the
// page's HTML <head>.
const STATIC_PAGES = [
  {
    id: 'home',
    eyebrow: 'PLUGIN SDK',
    // Tightened to 2 lines so the subtitle has room to breathe above the
    // bottom domain line. The landing-page hero gets the full 3-line
    // dramatic break; the OG card wants compact composition.
    title: 'Native WordPress plugins. Secure by default.',
    subtitle: 'Real WP admin markup, CSS/React/PHP runtimes, and a plugin scaffold for AI agents.',
    accent: '#2271b1',
  },
  {
    id: 'components',
    eyebrow: 'COMPONENTS',
    title: 'Every WP admin primitive, copy-pasteable.',
    subtitle: 'Buttons, forms, list tables, notices, postboxes — copy as HTML, AI prompt, React, or PHP.',
    accent: '#2271b1',
  },
  {
    id: 'layouts',
    eyebrow: 'LAYOUTS',
    title: 'Full plugin admin templates.',
    subtitle: 'Settings pages, list tables, dashboards, onboarding wizards. Real WP markup, ready to ship.',
    accent: '#2271b1',
  },
  {
    id: 'docs',
    eyebrow: 'DOCUMENTATION',
    title: 'Install, customize, and ship.',
    subtitle: 'Getting started, core concepts, agent guides, and a working plugin boilerplate.',
    accent: '#2271b1',
  },
  {
    id: 'changelog',
    eyebrow: 'CHANGELOG',
    title: 'Every release, every contributor.',
    subtitle: 'Bitácora of Plugin SDK — each entry with a shareable URL and OG card.',
    accent: '#2271b1',
  },
];

// Production URL — adjust if you host elsewhere. OG meta tags need absolute URLs.
const SITE_URL = 'https://wp-admincss.com';

// ─── Output directories ─────────────────────────────────────────────────
// Per-entry HTML pages live in src/ so Vite processes them as build inputs
// (asset paths get resolved + cache-busted). The OG PNGs live in public/
// so they're served at stable /og/<id>.png URLs unchanged by Vite —
// crawlers and social platforms need stable absolute URLs for OG images.
const CHANGELOG_DIR = resolve(SRC, 'changelog');
const OG_DIR = resolve(PUBLIC, 'og');

// ─── Helpers ────────────────────────────────────────────────────────────

// Fetch an http(s) image and return a base64 data URL. Cached per URL so
// the same Gravatar (or other shared avatar) is only fetched once per build.
const imageCache = new Map();
async function fetchImageAsDataUrl(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Trust the Content-Type header — Gravatar returns image/jpeg, but
  // fall back to detection by magic bytes for safety.
  let mime = res.headers.get('content-type') || '';
  if (!mime.startsWith('image/')) {
    if (buf[0] === 0x89 && buf[1] === 0x50) mime = 'image/png';
    else if (buf[0] === 0xff && buf[1] === 0xd8) mime = 'image/jpeg';
    else if (buf[0] === 0x47 && buf[1] === 0x49) mime = 'image/gif';
    else mime = 'application/octet-stream';
  }
  const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
  imageCache.set(url, dataUrl);
  return dataUrl;
}

// Replace every `<image href="https://…">` (or `href="http://…"`) in an SVG
// with the base64 data URL equivalent. resvg-js does NOT fetch external
// images on its own, so this step is what gets the Gravatar baked into the
// rasterized PNG.
async function inlineExternalImages(svg) {
  const urlRe = /href\s*=\s*"(https?:\/\/[^"]+)"/g;
  const urls = new Set();
  for (const m of svg.matchAll(urlRe)) urls.add(m[1]);
  for (const url of urls) {
    const dataUrl = await fetchImageAsDataUrl(url);
    svg = svg.split(url).join(dataUrl);
  }
  return svg;
}

// SVG string → PNG buffer at the SVG's native 1200×630.
async function rasterizePng(svg) {
  const inlined = await inlineExternalImages(svg);
  const resvg = new Resvg(inlined, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true },
  });
  return resvg.render().asPng();
}

// ─── Static-page OG card SVG ─────────────────────────────────────────────
// Light landing-page palette: subtle gradient + radial blue glow at top,
// dark headline, WP-admin-blue accent for the section eyebrow + wordmark.
// Includes the author block (Gravatar + name + handle) at bottom-left —
// same signature as the per-entry changelog cards, so every OG card
// across the site carries the same brand voice.
function renderStaticOgSvg(page) {
  const accent = page.accent || '#2271b1';
  const titleLines = wrapAt(page.title, 28);
  // 2 lines max at 64-char wrap. Title block ends at y=352 (2-line) so
  // a 2-line subtitle ends ~y=432, leaving 108px of clearance before the
  // author block at y=540.
  const subtitleLines = wrapAt(page.subtitle, 64).slice(0, 2);
  const author = SITE_AUTHOR;
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
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="hsl(210, 65%, 45%)"/>
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

  <!-- Eyebrow (e.g. COMPONENTS) -->
  <text x="64" y="220" font-family="ui-monospace, monospace" font-size="14"
        fill="${accent}" font-weight="600" letter-spacing="3">
    ${escapeHtml(page.eyebrow)}
  </text>

  <!-- Large title -->
  ${titleLines.map((line, i) => `
    <text x="64" y="${280 + i * 72}" font-family="system-ui, sans-serif"
          font-size="56" font-weight="700" fill="#14181f" letter-spacing="-1.5">
      ${escapeHtml(line)}
    </text>
  `).join('')}

  <!-- Subtitle (tightened to 1 line so the author block has room) -->
  ${subtitleLines.map((line, i) => `
    <text x="64" y="${280 + titleLines.length * 72 + 24 + i * 32}"
          font-family="system-ui, sans-serif" font-size="22" font-weight="400"
          fill="#50575e">
      ${escapeHtml(line)}
    </text>
  `).join('')}

  <!-- Author block, bottom-left. Same layout as the per-entry changelog
       cards (Gravatar clipped to a circle, name + handle to the right).
       The accent-gradient circle + initials are the fallback if a crawler
       drops the external image href. -->
  <g transform="translate(64, 540)">
    <circle cx="32" cy="32" r="32" fill="url(#avatarGrad)"/>
    <text x="32" y="32" text-anchor="middle" dominant-baseline="middle"
          fill="#fff" font-family="system-ui, sans-serif" font-weight="600" font-size="24">
      ${escapeHtml(author.initials || 'AP')}
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

  <!-- Domain marker, bottom-right (small, muted) -->
  <text x="1136" y="572" text-anchor="end"
        font-family="ui-monospace, monospace" font-size="14"
        fill="#9ca3af" font-weight="500" letter-spacing="2">
    WP-ADMINCSS.COM
  </text>
</svg>`;
}

// Greedy word-wrap to a max characters-per-line. Returns array of lines.
function wrapAt(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// main() is invoked at the very bottom of this file, AFTER every const
// declaration (including PAGE_STYLES below) has been initialized. JS hoists
// function declarations but not `const`s, so we have to delay execution.
async function main() {
  // Clean stale per-entry pages so removed changelog entries don't
  // leave dangling files. CHANGELOG_DIR also hosts `index.html` (the
  // changelog landing — source-owned, not regenerated), so we only
  // delete per-entry .html files, not the directory itself.
  if (existsSync(CHANGELOG_DIR)) {
    for (const file of readdirSync(CHANGELOG_DIR)) {
      if (file.endsWith('.html') && file !== 'index.html') {
        rmSync(resolve(CHANGELOG_DIR, file));
      }
    }
  }
  rmSync(OG_DIR, { recursive: true, force: true });
  mkdirSync(CHANGELOG_DIR, { recursive: true });
  mkdirSync(OG_DIR, { recursive: true });

  // Static-page OG PNGs (home, components, layouts, docs)
  for (const page of STATIC_PAGES) {
    const svg = renderStaticOgSvg(page).trim();
    const png = await rasterizePng(svg);
    writeFileSync(resolve(OG_DIR, `${page.id}.png`), png);
  }

  // Apple touch icon — rasterize favicon.svg to a 180×180 PNG.
  // iOS uses this for home-screen bookmarks; only PNG is accepted.
  const faviconSvg = readFileSync(resolve(PUBLIC, 'favicon.svg'), 'utf8');
  const appleIcon = new Resvg(faviconSvg, {
    fitTo: { mode: 'width', value: 180 },
    font: { loadSystemFonts: true },
  }).render().asPng();
  writeFileSync(resolve(PUBLIC, 'apple-touch-icon.png'), appleIcon);

  // Sitemap — list every public URL with a lastmod date. Static pages use
  // today's date; changelog entries use the release date from data.
  const today = new Date().toISOString().slice(0, 10);
  const sitemapUrls = [
    { loc: `${SITE_URL}/`,                priority: '1.0', lastmod: today },
    { loc: `${SITE_URL}/components.html`, priority: '0.9', lastmod: today },
    { loc: `${SITE_URL}/layouts.html`,    priority: '0.9', lastmod: today },
    { loc: `${SITE_URL}/docs.html`,       priority: '0.9', lastmod: today },
    { loc: `${SITE_URL}/changelog.html`,  priority: '0.8', lastmod: entries[0]?.date || today },
    ...entries.map(e => ({
      loc: `${SITE_URL}/changelog/${e.id}.html`,
      priority: '0.6',
      lastmod: e.date,
    })),
  ];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  writeFileSync(resolve(PUBLIC, 'sitemap.xml'), sitemapXml, 'utf8');

  // Changelog OG PNGs — rasterize the SVG with the avatar inlined.
  for (const entry of entries) {
    const svg = renderOgSvg(entry).trim();
    const png = await rasterizePng(svg);
    writeFileSync(resolve(OG_DIR, `${entry.id}.png`), png);
  }

  // Generate per-entry HTML pages (entries are sorted newest-first)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const newer = entries[i - 1];   // newer (released after this)
    const older = entries[i + 1];   // older (released before this)
    const page = renderPage(entry, { newer, older });
    writeFileSync(resolve(CHANGELOG_DIR, `${entry.id}.html`), page, 'utf8');
  }

  // Refresh the latest-release teaser block in the shared footer partial.
  // Markers in src/partials/footer.html:
  //   <!-- LATEST-RELEASE-START -->...<!-- LATEST-RELEASE-END -->
  refreshFooterTeaser();

  console.log(`[build-changelog] Generated ${STATIC_PAGES.length} static + ${entries.length} entry OG PNGs, ${entries.length} entry pages`);
}

function refreshFooterTeaser() {
  const footerPath = resolve(SRC, 'partials/footer.html');
  if (!existsSync(footerPath)) return;
  const latest = entries[0];
  if (!latest) return;
  const card = `<a class="footer-release-card" href="/changelog/${escapeAttr(latest.id)}.html">
        <span class="footer-release-version">v${escapeHtml(latest.version)}</span>
        <strong>${escapeHtml(latest.title)}</strong>
        <span class="footer-release-date">${escapeHtml(formatLongDate(latest.date))}</span>
      </a>`;
  const replacement =
    '<!-- LATEST-RELEASE-START — content between these markers is regenerated by scripts/build-changelog.mjs on every build. Do not hand-edit. -->\n      ' +
    card +
    '\n      <!-- LATEST-RELEASE-END -->';
  const re = /<!-- LATEST-RELEASE-START[\s\S]*?<!-- LATEST-RELEASE-END -->/;
  const before = readFileSync(footerPath, 'utf8');
  if (!re.test(before)) {
    console.warn('[build-changelog] footer.html missing LATEST-RELEASE markers — skipping teaser refresh');
    return;
  }
  const after = before.replace(re, replacement);
  if (after !== before) writeFileSync(footerPath, after, 'utf8');
}

// ─── Templates ──────────────────────────────────────────────────────────
// (functions are hoisted; const PAGE_STYLES below is referenced via closure)
function renderPage(entry, { newer, older }) {
  const url = `${SITE_URL}/changelog/${entry.id}.html`;
  const ogImage = `${SITE_URL}/og/${entry.id}.png`;
  const date = formatLongDate(entry.date);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escapeHtml(entry.title)} — Plugin SDK Changelog</title>
  <meta name="description" content="${escapeAttr(entry.summary)}">

  <link rel="canonical" href="${escapeAttr(url)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeAttr(entry.title)}">
  <meta property="og:description" content="${escapeAttr(entry.summary)}">
  <meta property="og:image" content="${escapeAttr(ogImage)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${escapeAttr(url)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Plugin SDK">
  <meta property="article:published_time" content="${escapeAttr(entry.date)}">
  <meta property="article:author" content="${escapeAttr(entry.author.name)}">
  ${(entry.tags || []).map(t => `<meta property="article:tag" content="${escapeAttr(t)}">`).join('\n  ')}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(entry.title)}">
  <meta name="twitter:description" content="${escapeAttr(entry.summary)}">
  <meta name="twitter:image" content="${escapeAttr(ogImage)}">

  <!-- @include head-icons -->

  <link rel="stylesheet" href="../styles.css">
  <style>
${PAGE_STYLES}
  </style>
</head>
<body data-page="changelog">

  <!-- @include header -->

  <main class="entry-focus">
    <p class="back-link"><a href="../changelog.html">← All releases</a></p>

    ${renderEntryArticleHtml(entry, {
      permalink: url,
      includeShareUi: true,
      ogPreviewSrc: `/og/${entry.id}.svg`,
    })}

    <nav class="prev-next">
      ${newer
        ? `<a class="nav-card newer" href="${escapeAttr(newer.id)}.html">
             <span class="dir">← Newer release</span>
             <strong>${escapeHtml(newer.title)}</strong>
             <span class="meta">v${escapeHtml(newer.version)} · ${escapeHtml(formatLongDate(newer.date))}</span>
           </a>`
        : '<div></div>'}
      ${older
        ? `<a class="nav-card older" href="${escapeAttr(older.id)}.html">
             <span class="dir">Older release →</span>
             <strong>${escapeHtml(older.title)}</strong>
             <span class="meta">v${escapeHtml(older.version)} · ${escapeHtml(formatLongDate(older.date))}</span>
           </a>`
        : '<div></div>'}
    </nav>
  </main>

  <script type="module" src="../changelog-app.js"></script>

  <!-- @include footer -->
</body>
</html>
`;
}

// Inline styles for per-entry pages. Keep visually identical to changelog.html.
const PAGE_STYLES = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--wpadmin-font);
      font-size: var(--wpadmin-font-size);
      color: var(--wpadmin-text);
      background: var(--wpadmin-surface);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--wpadmin-primary); }
    a:hover { color: var(--wpadmin-primary-dark); }
    code {
      font-family: var(--wpadmin-font-mono);
      font-size: .92em;
      background: var(--wpadmin-surface-alt);
      padding: 1px 5px;
      border-radius: 3px;
      color: var(--wpadmin-text);
    }

    /* Topbar + footer styles live in styles.css (shared across all pages). */

    .entry-focus {
      max-width: 720px; margin: 0 auto; padding: 56px 24px 96px;
    }
    .back-link { font-size: 13px; margin-bottom: 28px; }
    .back-link a { color: var(--wpadmin-text-subtle); text-decoration: none; }
    .back-link a:hover { color: var(--wpadmin-text); }

    .entry-meta {
      display: flex; align-items: center; gap: 10px;
      font-size: 13px; color: var(--wpadmin-text-subtle);
      margin-bottom: 16px;
    }
    .entry-meta .avatar {
      width: 28px; height: 28px; border-radius: 50%;
      overflow: hidden; flex-shrink: 0; background: var(--wpadmin-surface-alt);
    }
    .entry-meta .avatar img,
    .entry-meta .avatar svg { display: block; width: 100%; height: 100%; }
    .entry-meta .author-name { color: var(--wpadmin-text); font-weight: 500; }
    .entry-meta .dot { color: var(--wpadmin-border); }
    .entry-meta .version-tag {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; background: var(--wpadmin-surface-alt); border-radius: 999px;
      font-family: var(--wpadmin-font-mono); font-size: 11px;
      color: var(--wpadmin-primary); font-weight: 600;
    }

    .entry h2 {
      font-size: 32px; font-weight: 700; letter-spacing: -0.02em;
      line-height: 1.15; color: var(--wpadmin-text); margin-bottom: 16px;
    }
    .entry h2 a { color: inherit; text-decoration: none; }
    .entry-body { font-size: 16px; color: var(--wpadmin-text); line-height: 1.7; }
    .entry-body p { margin-bottom: 14px; }
    .entry-body p:last-child { margin-bottom: 0; }
    .entry-body ul { margin: 14px 0 14px 20px; }
    .entry-body li { margin-bottom: 6px; }
    .entry-body strong { color: var(--wpadmin-text); font-weight: 600; }
    .entry-body h3 {
      font-size: 18px; font-weight: 600; color: var(--wpadmin-text);
      margin: 22px 0 8px;
    }

    .entry-tags {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 18px;
    }
    .entry-tag {
      display: inline-block; font-size: 11px; padding: 2px 8px;
      border-radius: 999px; background: var(--wpadmin-surface-alt);
      color: var(--wpadmin-text-subtle); font-weight: 500;
    }

    .entry-share {
      margin-top: 28px; padding-top: 24px;
      border-top: 1px solid var(--wpadmin-border);
    }
    .entry-share-summary {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    .entry-share-summary strong {
      font-size: 12px; text-transform: uppercase; letter-spacing: .06em;
      color: var(--wpadmin-text-subtle); font-weight: 600;
    }
    .share-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; font-size: 12px; font-weight: 500;
      background: var(--wpadmin-surface); border: 1px solid var(--wpadmin-border);
      border-radius: 6px; cursor: pointer; color: var(--wpadmin-text);
      font-family: inherit; transition: background .12s, border-color .12s;
    }
    .share-btn:hover {
      background: var(--wpadmin-surface-alt); border-color: #a7aaad;
    }
    .share-btn.is-copied {
      background: rgba(70, 180, 80, 0.1);
      border-color: var(--wpadmin-success); color: var(--wpadmin-success);
    }
    .share-btn svg { width: 12px; height: 12px; }

    .og-preview {
      margin-top: 16px; border: 1px solid var(--wpadmin-border);
      border-radius: 12px; overflow: hidden;
      background: var(--wpadmin-body-bg); max-width: 600px;
    }
    .og-preview img, .og-preview svg {
      display: block; width: 100%; height: auto;
    }
    .og-preview-caption {
      padding: 10px 14px; font-size: 11px; color: var(--wpadmin-text-subtle);
      border-top: 1px solid var(--wpadmin-border); background: var(--wpadmin-surface);
    }

    .prev-next {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      margin-top: 64px;
    }
    .nav-card {
      display: flex; flex-direction: column; gap: 4px;
      padding: 16px 18px; border: 1px solid var(--wpadmin-border);
      border-radius: 10px; background: var(--wpadmin-surface);
      text-decoration: none; transition: border-color .12s, background .12s;
    }
    .nav-card:hover {
      border-color: var(--wpadmin-primary); background: var(--wpadmin-surface-alt);
    }
    .nav-card.older { text-align: right; }
    .nav-card .dir {
      font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
      color: var(--wpadmin-text-subtle); font-weight: 600;
    }
    .nav-card strong {
      font-size: 14px; color: var(--wpadmin-text); font-weight: 600;
      line-height: 1.3;
    }
    .nav-card .meta {
      font-size: 12px; color: var(--wpadmin-text-subtle);
    }

    @media (max-width: 600px) {
      .entry-focus { padding: 40px 20px 64px; }
      .entry h2 { font-size: 24px; }
      .prev-next { grid-template-columns: 1fr; }
      .nav-card.older { text-align: left; }
    }
`;

// All declarations are now initialized — run the generator. Top-level
// await is allowed because this file is an ES module (.mjs).
await main();
