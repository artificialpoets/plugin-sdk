/**
 * Changelog feed page — renders the full list of entries.
 *
 * Per-entry static pages (with proper per-entry Open Graph meta) are
 * generated at build time by scripts/build-changelog.mjs. Each entry's
 * permalink is changelog/<id>.html — the feed links to those.
 *
 * Hash routing (#/<id>) still works for in-page scroll + highlight, useful
 * when sharing into platforms that strip query strings.
 */

import { entries } from './changelog-data.js';
import { renderEntryArticleHtml, renderOgSvg } from './changelog-render.js';

const ORIGIN = window.location.origin;
const PERMALINK = (id) => `${ORIGIN}/changelog/${id}.html`;

function renderAll() {
  const mount = document.getElementById('entries');
  if (!mount) return;
  mount.innerHTML = entries
    .map(e => renderEntryArticleHtml(e, {
      permalink: PERMALINK(e.id),
      includeShareUi: true,
      ogPreviewSrc: `/og/${e.id}.png`,  // points at the build-time rasterized OG PNG
    }))
    .join('');
  wireShareButtons();
  highlightAndScrollFromHash();
}

function wireShareButtons() {
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const entryEl = btn.closest('.entry');
      const entry = entries.find(en => en.id === entryEl?.dataset.entry);
      if (!entry) return;

      if (action === 'copy-url') {
        try {
          await navigator.clipboard.writeText(btn.dataset.url);
          flash(btn, 'Copied!');
        } catch (e) { console.error('Clipboard write failed', e); }
        return;
      }

      if (action === 'toggle-og') {
        const og = entryEl.querySelector('.og-preview');
        const label = btn.querySelector('.label');
        if (og.hasAttribute('hidden')) {
          og.removeAttribute('hidden');
          label.textContent = 'Hide OG card';
        } else {
          og.setAttribute('hidden', '');
          label.textContent = 'Show OG card';
        }
        return;
      }

      if (action === 'download-svg') {
        const svg = renderOgSvg(entry);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `wp-admincss-${entry.id}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        flash(btn, 'Downloaded!');
      }
    });
  });
}

function flash(btn, message) {
  const label = btn.querySelector('.label');
  const original = label.textContent;
  btn.classList.add('is-copied');
  label.textContent = message;
  setTimeout(() => {
    btn.classList.remove('is-copied');
    label.textContent = original;
  }, 1600);
}

function highlightAndScrollFromHash() {
  document.querySelectorAll('.entry').forEach(el => el.classList.remove('is-active'));
  const hash = location.hash.replace(/^#\/?/, '');
  if (!hash) return;
  const entryEl = document.getElementById(hash);
  if (!entryEl) return;
  entryEl.classList.add('is-active');
  const og = entryEl.querySelector('.og-preview');
  const toggleLabel = entryEl.querySelector('[data-action="toggle-og"] .label');
  if (og && og.hasAttribute('hidden')) {
    og.removeAttribute('hidden');
    if (toggleLabel) toggleLabel.textContent = 'Hide OG card';
  }
  setTimeout(() => entryEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderAll);
} else {
  renderAll();
}
window.addEventListener('hashchange', highlightAndScrollFromHash);
