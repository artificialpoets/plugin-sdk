# Data modeling — where to store plugin data

> Load this skill when: deciding where new plugin data should live.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/data-modeling.md`

WordPress gives you five places to put data. Picking wrong leads to performance pain, ugly schemas, or data loss on uninstall. Pick right and the rest of the framework cooperates with you.

## Decision tree

```
Is the data one-off site-wide configuration (API keys, feature flags)?
└─ Yes → Options API: update_option() / get_option()

Does the data attach to a specific post, page, or CPT?
└─ Yes → Post Meta: update_post_meta() / get_post_meta()

Does the data attach to a specific user?
└─ Yes → User Meta: update_user_meta() / get_user_meta()

Does the data attach to a term (category, tag, taxonomy)?
└─ Yes → Term Meta: update_term_meta() / get_term_meta()

Is the data your own entity (events, log lines, subscriptions, transactions)?
└─ Yes → Custom Table (with $wpdb + dbDelta) — see skills/database.md

Is the data short-lived (cache, rate-limit counters, OAuth tokens)?
└─ Yes → Transients API: set_transient() / get_transient()
```

The full reasoning for each:

---

## 1. Options API — site-wide settings

Use for: API keys, plugin settings, feature flags, license info, schema version.

```php
// Save
update_option('my_plugin_settings', [
    'api_key' => $key,
    'mode'    => 'production',
]);

// Read
$settings = get_option('my_plugin_settings', [
    'api_key' => '',
    'mode'    => 'production',  // sensible default
]);

// Delete
delete_option('my_plugin_settings');
```

### `autoload` matters

By default, options are auto-loaded on every page. That's fine for small settings (a few KB) but disastrous for large arrays or rarely-accessed data.

```php
// Big or rarely-needed option — don't autoload
update_option('my_plugin_audit_log', $big_array, /* autoload */ 'no');

// Or, for new options (WP 4.2+):
add_option('my_plugin_audit_log', $big_array, '', 'no');
```

Check the `wp_options` table — if your option appears with `autoload = yes` and is > 1 KB, change it.

### Rule of thumb

- ✅ Use `update_option` for: < 50 KB, accessed often, site-wide
- ❌ Don't use for: per-user data, per-post data, time-series data, anything that grows unboundedly

---

## 2. Post Meta — data attached to posts

Use for: SEO fields, gallery configs, custom block attributes that need queryability, anything per-post.

```php
// Save
update_post_meta($post_id, '_my_plugin_featured_score', 42);
update_post_meta($post_id, '_my_plugin_config', ['mode' => 'preview']);  // serialized

// Read
$score  = get_post_meta($post_id, '_my_plugin_featured_score', /* single */ true);
$config = get_post_meta($post_id, '_my_plugin_config', true);
```

### The underscore prefix

Meta keys starting with `_` are **hidden** from the "Custom Fields" UI in the post editor. Use `_` for internal plugin data; omit it if you want users to edit the values via the Custom Fields metabox.

### Querying by meta

```php
// Built-in — use sparingly, meta queries are slow at scale
$query = new WP_Query([
    'post_type' => 'post',
    'meta_query' => [[
        'key'     => '_my_plugin_featured_score',
        'value'   => 50,
        'compare' => '>=',
        'type'    => 'NUMERIC',
    ]],
]);
```

### Watch out

- ⚠ **`get_post_meta()` returns an array by default** unless you pass `true` as the third arg. Forgetting `true` causes `$meta[0]` indexing confusion.
- ⚠ **Arrays get serialized** by WP. Cheap for small data, painful for searching/filtering.
- ⚠ **Performance at scale** — meta queries hit the `wp_postmeta` table with LIKE-ish filters. For high-volume reporting, copy data into a custom table.

---

## 3. User Meta — data attached to users

Use for: per-user preferences (column visibility, dashboard widgets), notification settings, dismissed admin notices.

```php
update_user_meta($user_id, 'my_plugin_dismissed_welcome', '1');
$dismissed = get_user_meta($user_id, 'my_plugin_dismissed_welcome', true);
```

### Built-in meta keys you can use

| Key | Purpose |
|---|---|
| `wp_capabilities` | User's roles. Don't modify directly — use `add_role()` / `remove_role()`. |
| `wp_user_level` | Legacy capability level. Read-only — modern code uses capabilities. |
| `description` | Bio. Editable in profile. |
| `nickname` / `first_name` / `last_name` | Profile fields. |

For **dismissed admin notices**:

```php
// Show notice
add_action('admin_notices', function() {
    if (get_user_meta(get_current_user_id(), 'my_plugin_dismissed_v2_intro', true)) {
        return;  // already dismissed
    }
    echo '<div class="notice notice-info is-dismissible" data-notice="v2_intro">
            <p>Welcome to v2!</p>
          </div>';
});

// Persist dismissal via REST
register_rest_route('my-plugin/v1', '/dismiss-notice', [
    'methods'  => 'POST',
    'callback' => function($req) {
        update_user_meta(
            get_current_user_id(),
            'my_plugin_dismissed_' . sanitize_key($req->get_param('key')),
            '1'
        );
        return ['ok' => true];
    },
    'permission_callback' => function() { return is_user_logged_in(); },
]);
```

---

## 4. Term Meta — data attached to taxonomies

Use for: per-category headers/colors, per-tag landing-page content. Rarer than post meta.

```php
update_term_meta($term_id, 'my_plugin_color', '#7c3aed');
$color = get_term_meta($term_id, 'my_plugin_color', true);
```

---

## 5. Custom tables — your own entities

Use for: things that aren't WordPress posts. Logs, events, subscriptions, line items, time-series.

**Decision: when to use a custom table**

- You have > 1,000 rows AND query them with non-trivial WHERE clauses → **custom table**.
- You need atomic counters (`updated_at`, increments) → **custom table**.
- The data is per-post, per-user, per-term in a clean 1:1 → **meta**.
- The data is your own domain object (Event, Subscription, Transaction, Webhook) → **custom table**.

See [`skills/database.md`](./database.md) for the `dbDelta` schema patterns, query helpers, and uninstall cleanup.

### Naming convention

```
$wpdb->prefix . 'my_plugin_events'
$wpdb->prefix . 'my_plugin_subscriptions'
```

Always prefix with your plugin slug to avoid collisions.

---

## 6. Transients — short-lived cached data

Use for: caches, rate-limit counters, OAuth state, anything that can rebuild from source.

```php
// Cache an API response for 15 minutes
$key = 'my_plugin_remote_data_' . md5($url);
$data = get_transient($key);
if ($data === false) {
    $data = remote_fetch($url);
    set_transient($key, $data, 15 * MINUTE_IN_SECONDS);
}

// Delete on relevant events
delete_transient('my_plugin_remote_data_*');  // doesn't support wildcards — track keys manually
```

### Transients vs object cache

- On sites WITHOUT a persistent object cache (most shared hosting), transients live in `wp_options` with an expiry. Reads hit the DB.
- On sites WITH a persistent object cache (Redis, Memcached), transients live there. Reads are in-memory.

Either way, the API is the same. Just be aware that "transients" don't always behave like RAM caches.

### Time constants

```php
MINUTE_IN_SECONDS
HOUR_IN_SECONDS
DAY_IN_SECONDS
WEEK_IN_SECONDS
MONTH_IN_SECONDS
YEAR_IN_SECONDS
```

---

## Custom Post Types — when to use one

A Custom Post Type (CPT) is sometimes the right "data layer" — it gives you a CRUD UI for free (the standard Posts list page), revisions, autosave, the REST API, and WP_Query.

Use a CPT when:
- The data is content-shaped (title + body + author + date).
- You want the standard WP admin UX for managing it.
- You need taxonomies attached.

Use a custom table instead when:
- The data is high-volume (millions of rows).
- The "title + body + meta" shape is a poor fit (e.g. timestamp + numeric value).
- You'll query with complex WHERE/aggregations.

```php
add_action('init', function() {
    register_post_type('my_event', [
        'label'         => __('Events', 'my-plugin'),
        'public'        => false,            // hide from public site
        'show_ui'       => true,             // but show in admin
        'show_in_menu'  => 'my-plugin',      // nest under your plugin menu
        'supports'      => ['title', 'editor', 'custom-fields'],
        'capability_type' => 'post',
        'show_in_rest'  => true,             // expose to Gutenberg + REST
    ]);
});
```

---

## Anti-patterns

- **Auto-loaded big options.** Causes every page to load megabytes from the DB.
- **Storing serialized arrays in `update_option` and then querying inside them.** PHP can't index into a serialized blob. Refactor to a custom table.
- **Per-user data in `update_option`.** Use user meta instead.
- **Log lines / audit events in post meta.** Use a custom table.
- **Caching forever with no invalidation.** Always set an expiry OR explicitly delete on writes.
- **Not cleaning up on uninstall.** Required for plugin directory submission. See [`skills/database.md`](./database.md) for the `uninstall.php` pattern.

---

## Multisite considerations

If your plugin can be **network-activated** on a multisite installation:

- Site-specific data goes in `update_option` (writes to current site's `wp_options`).
- Network-wide data goes in `update_site_option` (writes to `wp_sitemeta`).
- Custom tables: decide whether to create one table per site (use `$wpdb->prefix`) or a shared network table (use `$wpdb->base_prefix`).
- On uninstall, loop over `get_sites()` and clean each.

```php
// Per-site
update_option('my_plugin_setting', $value);

// Network-wide
update_site_option('my_plugin_license', $value);
```
