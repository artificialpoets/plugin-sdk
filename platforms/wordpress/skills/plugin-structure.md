# Plugin structure — file layout, autoloading, lifecycle

> Load this skill when: scaffolding a new plugin, organizing files, setting up Composer/autoload, or wiring activation/deactivation hooks.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/plugin-structure.md`

A WordPress plugin is fundamentally just one PHP file with a specific header comment. WordPress finds it, parses the header, and loads the file. Everything beyond that is convention — and modern conventions matter for maintainability, especially when an AI agent will be reading/extending the code.

## The recommended path — Plugin SDK scaffolder

If the user is starting a new plugin, scaffold it via the CLI:

```bash
npx @plugin-sdk/cli create "My Plugin"
```

This emits the layout described in the "Recommended structure" section below, but already wired through `Plugin::fromManifest()` so capability checks, nonce verification, and request-body validation are handled by the runtime. The plugin's main PHP file becomes two lines of meaningful bootstrap:

```php
add_action('plugins_loaded', function () {
    \PluginSDK\WP\Plugin::fromManifest(__DIR__ . '/plugin-sdk.json', __FILE__)->boot();
});
```

Everything else lives in `plugin-sdk.json` (declarative) or `src/` (handler logic). See [`plugin-manifest.md`](./plugin-manifest.md) for the manifest reference.

The rest of this skill is **the explanation of what the SDK is doing under the hood**, plus the file layout to use if you decide to hand-roll instead.

## The minimum viable plugin

```
my-plugin/
└── my-plugin.php
```

```php
<?php
/**
 * Plugin Name: My Plugin
 * Description: One-line description of what it does.
 * Version:     0.1.0
 * Author:      Your Name
 * License:     GPLv2 or later
 * Text Domain: my-plugin
 */

defined('ABSPATH') || exit;  // prevent direct access

add_action('admin_menu', function() {
    add_menu_page('My Plugin', 'My Plugin', 'manage_options', 'my-plugin', function() {
        echo '<div class="wrap"><h1>My Plugin</h1></div>';
    });
});
```

This works for a 50-line snippet. For anything bigger, use the structure below — or, again, scaffold via the CLI which gives you the same shape pre-wired.

---

## Recommended structure

```
my-plugin/
├── my-plugin.php                  ← Bootstrap file with the plugin header
├── composer.json                  ← Autoload + dependencies
├── readme.txt                     ← WP.org plugin-directory format
├── README.md                      ← Developer-facing README (GitHub)
├── uninstall.php                  ← Cleanup on plugin deletion
├── languages/                     ← .pot / .po / .mo translation files
│   └── my-plugin.pot
├── assets/                        ← Built CSS/JS
│   ├── admin.css
│   └── admin.js
├── vendor/                        ← Composer dependencies (gitignored)
└── src/                           ← Your PHP, PSR-4 autoloaded
    ├── Plugin.php                 ← Main orchestrator class
    ├── Admin/
    │   ├── Menu.php               ← Menu registration
    │   ├── SettingsPage.php       ← /admin.php?page=my-plugin
    │   └── Assets.php             ← Enqueue handlers
    ├── Database/
    │   ├── Schema.php             ← dbDelta migrations
    │   └── EventRepository.php    ← Domain queries
    ├── REST/
    │   └── SettingsController.php ← REST endpoints
    └── Lifecycle.php              ← activation/deactivation/uninstall hooks
```

---

## The bootstrap file (`my-plugin.php`)

Keep it small. Its only job is:

1. Define the plugin header (so WP discovers it).
2. Prevent direct access (`defined('ABSPATH')`).
3. Load Composer's autoloader.
4. Boot the main class.

```php
<?php
/**
 * Plugin Name:       My Plugin
 * Plugin URI:        https://example.com/my-plugin
 * Description:       Replace this with one sentence describing what your plugin does.
 * Version:           0.1.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Your Name
 * Author URI:        https://example.com
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * Text Domain:       my-plugin
 * Domain Path:       /languages
 */

declare(strict_types=1);

defined('ABSPATH') || exit;

define('MY_PLUGIN_VERSION', '0.1.0');
define('MY_PLUGIN_FILE', __FILE__);
define('MY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MY_PLUGIN_URL', plugin_dir_url(__FILE__));

// Composer autoload (skip if you ship without dependencies)
if (file_exists(MY_PLUGIN_DIR . 'vendor/autoload.php')) {
    require_once MY_PLUGIN_DIR . 'vendor/autoload.php';
}

// Boot
add_action('plugins_loaded', static function() {
    (new \MyPlugin\Plugin())->boot();
});

// Lifecycle hooks (top-level, not inside plugins_loaded)
register_activation_hook(__FILE__, ['\MyPlugin\Lifecycle', 'activate']);
register_deactivation_hook(__FILE__, ['\MyPlugin\Lifecycle', 'deactivate']);
```

---

## Composer + PSR-4

`composer.json`:

```json
{
  "name": "your-org/my-plugin",
  "description": "What the plugin does.",
  "type": "wordpress-plugin",
  "license": "GPL-2.0-or-later",
  "require": {
    "php": ">=7.4",
    "plugin-sdk/wp": "^0.1"
  },
  "autoload": {
    "psr-4": {
      "MyPlugin\\": "src/"
    }
  }
}
```

`src/Plugin.php`:

```php
<?php
declare(strict_types=1);

namespace MyPlugin;

use MyPlugin\Admin\Menu;
use MyPlugin\Admin\Assets;
use MyPlugin\REST\SettingsController;

final class Plugin {
    public function boot(): void {
        load_plugin_textdomain('my-plugin', false, dirname(plugin_basename(MY_PLUGIN_FILE)) . '/languages');

        (new Menu())->register();
        (new Assets())->register();
        (new SettingsController())->register();
    }
}
```

Each subsystem is a class with a `register()` method that wires its own hooks. That makes each piece testable in isolation and keeps `Plugin::boot()` a clean overview.

---

## Lifecycle: activation, deactivation, uninstall

### Activation hook — runs once when the plugin is activated

Use for: creating tables (`dbDelta`), seeding default options, flushing rewrite rules.

```php
namespace MyPlugin;

final class Lifecycle {
    public static function activate(): void {
        // Create custom tables
        \MyPlugin\Database\Schema::install();

        // Seed defaults
        if (!get_option('my_plugin_settings')) {
            update_option('my_plugin_settings', [
                'api_key' => '',
                'mode'    => 'production',
            ]);
        }

        // If you registered CPTs or rewrite rules:
        flush_rewrite_rules();
    }

    public static function deactivate(): void {
        // Clear scheduled crons, transients, etc.
        wp_clear_scheduled_hook('my_plugin_daily_sync');
        flush_rewrite_rules();
    }
}
```

### Uninstall — runs once when the plugin is deleted

Place an `uninstall.php` in the plugin root. WordPress runs it automatically:

```php
<?php
// uninstall.php
defined('WP_UNINSTALL_PLUGIN') || exit;

global $wpdb;

// Drop tables
$wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}my_plugin_events");

// Delete options
delete_option('my_plugin_settings');
delete_option('my_plugin_db_version');

// For multisite, loop sites
if (is_multisite()) {
    foreach (get_sites(['fields' => 'ids']) as $site_id) {
        switch_to_blog($site_id);
        delete_option('my_plugin_settings');
        restore_current_blog();
    }
}
```

### Don't put DB work in `plugins_loaded`

DB writes on every page load are a performance disaster and a common AI mistake. DB schema changes belong in activation hooks + version-bump migrations:

```php
// ✅ In Plugin::boot()
$current = get_option('my_plugin_db_version', '0');
if (version_compare($current, MY_PLUGIN_VERSION, '<')) {
    \MyPlugin\Database\Schema::install();
    update_option('my_plugin_db_version', MY_PLUGIN_VERSION);
}
```

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Plugin slug | kebab-case | `my-plugin` |
| Text domain | matches slug | `my-plugin` |
| Constants | `UPPER_SNAKE_CASE` prefixed | `MY_PLUGIN_DIR` |
| Functions (non-OO) | `lowercase_snake_case` prefixed | `my_plugin_render_page` |
| Classes / namespaces | `PascalCase` | `MyPlugin\Admin\SettingsPage` |
| Hook names | `lowercase_snake_case` prefixed | `my_plugin_before_save` |
| Option keys | `lowercase_snake_case` prefixed | `my_plugin_settings` |
| Capabilities | `lowercase_snake_case` prefixed | `manage_my_plugin` |
| CSS classes (your own) | `kebab-case` prefixed | `.my-plugin-card` |
| JS variables (`wp_localize_script` name) | `camelCase` prefixed | `myPluginData` |

**Always prefix.** WordPress is a shared namespace — every plugin runs in the same process. An unprefixed function `format_date()` will collide with another plugin's eventually. AI agents that emit unprefixed names are creating long-term bugs.

---

## Hooks vs direct calls

Subscribe to WordPress lifecycle via hooks rather than running code at file-load time:

```php
// ❌ NEVER — runs every page load, before WP is ready
register_my_settings();

// ✅ ALWAYS — runs at the right moment in the WP lifecycle
add_action('admin_init', 'register_my_settings');
```

Common hooks an AI agent should know:

| Hook | Fires |
|---|---|
| `plugins_loaded` | All plugins are loaded. Safe to call WP functions. |
| `init` | WP is initialized. Register CPTs, taxonomies, shortcodes here. |
| `admin_init` | Admin area is being loaded. Register settings, dashboard widgets here. |
| `admin_menu` | Add admin menu items here. |
| `admin_enqueue_scripts` | Add admin CSS/JS here. |
| `wp_enqueue_scripts` | Add front-end CSS/JS here. |
| `rest_api_init` | Register REST routes here. |
| `wp_loaded` | All of WP is loaded. Late init. |
| `wp_footer` / `admin_footer` | Inject footer HTML. |

For each, the rule of thumb: the latest hook that does what you need. Late = less chance of fighting WordPress's state.

---

## Avoiding global namespace pollution

```php
// ❌ Top-level code in the bootstrap file
function format_thing() { … }  // collides with every plugin

// ✅ Namespaced classes via PSR-4
namespace MyPlugin\Util;
class Formatter {
    public static function format(string $thing): string { … }
}

// Use: \MyPlugin\Util\Formatter::format($x);
```

For glue code that has to be a top-level function (legacy hooks expecting a function name):

```php
add_action('hook', static function() {
    \MyPlugin\Plugin::handle_hook();
});
```

Anonymous closures keep the global namespace clean.

---

## Configuration constants

Allow advanced users to override behavior via `wp-config.php` constants:

```php
// In wp-config.php (user-controlled):
define('MY_PLUGIN_DEBUG', true);

// In your plugin:
if (defined('MY_PLUGIN_DEBUG') && MY_PLUGIN_DEBUG) {
    // Verbose logging
}
```

This is the standard WordPress escape hatch for power users. Don't read environment variables (`getenv()`) — `wp-config.php` constants is the convention.

---

## Internal data flow

A typical plugin admin page request looks like:

```
URL: /wp-admin/admin.php?page=my-plugin&tab=general
│
├─ WP boots, loads all plugins
├─ admin_menu hook fires → MyPlugin\Admin\Menu registers the page
├─ User visits the page
├─ admin_enqueue_scripts fires → MyPlugin\Admin\Assets enqueues CSS/JS (scoped to this $hook)
└─ My page's render callback fires → MyPlugin\Admin\SettingsPage::render()
   └─ Renders HTML using \PluginSDK\WP\Components helpers

POST submission:
│
├─ WP routes to /wp-admin/admin-post.php?action=my_plugin_save
├─ admin_post_my_plugin_save hook fires
└─ handler: check_admin_referer + current_user_can + sanitize + save + redirect
```

The boilerplate plugin in [`/boilerplate`](../boilerplate) implements this end-to-end as a working example.

---

## Common AI mistakes

- **Code outside hooks** — running things at file-load time before WP is ready.
- **Unprefixed function/class names** — collisions with other plugins.
- **Single mega-class** for everything — make each subsystem its own class.
- **Activation hook code in `plugins_loaded`** — DB schema work re-runs on every request.
- **Tightly coupled to `__FILE__`** — passing `__FILE__` deep into classes. Use a single `MY_PLUGIN_FILE` constant.
- **No `defined('ABSPATH')` check** — files can be loaded directly via URL.
- **No `uninstall.php`** — leaves data behind on deletion, which fails WP.org plugin review.
- **No version constant** — makes assets hard to cache-bust on update.
