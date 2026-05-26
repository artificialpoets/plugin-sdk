/**
 * Layouts page — routing + rendering.
 *
 * Mirrors components-app.js but for full-page templates rather than
 * individual primitives. Each layout has 4 code variants (HTML / AI / React
 * / PHP) and renders inside a "browser frame" mockup so the preview reads
 * as a full plugin admin screen.
 */

import { layouts, categories } from './layouts-data.js';

const COPY_ICON = '<svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

// ─── Sidebar ──────────────────────────────────────────────────────────────
function renderSidebar() {
  const sidebar = document.getElementById('sidebar-list');
  if (!sidebar) return;

  const html = categories
    .map(cat => {
      const items = layouts
        .filter(l => l.category === cat.id)
        .map(l => `
          <li>
            <a href="#/${l.id}" data-id="${l.id}">
              ${l.name}
              ${l.subtitle ? `<span class="sublabel">${l.subtitle}</span>` : ''}
            </a>
          </li>`)
        .join('');
      if (!items) return '';
      return `
        <li class="sidebar-category">
          <div class="sidebar-category-name">${cat.name}</div>
          <ul class="sidebar-sublist">${items}</ul>
        </li>`;
    })
    .join('');

  sidebar.innerHTML = html;
}

// ─── Code panels ──────────────────────────────────────────────────────────
function renderCodePanel(key, content, copyLabel, isActive = false) {
  if (!content) {
    return `
      <div class="code-panel ${isActive ? 'is-active' : ''}" data-panel="${key}">
        <div style="padding:32px;text-align:center;color:#6e7681;font-size:13px">
          No example available for this layout.
        </div>
      </div>`;
  }
  return `
    <div class="code-panel ${isActive ? 'is-active' : ''}" data-panel="${key}">
      <button class="copy-btn" data-copy-target="${key}">
        ${COPY_ICON}
        <span class="copy-label">${copyLabel}</span>
      </button>
      <pre><code>${escapeHtml(content)}</code></pre>
    </div>`;
}

// ─── Main render ──────────────────────────────────────────────────────────
function renderLayout(id) {
  const main = document.getElementById('main');
  const layout = layouts.find(l => l.id === id);
  if (!layout) {
    main.innerHTML = `
      <div class="empty-route">
        <h1>Layout not found</h1>
        <p>Pick one from the sidebar.</p>
      </div>`;
    return;
  }

  document.title = `${layout.name} — Layouts — Plugin SDK`;

  const componentsList = layout.uses
    ? `<p class="layout-doc__components"><strong>Uses:</strong> ${layout.uses.map(c => `<a href="/wordpress/components/#/${c.id}">${c.name}</a>`).join(', ')}</p>`
    : '';

  const code = layout.code;
  const url = layout.url || 'wp-admin/admin.php?page=my-plugin';

  const html = `
    <article class="layout-doc">
      <header class="layout-doc__header">
        <p class="layout-doc__breadcrumb">${categoryName(layout.category)}</p>
        <h1>${layout.name}</h1>
        <p class="layout-doc__description">${layout.description}</p>
        ${componentsList}
      </header>

      <section class="layout-doc__preview-section">
        <div class="section-label"><span>Preview</span></div>
        <div class="browser-frame">
          <div class="browser-frame__bar">
            <span class="browser-frame__dot r"></span>
            <span class="browser-frame__dot y"></span>
            <span class="browser-frame__dot g"></span>
            <div class="browser-frame__url">https://example.com/${url}</div>
          </div>
          <div class="browser-frame__body">${layout.preview}</div>
        </div>
      </section>

      <section class="layout-doc__code-section">
        <div class="section-label"><span>Get the code</span></div>
        <div class="code-card">
          <div class="code-card__tabs" role="tablist">
            <button class="code-tab is-active" data-tab="html">HTML</button>
            <button class="code-tab" data-tab="ai">AI Prompt</button>
            <button class="code-tab" data-tab="react">React</button>
            <button class="code-tab" data-tab="php">PHP</button>
          </div>
          <div>
            ${renderCodePanel('html', code.html, 'Copy', true)}
            ${renderCodePanel('ai', code.ai, 'Copy prompt')}
            ${renderCodePanel('react', code.react, 'Copy')}
            ${renderCodePanel('php', code.php, 'Copy')}
          </div>
        </div>
      </section>
    </article>`;

  main.innerHTML = html;

  // Stash raw text for copy
  ['html', 'ai', 'react', 'php'].forEach(key => {
    if (!code[key]) return;
    const el = main.querySelector(`[data-panel="${key}"] pre code`);
    if (el) el.dataset.raw = code[key];
  });

  wireTabs();
  wireCopy();
  updateSidebar(id);
  document.querySelector('.main-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
}

function categoryName(id) {
  return categories.find(c => c.id === id)?.name ?? '';
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wireTabs() {
  const tabs = document.querySelectorAll('.code-tab');
  const panels = document.querySelectorAll('.code-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      panels.forEach(p => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.querySelector(`.code-panel[data-panel="${tab.dataset.tab}"]`)?.classList.add('is-active');
    });
  });
}

function wireCopy() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const which = btn.dataset.copyTarget;
      const text = document.querySelector(`.code-panel[data-panel="${which}"] code`)?.dataset.raw ?? '';
      try {
        await navigator.clipboard.writeText(text);
        const label = btn.querySelector('.copy-label');
        const original = label.textContent;
        btn.classList.add('is-copied');
        label.textContent = 'Copied!';
        setTimeout(() => {
          btn.classList.remove('is-copied');
          label.textContent = original;
        }, 1800);
      } catch (e) {
        console.error('Clipboard write failed', e);
      }
    });
  });
}

function updateSidebar(id) {
  document.querySelectorAll('#sidebar-list a').forEach(a => {
    a.classList.toggle('is-active', a.dataset.id === id);
  });
}

function currentId() {
  const hash = location.hash.replace(/^#\/?/, '');
  return hash || layouts[0].id;
}

function route() {
  renderLayout(currentId());
}

function init() {
  renderSidebar();
  route();
  window.addEventListener('hashchange', route);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
