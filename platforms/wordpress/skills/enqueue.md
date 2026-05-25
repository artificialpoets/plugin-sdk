# Enqueueing assets — admin scripts and styles

> Load this skill when: adding CSS or JavaScript to admin pages, front-end pages, or the block editor.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/enqueue.md`

WordPress has one correct way to add assets: register and enqueue them on the right hook. Don't echo `<link>` or `<script>` tags directly — you lose deduplication, dependency resolution, and version cache-busting, and you'll conflict with other plugins.

## The four hooks

| Hook | When it fires | Use for |
|---|---|---|
| `admin_enqueue_scripts` | On every admin page | Plugin admin pages, dashboards, custom post type screens |
| `wp_enqueue_scripts` | On every front-end page | Public-facing CSS/JS your plugin needs on the site |
| `enqueue_block_editor_assets` | On the Gutenberg editor only | Custom blocks, block editor extensions |
| `enqueue_block_assets` | On both editor + front-end | Block styles that must render in both contexts |

Pick the narrowest hook that fits — `admin_enqueue_scripts` for admin work, not `wp_enqueue_scripts`.

---

## Admin enqueue — scope to your plugin's page

`admin_enqueue_scripts` fires on every admin page. If you load 200KB of plugin JS unconditionally, you slow down every WP admin page for the user. Scope to your page.

```php
add_action('admin_enqueue_scripts', function($hook_suffix) {
    // $hook_suffix is the current admin page (e.g. 'toplevel_page_my-plugin')
    if ($hook_suffix !== 'toplevel_page_my-plugin') {
        return;
    }

    wp_enqueue_style(
        'my-plugin-admin',
        plugins_url('assets/admin.css', __FILE__),
        ['wp-admincss'],                              // depends on
        '1.0.0'                                       // version (for cache-bust)
    );

    wp_enqueue_script(
        'my-plugin-admin',
        plugins_url('assets/admin.js', __FILE__),
        ['wp-element', 'wp-api-fetch'],               // depends on
        '1.0.0',
        true                                          // load in footer
    );
});
```

### How to find your hook suffix

When you register an admin menu with `add_menu_page`, it returns the hook suffix. Store it:

```php
add_action('admin_menu', function() {
    $hook = add_menu_page(
        'My Plugin', 'My Plugin', 'manage_options',
        'my-plugin', 'my_plugin_render', 'dashicons-admin-generic'
    );
    // Store $hook so the enqueue callback can check it
    add_action('admin_print_styles-' . $hook, 'my_plugin_enqueue_admin_assets');
});

function my_plugin_enqueue_admin_assets(): void {
    wp_enqueue_style('my-plugin-admin', plugins_url('admin.css', __FILE__), [], '1.0.0');
}
```

The `admin_print_styles-{$hook}` and `admin_print_scripts-{$hook}` hooks only fire on YOUR page, so no `$hook_suffix` check needed.

---

## Front-end enqueue

```php
add_action('wp_enqueue_scripts', function() {
    // Only load on pages where the plugin's shortcode appears
    if (!is_singular() || !has_shortcode(get_post()->post_content, 'my_plugin')) {
        return;
    }

    wp_enqueue_style('my-plugin-front', plugins_url('assets/front.css', __FILE__), [], '1.0.0');
});
```

### Use `wp_register_script` + conditional enqueue

For assets that might be enqueued in multiple places:

```php
// Register once, anywhere
add_action('init', function() {
    wp_register_style('my-plugin-shared', plugins_url('shared.css', __FILE__), [], '1.0.0');
});

// Then in handlers
wp_enqueue_style('my-plugin-shared');  // dedups automatically
```

---

## Loading Plugin SDK in your plugin

Three options:

### Option 1 — CDN (simplest)

```php
add_action('admin_enqueue_scripts', function($hook) {
    if ($hook !== 'toplevel_page_my-plugin') return;
    wp_enqueue_style(
        'wp-admincss',
        'https://cdn.wp-admincss.com/css/latest.css',
        [],
        null  // pass null to skip cache-bust query string (CDN is already versioned)
    );
});
```

### Option 2 — Pinned version

```php
wp_enqueue_style(
    'wp-admincss',
    'https://cdn.wp-admincss.com/css/v0.1.0/wp-admin.css',
    [],
    null
);
```

### Option 3 — Bundled with your plugin (via composer)

```bash
composer require plugin-sdk/wp
```

```php
add_action('admin_enqueue_scripts', function($hook) {
    if ($hook !== 'toplevel_page_my-plugin') return;
    \PluginSDK\WP\Assets::enqueue_cdn();  // shortcut for the CDN URL
});
```

If your plugin is sold/distributed and you want zero external requests, ship the CSS file with your plugin:

```php
wp_enqueue_style(
    'wp-admincss',
    plugins_url('vendor/plugin-sdk/wp/dist/wp-admin.css', __FILE__),
    [],
    '0.1.0'
);
```

---

## WordPress's built-in scripts

WordPress ships dozens of useful libraries pre-registered. Don't bundle your own copy of jQuery, React, or wp.media — depend on the registered handles.

| Handle | What it gives you |
|---|---|
| `jquery` | jQuery |
| `wp-element` | React (re-exported from `@wordpress/element`) |
| `wp-i18n` | Translation functions for JS (`__`, `_x`, etc.) |
| `wp-api-fetch` | REST client (auto-adds nonce + base URL) |
| `wp-components` | The full Gutenberg component library |
| `wp-data` | Redux-like state container |
| `wp-color-picker` | Iris color picker (`jQuery('.x').wpColorPicker()`) |
| `dashicons` | The dashicons font + CSS |
| `media-upload` / `media-views` | wp.media() — call `wp_enqueue_media()` instead |
| `jquery-ui-datepicker` | jQuery UI Datepicker (NO CSS — ship your own) |
| `jquery-ui-sortable` | Drag-to-reorder |
| `code-editor` | CodeMirror wrapper (`wp.codeEditor.initialize()`) |

```php
wp_enqueue_script('my-plugin', $url, ['wp-element', 'wp-api-fetch', 'wp-i18n'], '1.0.0', true);
```

WordPress resolves the dependency graph: any handles your script depends on are loaded first.

### `wp_enqueue_media()` — special case

For wp.media (the media library modal), call `wp_enqueue_media()` instead of enqueuing individual handles. It registers all the right things:

```php
add_action('admin_enqueue_scripts', function($hook) {
    if ($hook !== 'toplevel_page_my-plugin') return;
    wp_enqueue_media();
    wp_enqueue_script('my-plugin', $url, ['jquery'], '1.0.0', true);
});
```

---

## Passing server data to JavaScript

### `wp_localize_script` — for arrays of values

```php
wp_enqueue_script('my-plugin', $url, [], '1.0.0', true);
wp_localize_script('my-plugin', 'myPluginData', [
    'restUrl'  => esc_url_raw(rest_url('my-plugin/v1/')),
    'nonce'    => wp_create_nonce('wp_rest'),
    'currentUser' => [
        'id'              => get_current_user_id(),
        'canManageOptions' => current_user_can('manage_options'),
    ],
    'i18n' => [
        'confirmDelete' => __('Are you sure you want to delete this?', 'my-plugin'),
    ],
]);
```

In JS:

```js
// window.myPluginData is now available
fetch(window.myPluginData.restUrl + 'settings', {
    headers: { 'X-WP-Nonce': window.myPluginData.nonce }
});
```

### `wp_add_inline_script` — for richer payloads

`wp_localize_script` only handles arrays/objects. For JSON of complex shapes or to add init code:

```php
wp_add_inline_script(
    'my-plugin',
    'window.myPluginData = ' . wp_json_encode($data) . ';',
    'before'  // 'before' = before the main script; 'after' = after
);
```

### Never inline secrets

`localStorage`, `sessionStorage`, and JS variables are all visible to the user. Never put API keys, license tokens, or service credentials in JS data. If the request goes to YOUR server, use a nonce + capability check; if it goes to a third party, proxy through your server.

---

## Versioning and cache busting

WordPress auto-appends `?ver=...` to enqueued URLs based on the version arg:

```php
wp_enqueue_style('my-plugin', $url, [], '1.0.0');
// → <link rel="stylesheet" href=".../style.css?ver=1.0.0">
```

When you ship a new version, change the version string — users get fresh assets, CDNs/proxies bust their cache.

For frequently-changing assets in development, use `filemtime`:

```php
wp_enqueue_style(
    'my-plugin',
    plugins_url('assets/admin.css', __FILE__),
    [],
    filemtime(plugin_dir_path(__FILE__) . 'assets/admin.css')
);
```

Pass `null` as version to **skip** the query string entirely (useful for CDN URLs that are already versioned in the path).

---

## Internationalization for JS

If your plugin uses `__()` etc. in JavaScript, declare the text domain to the script:

```php
wp_enqueue_script('my-plugin', $url, ['wp-i18n'], '1.0.0', true);
wp_set_script_translations('my-plugin', 'my-plugin', plugin_dir_path(__FILE__) . 'languages');
```

```js
import { __ } from '@wordpress/i18n';
const label = __('Save Changes', 'my-plugin');  // translatable
```

See [`skills/i18n.md`](./i18n.md) for the full i18n workflow.

---

## Conditional loading patterns

### Only on the editor (Gutenberg)

```php
add_action('enqueue_block_editor_assets', function() {
    wp_enqueue_script('my-block', $url, ['wp-blocks', 'wp-element', 'wp-editor'], '1.0.0');
});
```

### Only on the front-end (and only if shortcode used)

```php
add_action('wp_enqueue_scripts', function() {
    global $post;
    if (!is_singular() || !is_a($post, 'WP_Post')) return;
    if (!has_shortcode($post->post_content, 'my_plugin')) return;
    wp_enqueue_style('my-plugin-front', $url, [], '1.0.0');
});
```

### Only on specific post types

```php
add_action('admin_enqueue_scripts', function($hook) {
    $screen = get_current_screen();
    if (!$screen || $screen->post_type !== 'product') return;
    wp_enqueue_script('my-product-helpers', $url, ['jquery'], '1.0.0', true);
});
```

---

## Common AI mistakes

- **Echoing `<link>` or `<script>` tags directly** in templates instead of enqueuing.
- **Enqueuing without a version string** — breaks cache invalidation on updates.
- **Enqueuing on the wrong hook** — `wp_head` or `admin_head` instead of the enqueue hooks.
- **Unconditional enqueue** — loading plugin JS on every admin page when only one page needs it.
- **Bundling jQuery or React** instead of depending on the registered handles.
- **Inline `<script>` with no nonce** for CSP-strict sites — use `wp_add_inline_script` instead.
- **Forgetting `wp_enqueue_media()`** when using the media-library button.
