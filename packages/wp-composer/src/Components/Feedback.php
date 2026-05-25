<?php
/**
 * Feedback components — StatusBadge, Spinner, Pointer, Skeleton.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Feedback {

    /**
     * Render a status pill.
     *
     * @param string $label    Pill text (escaped).
     * @param string $variant  'active' | 'error' | 'warning' | 'info' | 'neutral'. Default 'neutral'.
     */
    public static function status_badge(string $label, string $variant = 'neutral'): string {
        $cls = Html::classes([
            'wp-admin-status',
            $variant !== 'neutral' ? 'is-' . $variant : '',
        ]);
        return Html::tag('span', ['class' => $cls], Html::esc($label));
    }

    /**
     * Render the WP spinner. Pass active=false to hide it.
     */
    public static function spinner(bool $active = true): string {
        return Html::tag('span', [
            'class' => Html::classes(['spinner', $active ? 'is-active' : '']),
        ], '');
    }

    /**
     * Render a WP pointer callout.
     *
     * @param array<string, mixed> $args {
     *     @var string $title
     *     @var string $body_html   Pre-rendered body HTML.
     *     @var string $actions_html Pre-rendered action button HTML.
     * }
     */
    public static function pointer(array $args = []): string {
        $title   = $args['title'] ?? '';
        $body    = $args['body_html'] ?? '';
        $actions = $args['actions_html'] ?? '';

        $inner  = Html::tag('div', ['class' => 'wp-admin-pointer__title'], Html::esc($title));
        $inner .= Html::tag('div', ['class' => 'wp-admin-pointer__body'], $body);
        if ($actions !== '') {
            $inner .= Html::tag('div', ['class' => 'wp-admin-pointer__actions'], $actions);
        }
        return Html::tag('div', ['class' => 'wp-admin-pointer'], $inner);
    }

    /**
     * Render a skeleton placeholder.
     *
     * @param string $variant  'title' | 'text' | 'short'. Default 'text'.
     */
    public static function skeleton(string $variant = 'text'): string {
        return Html::tag('div', [
            'class' => Html::classes(['wp-admin-skeleton', 'is-' . $variant]),
        ], '');
    }
}
