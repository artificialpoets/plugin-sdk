<?php
/**
 * Plugin Name:       Plugin SDK Starter
 * Description:       Greenfield plugin scaffold using Plugin SDK. Rename this file + composer.json + namespace + plugin-sdk.json to start your own plugin.
 * Version:           0.1.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Your Name
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * Text Domain:       plugin-sdk-starter
 * Domain Path:       /languages
 *
 * The Plugin/Author homepage headers are intentionally omitted. wp.org's
 * review fetches any URL declared here and fails the plugin if it does not
 * resolve, so shipping a placeholder or dead link is worse than shipping
 * none. Add the "Plugin URI" and "Author URI" header fields yourself once
 * you have a live homepage that resolves.
 */

declare(strict_types=1);

defined('ABSPATH') || exit;

define('PSDK_VERSION', '0.1.0');
define('PSDK_FILE', __FILE__);
define('PSDK_DIR', plugin_dir_path(__FILE__));
define('PSDK_URL', plugin_dir_url(__FILE__));

// Composer autoload — required for PSR-4 classes + Plugin SDK PHP helpers.
if (file_exists(PSDK_DIR . 'vendor/autoload.php')) {
    require_once PSDK_DIR . 'vendor/autoload.php';
} else {
    add_action('admin_notices', static function() {
        echo '<div class="notice notice-error"><p>';
        echo esc_html__('Plugin SDK Starter: run `composer install` in the plugin folder before activating.', 'plugin-sdk-starter');
        echo '</p></div>';
    });
    return;
}

/*
 * Boot the SDK runtime.
 *
 * The single call below reads plugin-sdk.json and:
 *   1. Registers the settings page declared in `settings.page`
 *      (with the right capability + nonce verification baked in).
 *   2. Wires up REST routes declared in `rest.routes` — each route runs
 *      through cap check + JSON-schema body validation before the
 *      handler executes.
 *   3. Registers an activation hook that runs dbDelta over every table
 *      in `database.tables`, gated on a version-stamped option so
 *      reactivations don't re-run unchanged migrations.
 *
 * Edit plugin-sdk.json to change shape; edit src/REST/Submissions.php
 * (and friends) to change behaviour. The plugin's own PHP code stays
 * focused on business logic.
 */
add_action('plugins_loaded', static function() {
    \PluginSDK\WP\Plugin::fromManifest(PSDK_DIR . 'plugin-sdk.json', PSDK_FILE)
        ->withRestHandler(
            'PluginSDK\\Starter\\REST\\Submissions::create',
            [\PluginSDK\Starter\REST\Submissions::class, 'create']
        )
        ->boot();

    // The starter's own bespoke logic (lifecycle hooks, custom assets,
    // anything beyond the manifest) still goes through the Plugin class.
    (new \PluginSDK\Starter\Plugin())->boot();
});

// Lifecycle hooks at the top level (NOT inside plugins_loaded).
register_activation_hook(__FILE__,   ['\PluginSDK\Starter\Lifecycle', 'activate']);
register_deactivation_hook(__FILE__, ['\PluginSDK\Starter\Lifecycle', 'deactivate']);

/* === PUC:BEGIN === */
/*
 * Self-hosted update checker — Plugin Update Checker by yahnis-elsts.
 *
 * When the plugin is distributed via GitHub releases (instead of, or
 * alongside, the WordPress.org Plugin Directory), PUC reads update
 * metadata from the GH release page so subscribers see updates in
 * their Dashboard. The marker file `.use-github-updates` is written
 * into the dist by `bin/build.sh github`; wp.org-flavoured dists do
 * not contain it, so the same source plays nicely with both channels.
 *
 * Channel patches at scaffold time:
 *   - wp.org-only  → the entire PUC:BEGIN/PUC:END block is removed.
 *   - github-only  → `file_exists(...)` is replaced with `true` so PUC
 *                    always runs (no marker required).
 *   - dual         → block stays exactly as written below; the marker
 *                    file in the dist switches PUC on or off.
 *
 * Replace the GitHub URL below with your actual repo when releasing.
 */
if (
    file_exists(PSDK_DIR . '.use-github-updates')
    && class_exists(\YahnisElsts\PluginUpdateChecker\v5\PucFactory::class)
) {
    \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/your-org/plugin-sdk-starter/',
        PSDK_FILE,
        'plugin-sdk-starter'
    );
}
/* === PUC:END === */
