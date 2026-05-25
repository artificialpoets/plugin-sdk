<?php
/**
 * Activation / deactivation hooks. Uninstall lives in /uninstall.php.
 */

declare(strict_types=1);

namespace PluginSDK\Starter;

final class Lifecycle {

    /** Called once when the user activates the plugin. */
    public static function activate(): void {
        // Create custom tables.
        \PluginSDK\Starter\Database\Schema::install();
        update_option('psdk_db_version', PSDK_VERSION);

        // Seed default settings (only if they don't already exist).
        if (get_option('wpacs_settings') === false) {
            update_option('wpacs_settings', [
                'api_key'      => '',
                'mode'         => 'production',
                'notifications' => true,
            ]);
        }
    }

    /** Called when the user deactivates the plugin (NOT deletes). */
    public static function deactivate(): void {
        // Clear scheduled crons and transients.
        wp_clear_scheduled_hook('wpacs_daily_sync');
        delete_transient('wpacs_remote_status');
    }
}
