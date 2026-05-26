<?php
/**
 * Uninstall routine for Plugin SDK Starter.
 *
 * Runs when the user clicks "Delete" on the plugin (not on deactivate).
 * Removes options, transients, and custom tables so the site is fully
 * clean after uninstall.
 *
 * Required for WordPress.org plugin directory submission.
 */

declare(strict_types=1);

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

$drop_table = static function ( string $name ) use ( $wpdb ): void {
    $table = $wpdb->prefix . $name;
    // Defence in depth: the input is hard-coded in cleanup_site() but we
    // still validate before interpolating into the DDL statement.
    if ( ! preg_match( '/^[a-zA-Z0-9_]+$/', $table ) ) {
        return;
    }
    // DROP TABLE has no higher-level WP wrapper. Uninstall is a one-shot
    // administrative action, so caching does not apply.
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
    $wpdb->query( "DROP TABLE IF EXISTS {$table}" );
};

$cleanup_site = static function () use ( $drop_table ): void {
    delete_option( 'plugin_sdk_starter_settings' );
    delete_option( 'psdk_db_version' );
    delete_transient( 'plugin_sdk_starter_remote_status' );
    $drop_table( 'plugin_sdk_starter_events' );
};

if ( is_multisite() ) {
    foreach ( get_sites( array( 'fields' => 'ids' ) ) as $site_id ) {
        switch_to_blog( $site_id );
        $cleanup_site();
        restore_current_blog();
    }
    delete_site_option( 'plugin_sdk_starter_network_settings' );
} else {
    $cleanup_site();
}
