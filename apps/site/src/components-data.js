/**
 * Component catalog — single source of truth for the component library.
 *
 * Each entry:
 *   id          — kebab-case slug, used in the URL hash
 *   name        — display name in the sidebar + page title
 *   category    — sidebar grouping
 *   description — one-paragraph intro shown under the title
 *   preview     — HTML rendered in the "Preview" area (no examples list)
 *   code.html   — the HTML snippet shown in the "HTML" tab
 *   code.ai     — the AI prompt shown in the "AI Prompt" tab
 *
 * react and php are intentionally left null — they render a "Coming in Phase N"
 * placeholder so plugin developers can see what's on the roadmap.
 */

export const categories = [
  { id: 'icons',      name: 'Icons' },
  { id: 'layout',     name: 'Layout' },
  { id: 'forms',      name: 'Forms' },
  { id: 'actions',    name: 'Actions' },
  { id: 'navigation', name: 'Navigation' },
  { id: 'overlays',   name: 'Overlays' },
  { id: 'data',       name: 'Data Display' },
  { id: 'tables',     name: 'Tables' },
  { id: 'feedback',   name: 'Feedback' },
  { id: 'security',   name: 'Security' }
];

export const components = [

  // ─── Icons ────────────────────────────────────────────────────────────
  {
    id: 'icon',
    name: 'Icon (SVG)',
    category: 'icons',
    description: 'Inline SVG icons — the direction WordPress core is moving per the <a href="https://make.wordpress.org/design/2020/04/20/next-steps-for-dashicons/" target="_blank" rel="noopener">2020 Dashicons roadmap post</a>. Ships a curated set of 20 essentials. Pair with <code>@wordpress/icons</code> or any SVG source for the full Gutenberg catalog.',
    preview: `<style>
  .wp-admin-icon { fill: currentColor; vertical-align: middle; }
  .icon-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:14px }
  .icon-cell { display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px;border:1px solid var(--wpadmin-border);border-radius:6px;background:var(--wpadmin-surface);font-family:var(--wpadmin-font-mono);font-size:11px;color:var(--wpadmin-text-subtle) }
  .icon-cell svg { color: var(--wpadmin-text) }
</style>
<div class="icon-grid">
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>plus</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M19 11H5v2h14v-2z"/></svg>minus</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z"/></svg>close</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>check</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>chevron-up</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>chevron-down</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>chevron-left</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>chevron-right</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z"/></svg>arrow-up</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8z"/></svg>arrow-down</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>arrow-left</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>arrow-right</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>edit</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>trash</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>search</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>more-horizontal</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>more-vertical</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style="color:var(--wpadmin-info)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v2h-2zm0 4h2v6h-2z"/></svg>info</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style="color:var(--wpadmin-warning)"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>warning</div>
  <div class="icon-cell"><svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>external-link</div>
</div>

<div style="margin-top:28px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
  <span style="font-size:13px;color:var(--wpadmin-text-subtle);font-weight:500">Sizes:</span>
  <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
  <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
  <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
  <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" aria-hidden="true"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
  <span style="font-size:13px;color:var(--wpadmin-text-subtle);font-family:var(--wpadmin-font-mono)">16 · 24 · 32 · 48</span>
</div>

<div style="margin-top:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
  <span style="font-size:13px;color:var(--wpadmin-text-subtle);font-weight:500">In buttons:</span>
  <button type="button" class="button button-primary" style="display:inline-flex;align-items:center;gap:5px">
    <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
    Add New
  </button>
  <button type="button" class="button button-link button-link-delete" style="display:inline-flex;align-items:center;gap:5px">
    <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
    Delete
  </button>
</div>`,
    code: {
      html: `<!-- Basic usage — 24×24 by default, color = currentColor -->
<svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
  <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z" fill="currentColor"/>
</svg>

<!-- In a button -->
<button class="button button-primary">
  <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z" fill="currentColor"/>
  </svg>
  Add New
</button>

<!-- Tinted via parent color (currentColor) -->
<span style="color: var(--wpadmin-error)">
  <svg class="wp-admin-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
  </svg>
</span>`,
      ai: `Add inline SVG icons (the modern WordPress direction per the 2020 Dashicons roadmap) to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Plugin SDK ships a built-in .wp-admin-icon helper that makes SVG icons inherit text color via currentColor and align with adjacent text.

Built-in icon set (20 essentials):
plus, minus, close, check, chevron-up/down/left/right, arrow-up/down/left/right, edit, trash, search, more-horizontal, more-vertical, info, warning, external-link

HTML template (replace the path d with the icon you want):
<svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
  <path d="..." fill="currentColor"/>
</svg>

For the full Gutenberg-era catalog (~250 icons), install @wordpress/icons and feed the icon element to <Icon> (React) or copy the SVG markup directly (HTML/PHP).`
    }
  },

  {
    id: 'dashicon',
    name: 'Dashicon',
    category: 'icons',
    description: 'WordPress\'s native icon font, included by default. Use any icon from the <a href="https://developer.wordpress.org/resource/dashicons/" target="_blank" rel="noopener">official Dashicons catalog</a> (~300 icons). Pair with the <code>is-small</code> / <code>is-large</code> classes to adjust size.',
    preview: `<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:0">
  <span class="dashicons dashicons-admin-users" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-admin-settings" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-admin-plugins" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-edit" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-trash" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-search" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-cloud" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-lock" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-shield" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-yes-alt" style="font-size:24px;width:24px;height:24px;color:var(--wpadmin-success)"></span>
  <span class="dashicons dashicons-warning" style="font-size:24px;width:24px;height:24px;color:var(--wpadmin-warning)"></span>
  <span class="dashicons dashicons-flag" style="font-size:24px;width:24px;height:24px;color:var(--wpadmin-error)"></span>
  <span class="dashicons dashicons-update" style="font-size:24px;width:24px;height:24px;color:var(--wpadmin-primary)"></span>
  <span class="dashicons dashicons-share" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-email" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-format-image" style="font-size:24px;width:24px;height:24px"></span>
  <span class="dashicons dashicons-star-filled" style="font-size:24px;width:24px;height:24px;color:#ffb900"></span>
</div>
<div style="margin-top:24px;display:flex;align-items:center;gap:16px">
  <span class="dashicons dashicons-admin-users is-small"></span>
  <span class="dashicons dashicons-admin-users"></span>
  <span class="dashicons dashicons-admin-users is-large"></span>
  <span style="font-size:13px;color:var(--wpadmin-text-subtle)">small · default · large</span>
</div>
<div style="margin-top:24px;display:flex;align-items:center;gap:10px">
  <button type="button" class="button button-primary">
    <span class="dashicons dashicons-plus" style="font-size:16px;width:16px;height:16px;line-height:1.4;margin-right:4px;vertical-align:middle"></span>
    Add New
  </button>
  <button type="button" class="button">
    <span class="dashicons dashicons-update" style="font-size:16px;width:16px;height:16px;line-height:1.4;margin-right:4px;vertical-align:middle"></span>
    Refresh
  </button>
</div>`,
    code: {
      html: `<!-- Basic usage -->
<span class="dashicons dashicons-admin-users"></span>
<span class="dashicons dashicons-edit"></span>
<span class="dashicons dashicons-trash"></span>

<!-- Sized variants (custom to Plugin SDK) -->
<span class="dashicons dashicons-admin-users is-small"></span>  <!-- 16px -->
<span class="dashicons dashicons-admin-users"></span>            <!-- 20px -->
<span class="dashicons dashicons-admin-users is-large"></span>  <!-- 28px -->

<!-- Inside a button -->
<button type="button" class="button button-primary">
  <span class="dashicons dashicons-plus" aria-hidden="true"></span>
  Add New
</button>

<!-- Tinted with token colors -->
<span class="dashicons dashicons-yes-alt" style="color: var(--wpadmin-success)"></span>
<span class="dashicons dashicons-warning" style="color: var(--wpadmin-warning)"></span>
<span class="dashicons dashicons-flag" style="color: var(--wpadmin-error)"></span>`,
      ai: `Add WordPress Dashicons (the built-in icon font shipped with WP core) to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The dashicons font is included by default in the wp-admin.css bundle. Browse the icon catalog at https://developer.wordpress.org/resource/dashicons/ — every icon name from that page works.

HTML:
<span class="dashicons dashicons-admin-users"></span>
<span class="dashicons dashicons-edit"></span>

Sizes: add .is-small (16px) or .is-large (28px). Default is 20px.

In WordPress context, prefer to enqueue dashicons via PHP for better performance (avoids the external CDN request):
wp_enqueue_style('dashicons');`
    }
  },

  // ─── Layout ───────────────────────────────────────────────────────────
  {
    id: 'page-header',
    name: 'Page Header',
    category: 'layout',
    description: 'The standard WordPress admin page heading, with an inline action link. The <code>wp-header-end</code> hr is the anchor WordPress uses to position admin notices.',
    preview: `<h1 class="wp-heading-inline">Plugin Settings</h1>
<a href="#" class="page-title-action">Add New</a>
<hr class="wp-header-end">`,
    code: {
      html: `<div class="wrap">
  <h1 class="wp-heading-inline">Plugin Settings</h1>
  <a href="?page=add-new" class="page-title-action">Add New</a>
  <hr class="wp-header-end">
</div>`,
      ai: `Add a WordPress admin page header with an inline "Add New" action button to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The .wp-header-end hr is important — it tells WordPress where admin notices should appear.

HTML:
<div class="wrap">
  <h1 class="wp-heading-inline">Plugin Settings</h1>
  <a href="?page=add-new" class="page-title-action">Add New</a>
  <hr class="wp-header-end">
</div>`
    }
  },

  {
    id: 'two-column',
    name: 'Two-Column Layout',
    category: 'layout',
    description: 'The classic edit-post layout — main content area with a sidebar column for meta boxes.',
    preview: `<div style="display:grid;grid-template-columns:1fr 220px;gap:16px;align-items:start">
  <div class="postbox" style="margin:0">
    <div class="postbox-header"><h2 class="hndle">Main Content</h2></div>
    <div class="inside">
      <p style="margin:.5em 0">The primary editing surface — title, content area, blocks.</p>
    </div>
  </div>
  <div class="postbox" style="margin:0">
    <div class="postbox-header"><h2 class="hndle">Publish</h2></div>
    <div class="inside">
      <p style="margin:.5em 0;font-size:13px">Status: <strong>Draft</strong></p>
      <p style="margin:.5em 0 0">
        <button type="button" class="button button-primary button-small">Save Draft</button>
      </p>
    </div>
  </div>
</div>`,
    code: {
      html: `<div id="poststuff">
  <div id="post-body" class="metabox-holder columns-2">
    <div id="post-body-content">
      <!-- main content / primary metabox column -->
    </div>
    <div id="postbox-container-1" class="postbox-container">
      <!-- sidebar metabox column -->
    </div>
  </div>
</div>`,
      ai: `Add a WordPress admin two-column layout (main + sidebar) to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

HTML:
<div id="poststuff">
  <div id="post-body" class="metabox-holder columns-2">
    <div id="post-body-content"><!-- main content --></div>
    <div id="postbox-container-1" class="postbox-container"><!-- sidebar --></div>
  </div>
</div>`
    }
  },

  {
    id: 'screen-options',
    name: 'Screen Options',
    category: 'layout',
    description: 'The collapsible panel WordPress shows in the top-right of every screen, letting users toggle which columns and metaboxes are visible.',
    preview: `<div style="background:var(--wpadmin-surface);border:1px solid var(--wpadmin-border);padding:14px;border-radius:4px">
  <h5 style="margin:0 0 10px;font-size:13px;font-weight:600">Screen Options</h5>
  <fieldset>
    <legend class="screen-reader-text">Columns</legend>
    <label style="display:inline-block;margin-right:14px"><input type="checkbox" checked> Title</label>
    <label style="display:inline-block;margin-right:14px"><input type="checkbox" checked> Author</label>
    <label style="display:inline-block;margin-right:14px"><input type="checkbox"> Tags</label>
    <label style="display:inline-block"><input type="checkbox" checked> Date</label>
  </fieldset>
</div>`,
    code: {
      html: `<div id="screen-meta">
  <div id="screen-options-wrap" class="hidden">
    <h5>Screen Options</h5>
    <fieldset>
      <legend class="screen-reader-text">Columns</legend>
      <label><input type="checkbox" checked> Title</label>
      <label><input type="checkbox" checked> Author</label>
    </fieldset>
  </div>
</div>`,
      ai: `Add a WordPress admin Screen Options panel to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

In WordPress, register options via PHP: get_current_screen()->add_option(). The HTML pattern is:

<div id="screen-meta">
  <div id="screen-options-wrap" class="hidden">
    <h5>Screen Options</h5>
    <fieldset>
      <label><input type="checkbox" checked> Column Name</label>
    </fieldset>
  </div>
</div>`
    }
  },

  {
    id: 'help-tabs',
    name: 'Help Tabs',
    category: 'layout',
    description: 'Contextual help tabs that appear when the user clicks "Help" in the top-right of a WordPress admin screen.',
    preview: `<div style="display:flex;border:1px solid var(--wpadmin-border);background:var(--wpadmin-surface);border-radius:4px;min-height:140px;overflow:hidden">
  <ul style="list-style:none;margin:0;padding:8px 0;width:140px;border-right:1px solid var(--wpadmin-border);background:var(--wpadmin-surface-alt)">
    <li><a href="#" style="display:block;padding:6px 12px;font-size:13px;background:var(--wpadmin-surface);color:var(--wpadmin-primary);text-decoration:none;border-left:3px solid var(--wpadmin-primary);font-weight:500">Overview</a></li>
    <li><a href="#" style="display:block;padding:6px 12px;font-size:13px;color:var(--wpadmin-text);text-decoration:none">Shortcuts</a></li>
    <li><a href="#" style="display:block;padding:6px 12px;font-size:13px;color:var(--wpadmin-text);text-decoration:none">FAQ</a></li>
  </ul>
  <div style="flex:1;padding:16px">
    <p style="margin:0;font-size:13px;color:var(--wpadmin-text)">This page lets you manage your plugin's settings…</p>
  </div>
</div>`,
    code: {
      html: `<div id="contextual-help-wrap">
  <div class="contextual-help-tabs">
    <ul>
      <li class="active"><a href="#tab-overview">Overview</a></li>
      <li><a href="#tab-shortcuts">Shortcuts</a></li>
    </ul>
  </div>
  <div class="contextual-help-tabs-wrap">
    <div id="tab-overview" class="help-tab-content active">
      <p>This page lets you…</p>
    </div>
  </div>
</div>`,
      ai: `Add WordPress admin contextual Help Tabs to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

In WP, register tabs via PHP: get_current_screen()->add_help_tab(). The HTML pattern:

<div id="contextual-help-wrap">
  <div class="contextual-help-tabs"><ul>
    <li class="active"><a href="#tab-overview">Overview</a></li>
  </ul></div>
  <div class="contextual-help-tabs-wrap">
    <div id="tab-overview" class="help-tab-content active"><p>Content</p></div>
  </div>
</div>`
    }
  },

  // ─── Forms ────────────────────────────────────────────────────────────
  {
    id: 'form-table',
    name: 'Form Table',
    category: 'forms',
    description: 'The two-column label/control layout WordPress uses on every settings page. Use <code>.regular-text</code>, <code>.large-text</code>, or <code>.small-text</code> on inputs to set width.',
    preview: `<table class="form-table">
  <tr>
    <th scope="row"><label for="ex-api">API Key</label></th>
    <td>
      <input type="text" id="ex-api" class="regular-text" placeholder="sk-…">
      <p class="description">Find your key in the dashboard.</p>
    </td>
  </tr>
  <tr>
    <th scope="row"><label for="ex-mode">Mode</label></th>
    <td>
      <select id="ex-mode">
        <option>Production</option>
        <option>Sandbox</option>
      </select>
    </td>
  </tr>
  <tr>
    <th scope="row">Options</th>
    <td>
      <fieldset>
        <label><input type="checkbox" checked> Enable feature</label><br>
        <label><input type="checkbox"> Send notifications</label>
      </fieldset>
    </td>
  </tr>
</table>`,
    code: {
      html: `<table class="form-table">
  <tr>
    <th scope="row"><label for="api-key">API Key</label></th>
    <td>
      <input type="text" id="api-key" class="regular-text" name="api_key">
      <p class="description">Find your key in the dashboard.</p>
    </td>
  </tr>
  <tr>
    <th scope="row">Options</th>
    <td>
      <fieldset>
        <label><input type="checkbox" name="enable_feature"> Enable feature</label>
      </fieldset>
    </td>
  </tr>
</table>`,
      ai: `Add a WordPress admin settings form using the standard .form-table layout from Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Standard pattern: th[scope="row"] for the label, td for the control. Use .regular-text / .large-text / .small-text for input width. Use .description for help text.

HTML:
<table class="form-table">
  <tr>
    <th scope="row"><label for="api-key">API Key</label></th>
    <td>
      <input type="text" id="api-key" class="regular-text" name="api_key">
      <p class="description">Find your key in the dashboard.</p>
    </td>
  </tr>
</table>`
    }
  },

  {
    id: 'inputs',
    name: 'Inputs',
    category: 'forms',
    description: 'All standard input types styled to match WordPress admin. Use width modifiers <code>.regular-text</code> (default), <code>.large-text</code>, and <code>.small-text</code>.',
    preview: `<div style="display:flex;flex-direction:column;gap:8px;max-width:380px">
  <input type="text" class="regular-text" placeholder="Text input">
  <input type="email" class="regular-text" placeholder="email@example.com">
  <input type="url" class="regular-text" placeholder="https://…">
  <input type="password" class="regular-text" placeholder="••••••••">
  <input type="number" class="small-text" value="25" min="0" max="100">
  <input type="date" class="regular-text">
  <textarea class="large-text" rows="3" placeholder="Multi-line input"></textarea>
</div>`,
    code: {
      html: `<input type="text"     class="regular-text"  name="text_field">
<input type="email"    class="regular-text"  name="email_field">
<input type="url"      class="regular-text"  name="url_field">
<input type="password" class="regular-text"  name="password_field">
<input type="number"   class="small-text"    name="count" min="0" max="100">
<input type="date"     class="regular-text"  name="date_field">
<textarea class="large-text" rows="3"        name="multiline"></textarea>`,
      ai: `Use these input types with Plugin SDK classes in my plugin settings form.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Width classes:
- .regular-text — default width for most inputs (~25em)
- .large-text   — full-width input (use for textareas and long URLs)
- .small-text   — narrow input (use for numbers)

HTML:
<input type="text"     class="regular-text"  name="text_field">
<input type="email"    class="regular-text"  name="email_field">
<input type="number"   class="small-text"    name="count">
<textarea class="large-text" rows="3"        name="multiline"></textarea>`
    }
  },

  {
    id: 'toggle',
    name: 'Toggle Switch',
    category: 'forms',
    description: 'On/off switch matching the Gutenberg toggle pattern. Replaces the standard checkbox when the binary nature of a setting needs to be obvious at a glance.',
    preview: `<div style="display:flex;flex-direction:column;gap:12px">
  <label class="wp-admin-toggle">
    <input type="checkbox" class="wp-admin-toggle__input" checked>
    <span class="wp-admin-toggle__track"></span>
    <span class="wp-admin-toggle__label">Notifications enabled</span>
  </label>
  <label class="wp-admin-toggle">
    <input type="checkbox" class="wp-admin-toggle__input">
    <span class="wp-admin-toggle__track"></span>
    <span class="wp-admin-toggle__label">Auto-save drafts</span>
  </label>
  <label class="wp-admin-toggle">
    <input type="checkbox" class="wp-admin-toggle__input" checked>
    <span class="wp-admin-toggle__track"></span>
    <span class="wp-admin-toggle__label">Public profile</span>
  </label>
</div>`,
    code: {
      html: `<label class="wp-admin-toggle">
  <input type="checkbox" class="wp-admin-toggle__input" name="enable_feature" checked>
  <span class="wp-admin-toggle__track"></span>
  <span class="wp-admin-toggle__label">Enable feature</span>
</label>`,
      ai: `Add a WordPress admin toggle switch (Gutenberg-style) to my plugin settings form using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Submits as a checkbox; the active color matches the user's WP color scheme.

HTML:
<label class="wp-admin-toggle">
  <input type="checkbox" class="wp-admin-toggle__input" name="enable_feature" checked>
  <span class="wp-admin-toggle__track"></span>
  <span class="wp-admin-toggle__label">Enable feature</span>
</label>`
    }
  },

  {
    id: 'help-tip',
    name: 'Help Tip',
    category: 'forms',
    description: 'A small question-mark icon that reveals a tooltip on hover. Use it inline with form labels to provide context without cluttering the layout.',
    preview: `<table class="form-table">
  <tr>
    <th scope="row">
      <label>Webhook URL <span class="wp-admin-helptip" data-tip="The full URL we will POST to when the event fires."></span></label>
    </th>
    <td>
      <input type="url" class="regular-text" placeholder="https://example.com/hook">
    </td>
  </tr>
  <tr>
    <th scope="row">
      <label>Retry attempts <span class="wp-admin-helptip" data-tip="Number of times to retry failed deliveries."></span></label>
    </th>
    <td>
      <input type="number" class="small-text" value="3" min="0" max="10">
    </td>
  </tr>
</table>`,
    code: {
      html: `<label>
  Webhook URL
  <span class="wp-admin-helptip" data-tip="The full URL we will POST to when the event fires."></span>
</label>
<input type="url" class="regular-text" name="webhook_url">`,
      ai: `Add a help tip (question-mark icon with hover tooltip) next to a form label using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The data-tip attribute holds the tooltip text — no JavaScript required.

HTML:
<label>
  Webhook URL
  <span class="wp-admin-helptip" data-tip="The full URL we will POST to."></span>
</label>
<input type="url" class="regular-text" name="webhook_url">`
    }
  },

  // ─── Actions ──────────────────────────────────────────────────────────
  {
    id: 'button',
    name: 'Button',
    category: 'actions',
    description: 'Every button variant WordPress admin provides. <code>button-primary</code> for the page\'s main action; <code>button</code> for everything else.',
    preview: `<div style="display:flex;flex-direction:column;gap:18px;align-items:flex-start">
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button type="button" class="button button-primary">Save Changes</button>
    <button type="button" class="button">Cancel</button>
    <button type="button" class="button button-link">Reset to defaults</button>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button type="button" class="button button-small">Small</button>
    <button type="button" class="button">Default</button>
    <button type="button" class="button button-large">Large</button>
    <button type="button" class="button button-primary button-hero">Hero CTA</button>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button type="button" class="button" disabled>Disabled</button>
    <button type="button" class="button button-primary" disabled>Disabled primary</button>
    <button type="button" class="button is-destructive">Delete item</button>
    <button type="button" class="button-link button-link-delete">Delete account</button>
  </div>
  <p class="submit" style="margin:0;padding:0">
    <button type="submit" class="button button-primary">Save</button>
    <span class="spinner is-active" style="float:none;margin:0 0 0 4px;vertical-align:middle"></span>
  </p>
</div>`,
    code: {
      html: `<!-- Primary action -->
<button type="button" class="button button-primary">Save Changes</button>

<!-- Secondary / default -->
<button type="button" class="button">Cancel</button>

<!-- Sizes -->
<button type="button" class="button button-small">Small</button>
<button type="button" class="button button-large">Large</button>
<button type="button" class="button button-primary button-hero">Hero CTA</button>

<!-- Link-style -->
<button type="button" class="button-link">Looks like a link</button>
<button type="button" class="button-link button-link-delete">Destructive link</button>

<!-- Submit row with spinner -->
<p class="submit">
  <button type="submit" class="button button-primary">Save</button>
  <span class="spinner"></span>
</p>`,
      ai: `Use WordPress admin buttons in my plugin page with Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Variants:
- .button.button-primary — main page action (one per page)
- .button                — secondary / default action
- .button.button-small / .button.button-large / .button.button-hero — size modifiers
- .button-link           — looks like a text link
- .button-link.button-link-delete — destructive link
- Wrap submit + spinner in <p class="submit">

HTML:
<button type="button" class="button button-primary">Save Changes</button>
<button type="button" class="button">Cancel</button>`
    }
  },

  // ─── Navigation ───────────────────────────────────────────────────────
  {
    id: 'subsubsub',
    name: 'Status Filter',
    category: 'navigation',
    description: 'The pipe-separated status filter row shown above WordPress list tables (All | Active | Draft | Trash). Known internally as "subsubsub".',
    preview: `<ul class="subsubsub">
  <li class="all"><a href="#" class="current">All <span class="count">(24)</span></a> |</li>
  <li class="publish"><a href="#">Active <span class="count">(18)</span></a> |</li>
  <li class="draft"><a href="#">Draft <span class="count">(4)</span></a> |</li>
  <li class="trash"><a href="#">Trash <span class="count">(2)</span></a></li>
</ul>`,
    code: {
      html: `<ul class="subsubsub">
  <li class="all"><a href="?status=all" class="current">All <span class="count">(24)</span></a> |</li>
  <li class="publish"><a href="?status=publish">Active <span class="count">(18)</span></a> |</li>
  <li class="draft"><a href="?status=draft">Draft <span class="count">(4)</span></a></li>
</ul>`,
      ai: `Add a WordPress status filter (All | Active | Draft | Trash) above my list table using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Add .current to the active link. Render the counts via PHP. Each link ends with " |" except the last.

HTML:
<ul class="subsubsub">
  <li class="all"><a href="?status=all" class="current">All <span class="count">(24)</span></a> |</li>
  <li><a href="?status=publish">Active <span class="count">(18)</span></a></li>
</ul>`
    }
  },

  // ─── Data Display ─────────────────────────────────────────────────────
  {
    id: 'postbox',
    name: 'Postbox',
    category: 'data',
    description: 'The bordered card used everywhere in WordPress admin — meta boxes, dashboard widgets, plugin settings sections. The base building block for grouped content.',
    preview: `<div class="postbox" style="margin:0">
  <div class="postbox-header">
    <h2 class="hndle">Plugin Status</h2>
  </div>
  <div class="inside">
    <p>Your plugin is active and running on this site.</p>
    <p><button type="button" class="button button-small">View Details</button></p>
  </div>
</div>`,
    code: {
      html: `<div class="postbox">
  <div class="postbox-header">
    <h2 class="hndle">Section Title</h2>
  </div>
  <div class="inside">
    <p>Content goes here.</p>
  </div>
</div>`,
      ai: `Add a WordPress admin postbox (meta-box style card) to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

HTML:
<div class="postbox">
  <div class="postbox-header">
    <h2 class="hndle">Section Title</h2>
  </div>
  <div class="inside">
    <p>Content goes here.</p>
  </div>
</div>`
    }
  },

  {
    id: 'welcome-panel',
    name: 'Welcome Panel',
    category: 'data',
    description: 'The large onboarding card WordPress shows on a freshly-installed dashboard. Use it for first-run welcome screens or plugin setup wizards.',
    preview: `<div class="welcome-panel">
  <div class="welcome-panel-content">
    <h2>Welcome to My Plugin</h2>
    <p class="about-description">Get started by connecting your account and choosing your defaults.</p>
    <a href="#" class="button button-primary button-hero">Get Started</a>
  </div>
</div>`,
    code: {
      html: `<div class="welcome-panel">
  <div class="welcome-panel-content">
    <h2>Welcome to My Plugin</h2>
    <p class="about-description">Get started by configuring your settings.</p>
    <a href="?page=onboarding" class="button button-primary button-hero">Get Started</a>
  </div>
</div>`,
      ai: `Add a WordPress admin welcome panel to my plugin onboarding flow using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

HTML:
<div class="welcome-panel">
  <div class="welcome-panel-content">
    <h2>Welcome to My Plugin</h2>
    <p class="about-description">Get started by configuring your settings.</p>
    <a href="?page=onboarding" class="button button-primary button-hero">Get Started</a>
  </div>
</div>`
    }
  },

  {
    id: 'stat-card',
    name: 'Stat Card',
    category: 'data',
    description: 'Dashboard widget that displays a single key metric — total count, recent activity number, etc. — with optional delta indicator.',
    preview: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
  <div class="wp-admin-statcard">
    <div class="wp-admin-statcard__label">Total posts</div>
    <div class="wp-admin-statcard__value">1,284</div>
    <div class="wp-admin-statcard__delta is-up">↑ 12 this week</div>
  </div>
  <div class="wp-admin-statcard">
    <div class="wp-admin-statcard__label">Active users</div>
    <div class="wp-admin-statcard__value">82</div>
    <div class="wp-admin-statcard__delta is-down">↓ 3 this week</div>
  </div>
  <div class="wp-admin-statcard">
    <div class="wp-admin-statcard__label">Storage</div>
    <div class="wp-admin-statcard__value">4.2GB</div>
    <div class="wp-admin-statcard__delta">↔ no change</div>
  </div>
</div>`,
    code: {
      html: `<div class="wp-admin-statcard">
  <div class="wp-admin-statcard__label">Total posts</div>
  <div class="wp-admin-statcard__value">1,284</div>
  <div class="wp-admin-statcard__delta is-up">↑ 12 this week</div>
</div>`,
      ai: `Add a WordPress admin stat card dashboard widget to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Use .is-up (green) or .is-down (red) on the delta. Place multiple inside a grid for a stats row.

HTML:
<div class="wp-admin-statcard">
  <div class="wp-admin-statcard__label">Total posts</div>
  <div class="wp-admin-statcard__value">1,284</div>
  <div class="wp-admin-statcard__delta is-up">↑ 12 this week</div>
</div>`
    }
  },

  {
    id: 'activity-feed',
    name: 'Activity Feed',
    category: 'data',
    description: 'List of recent activity items with avatar, body, and timestamp. Drop inside a postbox for the classic dashboard "Recent Activity" widget.',
    preview: `<div class="postbox" style="margin:0">
  <div class="postbox-header"><h2 class="hndle">Recent Activity</h2></div>
  <div class="inside">
    <div class="wp-admin-activity">
      <div class="wp-admin-activity__avatar">JD</div>
      <div class="wp-admin-activity__body">
        <div class="wp-admin-activity__text"><strong>Jane Doe</strong> published "Hello World"</div>
        <div class="wp-admin-activity__time">2 hours ago</div>
      </div>
    </div>
    <div class="wp-admin-activity">
      <div class="wp-admin-activity__avatar">AS</div>
      <div class="wp-admin-activity__body">
        <div class="wp-admin-activity__text"><strong>Alex Smith</strong> commented on "Sample Post"</div>
        <div class="wp-admin-activity__time">Yesterday</div>
      </div>
    </div>
    <div class="wp-admin-activity">
      <div class="wp-admin-activity__avatar">MR</div>
      <div class="wp-admin-activity__body">
        <div class="wp-admin-activity__text"><strong>Maria R.</strong> updated plugin settings</div>
        <div class="wp-admin-activity__time">2 days ago</div>
      </div>
    </div>
  </div>
</div>`,
    code: {
      html: `<div class="wp-admin-activity">
  <div class="wp-admin-activity__avatar">JD</div>
  <div class="wp-admin-activity__body">
    <div class="wp-admin-activity__text">
      <strong>Jane Doe</strong> published "Hello World"
    </div>
    <div class="wp-admin-activity__time">2 hours ago</div>
  </div>
</div>`,
      ai: `Add a WordPress admin activity feed item (avatar + body + timestamp) to my dashboard widget using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Wrap multiple items inside .postbox .inside for the standard widget container.

HTML:
<div class="wp-admin-activity">
  <div class="wp-admin-activity__avatar">JD</div>
  <div class="wp-admin-activity__body">
    <div class="wp-admin-activity__text"><strong>Jane Doe</strong> published "Hello World"</div>
    <div class="wp-admin-activity__time">2 hours ago</div>
  </div>
</div>`
    }
  },

  // ─── Tables ───────────────────────────────────────────────────────────
  {
    id: 'list-table',
    name: 'List Table',
    category: 'tables',
    description: 'The standard <code>WP_List_Table</code> markup. Use <code>widefat fixed striped</code> for the classic alternating-row WordPress table.',
    preview: `<table class="wp-list-table widefat fixed striped">
  <thead>
    <tr>
      <th scope="col" class="manage-column column-cb check-column"><input type="checkbox"></th>
      <th scope="col" class="manage-column">Title</th>
      <th scope="col" class="manage-column">Author</th>
      <th scope="col" class="manage-column">Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row" class="check-column"><input type="checkbox"></th>
      <td>
        <strong><a href="#">Sample Post Title</a></strong>
        <div class="row-actions">
          <span class="edit"><a href="#">Edit</a> | </span>
          <span class="trash"><a href="#" class="submitdelete">Trash</a></span>
        </div>
      </td>
      <td>Admin</td>
      <td>2 hours ago</td>
    </tr>
    <tr>
      <th scope="row" class="check-column"><input type="checkbox"></th>
      <td><strong><a href="#">Another Post</a></strong></td>
      <td>Editor</td>
      <td>Yesterday</td>
    </tr>
  </tbody>
</table>`,
    code: {
      html: `<table class="wp-list-table widefat fixed striped">
  <thead><tr>
    <th scope="col" class="manage-column column-cb check-column"><input type="checkbox"></th>
    <th scope="col" class="manage-column">Title</th>
    <th scope="col" class="manage-column">Author</th>
    <th scope="col" class="manage-column">Date</th>
  </tr></thead>
  <tbody>
    <tr>
      <th scope="row" class="check-column"><input type="checkbox"></th>
      <td>
        <strong><a href="?action=edit&id=1">Sample Title</a></strong>
        <div class="row-actions">
          <span class="edit"><a href="?action=edit&id=1">Edit</a> | </span>
          <span class="trash"><a href="?action=trash&id=1" class="submitdelete">Trash</a></span>
        </div>
      </td>
      <td>Admin</td>
      <td>2 hours ago</td>
    </tr>
  </tbody>
</table>`,
      ai: `Add a WordPress admin list table (the standard WP_List_Table style) to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Classes: .wp-list-table .widefat .fixed .striped for the standard alternating-row look. Use .row-actions to add hover-revealed Edit/Trash links.

HTML:
<table class="wp-list-table widefat fixed striped">
  <thead><tr>
    <th class="manage-column column-cb check-column"><input type="checkbox"></th>
    <th class="manage-column">Title</th>
  </tr></thead>
  <tbody><tr>
    <th class="check-column"><input type="checkbox"></th>
    <td>
      <strong><a href="?action=edit&id=1">Title</a></strong>
      <div class="row-actions">
        <span class="edit"><a href="?action=edit&id=1">Edit</a> | </span>
        <span class="trash"><a href="?action=trash&id=1" class="submitdelete">Trash</a></span>
      </div>
    </td>
  </tr></tbody>
</table>`
    }
  },

  {
    id: 'bulk-actions',
    name: 'Bulk Actions',
    category: 'tables',
    description: 'The bulk-actions select + Apply button that appears above WordPress list tables. Submits as part of the surrounding form.',
    preview: `<div class="tablenav top">
  <div class="alignleft actions bulkactions">
    <label for="bulk-action-selector" class="screen-reader-text">Select bulk action</label>
    <select id="bulk-action-selector" name="action">
      <option value="-1">Bulk actions</option>
      <option value="edit">Edit</option>
      <option value="trash">Move to Trash</option>
    </select>
    <button type="submit" class="button action">Apply</button>
  </div>
</div>`,
    code: {
      html: `<div class="tablenav top">
  <div class="alignleft actions bulkactions">
    <label for="bulk-action-selector" class="screen-reader-text">Select bulk action</label>
    <select id="bulk-action-selector" name="action">
      <option value="-1">Bulk actions</option>
      <option value="edit">Edit</option>
      <option value="trash">Move to Trash</option>
    </select>
    <button type="submit" class="button action">Apply</button>
  </div>
</div>`,
      ai: `Add a WordPress admin bulk-actions toolbar above a list table using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Place inside the <form> that wraps your <table class="wp-list-table">. The selected action will be in $_POST['action'].

HTML:
<div class="tablenav top">
  <div class="alignleft actions bulkactions">
    <select name="action">
      <option value="-1">Bulk actions</option>
      <option value="edit">Edit</option>
      <option value="trash">Move to Trash</option>
    </select>
    <button type="submit" class="button action">Apply</button>
  </div>
</div>`
    }
  },

  {
    id: 'search-box',
    name: 'Search Box',
    category: 'tables',
    description: 'The compact search input + Search button shown above WordPress list tables. Submits the <code>s</code> query parameter — the WP search convention.',
    preview: `<p class="search-box">
  <label class="screen-reader-text" for="post-search-input">Search posts:</label>
  <input type="search" id="post-search-input" name="s" placeholder="Search…">
  <button type="submit" class="button">Search Posts</button>
</p>`,
    code: {
      html: `<p class="search-box">
  <label class="screen-reader-text" for="post-search-input">Search:</label>
  <input type="search" id="post-search-input" name="s" value="">
  <button type="submit" class="button">Search Posts</button>
</p>`,
      ai: `Add a WordPress admin search box above a list table using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The name="s" is the WP convention for search query — submit the form to the same page.

HTML:
<p class="search-box">
  <label class="screen-reader-text" for="post-search-input">Search:</label>
  <input type="search" id="post-search-input" name="s" value="">
  <button type="submit" class="button">Search Posts</button>
</p>`
    }
  },

  {
    id: 'pagination',
    name: 'Pagination',
    category: 'tables',
    description: 'WordPress list-table pagination: total count + first/prev/next/last navigation. Use <code>paged</code> as the query parameter to match the WP convention.',
    preview: `<div class="tablenav-pages">
  <span class="displaying-num">142 items</span>
  <span class="pagination-links">
    <a class="first-page button" href="#"><span aria-hidden="true">«</span></a>
    <a class="prev-page button" href="#"><span aria-hidden="true">‹</span></a>
    <span class="paging-input">
      <span class="tablenav-paging-text">2 of <span class="total-pages">8</span></span>
    </span>
    <a class="next-page button" href="#"><span aria-hidden="true">›</span></a>
    <a class="last-page button" href="#"><span aria-hidden="true">»</span></a>
  </span>
</div>`,
    code: {
      html: `<div class="tablenav-pages">
  <span class="displaying-num">142 items</span>
  <span class="pagination-links">
    <a class="first-page button" href="?paged=1">«</a>
    <a class="prev-page button"  href="?paged=1">‹</a>
    <span class="paging-input">2 of 8</span>
    <a class="next-page button"  href="?paged=3">›</a>
    <a class="last-page button"  href="?paged=8">»</a>
  </span>
</div>`,
      ai: `Add WordPress admin pagination below a list table using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

In PHP, you can use WP_List_Table::pagination() to generate this. The paged query parameter is the WP convention.

HTML:
<div class="tablenav-pages">
  <span class="displaying-num">142 items</span>
  <span class="pagination-links">
    <a class="first-page button" href="?paged=1">«</a>
    <a class="prev-page button"  href="?paged=1">‹</a>
    <span class="paging-input">2 of 8</span>
    <a class="next-page button"  href="?paged=3">›</a>
    <a class="last-page button"  href="?paged=8">»</a>
  </span>
</div>`
    }
  },

  {
    id: 'empty-state',
    name: 'Empty State',
    category: 'tables',
    description: 'Friendly fallback shown when a list has no results. Includes icon, title, description, and a primary CTA to create the first item.',
    preview: `<div class="wp-admin-empty">
  <div class="wp-admin-empty__icon">∅</div>
  <div class="wp-admin-empty__title">No items yet</div>
  <div class="wp-admin-empty__description">Get started by creating your first item — it only takes a few seconds.</div>
  <a href="#" class="button button-primary">Add New</a>
</div>`,
    code: {
      html: `<div class="wp-admin-empty">
  <div class="wp-admin-empty__icon">∅</div>
  <div class="wp-admin-empty__title">No items yet</div>
  <div class="wp-admin-empty__description">Get started by creating your first item.</div>
  <a href="?page=add-new" class="button button-primary">Add New</a>
</div>`,
      ai: `Show an empty state when a WordPress admin list has no results, using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Render in place of the list table when the result set is empty.

HTML:
<div class="wp-admin-empty">
  <div class="wp-admin-empty__icon">∅</div>
  <div class="wp-admin-empty__title">No items yet</div>
  <div class="wp-admin-empty__description">Get started by creating your first item.</div>
  <a href="?page=add-new" class="button button-primary">Add New</a>
</div>`
    }
  },

  // ─── Feedback ─────────────────────────────────────────────────────────
  {
    id: 'notice',
    name: 'Notice',
    category: 'feedback',
    description: 'WordPress admin notices for confirmations, errors, warnings, and info. Add <code>is-dismissible</code> to enable WP\'s built-in dismiss-on-click behavior.',
    preview: `<div style="display:flex;flex-direction:column;gap:8px">
  <div class="notice notice-success inline" style="margin-left:0"><p><strong>Settings saved.</strong> Your changes have been applied.</p></div>
  <div class="notice notice-error inline" style="margin-left:0"><p><strong>Error:</strong> Could not connect to the API.</p></div>
  <div class="notice notice-warning inline" style="margin-left:0"><p><strong>Warning:</strong> Please review your settings before saving.</p></div>
  <div class="notice notice-info inline" style="margin-left:0"><p><strong>Info:</strong> A new version is available. <a href="#">Update now</a>.</p></div>
  <div class="notice notice-success is-dismissible inline" style="margin-left:0">
    <p><strong>Dismissible.</strong> Click the × to close.</p>
    <button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss</span></button>
  </div>
  <div class="notice notice-info inline" style="margin-left:0">
    <p><strong>Plugin update available.</strong> Version 2.0 includes new features.</p>
    <p>
      <button type="button" class="button button-primary">Update now</button>
      <button type="button" class="button">Later</button>
    </p>
  </div>
</div>`,
    code: {
      html: `<!-- Basic notice variants -->
<div class="notice notice-success"><p><strong>Settings saved.</strong></p></div>
<div class="notice notice-error"><p><strong>Error:</strong> Could not connect.</p></div>
<div class="notice notice-warning"><p><strong>Warning:</strong> Review your settings.</p></div>
<div class="notice notice-info"><p><strong>Info:</strong> New version available.</p></div>

<!-- Dismissible (WP wires the × click automatically when common.js is loaded) -->
<div class="notice notice-success is-dismissible">
  <p><strong>Saved.</strong></p>
  <button type="button" class="notice-dismiss">
    <span class="screen-reader-text">Dismiss</span>
  </button>
</div>

<!-- Notice with action buttons -->
<div class="notice notice-info">
  <p><strong>Update available.</strong> Description here.</p>
  <p>
    <button type="button" class="button button-primary">Update now</button>
    <button type="button" class="button">Later</button>
  </p>
</div>`,
      ai: `Add WordPress admin notices to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Variants:
- .notice.notice-success — green (confirmations)
- .notice.notice-error   — red   (errors)
- .notice.notice-warning — yellow (warnings)
- .notice.notice-info    — blue  (informational)
- Add .is-dismissible + a .notice-dismiss button for a closable notice

HTML:
<div class="notice notice-success is-dismissible">
  <p><strong>Settings saved.</strong></p>
  <button type="button" class="notice-dismiss">
    <span class="screen-reader-text">Dismiss</span>
  </button>
</div>`
    }
  },

  {
    id: 'status-badge',
    name: 'Status Badge',
    category: 'feedback',
    description: 'Inline pill indicators for entity status — Active, Pending, Failed, etc. Use semantic modifiers so the color matches the meaning.',
    preview: `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
  <span class="wp-admin-status is-active">Active</span>
  <span class="wp-admin-status is-warning">Pending</span>
  <span class="wp-admin-status is-error">Failed</span>
  <span class="wp-admin-status is-info">Syncing</span>
  <span class="wp-admin-status">Inactive</span>
</div>`,
    code: {
      html: `<span class="wp-admin-status is-active">Active</span>
<span class="wp-admin-status is-warning">Pending</span>
<span class="wp-admin-status is-error">Failed</span>
<span class="wp-admin-status is-info">Syncing</span>
<span class="wp-admin-status">Inactive</span>`,
      ai: `Add WordPress admin status badge pills (Active / Pending / Failed / etc.) to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Modifiers: .is-active (green), .is-warning (yellow), .is-error (red), .is-info (blue). No modifier = neutral grey.

HTML:
<span class="wp-admin-status is-active">Active</span>
<span class="wp-admin-status is-warning">Pending</span>
<span class="wp-admin-status is-error">Failed</span>`
    }
  },

  {
    id: 'spinner',
    name: 'Spinner',
    category: 'feedback',
    description: 'The standard WordPress loading spinner. Toggle the <code>is-active</code> class to show or hide it. Typically placed next to a submit button to indicate work in progress.',
    preview: `<div style="display:flex;align-items:center;gap:10px">
  <button type="button" class="button button-primary">Save Changes</button>
  <span class="spinner is-active" style="float:none;margin:0"></span>
  <span style="color:var(--wpadmin-text-subtle);font-size:13px">Saving…</span>
</div>`,
    code: {
      html: `<button type="button" class="button button-primary">Save</button>
<span class="spinner is-active"></span>`,
      ai: `Add a WordPress admin loading spinner to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Toggle the .is-active class with JavaScript to show/hide. Often placed next to a submit button.

HTML:
<button type="button" class="button button-primary">Save</button>
<span class="spinner is-active"></span>`
    }
  },

  {
    id: 'pointer',
    name: 'WP Pointer',
    category: 'feedback',
    description: 'The callout WordPress uses to highlight new features — a small panel with a left-arrow that points to a UI element. Show once, then dismiss.',
    preview: `<div style="padding:24px 0 24px 24px">
  <div class="wp-admin-pointer">
    <div class="wp-admin-pointer__title">New: AI Assist</div>
    <div class="wp-admin-pointer__body">Generate content faster with built-in AI suggestions in the editor.</div>
    <div class="wp-admin-pointer__actions">
      <button type="button" class="button button-primary button-small">Try it</button>
      <button type="button" class="button button-small">Dismiss</button>
    </div>
  </div>
</div>`,
    code: {
      html: `<div class="wp-admin-pointer">
  <div class="wp-admin-pointer__title">New: AI Assist</div>
  <div class="wp-admin-pointer__body">
    Generate content faster with built-in AI suggestions.
  </div>
  <div class="wp-admin-pointer__actions">
    <button class="button button-primary button-small">Try it</button>
    <button class="button button-small">Dismiss</button>
  </div>
</div>`,
      ai: `Add a WordPress admin pointer callout (WP uses these to highlight new features) using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Position absolutely next to the UI element you want to point at. Store a dismissed flag in user meta so it only shows once.

HTML:
<div class="wp-admin-pointer">
  <div class="wp-admin-pointer__title">New: AI Assist</div>
  <div class="wp-admin-pointer__body">Description of the new feature.</div>
  <div class="wp-admin-pointer__actions">
    <button class="button button-primary button-small">Try it</button>
    <button class="button button-small">Dismiss</button>
  </div>
</div>`
    }
  },

  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'feedback',
    description: 'Animated placeholders shown while content is loading. Replace with real content when the data arrives. Width modifiers control the visual shape.',
    preview: `<div class="postbox" style="margin:0">
  <div class="postbox-header">
    <h2 class="hndle">Loading…</h2>
  </div>
  <div class="inside">
    <div class="wp-admin-skeleton is-title"></div>
    <div class="wp-admin-skeleton is-text"></div>
    <div class="wp-admin-skeleton is-text"></div>
    <div class="wp-admin-skeleton is-short"></div>
  </div>
</div>`,
    code: {
      html: `<div class="wp-admin-skeleton is-title"></div>
<div class="wp-admin-skeleton is-text"></div>
<div class="wp-admin-skeleton is-text"></div>
<div class="wp-admin-skeleton is-short"></div>`,
      ai: `Add WordPress admin skeleton loaders (animated placeholders shown while data loads) using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Modifiers: .is-title (taller, 50% width), .is-text (full width), .is-short (60% width). Replace with real content once data arrives.

HTML:
<div class="wp-admin-skeleton is-title"></div>
<div class="wp-admin-skeleton is-text"></div>
<div class="wp-admin-skeleton is-short"></div>`
    }
  },

  // ─── Forms additions ──────────────────────────────────────────────────
  {
    id: 'color-picker',
    name: 'Color Picker',
    category: 'forms',
    description: 'Text input with the <code>.wp-color-picker</code> class — WordPress\'s Iris picker auto-upgrades these inputs when <code>wp-color-picker</code> is enqueued. Without Iris, falls back to a plain text input.',
    preview: `<table class="form-table">
  <tr>
    <th scope="row"><label for="ex-color">Primary color</label></th>
    <td>
      <span data-demo-color-pair style="display:inline-flex;align-items:center;gap:8px">
        <label style="display:inline-flex;align-items:center;border:1px solid var(--wpadmin-border);border-radius:4px;padding:3px;background:#fff;cursor:pointer">
          <span data-demo-swatch style="display:inline-block;width:24px;height:24px;border-radius:2px;background:#2271b1"></span>
          <input type="color" value="#2271b1" style="width:0;height:0;opacity:0;pointer-events:none;position:absolute">
        </label>
        <input type="text" id="ex-color" class="regular-text" value="#2271b1" style="max-width:140px;font-family:Consolas,Monaco,monospace">
      </span>
      <p class="description">Click the swatch to open the OS color picker, or type a hex value. In WP, enqueue <code>wp-color-picker</code> for the full Iris UI.</p>
    </td>
  </tr>
</table>`,
    code: {
      html: `<input type="text" class="wp-color-picker regular-text" name="theme_color" value="#2271b1">`,
      ai: `Add a WordPress admin color picker (the Iris picker) to my plugin settings form using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

In your plugin enqueue function (PHP):
  wp_enqueue_style('wp-color-picker');
  wp_enqueue_script('wp-color-picker');
  wp_add_inline_script('wp-color-picker', 'jQuery(function($){ $(".wp-color-picker").wpColorPicker(); })');

HTML:
<input type="text" class="wp-color-picker regular-text" name="theme_color" value="#2271b1">`
    }
  },

  {
    id: 'date-picker',
    name: 'Date Picker',
    category: 'forms',
    description: 'Native HTML5 date input styled to fit WordPress admin. Works without JavaScript. For the older jQuery UI datepicker convention, swap to a text input and call <code>jQuery.datepicker</code>.',
    preview: `<table class="form-table">
  <tr>
    <th scope="row"><label for="ex-date">Start date</label></th>
    <td>
      <input type="date" id="ex-date" class="regular-text" value="2026-01-15">
    </td>
  </tr>
</table>`,
    code: {
      html: `<input type="date" class="regular-text" name="start_date" value="2026-01-15">`,
      ai: `Add a date picker to my WordPress plugin settings form using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Uses HTML5 <input type="date"> — works without JS, accessible, mobile-friendly.

HTML:
<input type="date" class="regular-text" name="start_date" value="2026-01-15">

For the older jQuery UI datepicker convention (text input + jQuery init):
- PHP: wp_enqueue_script('jquery-ui-datepicker');
- HTML: <input type="text" class="regular-text wp-admin-datepicker" name="start_date">
- JS: jQuery('.wp-admin-datepicker').datepicker({ dateFormat: 'yy-mm-dd' });`
    }
  },

  {
    id: 'media-button',
    name: 'Media Button',
    category: 'forms',
    description: 'Trigger button + thumbnail preview + hidden input for the WordPress media library. Requires <code>wp_enqueue_media()</code> on the page.',
    preview: `<div style="display:flex;flex-direction:column;gap:18px">

  <!-- Trigger button + selected media preview -->
  <span class="wp-admin-media">
    <span class="wp-admin-media__preview" data-demo-preview aria-hidden="true"></span>
    <button type="button" class="button" data-demo-open="demo-media-modal">Select or Upload Media</button>
    <span data-demo-filename style="font-size:13px;color:var(--wpadmin-text-subtle)"></span>
  </span>

  <!-- Drag-and-drop zone (works without opening the modal) -->
  <label data-demo-dropzone data-demo-accept="image/*,video/*,application/pdf" style="display:block">
    <input type="file" accept="image/*,video/*,application/pdf">
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style="color:var(--wpadmin-text-subtle)"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/></svg>
      <strong style="font-size:13px">Drop a file to upload</strong>
      <span style="font-size:12px;color:var(--wpadmin-text-subtle)">or click anywhere in this box · images, video, or PDF</span>
    </div>
  </label>

  <input type="hidden" name="featured_image_id" value="">
</div>

<!-- Fake media library modal -->
<div id="demo-media-modal" class="wp-admin-modal-backdrop is-demo" role="dialog" aria-modal="true" style="display:none">
  <div class="wp-admin-modal is-large" role="document" style="min-width:560px">
    <header class="wp-admin-modal__header">
      <h2 class="wp-admin-modal__title">Select or Upload Media</h2>
      <button type="button" class="wp-admin-modal__close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z"/></svg>
      </button>
    </header>

    <div class="wp-admin-modal__body" style="padding:0">
      <div class="wp-admin-tabs">
        <nav class="nav-tab-wrapper" style="margin:0;padding-left:20px">
          <button type="button" class="nav-tab nav-tab-active" data-demo-tab="upload">Upload Files</button>
          <button type="button" class="nav-tab" data-demo-tab="library">Media Library</button>
          <button type="button" class="nav-tab" data-demo-tab="url">From URL</button>
        </nav>

        <div class="wp-admin-tab-panel is-active" data-demo-panel="upload" style="padding:20px">
          <label data-demo-dropzone data-demo-accept="image/*,video/*,audio/*,application/pdf" style="display:block;padding:48px 20px;min-height:200px;display:flex;align-items:center;justify-content:center">
            <input type="file" accept="image/*,video/*,audio/*,application/pdf">
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">
              <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" style="color:var(--wpadmin-text-subtle)"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/></svg>
              <strong style="font-size:15px">Drop files to upload</strong>
              <span style="font-size:13px;color:var(--wpadmin-text-subtle)">or click to choose · max 64 MB</span>
              <span style="font-size:11px;color:var(--wpadmin-text-subtle);font-family:var(--wpadmin-font-mono)">image · video · audio · pdf</span>
            </div>
          </label>
        </div>

        <div class="wp-admin-tab-panel" data-demo-panel="library" style="padding:16px 20px">
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;max-height:340px;overflow-y:auto">
            ${[
              'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
              'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
              'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
              'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
              'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
              'linear-gradient(135deg,#30cfd0 0%,#330867 100%)',
              'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)',
              'linear-gradient(135deg,#ff9a9e 0%,#fad0c4 100%)',
              'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)',
              'linear-gradient(135deg,#ff6e7f 0%,#bfe9ff 100%)',
              'linear-gradient(135deg,#84fab0 0%,#8fd3f4 100%)',
              'linear-gradient(135deg,#c471f5 0%,#fa71cd 100%)',
            ].map((bg, i) => `<button type="button" class="wp-admin-media-thumb" data-demo-pick="${i}" style="aspect-ratio:1;background:${bg};border:2px solid transparent;border-radius:4px;cursor:pointer;padding:0;transition:border-color .1s"></button>`).join('')}
          </div>
          <p style="margin-top:14px;font-size:13px;color:var(--wpadmin-text-subtle)">Click any thumbnail to pick it. In real WordPress, this grid is the actual <code>wp.media()</code> library populated from <code>wp-content/uploads</code>.</p>
        </div>

        <div class="wp-admin-tab-panel" data-demo-panel="url" style="padding:20px">
          <table class="form-table">
            <tr>
              <th scope="row"><label for="demo-media-url">Media URL</label></th>
              <td>
                <input type="url" id="demo-media-url" class="regular-text" placeholder="https://example.com/image.jpg">
                <p class="description">Paste a URL to a hosted image, video, or audio file.</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <footer class="wp-admin-modal__footer">
      <button type="button" class="button" data-demo-close>Cancel</button>
      <button type="button" class="button button-primary" data-demo-close>Use this media</button>
    </footer>
  </div>
</div>`,
    code: {
      html: `<span class="wp-admin-media">
  <span class="wp-admin-media__preview" aria-hidden="true"
        style="background-image: url('https://example.com/preview.jpg');"></span>
  <button type="button" class="button"
          data-wpa-media-trigger="my-image"
          data-wpa-modal-title="Select Image"
          data-wpa-library-type="image">
    Select Image
  </button>
  <input type="hidden" name="image_id" id="my-image" value="">
</span>`,
      ai: `Add a WordPress media-library button (with thumbnail preview) to my plugin settings form using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Requires PHP setup:
  add_action('admin_enqueue_scripts', function() { wp_enqueue_media(); });

HTML:
<span class="wp-admin-media">
  <span class="wp-admin-media__preview" aria-hidden="true"></span>
  <button type="button" class="button"
          data-wpa-media-trigger="my-image"
          data-wpa-modal-title="Select Image"
          data-wpa-library-type="image">
    Select Image
  </button>
  <input type="hidden" name="image_id" id="my-image" value="">
</span>

Then wire JS to open wp.media() on click and update the hidden input + preview background. The PHP package's Components::media_button_init_js() returns a ready-to-use init snippet.`
    }
  },

  // ─── Navigation additions ─────────────────────────────────────────────
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'navigation',
    description: "WordPress admin tab strip with switchable content panels. Drive the active tab via <code>$_GET['tab']</code> (PHP-rendered), or swap panels client-side by toggling <code>.is-active</code> on the <code>.wp-admin-tab-panel</code> that matches the clicked tab.",
    preview: `<div class="wp-admin-tabs">
  <nav class="nav-tab-wrapper">
    <button type="button" class="nav-tab nav-tab-active">General</button>
    <button type="button" class="nav-tab">Advanced</button>
    <button type="button" class="nav-tab">Integrations</button>
  </nav>
  <div class="wp-admin-tab-panel is-active">
    <p style="margin-top:16px"><strong>General settings</strong> appear here. This panel has the <code>.is-active</code> class so it's visible.</p>
    <p>The other panels are in the DOM but hidden by CSS.</p>
  </div>
  <div class="wp-admin-tab-panel">
    <p>Advanced settings (hidden).</p>
  </div>
  <div class="wp-admin-tab-panel">
    <p>Integrations (hidden).</p>
  </div>
</div>`,
    code: {
      html: `<div class="wp-admin-tabs">
  <nav class="nav-tab-wrapper">
    <button type="button" class="nav-tab nav-tab-active" data-tab="general">General</button>
    <button type="button" class="nav-tab"               data-tab="advanced">Advanced</button>
  </nav>
  <div class="wp-admin-tab-panel is-active" data-panel="general">
    <p>General settings…</p>
  </div>
  <div class="wp-admin-tab-panel" data-panel="advanced">
    <p>Advanced settings…</p>
  </div>
</div>

<!-- Minimal JS to swap panels (vanilla, ~12 lines) -->
<script>
  document.querySelectorAll('.wp-admin-tabs').forEach(root => {
    root.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('nav-tab-active', b === btn));
        const target = btn.dataset.tab;
        root.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
      });
    });
  });
</script>`,
      ai: `Add WordPress admin tabs with switchable content panels to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The strip + panels are both styled by core-css. Active panel is the one with .is-active.

Two ways to drive it:
1. PHP — render only the active panel based on $_GET['tab']
2. JS — render all panels, toggle .is-active on click

HTML:
<div class="wp-admin-tabs">
  <nav class="nav-tab-wrapper">
    <button type="button" class="nav-tab nav-tab-active" data-tab="general">General</button>
    <button type="button" class="nav-tab"               data-tab="advanced">Advanced</button>
  </nav>
  <div class="wp-admin-tab-panel is-active" data-panel="general">General content…</div>
  <div class="wp-admin-tab-panel"           data-panel="advanced">Advanced content…</div>
</div>`
    }
  },

  // ─── Overlays ─────────────────────────────────────────────────────────
  {
    id: 'modal',
    name: 'Modal',
    category: 'overlays',
    description: 'A centered overlay dialog with header, body, and optional footer. Foundation for <a href="#/confirm-dialog">Confirm Dialog</a>. Sizes: small / medium (default) / large.',
    preview: `<div style="display:flex;flex-direction:column;gap:14px;align-items:flex-start">
  <p style="margin:0;color:var(--wpadmin-text-subtle);font-size:13px">Click the button to open the modal. The dialog is scoped to this preview frame so it doesn't cover the docs.</p>
  <button type="button" class="button button-primary" data-demo-open="demo-modal">Open modal</button>
</div>

<div id="demo-modal" class="wp-admin-modal-backdrop is-demo" role="dialog" aria-modal="true" style="display:none">
  <div class="wp-admin-modal is-medium" role="document">
    <header class="wp-admin-modal__header">
      <h2 class="wp-admin-modal__title">Edit profile</h2>
      <button type="button" class="wp-admin-modal__close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z"/></svg>
      </button>
    </header>
    <div class="wp-admin-modal__body">
      <p>Update your profile details. Changes are saved when you click <strong>Save</strong>.</p>
      <table class="form-table" style="margin-top:8px">
        <tr><th scope="row"><label for="demo-modal-name">Display name</label></th><td><input id="demo-modal-name" type="text" class="regular-text" value="Jane Doe"></td></tr>
      </table>
    </div>
    <footer class="wp-admin-modal__footer">
      <button type="button" class="button" data-demo-close>Cancel</button>
      <button type="button" class="button button-primary" data-demo-close>Save</button>
    </footer>
  </div>
</div>`,
    code: {
      html: `<div class="wp-admin-modal-backdrop" role="dialog" aria-modal="true">
  <div class="wp-admin-modal is-medium" role="document">
    <header class="wp-admin-modal__header">
      <h2 class="wp-admin-modal__title">Edit profile</h2>
      <button type="button" class="wp-admin-modal__close" aria-label="Close">
        <!-- × icon -->
      </button>
    </header>
    <div class="wp-admin-modal__body">
      <p>Body content goes here.</p>
    </div>
    <footer class="wp-admin-modal__footer">
      <button type="button" class="button">Cancel</button>
      <button type="button" class="button button-primary">Save</button>
    </footer>
  </div>
</div>`,
      ai: `Add a WordPress admin modal dialog to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Sizes: .is-small (420px), .is-medium (640px, default), .is-large (880px).
Backdrop is .wp-admin-modal-backdrop (dark overlay).

HTML:
<div class="wp-admin-modal-backdrop" role="dialog" aria-modal="true">
  <div class="wp-admin-modal is-medium" role="document">
    <header class="wp-admin-modal__header">
      <h2 class="wp-admin-modal__title">Title here</h2>
      <button type="button" class="wp-admin-modal__close" aria-label="Close">×</button>
    </header>
    <div class="wp-admin-modal__body">Body content</div>
    <footer class="wp-admin-modal__footer">
      <button class="button">Cancel</button>
      <button class="button button-primary">Save</button>
    </footer>
  </div>
</div>

Toggle visibility from JS (display: none → display: flex on the backdrop). Close on backdrop click + Escape key.`
    }
  },

  {
    id: 'confirm-dialog',
    name: 'Confirm Dialog',
    category: 'overlays',
    description: 'Small modal with a question + Cancel / Confirm buttons. Use the <code>.is-destructive</code> class on the confirm button for delete-style actions (red filled button).',
    preview: `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
  <button type="button" class="button" data-demo-open="demo-confirm-save">Save changes</button>
  <button type="button" class="button is-destructive" data-demo-open="demo-confirm-delete">Delete item</button>
  <span style="font-size:13px;color:var(--wpadmin-text-subtle)">Click either button to open the corresponding dialog.</span>
</div>

<div id="demo-confirm-save" class="wp-admin-modal-backdrop is-demo" role="dialog" aria-modal="true" style="display:none">
  <div class="wp-admin-modal is-small" role="document">
    <header class="wp-admin-modal__header">
      <h2 class="wp-admin-modal__title">Save changes?</h2>
      <button type="button" class="wp-admin-modal__close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z"/></svg>
      </button>
    </header>
    <div class="wp-admin-modal__body">Your edits will be applied immediately.</div>
    <footer class="wp-admin-modal__footer">
      <button type="button" class="button" data-demo-close>Cancel</button>
      <button type="button" class="button button-primary" data-demo-confirm>Save</button>
    </footer>
  </div>
</div>

<div id="demo-confirm-delete" class="wp-admin-modal-backdrop is-demo" role="dialog" aria-modal="true" style="display:none">
  <div class="wp-admin-modal is-small" role="document">
    <header class="wp-admin-modal__header">
      <h2 class="wp-admin-modal__title">Delete this item?</h2>
      <button type="button" class="wp-admin-modal__close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z"/></svg>
      </button>
    </header>
    <div class="wp-admin-modal__body">This action cannot be undone.</div>
    <footer class="wp-admin-modal__footer">
      <button type="button" class="button" data-demo-close>Cancel</button>
      <button type="button" class="button button-primary is-destructive" data-demo-confirm>Delete</button>
    </footer>
  </div>
</div>`,
    code: {
      html: `<!-- Regular -->
<div class="wp-admin-modal-backdrop" role="dialog" aria-modal="true">
  <div class="wp-admin-modal is-small">
    <header class="wp-admin-modal__header">
      <h2 class="wp-admin-modal__title">Save changes?</h2>
      <button type="button" class="wp-admin-modal__close" aria-label="Close">×</button>
    </header>
    <div class="wp-admin-modal__body">Your edits will be applied.</div>
    <footer class="wp-admin-modal__footer">
      <button class="button" data-action="cancel">Cancel</button>
      <button class="button button-primary" data-action="confirm">Save</button>
    </footer>
  </div>
</div>

<!-- Destructive — same structure, add .is-destructive to the confirm button: -->
<button class="button button-primary is-destructive" data-action="confirm">Delete</button>`,
      ai: `Add a WordPress admin confirmation dialog to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Use the Modal pattern with .is-small size, a title that asks the question, a short message, and Cancel / Confirm buttons. For destructive actions (delete, remove, archive), add .is-destructive to the confirm button to render it red.

HTML:
<div class="wp-admin-modal-backdrop" role="dialog" aria-modal="true">
  <div class="wp-admin-modal is-small">
    <header class="wp-admin-modal__header">
      <h2 class="wp-admin-modal__title">Delete this item?</h2>
    </header>
    <div class="wp-admin-modal__body">This action cannot be undone.</div>
    <footer class="wp-admin-modal__footer">
      <button class="button" data-action="cancel">Cancel</button>
      <button class="button button-primary is-destructive" data-action="confirm">Delete</button>
    </footer>
  </div>
</div>`
    }
  },

  {
    id: 'dropdown-menu',
    name: 'Dropdown Menu',
    category: 'overlays',
    description: 'Action menu opened by a trigger button. Each item can be a link or a button; mark items destructive for delete-style actions. Add separators to group items.',
    preview: `<div style="display:flex;gap:24px;align-items:flex-start;padding:8px 8px 200px">
  <div class="wp-admin-dropdown">
    <button type="button" class="button" aria-haspopup="menu" aria-expanded="false">Actions ▾</button>
    <ul class="wp-admin-dropdown__menu" role="menu" hidden>
      <li role="none"><button type="button" class="wp-admin-dropdown__item" role="menuitem">Edit</button></li>
      <li role="none"><button type="button" class="wp-admin-dropdown__item" role="menuitem">Duplicate</button></li>
      <li role="none"><a href="#" class="wp-admin-dropdown__item" role="menuitem">View on site</a></li>
      <li class="wp-admin-dropdown__separator" role="separator"></li>
      <li role="none"><button type="button" class="wp-admin-dropdown__item is-destructive" role="menuitem">Delete</button></li>
    </ul>
  </div>
  <p style="font-size:13px;color:var(--wpadmin-text-subtle);max-width:280px;margin:6px 0 0">Click the trigger to open. Click outside, press Escape, or pick an item to close.</p>
</div>`,
    code: {
      html: `<div class="wp-admin-dropdown">
  <button type="button" class="button" aria-haspopup="menu" aria-expanded="false">
    Actions ▾
  </button>
  <ul class="wp-admin-dropdown__menu" role="menu" hidden>
    <li role="none">
      <button type="button" class="wp-admin-dropdown__item" role="menuitem">Edit</button>
    </li>
    <li role="none">
      <a href="?view=1" class="wp-admin-dropdown__item" role="menuitem">View on site</a>
    </li>
    <li class="wp-admin-dropdown__separator" role="separator"></li>
    <li role="none">
      <button type="button" class="wp-admin-dropdown__item is-destructive" role="menuitem">
        Delete
      </button>
    </li>
  </ul>
</div>`,
      ai: `Add a WordPress admin dropdown action menu to my plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

Each item can be a <button> (for client actions) or <a> (for navigation). Add .is-destructive for delete-style items. Use .wp-admin-dropdown__separator for grouping. Add .is-right to .wp-admin-dropdown__menu to align to the right edge of the trigger.

HTML:
<div class="wp-admin-dropdown">
  <button type="button" class="button" aria-haspopup="menu" aria-expanded="false">Actions ▾</button>
  <ul class="wp-admin-dropdown__menu" role="menu" hidden>
    <li role="none"><button class="wp-admin-dropdown__item" role="menuitem">Edit</button></li>
    <li class="wp-admin-dropdown__separator" role="separator"></li>
    <li role="none"><button class="wp-admin-dropdown__item is-destructive" role="menuitem">Delete</button></li>
  </ul>
</div>

Wire JS to toggle [hidden] on the menu on trigger click; close on click-outside + Escape.`
    }
  },

  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'overlays',
    description: 'CSS-only hover/focus tooltip that wraps any element. For an inline question-mark variant tied to form labels, see <a href="#/help-tip">Help Tip</a>.',
    preview: `<div style="display:flex;gap:16px;align-items:center;padding:40px 0 20px;flex-wrap:wrap;justify-content:center">
  <span class="wp-admin-tooltip" tabindex="0">
    <button type="button" class="button">Hover me</button>
    <span class="wp-admin-tooltip__content" role="tooltip">More info about this action</span>
  </span>
  <span class="wp-admin-tooltip" tabindex="0">
    <span class="wp-admin-status is-warning">Pending</span>
    <span class="wp-admin-tooltip__content" role="tooltip">Awaiting approval since yesterday</span>
  </span>
  <span class="wp-admin-tooltip" tabindex="0">
    <svg class="wp-admin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v2h-2zm0 4h2v6h-2z" fill="currentColor"/></svg>
    <span class="wp-admin-tooltip__content" role="tooltip">Hover the info icon</span>
  </span>
</div>
<p style="font-size:13px;color:var(--wpadmin-text-subtle);text-align:center">Hover any element above to see its tooltip.</p>`,
    code: {
      html: `<span class="wp-admin-tooltip" tabindex="0">
  <button type="button" class="button">Hover me</button>
  <span class="wp-admin-tooltip__content" role="tooltip">More info about this action</span>
</span>`,
      ai: `Add a hover/focus tooltip to any element on my WordPress admin plugin page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

CSS-only — no JS needed. The tooltip appears above the wrapped element on hover or keyboard focus.

HTML:
<span class="wp-admin-tooltip" tabindex="0">
  <button type="button" class="button">Hover me</button>
  <span class="wp-admin-tooltip__content" role="tooltip">More info about this action</span>
</span>`
    }
  },

  // ─── Security ─────────────────────────────────────────────────────────
  {
    id: 'nonce-field',
    name: 'Nonce Field',
    category: 'security',
    description: 'WordPress\'s standard CSRF protection. Place inside every <code>&lt;form&gt;</code> that mutates state, then verify with <code>wp_verify_nonce()</code> in your handler. The PHP helper wraps <code>wp_nonce_field()</code> directly.',
    preview: `<form>
  <table class="form-table">
    <tr>
      <th scope="row"><label for="ex-api-2">API Key</label></th>
      <td><input type="text" id="ex-api-2" class="regular-text" value=""></td>
    </tr>
  </table>
  <div style="background:var(--wpadmin-info-bg);border-left:3px solid var(--wpadmin-info);padding:10px 14px;margin:14px 0;border-radius:0 4px 4px 0;font-size:13px">
    <strong>Hidden inputs (rendered by nonce_field):</strong>
    <code style="display:block;margin-top:4px;background:none;padding:0">&lt;input type="hidden" name="_wpnonce" value="abc123…"&gt;</code>
    <code style="display:block;background:none;padding:0">&lt;input type="hidden" name="_wp_http_referer" value="/wp-admin/admin.php?page=my-plugin"&gt;</code>
  </div>
  <p class="submit"><button type="submit" class="button button-primary">Save Changes</button></p>
</form>`,
    code: {
      html: `<!-- Generated by wp_nonce_field('save_my_plugin_settings'); -->
<input type="hidden" name="_wpnonce" value="abc123def456">
<input type="hidden" name="_wp_http_referer" value="/wp-admin/admin.php?page=my-plugin">`,
      ai: `Add a WordPress nonce field to my plugin's settings form using Plugin SDK.

Nonces are WordPress's CSRF protection — they MUST be present in every form that mutates server state. The PHP helper wraps wp_nonce_field() directly.

In your form template (PHP):
  echo Components::nonce_field('save_my_plugin_settings');

In your form handler (PHP):
  if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'save_my_plugin_settings')) {
    wp_die('Invalid nonce', 403);
  }

The action name (the string passed to nonce_field/wp_verify_nonce) should be unique per form and identify the operation.`
    }
  },

  {
    id: 'capability-gate',
    name: 'Capability Gate',
    category: 'security',
    description: 'Conditionally render UI based on WordPress capabilities (<code>manage_options</code>, <code>edit_posts</code>, etc.). The server-side PHP helper checks <code>current_user_can()</code>; the React variant accepts a boolean computed server-side.',
    preview: `<div style="display:flex;flex-direction:column;gap:16px">
  <div style="padding:16px;border:1px solid var(--wpadmin-border);border-radius:6px;background:var(--wpadmin-surface-alt)">
    <p style="margin:0 0 10px;font-size:13px;color:var(--wpadmin-text-subtle)"><strong>Admin sees:</strong></p>
    <button type="button" class="button button-primary is-destructive">Delete all data</button>
  </div>
  <div style="padding:16px;border:1px solid var(--wpadmin-border);border-radius:6px;background:var(--wpadmin-surface-alt)">
    <p style="margin:0 0 10px;font-size:13px;color:var(--wpadmin-text-subtle)"><strong>Editor sees:</strong></p>
    <p class="description" style="margin:0">You don't have permission to delete data. Contact your site administrator.</p>
  </div>
</div>`,
    code: {
      html: `<!-- Server-side conditional rendering — there's no HTML primitive for capability checks.
     Use the PHP or React helper to wrap the UI block: -->

<!-- React: -->
<CapabilityGate capability="manage_options" has={userCanManageOptions}
  fallback={<p class="description">You don't have permission.</p>}>
  <button class="button button-primary is-destructive">Delete all data</button>
</CapabilityGate>

<!-- PHP: -->
<?php echo Components::capability_gate('manage_options',
  fn() => Components::button('Delete all data', ['variant' => 'primary', 'class' => 'is-destructive']),
  fn() => Components::description("You don't have permission.")
); ?>`,
      ai: `Conditionally show a UI element on my WordPress plugin page based on the current user's capability, using Plugin SDK.

Server-side gating is the security boundary — always re-check the capability in your form handler. The Capability Gate just hides the UI; it does NOT prevent the action.

In PHP:
  echo Components::capability_gate('manage_options',
    fn() => Components::button('Delete all data', [
      'variant' => 'primary',
      'class' => 'is-destructive',
    ]),
    fn() => Components::description("You don't have permission to do this.")
  );

In your handler (PHP):
  if (!current_user_can('manage_options')) {
    wp_die('Unauthorized', 403);
  }

Common capabilities: manage_options (admin settings), edit_posts (write posts), edit_others_posts, delete_posts, upload_files, install_plugins, edit_users.`
    }
  }

];
