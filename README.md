# Plugin SDK

**The open-source SDK for building plugins anywhere.** WordPress today; more platforms next. Built so humans and AI agents can ship plugins that look native, behave correctly, and pass review.

[![License](https://img.shields.io/badge/license-Apache--2.0%20%2F%20GPLv2%2B-blue.svg)](LICENSE)
[![Website](https://img.shields.io/badge/Website-wp--admincss.com-blue)](https://wp-admincss.com)

## Why

Every plugin-host ecosystem — WordPress, Shopify, Figma, VSCode, Slack, Chrome — makes you re-learn the same three things: how to make your plugin **look native**, how to keep it **secure**, and how to keep an **AI agent** from generating the wrong shape of code.

Plugin SDK is the answer: one SDK, with platform adapters that emit native-looking output, platform-correct security patterns, and agent-readable skill files. WordPress is the first adapter — it gets the full design system, runtime helpers, plugin scaffold, and 7 focused agent skills. Other platforms are next.

## Repo layout

```
plugin-sdk/
├── packages/
│   ├── cli/                  → @plugin-sdk/cli — the cross-platform scaffolder (new)
│   ├── wp-tokens/            → @plugin-sdk/wp-tokens
│   ├── wp-core-css/          → @plugin-sdk/wp-core-css
│   ├── wp-react/             → @plugin-sdk/wp-react
│   └── wp-composer/          → plugin-sdk/wp (Composer)
├── boilerplates/
│   └── wordpress/            ← Ready-to-clone WordPress plugin scaffold
├── platforms/
│   └── wordpress/
│       ├── AGENTS.md         ← WordPress-specific agent instructions
│       └── skills/           ← Focused expertise: security · database · enqueue · …
├── apps/
│   ├── site/                 ← wp-admincss.com (will migrate to plugin-sdk.com)
│   └── videos/               ← Remotion promo videos
└── package.json              ← npm workspaces root
```

## Quick start

### Drop the CSS into an existing WordPress plugin

```html
<link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

<div class="wrap">
  <h1 class="wp-heading-inline">My Plugin</h1>
  <a href="?page=add-new" class="page-title-action">Add New</a>
  <hr class="wp-header-end">

  <div class="notice notice-success is-dismissible">
    <p><strong>Settings saved.</strong></p>
  </div>

  <p class="submit">
    <button class="button button-primary">Save Changes</button>
  </p>
</div>
```

Pin to a version in production: `https://cdn.wp-admincss.com/css/v0.1.0/wp-admin.css`.

### Scaffold a new WordPress plugin

```bash
npx @plugin-sdk/cli@next create "My Plugin"
```

Interactive prompts ask for the slug, namespace, constant prefix, author, and **distribution channel**. For a fully non-interactive run:

```bash
npx @plugin-sdk/cli@next create my-plugin \
  --platform=wordpress \
  --channel=wp.org \
  --yes
```

The channel decides which CI workflows and helper scripts ship with the scaffold:

| `--channel=` | Updates from… | `release.yml`? | `readme.txt` + submission-prep? | PUC code? |
|---|---|---|---|---|
| `wp.org` (default) | WordPress.org SVN | no | yes | none |
| `github` | GitHub releases (Plugin Update Checker) | yes | no | always-on |
| `dual` | Both — wp.org for the directory, GH for early access | yes | yes | marker-gated |

Every scaffold is a complete working plugin with:

- **Manifest-driven runtime** — `plugin-sdk.json` declares the settings page, REST routes, and custom tables; one `Plugin::fromManifest()` call wires every WordPress hook with capability checks, nonces, sanitisation, and JSON-schema body validation built in.
- **Build pipeline** — `bin/build.sh` produces a wp.org-clean dist + zip via `rsync` and `.distignore`. `phpcs.xml.dist` + `composer run lint` mirror what wp.org reviewers run.
- **CI workflows** — `.github/workflows/ci.yml` runs lint + Plugin Check on every push. For `github` / `dual` channels, `.github/workflows/release.yml` auto-bumps the version (commit message tokens `[major]` / `[minor]` / `[skip-release]` control it), pushes the bump back to `main`, builds the dist, runs Plugin Check, and publishes a GitHub release with both zips.
- **Submission prep** (`wp.org` / `dual`) — `npm run prep` walks the same checks a wp.org reviewer will run and prints the SVN trunk → tag commands for first submission and subsequent releases.
- **Slug research** — `npm run slug-research` queries the wp.org API + scans for trademark collisions before you commit to a slug (which can't be renamed after wp.org approval).
- Reference WordPress code — secure settings page, custom-table repository (using the WP 6.2+ `%i` identifier placeholder), REST controller, lifecycle hooks, PSR-4 autoload, i18n setup, scoped asset enqueue. Lint-clean against WPCS + PHPCompatibilityWP on a fresh scaffold.

## For AI agents

1. **Pick your platform.** WordPress today: `https://cdn.wp-admincss.com/wordpress/AGENTS.md`. Other platforms coming.
2. **Load skills as needed.** Available at `https://cdn.wp-admincss.com/wordpress/skills/<name>.md`. The current set:
   - `security.md` — required for any state-changing action.
   - `database.md` / `data-modeling.md` — `$wpdb` patterns + deciding where to store data.
   - `enqueue.md` — adding admin CSS/JS.
   - `i18n.md` — translation patterns.
   - `plugin-manifest.md` — the declarative `plugin-sdk.json` reference.
   - `plugin-structure.md` — file layout + autoloading.
   - `publishing.md` — Plugin Check rules + slug research + `readme.txt` format.
   - `submission-prep.md` — the wp.org submission flow (`npm run prep`, SVN trunk → tag).
   - `release-pipeline.md` — the GitHub release flow (auto-bump on merge, PUC, dual-channel).
3. **Scaffold via the CLI** — `npx @plugin-sdk/cli@next create "<name>"` — or use the boilerplate directly at [`boilerplates/wordpress/`](./boilerplates/wordpress).
4. **Browse the visual catalog** at [wp-admincss.com/components](https://wp-admincss.com/components.html) and [wp-admincss.com/layouts](https://wp-admincss.com/layouts.html).

## Packages

### `@plugin-sdk/wp-tokens`

CSS custom properties mirroring WP admin's design system. Override-able per WP color scheme via the native `.admin-color-*` body classes.

```css
@import "@plugin-sdk/wp-tokens";

.my-plugin-card {
  border-left: 3px solid var(--wpadmin-primary);
  padding: var(--wpadmin-space-4);
  color: var(--wpadmin-text);
}
```

### `@plugin-sdk/wp-core-css`

The WordPress admin CSS bundle (common, forms, list-tables, dashboard, etc.) plus a small `extensions.css` layer for modern patterns WP core doesn't ship (status badges, stat cards, toggle switches, empty states, skeleton loaders, WP-style pointers, help tips). Dashicons included by default.

```html
<link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">
```

### `@plugin-sdk/wp-react`

React components that render real WordPress admin class names. No styled-components, no runtime CSS-in-JS. Pair with `wp-core-css` for styles.

```bash
npm install @plugin-sdk/wp-react @plugin-sdk/wp-core-css
```

```tsx
import { Wrap, PageHeader, Notice, Button } from '@plugin-sdk/wp-react';

<Wrap>
  <PageHeader title="My Plugin" action={{ label: 'Add New', href: '?page=new' }} />
  <Notice variant="success" dismissible><p><strong>Settings saved.</strong></p></Notice>
  <Button variant="primary">Save Changes</Button>
</Wrap>
```

### `plugin-sdk/wp` (Composer)

PHP render helpers for plugins that render admin pages server-side.

```bash
composer require plugin-sdk/wp
```

```php
use PluginSDK\WP\Components;
use PluginSDK\WP\Assets;

add_action('admin_enqueue_scripts', [Assets::class, 'enqueue_cdn']);

echo Components::wrap(
  Components::page_header('My Plugin', ['action' => ['label' => 'Add New', 'href' => '?page=new']]) .
  Components::notice_success('Settings saved.', ['dismissible' => true]) .
  Components::button('Save Changes', ['variant' => 'primary'])
);
```

## Component library

Browse every primitive at [wp-admincss.com/components](https://wp-admincss.com/components.html) and pre-assembled full plugin pages at [wp-admincss.com/layouts](https://wp-admincss.com/layouts.html). Each component has a live preview, the HTML to copy, and an AI prompt you can hand straight to your coding agent.

## CDN

Hosted at `cdn.wp-admincss.com` (migrating to `cdn.plugin-sdk.com` later):

| URL | Content |
|---|---|
| `https://cdn.wp-admincss.com/css/latest.css` | Latest CSS bundle (rolling) |
| `https://cdn.wp-admincss.com/css/v0.1.0/wp-admin.css` | Pinned version |
| `https://cdn.wp-admincss.com/AGENTS.md` | Master agent instructions (WordPress) |
| `https://cdn.wp-admincss.com/skills/<name>.md` | Individual skill files |

Pin a version for production.

## Color schemes

Tokens respond automatically to WP's nine built-in color schemes. Add the WP body class — or apply it to any ancestor element for isolated theming.

```html
<body class="admin-color-midnight">
  <!-- All tokens now use Midnight scheme values -->
</body>
```

Schemes: Default, Blue, Coffee, Ectoplasm, Midnight, Ocean, Sunrise, Light, Modern.

## Customize for your brand

Override CSS custom properties in your plugin's stylesheet:

```css
.my-plugin-page {
  --wpadmin-primary: #7c3aed;
  --wpadmin-primary-dark: #6d28d9;
  --wpadmin-radius: 8px;
}
```

Scope to a wrapper class so the rebrand only affects your plugin's screen — the rest of WP admin stays consistent.

## Development

```bash
npm install        # installs workspaces
npm run dev        # starts the site dev server
npm run build      # builds the production site + CDN
npm run build:site # site only (apps/site/dist/)
npm run build:cdn  # CDN only (cdn/)
npm test           # runs unit + smoke tests across all packages
```

## Deploy

The project ships as two Cloudflare Pages projects:

| Project | Source dir | Custom domains |
|---|---|---|
| `wp-admincss-site` | `apps/site/dist/` | `wp-admincss.com`, `www.wp-admincss.com` |
| `wp-admincss-cdn` | `cdn/` | `cdn.wp-admincss.com` |

```bash
npm run build
wrangler pages deploy apps/site/dist --project-name=wp-admincss-site --branch=main
wrangler pages deploy cdn --project-name=wp-admincss-cdn --branch=main
```

## License

Split license:

- **Apache 2.0** — repo root, `packages/cli/`, `packages/wp-tokens/`, `packages/wp-react/`, `packages/wp-composer/`, `apps/site/`, `platforms/wordpress/AGENTS.md`, and `platforms/wordpress/skills/`. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
- **GPLv2-or-later** — `packages/wp-core-css/` (bundles WordPress core admin CSS, which is GPL) and `boilerplates/wordpress/` (WordPress plugin scaffold). See `packages/wp-core-css/LICENSE`, `packages/wp-core-css/NOTICE`, and `boilerplates/wordpress/LICENSE`.

Apache 2.0 → GPLv2-or-later is one-way compatible, so plugins built from the boilerplate can incorporate the Apache-licensed framework packages without conflict.

Built by [Artificial Poets](https://artificialpoets.com).
