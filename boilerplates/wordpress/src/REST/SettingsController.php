<?php
/**
 * REST controller — example of a properly-secured REST endpoint.
 *
 * Demonstrates:
 *   • Capability check via permission_callback
 *   • Schema-validated input (args)
 *   • Sanitize_callback per arg
 *   • Returning WP_Error with proper HTTP status
 */

declare(strict_types=1);

namespace PluginSDK\Starter\REST;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

final class SettingsController {

    public function register(): void {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void {
        register_rest_route('plugin-sdk-starter/v1', '/settings', [
            [
                'methods'             => WP_REST_Server::READABLE,   // GET
                'callback'            => [$this, 'get_settings'],
                'permission_callback' => [$this, 'permission_check'],
            ],
            [
                'methods'             => WP_REST_Server::EDITABLE,   // POST/PUT/PATCH
                'callback'            => [$this, 'update_settings'],
                'permission_callback' => [$this, 'permission_check'],
                'args'                => [
                    'api_key' => [
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'mode' => [
                        'type'    => 'string',
                        'enum'    => ['production', 'sandbox'],
                        'default' => 'production',
                    ],
                    'notifications' => [
                        'type'    => 'boolean',
                        'default' => true,
                    ],
                ],
            ],
        ]);
    }

    /**
     * The permission_callback IS the security check.
     * Returning true here would expose this endpoint to ANY authenticated user.
     */
    public function permission_check(): bool {
        return current_user_can('manage_options');
    }

    public function get_settings(): WP_REST_Response {
        $settings = get_option('plugin_sdk_starter_settings', [
            'api_key'       => '',
            'mode'          => 'production',
            'notifications' => true,
        ]);
        return new WP_REST_Response($settings);
    }

    public function update_settings(WP_REST_Request $request): WP_REST_Response|WP_Error {
        // Args are already sanitized by sanitize_callback / type coercion.
        // The boolean still goes through rest_sanitize_boolean() rather than
        // a raw (bool) cast — wp.org's automated review flags loose boolean
        // casts, and strict normalization here is defence in depth if the
        // args schema ever drifts.
        $sanitized = [
            'api_key'       => (string) $request->get_param('api_key'),
            'mode'          => (string) $request->get_param('mode'),
            'notifications' => rest_sanitize_boolean($request->get_param('notifications')),
        ];

        $saved = update_option('plugin_sdk_starter_settings', $sanitized);
        if ($saved === false) {
            return new WP_Error(
                'plugin_sdk_starter_save_failed',
                __('Could not save settings.', 'plugin-sdk-starter'),
                ['status' => 500]
            );
        }

        return new WP_REST_Response($sanitized);
    }
}
