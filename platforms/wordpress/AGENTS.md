# AGENTS.md — Build WordPress plugins with an AI agent

> **For coding agents (Claude Code, Cursor, Aider, Cline, …) building WordPress plugins.**
> This file is the entry point for the **WordPress platform** of Plugin SDK. Read it first, then load the skill files referenced below as you need them.
> CDN: `https://cdn.wp-admincss.com/wordpress/AGENTS.md`
> (Legacy alias still works: `https://cdn.wp-admincss.com/AGENTS.md`.)

Plugin SDK is the **declarative SDK for WordPress plugin development**. The intended flow is:

1. The developer (or you, the agent) writes a `plugin-sdk.json` manifest describing what the plugin needs — a settings page, REST routes with JSON-schema body validation, custom tables.
2. One line in the plugin's main PHP file boots the runtime, which wires up every WordPress hook with capability checks, nonce verification, sanitisation, and validation built in.
3. The plugin's own classes implement only the business logic (REST handlers, custom queries, anything beyond the manifest).

This eliminates almost every category of AI-generated WordPress security bug — they happen in the wiring, not the handler logic, and the SDK owns the wiring.

The framework also ships:

- **CSS library** with real WP admin class names — plugin admin pages match WordPress out of the box.
- **React + PHP packages** that render the same primitives.
- A **CLI scaffolder** (`@plugin-sdk/cli`) that creates a working plugin from the boilerplate.
- A **codegen** command that turns the manifest's REST schemas into typed TypeScript clients.
- This **AGENTS.md** + a **`skills/`** directory with focused expertise.

---

## What this framework prevents

Independent research and the [WordPress/agent-skills](https://github.com/WordPress/agent-skills) repo identify the consistent failure modes for AI-generated WordPress plugins. Plugin SDK eliminates each by construction when you use the runtime:

| Failure mode | Without SDK | With SDK |
|---|---|---|
| Missing nonces on forms → CSVRF | manual `check_admin_referer()` per form | Settings runtime uses WP's `options.php` round-trip; nonces are automatic |
| Missing capability checks | manual `current_user_can()` per handler | declared in `plugin-sdk.json`; runtime checks before invoking your code |
| Unescaped output → XSS | manual `esc_*` everywhere | Settings renderer + Components helpers escape by default |
| Concatenated SQL → injection | manual `$wpdb->prepare()` for every query | Migration runtime emits `dbDelta`-safe SQL; handlers use prepared statements |
| Invalid request bodies reach handlers | manual validation per route | runtime validates body against the route's JSON Schema, returns 400 on failure |
| Invented WP hooks/functions | nothing | manifest's JSON Schema rejects unknown fields at boot |
| Hand-rolled CSS that drifts from WP | tedious | drop `@plugin-sdk/wp-core-css` link tag |

---

## Quick start — three paths

Pick the one that fits.

### Path A — Scaffold a new plugin (recommended)

The CLI generates a working plugin with the manifest + runtime + boilerplate wired up:

```bash
npx @plugin-sdk/cli create "Acme Forms"
```

Or with flags for non-interactive runs:

```bash
npx @plugin-sdk/cli create acme-forms \
  --platform=wordpress \
  --author="Acme Co" \
  --yes
```

This writes a directory containing:

- `acme-forms.php` — bootstrap (one `Plugin::fromManifest()->boot()` call)
- `plugin-sdk.json` — the manifest (edit this to declare what your plugin does)
- `composer.json` — pulls in `plugin-sdk/wp` for the runtime
- `src/` — your business logic (REST handlers, lifecycle hooks)
- `assets/admin.css` — your plugin-specific overrides

You then `composer install`, activate the plugin, and you have a settings page + REST endpoint + custom table running.

### Path B — Add the SDK to an existing plugin

```bash
composer require plugin-sdk/wp
```

Create `plugin-sdk.json` at your plugin root (full schema reference below; IDE autocomplete works via the `$schema` URL). In your main plugin PHP file:

```php
<?php
require_once __DIR__ . '/vendor/autoload.php';

use PluginSDK\WP\Plugin;
use Acme\Forms\REST\Submissions;

add_action('plugins_loaded', function () {
    Plugin::fromManifest(__DIR__ . '/plugin-sdk.json', __FILE__)
        ->withRestHandler('Acme\\Forms\\REST\\Submissions::create', [Submissions::class, 'create'])
        ->boot();
});
```

That's the entire bootstrap. The runtime registers menu, settings, REST, and migration hooks for you.

### Path C — Just the CSS, you'll wire WordPress yourself

If the user doesn't want the runtime — say they're maintaining a pre-SDK plugin and only want the visual polish — drop the CSS:

```html
<link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">
```

Then use WordPress's native admin class names. Full component catalog at <https://wp-admincss.com/components>.

For this path you still own every security check yourself. The skills under `skills/` teach the right primitives.

---

## The manifest — `plugin-sdk.json`

The single source of truth. Plugin SDK validates against the JSON Schema at `cdn.wp-admincss.com/wordpress/plugin-sdk.schema.json` at boot — `ConfigException` if anything's wrong.

```json
{
  "$schema": "https://cdn.wp-admincss.com/wordpress/plugin-sdk.schema.json",
  "platform": "wordpress",
  "name": "Acme Forms",
  "slug": "acme-forms",
  "textDomain": "acme-forms",
  "version": "0.1.0",
  "namespace": "Acme\\Forms",

  "settings": {
    "page": {
      "title": "Acme Forms",
      "capability": "manage_options",
      "sections": [{
        "id": "general",
        "title": "General",
        "fields": [
          { "id": "api_key", "label": "API Key", "type": "password", "required": true },
          { "id": "env", "label": "Environment", "type": "select",
            "default": "production",
            "options": [
              { "value": "production", "label": "Production" },
              { "value": "staging", "label": "Staging" }
            ]
          }
        ]
      }]
    }
  },

  "rest": {
    "namespace": "acme-forms/v1",
    "routes": [{
      "path": "/submissions",
      "method": "POST",
      "capability": "manage_options",
      "handler": "Acme\\Forms\\REST\\Submissions::create",
      "schema": {
        "type": "object",
        "required": ["email"],
        "properties": {
          "email": { "type": "string", "format": "email" },
          "name":  { "type": "string", "maxLength": 200 }
        },
        "additionalProperties": false
      }
    }]
  },

  "database": {
    "tables": [{
      "name": "submissions",
      "columns": [
        { "name": "id", "type": "BIGINT UNSIGNED", "primary": true, "autoIncrement": true },
        { "name": "email", "type": "VARCHAR(255)", "notNull": true },
        { "name": "created_at", "type": "DATETIME", "notNull": true, "default": "CURRENT_TIMESTAMP" }
      ],
      "indexes": [
        { "name": "email_idx", "columns": ["email"] }
      ]
    }]
  }
}
```

Load [`skills/plugin-manifest.md`](./skills/plugin-manifest.md) for the full field reference.

---

## The runtime — public classes

Every class listed below is `@api` (stable across minor releases per [STABILITY.md](https://github.com/artificialpoets/plugin-sdk/blob/main/STABILITY.md)). Internals are tagged `@internal`.

| Class | What it does |
|---|---|
| `PluginSDK\WP\Plugin` | Single-call bootstrap. `Plugin::fromManifest($path, __FILE__)->boot()`. |
| `PluginSDK\WP\Config` | Loads + validates the manifest. Throws `ConfigException` on failure. |
| `PluginSDK\WP\Settings` | Settings page builder. Sanitises every field per its type. |
| `PluginSDK\WP\Settings\Section` + `\Field` | Sub-builders for the page structure. |
| `PluginSDK\WP\REST` | REST route registration. Runs cap check + schema validation before each handler. |
| `PluginSDK\WP\REST\Route` + `\Schema` | Per-route + per-body validators. |
| `PluginSDK\WP\Migration` | dbDelta wrapper. Versioned via an option so reactivations are no-ops. |
| `PluginSDK\WP\Migration\Table` | Single table builder; produces dbDelta-compatible SQL. |
| `PluginSDK\WP\Version` | Runtime version + compatibility helper. `Version::requireAtLeast('0.2.0')`. |
| `PluginSDK\WP\Components` | Hand-rolled UI helpers (use these for pages outside the Settings runtime). |
| `PluginSDK\WP\Assets` | Enqueue the CSS bundle. `Assets::enqueue_cdn()` or `enqueue_local()`. |
| `PluginSDK\WP\Html` | Escape helpers. `Html::esc()`, `Html::esc_attr_value()`, `Html::esc_url()`. |

You can also use the **fluent (imperative) API** directly without the manifest — see [`skills/plugin-manifest.md`](./skills/plugin-manifest.md). The two styles compose: declarative covers the common case, fluent fills in the rest.

---

## The CLI — `@plugin-sdk/cli`

Two commands today:

```bash
# Scaffold
npx @plugin-sdk/cli create <name> [--platform=wordpress] [--yes] [--no-install]

# Codegen — typed TS REST client from plugin-sdk.json
npx @plugin-sdk/cli codegen [--manifest=./plugin-sdk.json] [--out=./src/api.ts]
```

The codegen output gives the user a typed `PluginSDKClient` they can call from React without redeclaring every request body:

```typescript
import { createPluginSDKClient } from './src/api';

const client = createPluginSDKClient({
  baseUrl: window.wpApiSettings.root,
  nonce:   window.wpApiSettings.nonce,
});

await client.submissions.create({ email: 'a@b.com' });
```

---

## How to use this framework (the agent recipe)

When a user asks you to build (or extend) a WordPress plugin:

1. **Look for a `plugin-sdk.json`.** If present, the user is on the SDK path — make changes by editing the manifest where possible, falling through to handler code only for behaviour the manifest can't express.

2. **If they're starting fresh, use the CLI** to scaffold (`npx @plugin-sdk/cli create ...`). Don't hand-roll the bootstrap.

3. **Translate the request into manifest fields first.** "Add a settings field" → add a field to `settings.page.sections[].fields[]`. "Add an API endpoint" → add a route to `rest.routes[]` with a body schema. "Add a custom table" → add an entry to `database.tables[]`.

4. **For behaviour the manifest can't express**, write a small PHP class under the plugin's namespace and reference it via the route `handler` field or via `withRestHandler()` at boot.

5. **Pick the right data store** — options (for plugin config), post/user meta (for per-record metadata), or a custom table (for high-volume or queryable structured data). See [`skills/data-modeling.md`](./skills/data-modeling.md).

6. **Run the codegen** (`npx @plugin-sdk/cli codegen`) when you add or change REST routes with body schemas — so the React/TS side has matching typed clients.

7. **Add i18n from day one** — the `textDomain` field in the manifest is the source. Wrap user-facing strings in `__()` / `_e()` in PHP, `__()` from `@wordpress/i18n` in JS. See [`skills/i18n.md`](./skills/i18n.md).

8. **Run [Plugin Check](https://wordpress.org/plugins/plugin-check/) before calling the plugin done.** It catches missing nonces, unescaped output, unprepared SQL, and ~30 other AI-common failures automatically. `wp plugin check <slug>` from CLI. The Plugin SDK CI runs this on every commit against the scaffolded boilerplate. See [`skills/publishing.md`](./skills/publishing.md).

9. **If publishing to WordPress.org, verify the slug is available first** at `https://wordpress.org/plugins/<your-slug>/` (404 = free, page = taken). Pick once — slugs can't be renamed after submission.

---

## Skills (load as needed)

Each file is self-contained. Load the one relevant to the task at hand — don't load all of them at once.

| File | When to load |
|---|---|
| [`skills/plugin-manifest.md`](./skills/plugin-manifest.md) | Editing `plugin-sdk.json`, using the runtime APIs, or deciding declarative vs fluent. |
| [`skills/security.md`](./skills/security.md) | Any form, AJAX endpoint, REST route, or state-changing action. |
| [`skills/database.md`](./skills/database.md) | Custom SQL queries, schema migrations, or any `$wpdb` usage. |
| [`skills/data-modeling.md`](./skills/data-modeling.md) | Deciding where to store data (options / meta / custom table). |
| [`skills/enqueue.md`](./skills/enqueue.md) | Adding CSS or JS to admin or front-end. |
| [`skills/plugin-structure.md`](./skills/plugin-structure.md) | New plugin scaffolding, file layout, autoloading. |
| [`skills/i18n.md`](./skills/i18n.md) | Any user-facing string. |
| [`skills/publishing.md`](./skills/publishing.md) | Picking a slug, running Plugin Check, writing `readme.txt`, submitting to WordPress.org. |
| [`skills/submission-prep.md`](./skills/submission-prep.md) | Operating `bin/submission-prep.sh` and the wp.org SVN trunk → tag flow. Load when shipping to the WP.org directory. |
| [`skills/release-pipeline.md`](./skills/release-pipeline.md) | Operating `.github/workflows/release.yml` — auto-bump, GH releases, Plugin Update Checker, dual-channel updates. Load when shipping via GitHub releases. |
| [`skills/wporg-svn-deploy.md`](./skills/wporg-svn-deploy.md) | Automating deploys to the WordPress.org SVN repo from GitHub — CI wiring, SVN secrets, readme/assets-only updates (no version bump). Load when syncing a GitHub repo to the plugin directory. |

CDN-hosted versions are mirrored at `https://cdn.wp-admincss.com/wordpress/skills/<file>.md`.

---

## Component class names you'll use most

These are real WordPress admin class names. They work out of the box once the CSS is loaded:

| Class | What it is |
|---|---|
| `.wrap` | Standard admin page wrapper |
| `.wp-heading-inline` + `.page-title-action` | Page title with inline "Add New" link |
| `.notice .notice-{success,error,warning,info}` | Admin notice. Add `.is-dismissible` for closable. |
| `.form-table` | Two-column label/control form layout |
| `.button` / `.button.button-primary` | Buttons. `.is-destructive` modifier for delete. |
| `.regular-text` / `.large-text` / `.small-text` | Text input width classes |
| `.wp-list-table.widefat.fixed.striped` | List tables |
| `.tablenav` / `.bulkactions` / `.tablenav-pages` | Above/below list-table chrome |
| `.subsubsub` | Status filter row (All \| Active \| Draft) |
| `.nav-tab-wrapper` + `.nav-tab.nav-tab-active` | Tab strip |
| `.postbox` + `.postbox-header` + `.inside` | The bordered card used everywhere |
| `.welcome-panel` | Onboarding card |
| `.spinner.is-active` | Loading spinner |
| `.description` | Help text under form fields |
| `.screen-reader-text` | Hide from sighted users, keep for screen readers |

Extensions (added by Plugin SDK, not in WP core):

| Class | What it is |
|---|---|
| `.wp-admin-status.is-{active,warning,error,info}` | Status badge pills |
| `.wp-admin-statcard` + `__label`/`__value`/`__delta` | Dashboard widget stat card |
| `.wp-admin-activity` + `__avatar`/`__body`/`__time` | Activity feed item |
| `.wp-admin-empty` + `__icon`/`__title`/`__description` | Empty-state placeholder |
| `.wp-admin-toggle` + `__input`/`__track`/`__label` | Toggle switch |
| `.wp-admin-tooltip` + `__content` | Hover/focus tooltip wrapper |
| `.wp-admin-dropdown` + `__menu`/`__item` | Action dropdown menu |
| `.wp-admin-modal-backdrop` + `.wp-admin-modal` + `__header`/`__body`/`__footer` | Modal dialog |
| `.wp-admin-pointer` | Feature-highlight callout |
| `.wp-admin-skeleton` + `.is-{title,text,short}` | Loading placeholder |
| `.wp-admin-icon` | Inline SVG icon (auto inherits `currentColor`) |
| `.dashicons.dashicons-{name}` | WP dashicon (icon font) |

---

## Customization (the user's brand)

Plugin SDK uses ~50 CSS custom properties. Plugin developers override them to match their brand without forking the library:

```css
/* In your plugin's admin.css */
.my-plugin-page {
  --wpadmin-primary: #7c3aed;
  --wpadmin-primary-dark: #6d28d9;
  --wpadmin-radius: 8px;
}
```

Scope to a wrapper class so the rebrand only affects your plugin's screen — the rest of WP admin stays consistent with WordPress.

Most-overridden tokens: `--wpadmin-primary`, `--wpadmin-primary-dark`, `--wpadmin-radius`, `--wpadmin-text`, `--wpadmin-text-subtle`, `--wpadmin-surface`, `--wpadmin-border`, `--wpadmin-success/error/warning`.

Full reference at <https://wp-admincss.com/#customize>.

---

## Anti-patterns to never emit

Code that includes any of these is a bug regardless of how plausible it looks:

```php
// ❌ NEVER — direct SQL with concatenation
$wpdb->query("SELECT * FROM wp_users WHERE login = '" . $_POST['login'] . "'");

// ✅ ALWAYS — prepared statement
$wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$wpdb->users} WHERE user_login = %s",
    sanitize_user($_POST['login'])
));
```

```php
// ❌ NEVER — output without escaping
echo $user_input;
echo "<a href='$url'>";

// ✅ ALWAYS — escape at the boundary
echo esc_html($user_input);
echo '<a href="' . esc_url($url) . '">';
```

```php
// ❌ NEVER — form handler without nonce/capability checks
function handle_save() {
    update_option('my_setting', $_POST['value']);
}

// ✅ ALWAYS — let the SDK runtime handle it OR check both layers manually
//   Manifest: declare the field in plugin-sdk.json. Runtime applies cap+nonce.
//   Manual:
function handle_save() {
    if (!current_user_can('manage_options')) {
        wp_die('Forbidden', 403);
    }
    check_admin_referer('save_my_settings');
    update_option('my_setting', sanitize_text_field($_POST['value']));
}
```

```php
// ❌ NEVER — REST route without permission_callback or schema
register_rest_route('my-plugin/v1', '/save', [
    'methods' => 'POST',
    'callback' => 'my_save_handler',
]);

// ✅ ALWAYS — let the SDK runtime handle it OR specify both manually
//   Manifest: add to rest.routes[] with capability + schema.
//   Manual:
register_rest_route('my-plugin/v1', '/save', [
    'methods' => 'POST',
    'callback' => 'my_save_handler',
    'permission_callback' => fn() => current_user_can('manage_options'),
    'args' => [ 'email' => [ 'type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_email' ] ],
]);
```

```php
// ❌ NEVER — direct $_GET/$_POST in output without sanitization or escaping
echo "<h1>Hello {$_GET['name']}</h1>";

// ✅ ALWAYS — sanitize on input, escape on output
$name = sanitize_text_field($_GET['name'] ?? '');
echo '<h1>Hello ' . esc_html($name) . '</h1>';
```

```php
// ❌ NEVER — adding admin scripts via wp_head
add_action('wp_head', 'my_plugin_styles');

// ✅ ALWAYS — use admin_enqueue_scripts for admin assets
add_action('admin_enqueue_scripts', function() {
    \PluginSDK\WP\Assets::enqueue_cdn();   // or enqueue_local($url) for vendored copy
    wp_enqueue_style('my-plugin-admin', plugins_url('admin.css', __FILE__));
});
```

```php
// ❌ NEVER — boolean sanitize_callback built on a raw cast. wp.org's automated
//    review flags this: "a raw cast makes arbitrary non-empty strings true."
register_setting('my_group', 'my_flag', [
    'type'              => 'boolean',
    'sanitize_callback' => fn($v) => (bool) $v,   // "false" → true, "no" → true
]);
$opts['enabled'] = !empty($_POST['enabled']);      // same loose-cast problem

// ✅ ALWAYS — rest_sanitize_boolean(): strict whitelist normalization
register_setting('my_group', 'my_flag', [
    'type'              => 'boolean',
    'sanitize_callback' => 'rest_sanitize_boolean',
]);
$opts['enabled'] = rest_sanitize_boolean(wp_unslash($_POST['enabled'] ?? false));
```

```php
// ❌ NEVER — '__return_true' on an endpoint that re-serves data obtained with
//    stored credentials (API keys, Application Passwords, OAuth tokens).
//    wp.org's automated review traces data flow and flags this EVEN when a
//    comment says "intentionally public" — a public passthrough of
//    credentialed data bypasses the upstream's access control.
register_rest_route('my-plugin/v1', '/remote-data', [
    'methods'  => 'GET',
    'callback' => 'my_fetch_from_authenticated_upstream',
    // Intentionally public ← the comment does not help; the data flow fails review
    'permission_callback' => '__return_true',
]);

// ✅ ALWAYS — reserve '__return_true' for intrinsically public data; anything
//    that flowed through an authenticated channel keeps a real capability check
register_rest_route('my-plugin/v1', '/remote-data', [
    'methods'  => 'GET',
    'callback' => 'my_fetch_from_authenticated_upstream',
    'permission_callback' => fn() => current_user_can('manage_options'),
]);
```

```php
// ❌ NEVER — is_user_logged_in() as the permission_callback for non-public data.
//    wp.org flags this: any logged-in user (even a subscriber) is not an
//    authorization boundary for admin-configured or credential-proxied data.
'permission_callback' => 'is_user_logged_in',

// ✅ ALWAYS — gate on a capability matching the data's sensitivity
'permission_callback' => fn() => current_user_can('manage_options'),
```

```php
// ❌ NEVER — a global name with a short (<4 char) or reserved prefix. wp.org
//    rejects 2-3 char prefixes and wp_/_/__ (reserved for core). Also NEVER
//    declare a non-resolving Plugin URI / Author URI in the header — the
//    reviewer fetches them and fails the plugin if they don't resolve.
define('PC_VERSION', '1.0.0');          // 2-char prefix → rejected
add_menu_page(..., 'settings', ...);    // generic unprefixed menu slug → rejected
// * Plugin URI: https://not-registered-yet.example   ← dead URL → rejected

// ❌ NEVER — the same URL in both header fields. wp.org: "Those two must be
//    different. You are not required to provide both." This is the trap that
//    catches you when you "fix" a dead Plugin URI by repointing it at the
//    author homepage — it now resolves, and now it's a duplicate.
// * Plugin URI: https://example.com     ← identical to Author URI → rejected
// * Author URI: https://example.com

// ✅ ALWAYS — a ≥4-char plugin-unique prefix, prefixed menu slugs, and header
//    URLs that both resolve AND differ. Declare Plugin URI only when a page
//    about THAT plugin exists; otherwise ship Author URI alone (or neither).
define('MYPLUGIN_VERSION', '1.0.0');
add_menu_page(..., 'my-plugin', ...);
// * Author URI: https://example.com     ← one field, live, unambiguous
// The SDK boilerplate does this by construction: full-slug prefixes everywhere,
// and it omits Plugin URI / Author URI until you supply a live homepage.
```

```jsx
// ❌ NEVER — invent prefixed classes that don't exist in WP
<button className="wpac-button wpac-button-primary">Save</button>

// ✅ ALWAYS — use real WP admin class names
<button className="button button-primary">Save</button>
```

---

## Versioning + stability

- `https://cdn.wp-admincss.com/css/latest.css` — rolling latest (use during development)
- `https://cdn.wp-admincss.com/css/v0.1.0/wp-admin.css` — pinned version (use in production)
- Same scheme for `AGENTS.md` and all `skills/*.md` files

The `latest` URL **will** change as the library evolves. For a stable production plugin, pin to a specific version.

The PHP runtime exposes the version + a minimum-version assertion:

```php
use PluginSDK\WP\Version;

Version::requireAtLeast('0.2.0'); // throws if older
echo Version::SDK; // "0.1.0"
```

The full public-API contract lives at [STABILITY.md](https://github.com/artificialpoets/plugin-sdk/blob/main/STABILITY.md) — every class listed there is `@api` tagged in source and guaranteed across minor releases.

---

## When in doubt

- **Component to render?** → <https://wp-admincss.com/components.html>
- **Full page template?** → <https://wp-admincss.com/layouts.html>
- **Manifest field reference?** → [`skills/plugin-manifest.md`](./skills/plugin-manifest.md)
- **Security pattern?** → [`skills/security.md`](./skills/security.md)
- **Database pattern?** → [`skills/database.md`](./skills/database.md)
- **Plugin file layout?** → [`skills/plugin-structure.md`](./skills/plugin-structure.md)
- **Scaffold a new plugin?** → `npx @plugin-sdk/cli create <name>`
- **Official WP docs?** → <https://developer.wordpress.org/>

If a WordPress function or hook name "sounds right" but you can't find it in the WP developer docs (developer.wordpress.org), it probably doesn't exist. Verify before emitting. Common hallucinations: WooCommerce hooks that aren't real, `wp_get_*` functions that don't exist, `do_action` filters where `apply_filters` is required (or vice versa).

---

## License

Apache 2.0 for the framework. GPLv2-or-later for `packages/wp-core-css/` (bundles WP core CSS) and `boilerplates/wordpress/` (WP plugin scaffold). Commercial plugins welcome. See [NOTICE](NOTICE) for the split.

— [wp-admincss.com](https://wp-admincss.com) · [GitHub](https://github.com/artificialpoets/plugin-sdk)
