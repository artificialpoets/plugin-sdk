# Database — `$wpdb` and custom tables

> Load this skill when working on: custom SQL queries, schema migrations, or any direct database access.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/database.md`

WordPress provides three layers for data access. Use them in this order of preference:

1. **High-level API** — `update_option`, `get_post_meta`, `update_user_meta`, `WP_Query`, `WP_User_Query` etc. Use these when the data fits the WP model.
2. **`$wpdb` query helpers** — `get_results`, `get_var`, `insert`, `update`, `delete`, `replace`. Use these for custom tables when the high-level API doesn't fit.
3. **Raw `$wpdb->query()` / `prepare()`** — last resort for complex queries (joins, aggregations, transactions). Use only with `prepare()`.

See [`skills/data-modeling.md`](./data-modeling.md) for choosing where to store data (option vs meta vs custom table).

## Schema management — Plugin SDK Migration

For creating + evolving **custom tables**, Plugin SDK provides a `Migration` class that wraps `dbDelta` with the right quirks (two-space `PRIMARY KEY  (col)`, `KEY` not `INDEX`) and gates execution on a version-stamped option so reactivations are no-ops.

### Declarative (preferred): `plugin-sdk.json`

Add a `database.tables[]` entry to your manifest:

```json
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
```

`Plugin::fromManifest()` registers an activation hook that runs `dbDelta` over each table. Bump the manifest's `version` to trigger a re-run. See [`plugin-manifest.md`](./plugin-manifest.md) for the full schema.

### Fluent: `Migration` + `Table`

When the manifest doesn't fit:

```php
use PluginSDK\WP\Migration;
use PluginSDK\WP\Migration\Table;

$migration = (new Migration('acme_db_version', '0.1.0', 'acme_'))
    ->addTable(new Table('submissions', [
        ['name' => 'id',         'type' => 'BIGINT UNSIGNED', 'primary' => true, 'autoIncrement' => true],
        ['name' => 'email',      'type' => 'VARCHAR(255)', 'notNull' => true],
        ['name' => 'created_at', 'type' => 'DATETIME', 'notNull' => true, 'default' => 'CURRENT_TIMESTAMP'],
    ]));

register_activation_hook(__FILE__, [$migration, 'run']);
```

The rest of this skill teaches **the primitives** for everything beyond schema creation — querying, prepared statements, transactions, etc.

---

## `$wpdb` quickref

`$wpdb` is a global instance of `wpdb` class. Inside a function, declare it as global:

```php
global $wpdb;
```

### Common helpers

| Method | Returns | Use for |
|---|---|---|
| `$wpdb->get_var($sql)` | A single scalar | `COUNT(*)`, `MAX(id)`, single-cell lookups |
| `$wpdb->get_row($sql)` | A single row as object (or `ARRAY_A` for assoc array) | Find one record |
| `$wpdb->get_results($sql)` | Array of rows | Find many records |
| `$wpdb->get_col($sql)` | Array of values from one column | List of IDs/names |
| `$wpdb->insert($table, $data, $format)` | Rows affected (1 or `false`) | INSERT a row |
| `$wpdb->update($table, $data, $where, $format, $where_format)` | Rows affected | UPDATE rows |
| `$wpdb->delete($table, $where, $where_format)` | Rows affected | DELETE rows |
| `$wpdb->replace($table, $data, $format)` | Rows affected | INSERT-or-UPDATE |
| `$wpdb->query($sql)` | Rows affected | Any other SQL (DDL, multi-row INSERT, etc.) |

`$format` is an array of `%s`/`%d`/`%f` matching each value's type. It activates auto-escaping.

### Examples

```php
global $wpdb;
$table = $wpdb->prefix . 'my_events';

// COUNT
$count = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM $table WHERE user_id = %d", $user_id
));

// One row
$row = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM $table WHERE id = %d", $event_id
));

// Many rows with pagination
$rows = $wpdb->get_results($wpdb->prepare(
    "SELECT id, name, created_at FROM $table
     WHERE status = %s
     ORDER BY created_at DESC
     LIMIT %d OFFSET %d",
    $status, $per_page, ($page - 1) * $per_page
));

// INSERT with formats (no need for prepare on this helper)
$wpdb->insert(
    $table,
    [
        'user_id'    => $user_id,
        'name'       => sanitize_text_field($name),
        'status'     => 'active',
        'created_at' => current_time('mysql'),
    ],
    ['%d', '%s', '%s', '%s']
);
$new_id = $wpdb->insert_id;

// UPDATE
$wpdb->update(
    $table,
    ['status' => 'archived'],            // SET clause
    ['id' => $event_id],                  // WHERE clause
    ['%s'],                               // SET formats
    ['%d']                                // WHERE formats
);

// DELETE
$wpdb->delete($table, ['id' => $event_id], ['%d']);
```

### Always use prepare() for raw query()

```php
// ❌ NEVER
$wpdb->query("DELETE FROM $table WHERE created_at < '" . $cutoff . "'");

// ✅ ALWAYS
$wpdb->query($wpdb->prepare(
    "DELETE FROM $table WHERE created_at < %s",
    $cutoff
));
```

### Error handling

```php
$result = $wpdb->insert($table, $data, $formats);
if ($result === false) {
    // $wpdb->last_error contains the MySQL error message
    error_log('My Plugin DB insert failed: ' . $wpdb->last_error);
    return new WP_Error('db_error', 'Could not save', ['status' => 500]);
}
```

By default, `$wpdb` does NOT throw on error — it returns `false` from helpers. Always check.

### Transactions

```php
$wpdb->query('START TRANSACTION');
try {
    $wpdb->insert($events_table, $event_data, ['%d', '%s']);
    $event_id = $wpdb->insert_id;
    $wpdb->insert($actions_table, ['event_id' => $event_id, ...], ['%d']);
    $wpdb->query('COMMIT');
} catch (\Throwable $e) {
    $wpdb->query('ROLLBACK');
    throw $e;
}
```

Note: transactions only work on InnoDB tables. The WP core tables (`wp_posts`, `wp_options`, etc.) are InnoDB on modern installs, but verify before relying on them.

---

## Custom tables — schema and migrations

Use `dbDelta` for table creation. It diffs your CREATE TABLE statement against the current schema and applies missing pieces. Safe to run repeatedly.

### Schema definition

```php
function my_plugin_install_schema(): void {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();
    $table = $wpdb->prefix . 'my_events';

    // dbDelta is picky about formatting. Follow these rules:
    //   - Two spaces between PRIMARY KEY and its definition.
    //   - One space between PRIMARY/UNIQUE/KEY and the column name.
    //   - No backticks around column names in the CREATE TABLE statement.
    //   - Each field on its own line.
    $sql = "CREATE TABLE $table (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(191) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        payload LONGTEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL,
        PRIMARY KEY  (id),
        KEY user_id (user_id),
        KEY status_created (status, created_at)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
}
```

### When to run it

1. **Plugin activation:**

   ```php
   register_activation_hook(__FILE__, 'my_plugin_install_schema');
   ```

2. **Version bumps (for live updates):** check a stored version, run migrations if it changed.

   ```php
   add_action('plugins_loaded', function() {
       $current = get_option('my_plugin_db_version');
       if ($current !== '1.2.0') {
           my_plugin_install_schema();           // dbDelta is idempotent
           my_plugin_migrate_to_1_2_0();          // any data backfill
           update_option('my_plugin_db_version', '1.2.0');
       }
   });
   ```

3. **For multisite (network-activated plugin):** loop over sites:

   ```php
   register_activation_hook(__FILE__, function($network_wide) {
       if ($network_wide && is_multisite()) {
           foreach (get_sites(['fields' => 'ids']) as $site_id) {
               switch_to_blog($site_id);
               my_plugin_install_schema();
               restore_current_blog();
           }
       } else {
           my_plugin_install_schema();
       }
   });
   ```

### Column lengths

- Use `VARCHAR(191)` for indexed string columns. With `utf8mb4`, the InnoDB index byte limit (767 bytes pre-MySQL 5.7) caps indexed varchars at 191 chars. Going higher risks the dreaded `Specified key was too long` error on older MySQL.
- Use `LONGTEXT` for JSON or large payloads. `TEXT` (65KB max) is rarely enough.
- Use `BIGINT UNSIGNED` for IDs (matches `$wpdb->posts.ID` etc.).
- Use `DATETIME` for timestamps (UTC strings via `current_time('mysql', true)` or local via `current_time('mysql')`).

### Indexes

- Add a `KEY` (index) on any column you query by frequently (`WHERE`, `ORDER BY`).
- Multi-column indexes for compound conditions: `KEY status_created (status, created_at)` accelerates `WHERE status = ? ORDER BY created_at`.
- Don't over-index — each index slows writes.

---

## Uninstall

When the plugin is deleted (NOT just deactivated), clean up the data.

Create `uninstall.php` in the plugin root. WordPress runs it automatically on deletion:

```php
<?php
// uninstall.php
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

// Drop custom tables
$wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}my_events");

// Delete options
delete_option('my_plugin_settings');
delete_option('my_plugin_db_version');

// For multisite: iterate sites
if (is_multisite()) {
    foreach (get_sites(['fields' => 'ids']) as $site_id) {
        switch_to_blog($site_id);
        delete_option('my_plugin_settings');
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}my_events");
        restore_current_blog();
    }
    delete_site_option('my_plugin_network_settings');
}
```

Alternatively, register `register_uninstall_hook(__FILE__, 'callback')` — but `uninstall.php` is more reliable (works even if the plugin's main file errors).

---

## Performance hygiene

### Cache expensive queries

```php
function my_plugin_event_counts(): array {
    $cache_key = 'my_plugin_event_counts';
    $cached = wp_cache_get($cache_key);
    if ($cached !== false) return $cached;

    global $wpdb;
    $rows = $wpdb->get_results(
        "SELECT status, COUNT(*) AS n FROM {$wpdb->prefix}my_events GROUP BY status"
    );
    $counts = wp_list_pluck($rows, 'n', 'status');
    wp_cache_set($cache_key, $counts, '', 300);  // 5 min
    return $counts;
}

// Invalidate on writes:
function my_plugin_invalidate_event_counts(): void {
    wp_cache_delete('my_plugin_event_counts');
}
```

For longer-lived caches (database-persisted), use `set_transient()` / `get_transient()`.

### Bulk operations

For inserting many rows at once, build one multi-row INSERT instead of looping `$wpdb->insert()`:

```php
$values = [];
$placeholders = [];
foreach ($rows as $row) {
    $values[] = $row['user_id'];
    $values[] = sanitize_text_field($row['name']);
    $placeholders[] = '(%d, %s, NOW())';
}

if ($placeholders) {
    $sql = "INSERT INTO {$wpdb->prefix}my_events (user_id, name, created_at) VALUES "
         . implode(', ', $placeholders);
    $wpdb->query($wpdb->prepare($sql, ...$values));
}
```

### Don't `SELECT *`

Pick the columns you need. Reduces row size, helps query plan.

---

## Common AI mistakes

- **Forgetting `prepare()` for "trusted" inputs.** Even an admin-supplied value should be prepared. Defense in depth.
- **Backticks around column names in `dbDelta()`.** dbDelta breaks if you backtick. Remove them.
- **Single space instead of two before `(id)` in `PRIMARY KEY`.** dbDelta's parser is fragile here.
- **Forgetting `$charset_collate`.** Causes mojibake on emoji + non-Latin text.
- **`$wpdb->prefix` confusion.** Always concatenate it: `$wpdb->prefix . 'my_table'`. Not `'wp_my_table'` (the prefix may be customized).
- **`SELECT *` then accessing fields the user doesn't know about.** Causes notices when the schema changes.
- **No error handling on `$wpdb->insert()`.** It returns `false`, not throws.
- **Index on `TEXT` / `LONGTEXT`.** Doesn't work without a prefix length and breaks on `utf8mb4`. Use `VARCHAR(191)` if you need to index.

When in doubt, run [Query Monitor](https://wordpress.org/plugins/query-monitor/) — it inspects every query the plugin runs and surfaces unprepared queries, slow queries, and N+1 patterns.
