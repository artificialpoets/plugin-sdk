<?php
/**
 * Plugin settings page (admin.php?page=plugin-sdk-starter).
 *
 * Demonstrates the full WP admin page lifecycle:
 *   • Capability check          (current_user_can)
 *   • Nonce verification        (check_admin_referer)
 *   • Input sanitization        (wp_unslash + sanitize_*)
 *   • State storage              (update_option)
 *   • Success notice via redirect (?settings-updated=1)
 *   • Output escaping            (Components helpers escape internally)
 *
 * Read this file as the template for your own admin pages.
 */

declare(strict_types=1);

namespace PluginSDK\Starter\Admin;

use PluginSDK\WP\Components;

final class SettingsPage {

    private const OPTION_KEY    = 'plugin_sdk_starter_settings';
    private const NONCE_ACTION  = 'plugin_sdk_starter_save_settings';
    private const CAPABILITY    = 'manage_options';

    /** Default values shape — also the schema. */
    private const DEFAULTS = array(
        'api_key'       => '',
        'mode'          => 'production',
        'notifications' => true,
    );

    public static function render(): void {
        // 1. Capability check — server-side gate.
        if ( ! current_user_can( self::CAPABILITY ) ) {
            wp_die(
                esc_html__( 'You do not have permission to access this page.', 'plugin-sdk-starter' ),
                '',
                array( 'response' => 403 )
            );
        }

        // 2. Handle POST if a form was submitted. The handle_save()
        //    method below verifies the nonce + capability + sanitises
        //    each field before saving and then exits with a redirect.
        $method = isset( $_SERVER['REQUEST_METHOD'] )
            ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) )
            : '';
        if ( 'POST' === $method ) {
            self::handle_save();
        }

        // 3. Load current settings.
        $values = wp_parse_args( get_option( self::OPTION_KEY, array() ), self::DEFAULTS );

        // 4. Read the active tab from the URL. This is a read-only
        //    routing hint, not a state mutation — nonce verification is
        //    not applicable. sanitize_key() also strips any unexpected
        //    characters as a defence-in-depth measure.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $tab = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'general';

        // 5. Render. Components helpers (wrap, page_header, tabs,
        //    notice_success, form_table, …) escape every dynamic value
        //    they receive via Html::esc_* internally, so the composed
        //    HTML is safe to echo as a single string. The disable/enable
        //    block covers the multi-line echo expression below; the
        //    comment documents the reasoning so the next reader knows
        //    we weighed the warning, not just suppressed it.
        // phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
        echo Components::wrap(
            Components::page_header(
                __( 'Starter Plugin', 'plugin-sdk-starter' ),
                array(
                    'action' => array(
                        'label' => __( 'Documentation', 'plugin-sdk-starter' ),
                        'href'  => 'https://wp-admincss.com',
                    ),
                )
            )
            . self::saved_notice()
            . Components::tabs(
                array(
                    array(
                        'id'           => 'general',
                        'label'        => __( 'General', 'plugin-sdk-starter' ),
                        'content_html' => self::render_general_tab( $values ),
                    ),
                    array(
                        'id'           => 'advanced',
                        'label'        => __( 'Advanced', 'plugin-sdk-starter' ),
                        'content_html' => self::render_advanced_tab( $values ),
                    ),
                ),
                $tab
            )
        );
        // phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    /**
     * POST handler — call BEFORE rendering. Validates + saves + redirects.
     *
     * The nonce check below is the security gate: until check_admin_referer
     * returns successfully, no $_POST data is read.
     */
    private static function handle_save(): void {
        // 2a. Nonce verification (dies on failure).
        check_admin_referer( self::NONCE_ACTION );

        // 2b. Capability check again — defence in depth.
        if ( ! current_user_can( self::CAPABILITY ) ) {
            wp_die( esc_html__( 'Forbidden.', 'plugin-sdk-starter' ), '', array( 'response' => 403 ) );
        }

        // 2c. Pull the form payload. wp_unslash strips magic-quotes;
        //     each sub-field is sanitised individually below.
        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
        $post_raw = isset( $_POST['plugin_sdk_starter'] ) ? wp_unslash( $_POST['plugin_sdk_starter'] ) : null;
        $raw      = is_array( $post_raw ) ? $post_raw : array();

        $sanitized = array(
            'api_key'       => sanitize_text_field( (string) ( $raw['api_key'] ?? '' ) ),
            'mode'          => in_array( ( $raw['mode'] ?? '' ), array( 'production', 'sandbox' ), true )
                                ? (string) $raw['mode']
                                : 'production',
            'notifications' => ! empty( $raw['notifications'] ),
        );

        // 2d. Save.
        update_option( self::OPTION_KEY, $sanitized );

        // 2e. Redirect back to this page with ?settings-updated=1 so the
        //     notice flashes. Pulling `tab` from $_GET is the same
        //     read-only routing pattern as in render(); same rationale.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $tab = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'general';

        wp_safe_redirect(
            add_query_arg(
                array(
                    'page'             => 'plugin-sdk-starter',
                    'tab'              => $tab,
                    'settings-updated' => '1',
                ),
                admin_url( 'admin.php' )
            )
        );
        exit;
    }

    private static function saved_notice(): string {
        // Reading the `settings-updated` flag is a read-only routing
        // check (it's the flash flag set by handle_save's redirect),
        // never a trust boundary for state changes.
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if ( empty( $_GET['settings-updated'] ) ) {
            return '';
        }
        return Components::notice_success(
            __( 'Settings saved.', 'plugin-sdk-starter' ),
            array( 'dismissible' => true )
        );
    }

    private static function render_general_tab( array $values ): string {
        $rows  = Components::form_row(
            __( 'API Key', 'plugin-sdk-starter' ),
            Components::input(
                array(
                    'name'  => 'plugin_sdk_starter[api_key]',
                    'id'    => 'plugin-sdk-starter-api-key',
                    'value' => $values['api_key'],
                    'attrs' => array( 'autocomplete' => 'off' ),
                )
            ),
            array(
                'for'         => 'plugin-sdk-starter-api-key',
                'description' => __( 'Find your key in the dashboard.', 'plugin-sdk-starter' ),
            )
        );

        $rows .= Components::form_row(
            __( 'Mode', 'plugin-sdk-starter' ),
            Components::select(
                array(
                    'production' => __( 'Production', 'plugin-sdk-starter' ),
                    'sandbox'    => __( 'Sandbox', 'plugin-sdk-starter' ),
                ),
                array(
                    'name'  => 'plugin_sdk_starter[mode]',
                    'id'    => 'plugin-sdk-starter-mode',
                    'value' => $values['mode'],
                )
            ),
            array( 'for' => 'plugin-sdk-starter-mode' )
        );

        $rows .= Components::form_row(
            __( 'Notifications', 'plugin-sdk-starter' ),
            Components::toggle(
                array(
                    'name'    => 'plugin_sdk_starter[notifications]',
                    'label'   => __( 'Email me when events fire', 'plugin-sdk-starter' ),
                    'checked' => (bool) $values['notifications'],
                )
            )
        );

        return '<form method="post" action="">'
            . Components::nonce_field( self::NONCE_ACTION )
            . Components::form_table( $rows )
            . Components::submit(
                Components::button(
                    __( 'Save Changes', 'plugin-sdk-starter' ),
                    array(
                        'variant' => 'primary',
                        'type'    => 'submit',
                    )
                ) . Components::spinner( false )
            )
            . '</form>';
    }

    private static function render_advanced_tab( array $values ): string {
        return '<p>' . esc_html__(
            'Advanced settings go here. Add another tab content render method following the same pattern as render_general_tab().',
            'plugin-sdk-starter'
        ) . '</p>';
    }
}
