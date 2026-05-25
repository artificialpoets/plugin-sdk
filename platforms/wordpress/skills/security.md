# Security — WordPress plugin essentials

> Load this skill when working on: any form, AJAX endpoint, REST route, cookie/header read, or state-changing action.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/security.md`

WordPress security comes down to three layers. Every state-changing action must clear all three. **No exceptions.**

| Layer | What it answers | WP function |
|---|---|---|
| **Capability** | Is this user *allowed* to do this? | `current_user_can()` |
| **Nonce** | Did this request come from *our* form, not a forged one? | `wp_verify_nonce()` / `check_admin_referer()` |
| **Sanitization / escaping** | Is the data shape what we expect? | `sanitize_*` (in) / `esc_*` (out) |

If you skip any layer, the plugin has a vulnerability. AI agents skip these most often — make them muscle memory.

## What the Plugin SDK runtime handles for you

When a settings field or REST route is declared in `plugin-sdk.json`, the SDK enforces every layer above **before your handler runs**:

- **Settings page**: capability check at render time, nonce via WP's `options.php` round-trip, per-field type-aware sanitisation (`email` via `FILTER_VALIDATE_EMAIL`, `url` via `FILTER_VALIDATE_URL`, `text` strip-tagged, `select` whitelisted against its `options`, `number` clamped to `min`/`max`, etc.).
- **REST routes**: capability check in `permission_callback`, JSON-schema body validation before dispatch (`rest_invalid_body` 400 on failure), thrown-exception wrapping into `WP_Error` 500.

That covers the common case. The rest of this skill teaches **the primitives** — what the SDK is doing under the hood, plus how to handle the cases the manifest can't express (custom admin pages outside the Settings runtime, AJAX endpoints, file uploads, etc.). For the manifest-driven flow, also load [`plugin-manifest.md`](./plugin-manifest.md).

---

## 1. Capability check

> **The authorization boundary.** Always server-side. Never trust the client to enforce this.

```php
function my_plugin_save_settings(): void {
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have permission to do this.', 'my-plugin'), '', ['response' => 403]);
    }
    // …rest of handler
}
```

### Which capability to use

| If your endpoint... | Use |
|---|---|
| Manages site-wide settings | `manage_options` |
| Creates/edits posts | `edit_posts` |
| Edits OTHER users' posts | `edit_others_posts` |
| Deletes posts | `delete_posts` |
| Uploads files | `upload_files` |
| Activates plugins | `activate_plugins` |
| Edits users | `edit_users` |
| Anything else | The closest [built-in capability](https://wordpress.org/documentation/article/roles-and-capabilities/) |

**Custom capabilities** are fine for your own data:

```php
// Register on plugin activation
add_action('init', function() {
    $admin = get_role('administrator');
    $admin?->add_cap('manage_my_plugin_widgets');
});

// Use in handlers
if (!current_user_can('manage_my_plugin_widgets')) {
    wp_die('Forbidden', '', ['response' => 403]);
}
```

### Never check capabilities only on the client

```jsx
// ❌ Hiding a button in React is UX only — NOT a security boundary.
{userCanManage && <Button>Delete</Button>}
```

```php
// ✅ The server-side handler MUST still check.
function rest_delete_handler($request) {
    if (!current_user_can('manage_options')) {
        return new WP_Error('forbidden', 'Insufficient permissions', ['status' => 403]);
    }
    // …
}
```

---

## 2. Nonce (CSRF protection)

> **Verifies the request originated from your form/page.** Every state-changing request needs one.

### Forms

In the form template:

```php
<form method="post" action="">
    <?php wp_nonce_field('my_plugin_save_settings'); ?>
    <!-- …fields… -->
</form>
```

This emits two hidden inputs: `_wpnonce` (the token) and `_wp_http_referer` (the URL).

In the handler:

```php
if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'my_plugin_save_settings')) {
    wp_die(__('Invalid nonce.', 'my-plugin'), '', ['response' => 403]);
}
```

Or shorter — `check_admin_referer()` does the verification + admin-only check + automatic die:

```php
check_admin_referer('my_plugin_save_settings');
```

### AJAX / `admin-ajax.php`

```php
// In your enqueue:
wp_localize_script('my-plugin', 'myPluginData', [
    'ajaxUrl' => admin_url('admin-ajax.php'),
    'nonce'   => wp_create_nonce('my_plugin_ajax'),
]);

// Server handler:
add_action('wp_ajax_my_plugin_save', function() {
    check_ajax_referer('my_plugin_ajax');  // dies on failure
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'Forbidden'], 403);
    }
    // …
});
```

```js
// Client:
fetch(myPluginData.ajaxUrl, {
    method: 'POST',
    body: new URLSearchParams({
        action: 'my_plugin_save',
        _wpnonce: myPluginData.nonce,
        value: 'whatever'
    })
});
```

### REST API

```php
// In your enqueue:
wp_localize_script('my-plugin', 'myPluginData', [
    'restUrl' => esc_url_raw(rest_url('my-plugin/v1/')),
    'nonce'   => wp_create_nonce('wp_rest'),  // standard 'wp_rest' action
]);

// Server route — permission_callback IS the security check:
register_rest_route('my-plugin/v1', '/settings', [
    'methods' => 'POST',
    'callback' => 'my_plugin_rest_save',
    'permission_callback' => function() {
        return current_user_can('manage_options');
    },
]);
```

```js
// Client — wp.apiFetch (recommended) automatically includes the nonce
import apiFetch from '@wordpress/api-fetch';

apiFetch({
    path: '/my-plugin/v1/settings',
    method: 'POST',
    data: { value: 'whatever' }
});

// Or plain fetch:
fetch(myPluginData.restUrl + 'settings', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': myPluginData.nonce
    },
    body: JSON.stringify({ value: 'whatever' })
});
```

### Nonce lifetimes

Nonces are valid for ~24 hours by default. They are **NOT** unique per-request — they're tied to (action, user_id, session). Long-lived admin pages may need to refresh them with `wp_create_nonce()` periodically.

---

## 3. Sanitize on input, escape on output

> Sanitize untrusted data **as it enters your code**. Escape **as it leaves your code** (into HTML, attributes, URLs, or SQL).

### Input sanitization

| Input shape | Function |
|---|---|
| Single-line plain text | `sanitize_text_field()` |
| Multi-line plain text | `sanitize_textarea_field()` |
| Email | `sanitize_email()` |
| URL (for storage) | `esc_url_raw()` |
| Slug / key | `sanitize_key()` (lowercase + dashes only) |
| File name | `sanitize_file_name()` |
| HTML content (e.g. post body) | `wp_kses_post()` |
| HTML content (custom allowed tags) | `wp_kses($input, $allowed_html)` |
| Integer | `(int)` cast or `absint()` (forces positive) |
| Float | `(float)` cast |
| Boolean | `(bool)` cast (or `wp_validate_boolean()` for `"true"/"false"` strings) |
| Hex color | `sanitize_hex_color()` |
| One of a set | Validate against an `in_array()` allow-list |

```php
$mode = $_POST['mode'] ?? '';
if (!in_array($mode, ['production', 'sandbox'], true)) {
    $mode = 'production';  // safe default
}
```

### Output escaping

| Context | Function |
|---|---|
| Inside an HTML element | `esc_html()` |
| Inside an HTML attribute | `esc_attr()` |
| Inside an `href`/`src` URL | `esc_url()` |
| Inside a `<textarea>` | `esc_textarea()` |
| Inside JS (`<script>`) | `wp_json_encode()` (NOT `json_encode()`) |
| Translatable + escaped at once | `esc_html__()`, `esc_attr__()`, `esc_html_e()`, `esc_attr_e()` |

```php
// ✅ Always escape at the moment of output
echo '<a href="' . esc_url($url) . '" title="' . esc_attr($title) . '">'
   . esc_html($label) . '</a>';

// ✅ For translations
echo esc_html__('Settings saved.', 'my-plugin');
```

### `_e()` vs `__()` vs escaping

```php
// ❌ Translatable but UNESCAPED — DON'T do this with user-controllable strings
echo __('Hello %s', 'my-plugin');

// ✅ Use the escaped variants when output is HTML context
echo esc_html__('Hello %s', 'my-plugin');
```

---

## 4. SQL injection prevention

> Use `$wpdb->prepare()` for any custom SQL. The `prepare()` function is the WordPress equivalent of parameterized queries.

```php
global $wpdb;

// ❌ NEVER — concatenation
$wpdb->get_results("SELECT * FROM {$wpdb->users} WHERE user_login = '{$_POST['login']}'");

// ✅ ALWAYS — prepared
$wpdb->get_row($wpdb->prepare(
    "SELECT ID, user_login FROM {$wpdb->users} WHERE user_login = %s",
    sanitize_user($_POST['login'])
));
```

### Placeholder types

| Placeholder | Type |
|---|---|
| `%s` | String (auto-quoted) |
| `%d` | Integer |
| `%f` | Float |
| `%i` | Identifier (table/column name) — WP 6.2+ |

```php
// String + int
$wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}my_events WHERE user_id = %d AND status = %s",
    $user_id, $status
));

// Identifiers (table/column names) — WP 6.2+
$wpdb->get_results($wpdb->prepare(
    "SELECT * FROM %i WHERE %i = %s",
    $wpdb->prefix . 'my_table', 'name', 'John'
));
```

### `IN (...)` clauses

Build the placeholder list dynamically to keep things prepared:

```php
$ids = [1, 5, 8, 12];
$placeholders = implode(', ', array_fill(0, count($ids), '%d'));
$query = "SELECT * FROM {$wpdb->posts} WHERE ID IN ($placeholders)";
$results = $wpdb->get_results($wpdb->prepare($query, ...$ids));
```

### `LIKE` queries

`$wpdb->esc_like()` first, then prepare:

```php
$search = $wpdb->esc_like($_GET['s']);
$wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$wpdb->posts} WHERE post_title LIKE %s",
    '%' . $search . '%'
));
```

See [`skills/database.md`](./database.md) for more `$wpdb` patterns.

---

## 5. File uploads

> Use WordPress's media handler. Don't roll your own.

```php
if (!current_user_can('upload_files')) {
    wp_die('Forbidden', '', ['response' => 403]);
}
check_admin_referer('my_plugin_upload');

if (!function_exists('media_handle_upload')) {
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
}

$attachment_id = media_handle_upload('my_file', 0);
if (is_wp_error($attachment_id)) {
    wp_die($attachment_id->get_error_message());
}
```

`media_handle_upload()` validates MIME type, runs the WordPress upload filters, generates thumbnails, and saves an attachment post — all the things you'd otherwise have to do (and probably get wrong).

### Restrict to a MIME-type set

```php
add_filter('upload_mimes', function($mimes) {
    return ['jpg|jpeg' => 'image/jpeg', 'png' => 'image/png'];
});  // remove others
```

---

## 6. Audit checklist

Before declaring a plugin admin page "done", walk through this list:

- [ ] Every form has `wp_nonce_field()` + handler has `wp_verify_nonce()` / `check_admin_referer()`.
- [ ] Every state-changing handler has `current_user_can()`.
- [ ] Every `$_GET` / `$_POST` / `$_COOKIE` / `$_SERVER` value is sanitized before use.
- [ ] Every output of a variable is escaped (`esc_html`, `esc_attr`, `esc_url`).
- [ ] Every custom SQL query uses `$wpdb->prepare()`.
- [ ] Every REST route has a `permission_callback` (not just `__return_true`).
- [ ] Every AJAX handler calls `check_ajax_referer()` + capability check.
- [ ] No file paths constructed from user input without `realpath()` + `str_starts_with($real, ABSPATH)` validation.
- [ ] No `eval()`, no `system()`, no `shell_exec()`, no `file_get_contents()` on user-supplied URLs without explicit allow-listing.
- [ ] No client-side capability check is the only check. The server must re-verify.

### When in doubt — run Plugin Check

The [Plugin Check](https://wordpress.org/plugins/plugin-check/) plugin (made by Automattic) is the same scanner the WordPress.org review team runs on every submission. It catches missing nonces, unescaped output, unprepared SQL, and ~30 other security/quality issues automatically — with line numbers.

```bash
# Via WP-CLI
wp plugin install plugin-check --activate
wp plugin check my-plugin

# Or via Composer (for CI)
composer require --dev wordpress/plugin-check
vendor/bin/plugin-check check .
```

Run it before declaring a plugin done. Run it in CI on every PR. See [`skills/publishing.md`](./publishing.md) for the full pre-release procedure.
