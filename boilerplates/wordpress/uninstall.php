<?php
/**
 * Uninstall script — runs when the plugin is DELETED (not just deactivated).
 *
 * Removes all plugin data so the site is fully clean.
 * Required for WordPress.org plugin directory submission.
 */

declare(strict_types=1);

// WordPress sets this constant before requiring uninstall.php.
defined('WP_UNINSTALL_PLUGIN') || exit;

global $wpdb;

$drop_table = function(string $name) use ($wpdb): void {
    $table = $wpdb->prefix . $name;
    // %i (identifier placeholder) needs WP 6.2+; fall back to a sanity-check for older WP.
    if (preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
        $wpdb->query("DROP TABLE IF EXISTS $table");
    }
};

$cleanup_site = function() use ($drop_table): void {
    delete_option('wpacs_settings');
    delete_option('psdk_db_version');
    delete_transient('wpacs_remote_status');
    $drop_table('wpacs_events');
};

if (is_multisite()) {
    foreach (get_sites(['fields' => 'ids']) as $site_id) {
        switch_to_blog($site_id);
        $cleanup_site();
        restore_current_blog();
    }
    delete_site_option('wpacs_network_settings');
} else {
    $cleanup_site();
}
