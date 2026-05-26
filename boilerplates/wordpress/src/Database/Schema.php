<?php
/**
 * Custom table schema. Run on activation + on version-bump migrations.
 */

declare(strict_types=1);

namespace PluginSDK\Starter\Database;

final class Schema {

    /** Run dbDelta to create/update the custom tables. Safe to run repeatedly. */
    public static function install(): void {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $events_table    = $wpdb->prefix . 'plugin_sdk_starter_events';

        // dbDelta is picky:
        //   • Two spaces between PRIMARY KEY and (id)
        //   • One space between KEY and the column name
        //   • No backticks around column names
        //   • Each field on its own line
        $sql = "CREATE TABLE $events_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            payload LONGTEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at DATETIME NOT NULL,
            updated_at DATETIME NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY status_created (status, created_at),
            KEY event_type (event_type)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }

    /** The fully-qualified table name (with the site's prefix). */
    public static function events_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'plugin_sdk_starter_events';
    }
}
