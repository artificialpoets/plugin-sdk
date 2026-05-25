<?php
/**
 * Card-style components — Postbox, WelcomePanel, StatCard, ActivityItem.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Cards {

    /**
     * Render a postbox (the classic WP card).
     *
     * @param string $title         Heading text (escaped). Pass an empty string to omit the header.
     * @param string $inside_html   Pre-rendered HTML for the body.
     */
    public static function postbox(string $title, string $inside_html): string {
        $header = $title !== ''
            ? Html::tag('div', ['class' => 'postbox-header'],
                Html::tag('h2', ['class' => 'hndle'], Html::esc($title))
              )
            : '';
        return Html::tag('div', ['class' => 'postbox'],
            $header . Html::tag('div', ['class' => 'inside'], $inside_html)
        );
    }

    /**
     * Render a welcome panel.
     *
     * @param array<string, mixed> $args {
     *     @var string $title
     *     @var string $description
     *     @var array  $cta  ['label' => string, 'href' => string]
     * }
     */
    public static function welcome_panel(array $args = []): string {
        $title = $args['title'] ?? '';
        $desc  = $args['description'] ?? '';
        $cta   = $args['cta'] ?? null;

        $inner  = Html::tag('h2', [], Html::esc($title));
        if ($desc !== '') {
            $inner .= Html::tag('p', ['class' => 'about-description'], Html::esc($desc));
        }
        if (is_array($cta)) {
            $inner .= Html::tag('a', [
                'href'  => Html::esc_url($cta['href']),
                'class' => 'button button-primary button-hero',
            ], Html::esc($cta['label']));
        }

        return Html::tag('div', ['class' => 'welcome-panel'],
            Html::tag('div', ['class' => 'welcome-panel-content'], $inner)
        );
    }

    /**
     * Render a stat-card dashboard widget.
     *
     * @param array<string, mixed> $args {
     *     @var string $label
     *     @var string $value
     *     @var string $delta  Optional delta text.
     *     @var string $trend  'up' | 'down' — colors the delta.
     * }
     */
    public static function stat_card(array $args = []): string {
        $label = $args['label'] ?? '';
        $value = $args['value'] ?? '';
        $delta = $args['delta'] ?? null;
        $trend = $args['trend'] ?? null;

        $inner  = Html::tag('div', ['class' => 'wp-admin-statcard__label'], Html::esc($label));
        $inner .= Html::tag('div', ['class' => 'wp-admin-statcard__value'], Html::esc((string) $value));
        if ($delta !== null) {
            $delta_cls = Html::classes([
                'wp-admin-statcard__delta',
                $trend === 'up' ? 'is-up' : '',
                $trend === 'down' ? 'is-down' : '',
            ]);
            $inner .= Html::tag('div', ['class' => $delta_cls], Html::esc((string) $delta));
        }
        return Html::tag('div', ['class' => 'wp-admin-statcard'], $inner);
    }

    /**
     * Render a single activity-feed item.
     *
     * @param array<string, mixed> $args {
     *     @var string $initials   Two-letter initials for the avatar.
     *     @var string $body_html  Pre-rendered body HTML (use Html::esc() yourself).
     *     @var string $time       Timestamp text (e.g. "2 hours ago").
     * }
     */
    public static function activity_item(array $args = []): string {
        $initials = $args['initials'] ?? '';
        $body     = $args['body_html'] ?? '';
        $time     = $args['time']      ?? '';

        return Html::tag('div', ['class' => 'wp-admin-activity'],
            Html::tag('div', ['class' => 'wp-admin-activity__avatar'], Html::esc($initials)) .
            Html::tag('div', ['class' => 'wp-admin-activity__body'],
                Html::tag('div', ['class' => 'wp-admin-activity__text'], $body) .
                Html::tag('div', ['class' => 'wp-admin-activity__time'], Html::esc($time))
            )
        );
    }
}
