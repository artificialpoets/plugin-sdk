<?php
/**
 * Notice — WordPress admin notice (success/error/warning/info), optionally dismissible.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Notice {

    /**
     * @param string $variant     'success' | 'error' | 'warning' | 'info'
     * @param string $message_html Pre-escaped HTML for the message body
     *                             (use Html::esc() yourself if it's user-supplied text).
     * @param array<string, mixed> $args {
     *     @var bool   $dismissible  Add the × dismiss button. Default false.
     *     @var bool   $inline       Add the .inline class (no auto-positioning).
     *     @var string $class        Extra class names.
     *     @var array  $attrs        Extra HTML attributes.
     * }
     */
    public static function render(string $variant, string $message_html, array $args = []): string {
        $dismissible = !empty($args['dismissible']);
        $inline      = !empty($args['inline']);
        $extra_cls   = $args['class'] ?? '';
        $extra       = $args['attrs'] ?? [];

        $classes = Html::classes([
            'notice',
            'notice-' . $variant,
            $dismissible ? 'is-dismissible' : '',
            $inline ? 'inline' : '',
            $extra_cls,
        ]);

        $inner = $message_html;
        if ($dismissible) {
            $inner .= Html::tag('button', [
                'type'  => 'button',
                'class' => 'notice-dismiss',
            ], Html::tag('span', ['class' => 'screen-reader-text'], 'Dismiss'));
        }

        return Html::tag('div', array_merge($extra, ['class' => $classes]), $inner);
    }

    /** Convenience: success notice with a <p><strong>…</strong> message</p>. */
    public static function success(string $message, array $args = []): string {
        return self::render('success', '<p>' . Html::esc($message) . '</p>', $args);
    }
    public static function error(string $message, array $args = []): string {
        return self::render('error', '<p>' . Html::esc($message) . '</p>', $args);
    }
    public static function warning(string $message, array $args = []): string {
        return self::render('warning', '<p>' . Html::esc($message) . '</p>', $args);
    }
    public static function info(string $message, array $args = []): string {
        return self::render('info', '<p>' . Html::esc($message) . '</p>', $args);
    }
}
