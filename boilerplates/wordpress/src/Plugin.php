<?php
/**
 * Main plugin orchestrator.
 */

declare(strict_types=1);

namespace PluginSDK\Starter;

use PluginSDK\Starter\Admin\Assets;
use PluginSDK\Starter\Admin\Menu;
use PluginSDK\Starter\REST\SettingsController;

final class Plugin {
    public function boot(): void {
        // Load translations.
        load_plugin_textdomain(
            'plugin-sdk-starter',
            false,
            dirname(plugin_basename(PSDK_FILE)) . '/languages'
        );

        // Run pending DB migrations if the stored version is older than the code.
        $stored = (string) get_option('psdk_db_version', '0');
        if (version_compare($stored, PSDK_VERSION, '<')) {
            \PluginSDK\Starter\Database\Schema::install();
            update_option('psdk_db_version', PSDK_VERSION);
        }

        // Wire each subsystem.
        (new Menu())->register();
        (new Assets())->register();
        (new SettingsController())->register();
    }
}
