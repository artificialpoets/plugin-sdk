<?php
/**
 * Register the admin menu pages.
 */

declare(strict_types=1);

namespace PluginSDK\Starter\Admin;

final class Menu {
    public function register(): void {
        add_action('admin_menu', [$this, 'add_pages']);
    }

    public function add_pages(): void {
        $hook = add_menu_page(
            __('Plugin SDK Starter', 'plugin-sdk-starter'),
            __('Starter', 'plugin-sdk-starter'),
            'manage_options',
            'plugin-sdk-starter',
            [SettingsPage::class, 'render'],
            'dashicons-admin-generic',
            80
        );

        // Scope our admin assets to this page only — don't load on every WP admin screen.
        add_action('admin_print_styles-' . $hook, [Assets::class, 'enqueue_for_page']);
    }
}
