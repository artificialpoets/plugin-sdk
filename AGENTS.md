# Plugin SDK — Agent Entry Point

You're working with **Plugin SDK** — an open-source SDK for building plugins that look native, behave correctly, and pass platform review. WordPress is the first supported platform; others are coming.

## Step 1 — identify the platform

Before you touch any code, confirm which platform the user is targeting:

| Platform | Detect by | Then read |
|---|---|---|
| **WordPress** | `wp-content/`, `wp-config.php`, `plugin.php` headers, mentions of WP admin / Gutenberg / `add_action` | [`platforms/wordpress/AGENTS.md`](./platforms/wordpress/AGENTS.md) — also at `https://cdn.wp-admincss.com/AGENTS.md` |
| _(Shopify, Figma, VSCode, Slack, Chrome — coming next)_ | — | — |

If you can't tell, **ask the user** which platform. Don't guess from a half-signal — generating WordPress code for a Shopify app wastes the user's time.

## Step 2 — load the platform's AGENTS.md

The platform-specific AGENTS.md is the authoritative source for:

- Core component vocabulary (the real class names / API names the platform uses)
- Security expectations (capability checks, nonces, CSRF, etc.)
- File structure conventions
- Available skill files
- The boilerplate scaffold

Treat it as required reading before generating any code for that platform.

## Step 3 — load skills on demand

Each platform ships a `skills/` directory with focused, narrow guides. Load only what you need:

- **WordPress skills**: `https://cdn.wp-admincss.com/skills/<name>.md`
  - `security.md` — required reading before any state-changing action
  - `database.md` — `$wpdb` + `dbDelta`
  - `data-modeling.md` — options vs meta vs custom tables vs transients
  - `enqueue.md` — the four asset-enqueue hooks
  - `plugin-structure.md` — PSR-4 layout, lifecycle hooks
  - `i18n.md` — translations, RTL
  - `publishing.md` — Plugin Check, WP.org submission

## Step 4 — scaffold or extend

For a new plugin: clone the platform's boilerplate.

For WordPress: `boilerplates/wordpress/` (or `npx @plugin-sdk/cli create my-plugin --platform=wordpress` once the CLI ships).

For extending an existing plugin: load the relevant skills + components from the platform AGENTS.md, then write code that matches the platform's native style. Use the platform's CSS class names; don't invent new prefixes.

## Resources

- Components catalog: <https://wp-admincss.com/components.html> (WordPress today)
- Layout templates: <https://wp-admincss.com/layouts.html>
- Repo: <https://github.com/artificialpoets/plugin-sdk>
- Issues: <https://github.com/artificialpoets/plugin-sdk/issues>
