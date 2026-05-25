/**
 * Changelog catalog. Newest entry first.
 *
 * Each entry:
 *   id          — URL slug (the part after `#/` in changelog.html#/<id>)
 *   version     — semver string shown as a chip
 *   title       — human title for the release
 *   date        — ISO date (YYYY-MM-DD); used for chronological sort + display
 *   author      — { name, handle, initials, avatar? }
 *                 If `avatar` (URL) is provided it's shown. Otherwise a
 *                 procedural SVG with `initials` is rendered.
 *   summary     — one-line summary (used in OG card subtitle)
 *   body_html   — long-form HTML for the page (use <p>, <ul>, <strong>, <h3>)
 *   tags        — array of short strings rendered as pills
 *   accent      — optional hex color for the OG card brand accent
 */

export const authors = {
  matias: {
    name: 'Matías Sanchez Moises',
    handle: '@matysanchez',
    initials: 'MS',
    // Gravatar — username `matysanchezcom`. SHA-256-hashed avatar URL
    // taken from https://gravatar.com/matysanchezcom.json. `s=200`
    // requests a 200px image; the OG card renders at 96px and the
    // in-page avatar at 36–48px so 200 covers both retina densities.
    // `d=mp` falls back to a neutral mystery-person silhouette if the
    // Gravatar profile is ever removed.
    avatar: 'https://0.gravatar.com/avatar/f39122b615ee53a395b2f7b5c21ed7a9d79ec3e553f41c9ecd08d88be450d5e0?s=200&d=mp',
  },
};

export const entries = [

  {
    id: 'v0.1.0',
    version: '0.1.0',
    title: 'Meet Plugin SDK.',
    date: '2026-05-22',
    author: authors.matias,
    summary:
      'The first public release of Plugin SDK — a framework for building WordPress plugins with native admin design, security by default, and AI-agent support.',
    body_html: `
      <p><strong>Plugin SDK is the framework I wished existed when I started building WordPress plugins.</strong> It bundles the three things every plugin needs — native admin design, security patterns, and AI-agent-readable docs — into one cohesive system.</p>

      <p>v0.1.0 is the first public release. Everything below is in the box, open source, free.</p>

      <h3>Three runtimes — pick your level</h3>
      <ul>
        <li><strong>@plugin-sdk/wp-core-css</strong> — drop a <code>&lt;link&gt;</code> tag into your plugin admin page and you're done. Full WordPress admin CSS bundle, plus an extensions layer for modern patterns WP core doesn't ship (status badges, stat cards, toggle switches, skeleton loaders, dropdowns, modals).</li>
        <li><strong>@plugin-sdk/wp-tokens</strong> — 50+ CSS custom properties for colors, spacing, typography. Responds to all 9 WP admin color schemes (Default, Blue, Coffee, Ectoplasm, Midnight, Ocean, Sunrise, Light, Modern). Inherit the user's preference automatically.</li>
        <li><strong>@plugin-sdk/wp-react</strong> — typed React components rendering real WordPress admin class names. No styled-components, no runtime CSS-in-JS.</li>
        <li><strong>plugin-sdk/wp</strong> — PHP render helpers (PSR-4) for server-rendered admin pages.</li>
      </ul>
      <p>All four packages emit identical WordPress-native HTML. Same markup, same security expectations, same component set.</p>

      <h3>Real WordPress class names — not a prefix</h3>
      <p>Other "WordPress admin component libraries" invent their own class prefix (<code>.wpac-button--primary</code>). Plugin SDK uses the actual WordPress class names — <code>.button</code>, <code>.notice</code>, <code>.wp-list-table</code>, <code>.postbox</code>, <code>.form-table</code>. The result is plugin admin pages that look indistinguishable from native WordPress screens.</p>

      <h3>Security by default</h3>
      <p>Every PHP example in the framework demonstrates the patterns plugin reviewers expect: capability check, nonce verification, sanitize on input, escape on output, prepared SQL. The boilerplate (below) ships with these built in.</p>

      <h3>Built for AI agents</h3>
      <p>Three artifacts at <code>cdn.wp-admincss.com</code> that any coding agent (Claude, Cursor, Aider, Cline) can fetch in one go:</p>
      <ul>
        <li><strong>AGENTS.md</strong> — the master entry point. Framework overview, anti-patterns to avoid, component cheat sheet, the 9-step plugin-building recipe.</li>
        <li><strong>7 focused skill files</strong> — each loaded on demand:
          <code>security.md</code> (caps + nonces + sanitize/escape + SQL),
          <code>database.md</code> (<code>$wpdb</code> + <code>dbDelta</code>),
          <code>data-modeling.md</code> (options vs meta vs custom tables vs transients),
          <code>enqueue.md</code> (the four enqueue hooks),
          <code>plugin-structure.md</code> (PSR-4, lifecycle hooks),
          <code>i18n.md</code> (translations, RTL),
          <code>publishing.md</code> (Plugin Check, WP.org submission).
        </li>
        <li><strong>Plugin boilerplate</strong> — a complete working WordPress plugin: secure settings page, custom table with <code>dbDelta</code> migration, typed repository, REST endpoint with schema validation, lifecycle hooks, multisite-aware uninstall, PSR-4 autoloading, i18n setup. Clone, find-replace the names, ship.</li>
      </ul>

      <h3>Interactive documentation</h3>
      <p>The site you're reading. <a href="/components.html">/components</a> — 25+ primitives across 10 categories with HTML / AI Prompt / React / PHP copy tabs and live previews scoped to the docs page. <a href="/layouts.html">/layouts</a> — four full plugin admin templates (Settings, List Table, Dashboard, Onboarding) with the same four-tab recipe. <a href="/docs.html">/docs</a> — install paths, core concepts, customizing, the agent recipe, skills reference, boilerplate walkthrough.</p>

      <h3>Open source</h3>
      <p>Apache 2.0 for the framework. GPLv2-or-later for <code>packages/wp-core-css</code> (which bundles WordPress core admin CSS — itself GPL) and the <code>boilerplate</code> (WordPress plugin convention). Apache 2.0 → GPL is one-way compatible, so plugins built from the boilerplate can incorporate every package without conflict. See <a href="https://github.com/artificialpoets/plugin-sdk/blob/main/NOTICE">NOTICE</a> for the full attribution.</p>

      <h3>How to get started</h3>
      <p>One line into your plugin admin page:</p>
      <p><code>&lt;link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css"&gt;</code></p>
      <p>Then use real WordPress admin class names. Or clone the boilerplate. Or point your AI agent at <code>cdn.wp-admincss.com/AGENTS.md</code>. Read <a href="/docs.html">the docs</a> for the full guide.</p>

      <h3>Thanks</h3>
      <p>Built by <a href="https://artificialpoets.com">Artificial Poets</a>. Feedback, bugs, and PRs: <a href="https://github.com/artificialpoets/plugin-sdk/issues">github.com/artificialpoets/plugin-sdk</a>.</p>
    `,
    tags: ['initial', 'release', 'launch'],
    accent: '#2271b1',
  },

];
