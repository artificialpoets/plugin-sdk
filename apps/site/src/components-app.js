/**
 * Components page — routing + rendering.
 *
 * Reads the structured component catalog and renders one component at a time
 * based on `location.hash`. Pure browser ES module — no framework.
 */

import { components, categories } from './components-data.js';
import { reactPhpCode } from './components-code-react-php.js';

// ─── Sidebar ──────────────────────────────────────────────────────────────
function renderSidebar() {
  const sidebar = document.getElementById('sidebar-list');
  if (!sidebar) return;

  const html = categories
    .map(cat => {
      const items = components
        .filter(c => c.category === cat.id)
        .map(c => `
          <li>
            <a href="#/${c.id}" data-id="${c.id}">${c.name}</a>
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

// ─── Code panel (per-tab) ─────────────────────────────────────────────────
const COPY_ICON = '<svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

function renderCodePanel(key, content, copyLabel, isActive = false) {
  if (!content) {
    return `
      <div class="code-panel ${isActive ? 'is-active' : ''}" data-panel="${key}">
        <div class="code-panel__empty">No example available for this component.</div>
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

// ─── Main content ─────────────────────────────────────────────────────────
function renderComponent(id) {
  const main = document.getElementById('main');
  const comp = components.find(c => c.id === id);
  if (!comp) {
    main.innerHTML = `
      <div class="empty-route">
        <h1>Component not found</h1>
        <p>Try one of the components from the sidebar.</p>
      </div>`;
    return;
  }

  document.title = `${comp.name} — Plugin SDK`;

  // Merge React/PHP snippets onto the catalog entry
  const extra = reactPhpCode[comp.id] || {};
  const code = {
    html: comp.code.html,
    ai: comp.code.ai,
    react: extra.react ?? null,
    php: extra.php ?? null
  };

  const html = `
    <article class="component-doc">
      <header class="component-doc__header">
        <p class="component-doc__breadcrumb">${categoryName(comp.category)}</p>
        <h1>${comp.name}</h1>
        <p class="component-doc__description">${comp.description}</p>
      </header>

      <section class="component-doc__preview-section">
        <div class="section-label">
          <span>Preview</span>
        </div>
        <div class="preview-frame">
          <div class="preview-frame__inner">${comp.preview}</div>
        </div>
      </section>

      <section class="component-doc__code-section">
        <div class="section-label">
          <span>Get the code</span>
        </div>
        <div class="code-card">
          <div class="code-card__tabs" role="tablist">
            <button class="code-tab is-active" role="tab" data-tab="html">HTML</button>
            <button class="code-tab" role="tab" data-tab="ai">AI Prompt</button>
            <button class="code-tab" role="tab" data-tab="react">React</button>
            <button class="code-tab" role="tab" data-tab="php">PHP</button>
          </div>

          <div class="code-card__body">
            ${renderCodePanel('html', code.html, 'Copy', true)}
            ${renderCodePanel('ai', code.ai, 'Copy prompt')}
            ${renderCodePanel('react', code.react, 'Copy')}
            ${renderCodePanel('php', code.php, 'Copy')}
          </div>
        </div>
      </section>
    </article>`;

  main.innerHTML = html;
  // Hidden text holders for copy-to-clipboard
  Object.entries(code).forEach(([key, value]) => {
    if (!value) return;
    const el = main.querySelector(`[data-panel="${key}"] pre code`);
    if (el) el.dataset.raw = value;
  });

  wireCodeTabs();
  wireCopyButtons();
  enhancePreview(main);
  updateActiveSidebarLink(id);
  // Reset scroll to top of content
  document.querySelector('.main-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
}

// ─── Preview interactivity ─────────────────────────────────────────────────
// Makes demos clickable: tabs swap, dropdowns toggle, modals open, etc.
// Links pointing at "#" are neutralized so they don't jump the page.
function enhancePreview(main) {
  const frame = main.querySelector('.preview-frame');
  if (!frame) return;

  // 1. Kill anchor-to-top navigation on demo links.
  frame.querySelectorAll('a[href="#"], a[href=""]').forEach(a => {
    a.addEventListener('click', e => e.preventDefault());
  });

  // 2. Wire tab strips that have data-demo-tab on the buttons.
  frame.querySelectorAll('.wp-admin-tabs').forEach(wireTabs);

  // 3. Wire dropdown triggers (aria-haspopup="menu").
  frame.querySelectorAll('.wp-admin-dropdown').forEach(wireDropdown);

  // 4. Wire modal open buttons (data-demo-open="modal-id").
  frame.querySelectorAll('[data-demo-open]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const target = frame.querySelector('#' + btn.dataset.demoOpen);
      if (target) target.style.display = 'flex';
    });
  });

  // 5. Wire modal close (× button, Cancel buttons with data-demo-close, backdrop click).
  frame.querySelectorAll('.wp-admin-modal__close, [data-demo-close]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const modal = btn.closest('.wp-admin-modal-backdrop');
      if (modal) modal.style.display = 'none';
    });
  });
  frame.querySelectorAll('.wp-admin-modal-backdrop.is-demo').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) backdrop.style.display = 'none';
    });
  });

  // 6. Confirm dialog confirm buttons: also close the dialog on click.
  frame.querySelectorAll('[data-demo-confirm]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const modal = btn.closest('.wp-admin-modal-backdrop');
      if (modal) modal.style.display = 'none';
      // Could show a fake "deleted" notice etc. — keep simple for now.
    });
  });

  // 7. Color picker sync: text <input> ↔ native <input type="color">.
  frame.querySelectorAll('[data-demo-color-pair]').forEach(wireColorPicker);

  // 8. Drop zones for media demo.
  frame.querySelectorAll('[data-demo-dropzone]').forEach(wireDropzone);

  // 9. Media library thumbnail picker.
  frame.querySelectorAll('[data-demo-pick]').forEach(thumb => {
    thumb.addEventListener('click', e => {
      e.preventDefault();
      const background = thumb.style.background;
      frame.querySelectorAll('[data-demo-preview]').forEach(p => {
        p.style.backgroundImage = '';
        p.style.background = background;
        p.classList.add('has-image');
      });
      frame.querySelectorAll('[data-demo-filename]').forEach(f => {
        f.textContent = 'picked-image-' + thumb.dataset.demoPick + '.jpg · 142 KB';
      });
      frame.querySelectorAll('[data-demo-pick]').forEach(t => t.style.borderColor = 'transparent');
      thumb.style.borderColor = 'var(--wpadmin-primary)';
      setTimeout(() => {
        const modal = thumb.closest('.wp-admin-modal-backdrop');
        if (modal) modal.style.display = 'none';
      }, 280);
    });
  });
}

function wireTabs(root) {
  const tabs  = [...root.querySelectorAll('.nav-tab[data-demo-tab]')];
  const panelMap = new Map();
  root.querySelectorAll('.wp-admin-tab-panel[data-demo-panel]').forEach(p => {
    panelMap.set(p.dataset.demoPanel, p);
  });
  if (!tabs.length || !panelMap.size) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      tabs.forEach(t => t.classList.toggle('nav-tab-active', t === tab));
      const target = tab.dataset.demoTab;
      panelMap.forEach((panel, key) => {
        panel.classList.toggle('is-active', key === target);
      });
    });
  });
}

function wireDropdown(root) {
  const trigger = root.querySelector('[aria-haspopup="menu"]');
  const menu = root.querySelector('.wp-admin-dropdown__menu');
  if (!trigger || !menu) return;
  // Start closed.
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');

  trigger.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const open = !menu.hidden;
    menu.hidden = open;
    trigger.setAttribute('aria-expanded', String(!open));
  });

  // Close-on-outside-click — listener attached to the preview frame only
  // so it goes away when we navigate to another component.
  const frame = root.closest('.preview-frame');
  if (frame) {
    frame.addEventListener('click', e => {
      if (!root.contains(e.target)) {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Item clicks close the menu.
  menu.querySelectorAll('button, a').forEach(item => {
    item.addEventListener('click', e => {
      if (item.tagName === 'A' && (item.getAttribute('href') === '#' || !item.getAttribute('href'))) {
        e.preventDefault();
      }
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    });
  });
}

function wireColorPicker(wrapper) {
  const textInput  = wrapper.querySelector('input[type="text"]');
  const colorInput = wrapper.querySelector('input[type="color"]');
  const swatch     = wrapper.querySelector('[data-demo-swatch]');
  if (!textInput || !colorInput) return;
  const sync = (value) => {
    textInput.value = value;
    colorInput.value = value;
    if (swatch) swatch.style.background = value;
  };
  sync(textInput.value || colorInput.value || '#2271b1');
  textInput.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(textInput.value)) sync(textInput.value);
  });
  colorInput.addEventListener('input', () => sync(colorInput.value));
}

function wireDropzone(zone) {
  const preview = zone.querySelector('[data-demo-preview]');
  const label   = zone.querySelector('[data-demo-filename]');
  const accept  = zone.dataset.demoAccept || 'image/*';

  const handleFile = (file) => {
    if (!file) return;
    if (label) label.textContent = file.name + ' · ' + Math.round(file.size / 1024) + ' KB';
    if (file.type.startsWith('image/') && preview) {
      const reader = new FileReader();
      reader.onload = () => {
        preview.style.backgroundImage = `url(${reader.result})`;
        preview.classList.add('has-image');
      };
      reader.readAsDataURL(file);
    } else if (preview) {
      // Non-image: clear the image and show a generic icon via data attr.
      preview.style.backgroundImage = '';
      preview.classList.remove('has-image');
      preview.dataset.icon = file.type.split('/')[0] || 'file';
    }
  };

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('is-dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('is-dragover');
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  });

  const fileInput = zone.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.accept = accept;
    fileInput.addEventListener('change', () => handleFile(fileInput.files?.[0]));
  }
}

function categoryName(id) {
  return categories.find(c => c.id === id)?.name ?? '';
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Tab switching ────────────────────────────────────────────────────────
function wireCodeTabs() {
  const tabs = document.querySelectorAll('.code-tab');
  const panels = document.querySelectorAll('.code-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.disabled) return;
      tabs.forEach(t => t.classList.remove('is-active'));
      panels.forEach(p => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      const panel = document.querySelector(`.code-panel[data-panel="${tab.dataset.tab}"]`);
      panel?.classList.add('is-active');
    });
  });
}

// ─── Copy buttons ─────────────────────────────────────────────────────────
function wireCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const which = btn.dataset.copyTarget;
      const panel = document.querySelector(`.code-panel[data-panel="${which}"]`);
      const text = panel?.querySelector('code')?.dataset.raw ?? '';
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

// ─── Active link in sidebar ──────────────────────────────────────────────
function updateActiveSidebarLink(id) {
  document.querySelectorAll('#sidebar-list a').forEach(a => {
    a.classList.toggle('is-active', a.dataset.id === id);
  });
}

// ─── Routing ──────────────────────────────────────────────────────────────
function currentId() {
  const hash = location.hash.replace(/^#\/?/, '');
  return hash || components[0].id;
}

function route() {
  renderComponent(currentId());
}

// ─── Color scheme switcher (pure CSS via :has()) ─────────────────────────
// The radio inputs in the HTML are the source of truth; this file only
// wires the keyboard shortcut for accessibility.

// ─── Boot ─────────────────────────────────────────────────────────────────
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
