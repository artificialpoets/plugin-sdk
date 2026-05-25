<?php
/**
 * Dashicon — renders a WordPress Dashicon (icon font shipped with WP core).
 *
 * Inside a WordPress plugin, call PluginSDK\WP\Assets::enqueue_dashicons()
 * once during admin_enqueue_scripts so the icon font is loaded. Outside
 * WordPress (e.g. a docs site), the CSS bundle in @plugin-sdk/wp-core-css
 * pulls the dashicons stylesheet from WordPress's CDN automatically.
 *
 * Browse the catalog: https://developer.wordpress.org/resource/dashicons/
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Dashicon {

    /**
     * @param string $icon  The icon name, with or without the "dashicons-" prefix
     *                      (e.g. "admin-users" or "dashicons-admin-users").
     * @param array<string, mixed> $args {
     *     @var string $size   'small' | 'large' — adjusts to 16px / 28px (default 20px).
     *     @var string $class  Extra class names.
     *     @var array  $attrs  Extra HTML attributes.
     * }
     */
    public static function render(string $icon, array $args = []): string {
        // Normalize: accept "edit" or "dashicons-edit", always emit "dashicons-edit".
        $name = (strpos($icon, 'dashicons-') === 0) ? $icon : 'dashicons-' . $icon;

        $classes = ['dashicons', $name];
        if (!empty($args['size'])) {
            $classes[] = 'is-' . $args['size'];
        }
        if (!empty($args['class'])) {
            $classes[] = $args['class'];
        }

        $attrs = array_merge($args['attrs'] ?? [], [
            'class'       => Html::classes($classes),
            'aria-hidden' => 'true',
        ]);

        return Html::tag('span', $attrs, '');
    }
}
