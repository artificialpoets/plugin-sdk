<?php
/**
 * Security primitives — NonceField, CapabilityGate, and a few escape passthroughs.
 *
 * These wrap WordPress's built-in security functions in a way that's hard
 * to forget. The AI-WordPress research that informed the roadmap flagged
 * "missing nonces, capability checks, and unescaped output" as the most
 * common AI-generated security failures — these helpers exist to make
 * doing the right thing the easy thing.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Security {

    /**
     * Render WordPress's standard nonce hidden inputs.
     *
     * Wraps wp_nonce_field(), which emits two hidden inputs by default:
     *   - The nonce token
     *   - The current admin referer URL (used by check_admin_referer())
     *
     * Place inside every <form> that mutates server state.
     *
     * @param string $action  Action name. Should be unique per form
     *                        (e.g. 'my_plugin_save_settings').
     * @param array<string, mixed> $args {
     *     @var string $name      Hidden-input name. Default '_wpnonce'.
     *     @var bool   $referer   Include the _wp_http_referer hidden input. Default true.
     * }
     */
    public static function nonce_field(string $action, array $args = []): string {
        $name    = $args['name']    ?? '_wpnonce';
        $referer = $args['referer'] ?? true;

        // Inside WordPress, defer to the real function for correctness.
        if (function_exists('wp_nonce_field')) {
            ob_start();
            wp_nonce_field($action, $name, $referer, true);
            return (string) ob_get_clean();
        }

        // Fallback for non-WP contexts (testing, docs): render the same shape
        // without a valid token. NEVER trust this fallback in production.
        $html = Html::tag('input', [
            'type'  => 'hidden',
            'name'  => $name,
            'value' => '',
        ], '', true);
        if ($referer) {
            $html .= Html::tag('input', [
                'type'  => 'hidden',
                'name'  => '_wp_http_referer',
                'value' => '',
            ], '', true);
        }
        return $html;
    }

    /**
     * Conditionally render content if the current user has a capability.
     *
     * Authorization-by-default — the gate calls WordPress's
     * current_user_can() so the check is server-side, not client-trusted.
     *
     * @param string         $capability  e.g. 'manage_options', 'edit_posts'.
     * @param callable|string $content    String of HTML OR a callable that returns
     *                                    HTML (only invoked when the cap check passes).
     * @param callable|string|null $fallback  Optional: rendered when the user lacks the cap.
     */
    public static function capability_gate(
        string $capability,
        $content,
        $fallback = null
    ): string {
        $allowed = self::user_can($capability);
        if ($allowed) {
            return is_callable($content) ? (string) $content() : (string) $content;
        }
        if ($fallback === null) return '';
        return is_callable($fallback) ? (string) $fallback() : (string) $fallback;
    }

    /**
     * Thin wrapper around current_user_can(). Returns true if WP isn't loaded
     * — fail open in non-WP contexts so docs/preview pages don't blank out.
     * In production WP context, the real check runs.
     */
    public static function user_can(string $capability): bool {
        if (function_exists('current_user_can')) {
            return (bool) current_user_can($capability);
        }
        return true; // Non-WP context — defer judgment to the actual app.
    }
}
