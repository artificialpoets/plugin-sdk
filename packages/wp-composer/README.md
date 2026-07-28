# plugin-sdk/wp

> **Read-only mirror.** This repository is auto-generated from the
> `packages/wp-composer/` subdirectory of
> [artificialpoets/plugin-sdk](https://github.com/artificialpoets/plugin-sdk)
> by a `git subtree split` GitHub Action on every tagged release.
>
> **File issues + PRs against the main repo**, not here. The mirror is
> rebuilt on every release; any commits pushed directly here will be
> overwritten.

The WordPress runtime for **Plugin SDK** — a declarative manifest loader, fluent Settings/REST/Migration APIs, plus the admin-UI render helpers. Drop a `plugin-sdk.json` in your plugin root, call `Plugin::fromManifest()` once, and the SDK wires up:

- the **settings page** (with capability check + sanitisation per field),
- the **REST API** (with cap check + JSON-schema body validation),
- and the **database tables** (rendered to dbDelta SQL, run on activate),

…then gets out of your way for handlers and business logic.

Pair with [`@plugin-sdk/wp-core-css`](https://github.com/artificialpoets/plugin-sdk/tree/main/packages/wp-core-css) for the stylesheet.

## Install

```bash
composer require plugin-sdk/wp
```

Requires PHP 7.4 or later.

## Declarative quickstart

Add a `plugin-sdk.json` to your plugin root:

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
          { "id": "api_key", "label": "API Key", "type": "password", "required": true }
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
        "properties": { "email": { "type": "string", "format": "email" } }
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
      ]
    }]
  }
}
```

In your plugin's main PHP file:

```php
<?php
use PluginSDK\WP\Plugin;
use Acme\Forms\REST\Submissions;

add_action('plugins_loaded', function () {
    Plugin::fromManifest(__DIR__ . '/plugin-sdk.json', __FILE__)
        ->withRestHandler('Acme\\Forms\\REST\\Submissions::create', [Submissions::class, 'create'])
        ->boot();
});
```

That's the whole bootstrap. Errors in the manifest throw `ConfigException` with the full validation trace, so you fail fast at boot time instead of hitting a half-broken admin page later.

## Fluent runtime (imperative layer)

The declarative loader compiles to the same fluent calls — you can use either layer or both.

```php
use PluginSDK\WP\Settings;
use PluginSDK\WP\Settings\Field;
use PluginSDK\WP\REST;
use PluginSDK\WP\Migration;
use PluginSDK\WP\Migration\Table;

(new Settings('acme-forms', 'Acme Forms'))
    ->capability('manage_options')
    ->section('general', 'General')
        ->field('api_key', 'API Key', Field::TYPE_PASSWORD, required: true)
    ->section('advanced', 'Advanced')
        ->field('endpoint', 'Endpoint', Field::TYPE_URL);

(new REST('acme-forms/v1'))
    ->route('/submissions', 'POST')
        ->capability('manage_options')
        ->schema(['type' => 'object', 'required' => ['email'], 'properties' => ['email' => ['type' => 'string', 'format' => 'email']]])
        ->setHandler([Submissions::class, 'create']);

(new Migration('acme_forms_db_version', '0.1.0', 'acme_'))
    ->addTable(new Table('submissions', [
        ['name' => 'id',    'type' => 'BIGINT UNSIGNED', 'primary' => true, 'autoIncrement' => true],
        ['name' => 'email', 'type' => 'VARCHAR(255)', 'notNull' => true],
    ]));
```

## Admin UI render helpers

The package also includes the original render helpers — useful for hand-rolled admin pages that don't fit the settings model:

```php
<?php
use PluginSDK\WP\Components;
use PluginSDK\WP\Assets;

// Enqueue the stylesheet (from CDN, or pass a local URL)
add_action('admin_enqueue_scripts', [Assets::class, 'enqueue_cdn']);

// Render a settings page
function my_plugin_render_settings_page(): void {
    echo Components::wrap(
        Components::page_header('My Plugin Settings', [
            'action' => ['label' => 'Add New', 'href' => '?page=add-new'],
        ]) .

        Components::notice_success('Settings saved.', ['dismissible' => true]) .

        Components::form_table(
            Components::form_row('API Key',
                Components::input(['name' => 'api_key', 'id' => 'api-key']),
                ['for' => 'api-key', 'description' => 'Find your key in the dashboard.']
            ) .
            Components::form_row('Notifications',
                Components::toggle([
                    'name' => 'notify',
                    'label' => 'Email me when events fire',
                    'checked' => true,
                ])
            )
        ) .

        Components::submit(
            Components::button('Save Changes', ['variant' => 'primary', 'type' => 'submit'])
        )
    );
}
```

The rendered HTML uses **real WordPress admin class names** — `.wrap`, `.notice notice-success is-dismissible`, `.form-table`, `.button button-primary`, etc. — so plugin admin pages look indistinguishable from a native WP screen and inherit the user's color scheme automatically.

## Available helpers

All methods live on `\PluginSDK\WP\Components` as static methods. Each underlying renderer is also available directly (e.g. `\PluginSDK\WP\Components\Button::render()`).

### Actions
- `button(string $label, array $args = [])` — variants `primary` / `secondary` / `link` / `link-delete`, sizes `small` / `large` / `hero`. Pass `html_label` to use pre-rendered HTML (e.g. for icons + text).

### Icons
- `dashicon(string $icon, array $args = [])` — WordPress's native icon font. Pass any name from the [Dashicons catalog](https://developer.wordpress.org/resource/dashicons/), e.g. `'admin-users'` or `'edit'`. Sizes: `'small'` (16px), default (20px), `'large'` (28px).
- `icon(string $name, array $args = [])` — Inline SVG, the [modern WP direction](https://make.wordpress.org/design/2020/04/20/next-steps-for-dashicons/). 20 built-in names (plus / minus / close / check / chevrons / arrows / edit / trash / search / more-horizontal / more-vertical / info / warning / external-link). Pass `svg_html` to supply your own inline SVG content.

### Notice
- `notice(string $variant, string $message_html, array $args)` — pass pre-escaped HTML
- `notice_success(string $message, array $args)` — convenience wrapper that escapes a single-line message
- `notice_error()`, `notice_warning()`, `notice_info()`

### Forms
- `input(array $args)` — width `regular` / `large` / `small`, type, name, value, etc.
- `textarea(array $args)`
- `select(array $options, array $args)`
- `form_table(string $rows_html)`, `form_row(string $label, string $control_html, array $args)`
- `description(string $text)` — `<p class="description">`
- `help_tip(string $tip)` — `?` icon with hover tooltip
- `toggle(array $args)` — Gutenberg-style switch
- `submit(string $children_html)` — `<p class="submit">` wrapper

### Navigation
- `nav_tabs(array $tabs)` — `[['label' => …, 'href' => …, 'active' => true], …]`
- `subsubsub(array $items)` — status filter row

### Layout
- `wrap(string $inner_html)`, `page_header(string $title, array $args)`
- `two_column(string $main_html, string $sidebar_html)`
- `screen_options(string $children_html, bool $open = false)`
- `help_tabs(array $tabs, ?string $active_id = null)`

### Data display
- `postbox(string $title, string $inside_html)`
- `welcome_panel(array $args)`
- `stat_card(array $args)` — `label`, `value`, `delta`, `trend` (`up` / `down`)
- `activity_item(array $args)`

### Tables
- `list_table(string $inner_html, array $args)`, `row_actions(array $actions)`
- `bulk_actions(array $actions, array $args)`
- `search_box(array $args)`, `pagination(array $args)`
- `empty_state(array $args)`

### Feedback
- `status_badge(string $label, string $variant)` — `active` / `error` / `warning` / `info` / `neutral`
- `spinner(bool $active = true)`
- `pointer(array $args)`, `skeleton(string $variant)`

### Asset enqueue
- `Assets::enqueue_cdn()` — loads the Plugin SDK bundle from `https://cdn.wp-admincss.com/css/latest.css`
- `Assets::enqueue_local(string $url)` — loads the Plugin SDK bundle from a URL you control
- `Assets::enqueue_dashicons()` — calls `wp_enqueue_style('dashicons')`. Prefer this over the bundled CSS when inside WordPress; avoids the external CDN request.

## Example

See [examples/settings-page.php](examples/settings-page.php) for a complete plugin admin page demonstrating most components.

## Security

The declarative runtime bakes in capability checks (via `current_user_can`), nonce verification (settings forms use WP's `options.php` round-trip), and per-field sanitisation. REST routes run JSON-schema validation before the handler executes — a malformed body is rejected with a `rest_invalid_body` 400 response, never reaching your code.

Every render helper accepting user-controllable strings (label, title, message, URL, attribute value) runs them through `esc_html()` / `esc_attr()` / `esc_url()` (with safe fallbacks when WordPress functions aren't loaded). Methods that take pre-rendered HTML (e.g. `notice()` with `$message_html`) are documented as such — escape inputs yourself with `\PluginSDK\WP\Html::esc()` if they're user-controllable.

## Tests

Zero-dep PHP test harness — no PHPUnit needed:

```bash
composer test
# or directly:
php tests/run.php
```

Tests run against WP-function stubs that capture invocations, so the runtime can be unit-tested without WordPress installed.

## License

Dual-licensed: **Apache 2.0 OR GPL-2.0-or-later**, your choice. Plugins headed for the WordPress.org directory should elect the GPL branch (the directory requires GPLv2-or-later compatibility for everything in the zip; Apache 2.0 alone is only GPLv3-compatible). See [LICENSE](./LICENSE) (Apache) and [LICENSE-GPL2](./LICENSE-GPL2) in this package.
