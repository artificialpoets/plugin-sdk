<?php
/**
 * Enqueues the Plugin SDK stylesheet on WordPress admin pages.
 *
 * Two strategies, depending on your distribution model:
 *
 *  - {@see Assets::enqueue_cdn()} pulls the latest published bundle from
 *    https://cdn.wp-admincss.com/css/latest.css. Easiest, but introduces an
 *    external dependency.
 *
 *  - {@see Assets::enqueue_local()} expects you to ship the CSS bundle with
 *    your plugin. Pass the URL where the bundle lives (typically
 *    plugins_url('vendor/plugin-sdk/wp/dist/wp-admin.css', __FILE__)).
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP;

final class Assets {

    /** @api */
    public const VERSION = '0.1.0-rc.1';
    /** @api */
    public const HANDLE  = 'plugin-sdk';
    /** @api */
    public const CDN_URL = 'https://cdn.wp-admincss.com/css/latest.css';

    /**
     * Register the Plugin SDK stylesheet from the official CDN.
     *
     * Call this from your plugin's `admin_enqueue_scripts` callback.
     *
     * @api
     */
    public static function enqueue_cdn(): void {
        if (function_exists('wp_enqueue_style')) {
            wp_enqueue_style(
                self::HANDLE,
                self::CDN_URL,
                [],
                self::VERSION
            );
        }
    }

    /**
     * Register the Plugin SDK stylesheet from a local URL you control.
     *
     * @api
     * @param string $url  The URL where the wp-admin.css bundle is served.
     */
    public static function enqueue_local(string $url): void {
        if (function_exists('wp_enqueue_style')) {
            wp_enqueue_style(
                self::HANDLE,
                $url,
                [],
                self::VERSION
            );
        }
    }

    /**
     * Enqueue WordPress's built-in dashicons stylesheet.
     *
     * Prefer this over loading dashicons via the @plugin-sdk/wp-core-css
     * bundle when running inside WordPress — it avoids the external CDN
     * request and reuses the version WP ships.
     *
     * @api
     */
    public static function enqueue_dashicons(): void {
        if (function_exists('wp_enqueue_style')) {
            wp_enqueue_style('dashicons');
        }
    }
}
