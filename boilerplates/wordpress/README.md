# Plugin SDK Starter

A greenfield WordPress plugin scaffold built with [Plugin SDK](https://wp-admincss.com). Clone this folder, rename a few strings, and you have a plugin with secure form handling, custom tables, REST endpoints, and a polished admin UI — out of the box.

## What you get

- **Working settings page** with tabs, form-table, toggle, nonce, capability check, and success notice — all wired correctly.
- **Custom table** (`{prefix}_wpacs_events`) with `dbDelta` migration and a `EventRepository` class for safe `$wpdb` access.
- **REST endpoint** (`/wp-json/wpacs/v1/settings`) with proper `permission_callback`, schema-validated input, and sanitization.
- **Lifecycle hooks** — activation seeds defaults + creates tables; deactivation clears crons; `uninstall.php` removes all plugin data.
- **PSR-4 autoloading** via Composer.
- **i18n setup** — `load_plugin_textdomain` + every user-facing string wrapped in `__()`.
- **Asset enqueueing scoped to the plugin's admin page** only (doesn't slow down the rest of WP admin).

## Quick start

```bash
# 1. Copy the scaffold into a new plugin folder
cp -r boilerplate ~/my-new-plugin
cd ~/my-new-plugin

# 2. Install dependencies
composer install

# 3. Run a global find-replace to rename the plugin
#    Replace these strings throughout the codebase:
#
#    Plugin SDK Starter   →  My Plugin Name
#    plugin-sdk-starter   →  my-plugin (the slug — must match folder name)
#    WPACS\               →  MyPlugin\ (PSP-4 namespace)
#    WPACS_                →  MY_PLUGIN_  (constants)
#    wpacs_                →  my_plugin_  (option keys, table names, hook prefixes)

# 4. Activate the plugin
#    Symlink into wp-content/plugins/ or copy the folder there.
```

## File layout

```
boilerplate/
├── plugin-sdk-starter.php          ← Plugin header + bootstrap. Loads everything.
├── composer.json                     ← Autoload + plugin-sdk/wp dependency.
├── uninstall.php                     ← Runs on plugin deletion (cleans DB).
├── README.md                         ← This file.
├── assets/
│   └── admin.css                     ← Your plugin's CSS overrides.
├── languages/                        ← .pot / .po / .mo translation files.
└── src/
    ├── Plugin.php                    ← Orchestrator. Wires every subsystem.
    ├── Lifecycle.php                 ← activate() / deactivate() hooks.
    ├── Admin/
    │   ├── Menu.php                  ← Register admin menu page.
    │   ├── Assets.php                ← Enqueue plugin CSS/JS.
    │   └── SettingsPage.php          ← Settings page render + POST handler.
    ├── Database/
    │   ├── Schema.php                ← dbDelta CREATE TABLE.
    │   └── EventRepository.php       ← Queries the events table.
    └── REST/
        └── SettingsController.php    ← REST endpoint for settings.
```

Each subsystem has a `register()` method that wires its own WordPress hooks. `Plugin::boot()` is just an overview.

## Read these files first

The boilerplate is heavily commented to teach the patterns by example. Read them in this order:

1. **`plugin-sdk-starter.php`** — the bootstrap. Five things only: header, security guard (`defined('ABSPATH')`), composer autoload, boot on `plugins_loaded`, lifecycle hooks.
2. **`src/Plugin.php`** — the orchestrator. How subsystems are wired.
3. **`src/Admin/SettingsPage.php`** — the canonical example of a secure WP admin page. Capability check → nonce check → sanitize → save → redirect-with-flash. Study this one closely.
4. **`src/REST/SettingsController.php`** — the canonical REST endpoint. `permission_callback`, `args` with `sanitize_callback`, returning `WP_Error` on failure.
5. **`src/Database/EventRepository.php`** — safe `$wpdb` usage with `prepare()`.

## Customize for your brand

Override CSS tokens in `assets/admin.css`:

```css
.toplevel_page_plugin-sdk-starter {  /* scope to your plugin page only */
  --wpadmin-primary: #7c3aed;
  --wpadmin-radius: 8px;
}
```

The `toplevel_page_*` body class is added by WordPress automatically based on your menu slug.

## Working with an AI agent

This boilerplate is designed to be edited by AI coding agents. Point your agent at:

- **`/AGENTS.md`** (in the parent `wp-admincss` repo) — master framework instructions.
- **`/skills/security.md`** — when adding new endpoints/handlers.
- **`/skills/database.md`** — when adding new tables/queries.
- **`/skills/data-modeling.md`** — when deciding where to put data.

Or simply tell your agent: *"Follow the patterns in Plugin SDK Starter. Match the security, capability, and i18n conventions used in SettingsPage.php."*

## Renaming script (optional)

Save this as `rename.sh`, then `bash rename.sh "My Plugin Name" "my-plugin" "MyPlugin" "MY_PLUGIN" "my_plugin"`:

```bash
#!/bin/bash
# rename.sh <Name> <slug> <Namespace> <CONST_PREFIX> <fn_prefix>
NAME=$1; SLUG=$2; NS=$3; CONST=$4; FN=$5

find . -type f \( -name '*.php' -o -name '*.json' -o -name '*.md' -o -name '*.css' -o -name '*.txt' \) \
    -not -path './vendor/*' \
    -exec sed -i '' \
    -e "s/Plugin SDK Starter/$NAME/g" \
    -e "s/plugin-sdk-starter/$SLUG/g" \
    -e "s/WPACS\\\\/${NS}\\\\/g" \
    -e "s/WPACS_/${CONST}_/g" \
    -e "s/wpacs_/${FN}_/g" \
    -e "s/wpacs-/${SLUG}-/g" \
    -e "s/wpacs\./${FN}\./g" \
    {} +

mv plugin-sdk-starter.php "$SLUG.php"
echo "Renamed to $NAME ($SLUG)"
```

## Before you ship — pre-release checklist

Run these checks before tagging a version or submitting to WordPress.org:

### 1. Plugin Check (the same scanner WordPress.org uses)

```bash
# Install once
wp plugin install plugin-check --activate

# Run against this plugin
wp plugin check plugin-sdk-starter
```

Fix every **Error** before submission. Plugin Check catches missing nonces, unescaped output, unprepared SQL, deprecated APIs, accessibility issues, and i18n misuse — the same things WordPress.org reviewers flag.

### 2. Slug availability (first release only)

If you're publishing to WordPress.org, verify the slug isn't already taken:

```bash
# Either visit the URL in a browser (404 = free, page = taken):
open https://wordpress.org/plugins/your-slug/

# Or query the API:
curl "https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=your-slug"
```

A response containing `{"error":"Plugin not found."}` means the slug is available. Slugs **cannot be renamed** after submission, so pick wisely.

### 3. Version consistency

The version must match in three places:

```bash
grep "Version:" plugin-sdk-starter.php   # plugin header
grep "PSDK_VERSION" plugin-sdk-starter.php  # PHP constant
grep "Stable tag:" readme.txt  # (when you add a readme.txt)
```

### 4. Standard checklist

- [ ] All `__()` / `_e()` calls use the literal text domain `plugin-sdk-starter`
- [ ] No `error_log()`, `var_dump()`, `console.log()` left in
- [ ] No hardcoded credentials, API keys, internal URLs
- [ ] Tested with `WP_DEBUG = true` — no notices/warnings
- [ ] `uninstall.php` cleans up everything the latest version writes

See [`skills/publishing.md`](../skills/publishing.md) for the full publishing flow (`readme.txt` format, screenshot guidelines, SVN tagging, post-approval maintenance).

## License inheritance

This scaffold is **GPLv2-or-later** because it is designed to run as a WordPress plugin (and WordPress core is GPLv2-or-later).

When you ship a plugin built from this scaffold:

- **The framework dependencies you pull in are differently licensed.** `@plugin-sdk/wp-tokens`, `@plugin-sdk/wp-react`, and `plugin-sdk/wp` are Apache 2.0. `@plugin-sdk/wp-core-css` is GPLv2-or-later (it bundles WordPress core CSS).
- **Apache 2.0 → GPLv2-or-later is one-way compatible**, so Apache-licensed framework code can be incorporated into your GPL plugin without conflict.
- **Your distributed plugin will normally be GPLv2-or-later** when shipped alongside WordPress. Set `License: GPLv2 or later` and `License URI: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html` in your plugin header.

## License

GPLv2-or-later. See [LICENSE](LICENSE) in this directory.
