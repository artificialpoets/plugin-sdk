<?php
/**
 * Plugin settings page (admin.php?page=plugin-sdk-starter).
 *
 * Demonstrates the full WP admin page lifecycle:
 *   • Capability check          (current_user_can)
 *   • Nonce verification        (check_admin_referer)
 *   • Input sanitization        (sanitize_text_field, in_array)
 *   • State storage              (update_option)
 *   • Success notice via redirect (?settings-updated=1)
 *   • Output escaping            (esc_html, esc_attr, esc_url)
 *
 * Read this file as the template for your own admin pages.
 */

declare(strict_types=1);

namespace PluginSDK\Starter\Admin;

use PluginSDK\WP\Components;

final class SettingsPage {

    private const OPTION_KEY    = 'wpacs_settings';
    private const NONCE_ACTION  = 'wpacs_save_settings';
    private const CAPABILITY    = 'manage_options';

    /** Default values shape — also the schema. */
    private const DEFAULTS = [
        'api_key'       => '',
        'mode'          => 'production',
        'notifications' => true,
    ];

    public static function render(): void {
        // 1. Capability check — server-side gate.
        if (!current_user_can(self::CAPABILITY)) {
            wp_die(esc_html__('You do not have permission to access this page.', 'plugin-sdk-starter'), '', ['response' => 403]);
        }

        // 2. Handle POST if a form was submitted.
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            self::handle_save();
            // Falls through to render the page with the saved values.
        }

        // 3. Load current settings.
        $values = wp_parse_args(get_option(self::OPTION_KEY, []), self::DEFAULTS);

        // 4. Render.
        $tab = isset($_GET['tab']) ? sanitize_key($_GET['tab']) : 'general';

        echo Components::wrap(
            Components::page_header(__('Starter Plugin', 'plugin-sdk-starter'), [
                'action' => [
                    'label' => __('Documentation', 'plugin-sdk-starter'),
                    'href'  => 'https://wp-admincss.com',
                ],
            ])
            . self::saved_notice()
            . Components::tabs([
                ['id' => 'general',  'label' => __('General',  'plugin-sdk-starter'), 'content_html' => self::render_general_tab($values)],
                ['id' => 'advanced', 'label' => __('Advanced', 'plugin-sdk-starter'), 'content_html' => self::render_advanced_tab($values)],
            ], $tab)
        );
    }

    /** POST handler — call BEFORE rendering. Validates + saves + redirects. */
    private static function handle_save(): void {
        // 2a. Nonce verification (dies on failure).
        check_admin_referer(self::NONCE_ACTION);

        // 2b. Capability check again — defense in depth.
        if (!current_user_can(self::CAPABILITY)) {
            wp_die(esc_html__('Forbidden.', 'plugin-sdk-starter'), '', ['response' => 403]);
        }

        // 2c. Sanitize each field. Never trust $_POST.
        $input = isset($_POST['wpacs']) && is_array($_POST['wpacs']) ? $_POST['wpacs'] : [];
        $sanitized = [
            'api_key' => sanitize_text_field($input['api_key'] ?? ''),
            'mode'    => in_array(($input['mode'] ?? ''), ['production', 'sandbox'], true)
                          ? $input['mode']
                          : 'production',
            'notifications' => !empty($input['notifications']),
        ];

        // 2d. Save.
        update_option(self::OPTION_KEY, $sanitized);

        // 2e. Redirect back to this page with ?settings-updated=1 so the notice flashes.
        wp_safe_redirect(add_query_arg([
            'page'              => 'plugin-sdk-starter',
            'tab'               => sanitize_key($_GET['tab'] ?? 'general'),
            'settings-updated'  => '1',
        ], admin_url('admin.php')));
        exit;
    }

    private static function saved_notice(): string {
        if (empty($_GET['settings-updated'])) return '';
        return Components::notice_success(
            __('Settings saved.', 'plugin-sdk-starter'),
            ['dismissible' => true]
        );
    }

    private static function render_general_tab(array $values): string {
        $rows  = Components::form_row(
            __('API Key', 'plugin-sdk-starter'),
            Components::input([
                'name'  => 'wpacs[api_key]',
                'id'    => 'wpacs-api-key',
                'value' => $values['api_key'],
                'attrs' => ['autocomplete' => 'off'],
            ]),
            [
                'for'         => 'wpacs-api-key',
                'description' => __('Find your key in the dashboard.', 'plugin-sdk-starter'),
            ]
        );

        $rows .= Components::form_row(
            __('Mode', 'plugin-sdk-starter'),
            Components::select(
                [
                    'production' => __('Production', 'plugin-sdk-starter'),
                    'sandbox'    => __('Sandbox',    'plugin-sdk-starter'),
                ],
                [
                    'name'  => 'wpacs[mode]',
                    'id'    => 'wpacs-mode',
                    'value' => $values['mode'],
                ]
            ),
            ['for' => 'wpacs-mode']
        );

        $rows .= Components::form_row(
            __('Notifications', 'plugin-sdk-starter'),
            Components::toggle([
                'name'    => 'wpacs[notifications]',
                'label'   => __('Email me when events fire', 'plugin-sdk-starter'),
                'checked' => (bool) $values['notifications'],
            ])
        );

        return '<form method="post" action="">'
            . Components::nonce_field(self::NONCE_ACTION)
            . Components::form_table($rows)
            . Components::submit(
                Components::button(
                    __('Save Changes', 'plugin-sdk-starter'),
                    ['variant' => 'primary', 'type' => 'submit']
                ) . Components::spinner(false)
            )
            . '</form>';
    }

    private static function render_advanced_tab(array $values): string {
        return '<p>' . esc_html__('Advanced settings go here. Add another tab content render method following the same pattern as render_general_tab().', 'plugin-sdk-starter') . '</p>';
    }
}
