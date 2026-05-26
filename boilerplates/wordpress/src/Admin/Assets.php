<?php
/**
 * Enqueue plugin admin CSS and JS.
 */

declare(strict_types=1);

namespace PluginSDK\Starter\Admin;

final class Assets {

    public function register(): void {
        // Nothing to wire at boot — Menu calls enqueue_for_page() on its hook.
    }

    /** Called only on our plugin's admin page (wired in Menu::add_pages). */
    public static function enqueue_for_page(): void {
        // The CSS library — pulled from the official CDN.
        wp_enqueue_style(
            'wp-admincss',
            'https://cdn.wp-admincss.com/css/latest.css',
            [],
            null  // CDN URL is already versioned; skip the ?ver= query string
        );

        // Your plugin's own CSS overrides (only the brand tokens you care about).
        wp_enqueue_style(
            'psdk-admin',
            PSDK_URL . 'assets/admin.css',
            ['wp-admincss'],
            PSDK_VERSION
        );

        // Expose nonce + REST URL to client JS.
        wp_register_script('psdk-admin', '', ['wp-api-fetch'], PSDK_VERSION, true);
        wp_add_inline_script(
            'psdk-admin',
            'window.pluginSdkStarter = ' . wp_json_encode([
                'restUrl' => esc_url_raw(rest_url('plugin-sdk-starter/v1/')),
                'nonce'   => wp_create_nonce('wp_rest'),
            ]) . ';',
            'before'
        );
        wp_enqueue_script('psdk-admin');
    }
}
