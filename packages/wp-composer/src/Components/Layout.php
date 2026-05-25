<?php
/**
 * Layout components — Wrap, PageHeader, TwoColumn, ScreenOptions, HelpTabs.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Layout {

    /** Wrap content in <div class="wrap">. */
    public static function wrap(string $inner_html): string {
        return Html::tag('div', ['class' => 'wrap'], $inner_html);
    }

    /**
     * Render a page heading with optional inline action button and end marker.
     *
     * @param string $title  The heading text (will be escaped).
     * @param array<string, mixed> $args {
     *     @var array  $action  ['label' => string, 'href' => string]
     *     @var bool   $end_marker  Render the <hr class="wp-header-end">. Default true.
     * }
     */
    public static function page_header(string $title, array $args = []): string {
        $html = Html::tag('h1', ['class' => 'wp-heading-inline'], Html::esc($title));

        if (!empty($args['action'])) {
            $action = $args['action'];
            $html .= Html::tag('a', [
                'href'  => Html::esc_url($action['href']),
                'class' => 'page-title-action',
            ], Html::esc($action['label']));
        }

        if (($args['end_marker'] ?? true) === true) {
            $html .= Html::tag('hr', ['class' => 'wp-header-end'], '', true);
        }

        return $html;
    }

    /**
     * Render the two-column #poststuff layout.
     *
     * @param string $main_html     HTML for the main column.
     * @param string $sidebar_html  HTML for the sidebar column.
     */
    public static function two_column(string $main_html, string $sidebar_html): string {
        $body  = Html::tag('div', ['id' => 'post-body-content'], $main_html);
        $body .= Html::tag('div', [
            'id'    => 'postbox-container-1',
            'class' => 'postbox-container',
        ], $sidebar_html);

        return Html::tag('div', ['id' => 'poststuff'],
            Html::tag('div', [
                'id'    => 'post-body',
                'class' => 'metabox-holder columns-2',
            ], $body)
        );
    }

    /**
     * Render the Screen Options panel.
     *
     * @param string $children_html  Pre-rendered <fieldset>…</fieldset>.
     * @param bool   $open           Whether the panel is initially visible. Default false.
     */
    public static function screen_options(string $children_html, bool $open = false): string {
        $cls   = $open ? '' : 'hidden';
        $inner = Html::tag('h5', [], 'Screen Options') . $children_html;
        return Html::tag('div', ['id' => 'screen-meta'],
            Html::tag('div', ['id' => 'screen-options-wrap', 'class' => $cls], $inner)
        );
    }

    /**
     * Render the contextual Help Tabs panel.
     *
     * @param array<int, array{id: string, label: string, content_html: string}> $tabs
     * @param string|null $active_id  Defaults to the first tab.
     */
    public static function help_tabs(array $tabs, ?string $active_id = null): string {
        if ($active_id === null && isset($tabs[0])) {
            $active_id = $tabs[0]['id'];
        }
        $nav_items = '';
        $contents  = '';
        foreach ($tabs as $tab) {
            $is_active = ($tab['id'] === $active_id);
            $nav_items .= Html::tag('li',
                ['class' => $is_active ? 'active' : ''],
                Html::tag('a', ['href' => '#' . $tab['id']], Html::esc($tab['label']))
            );
            $contents .= Html::tag('div', [
                'id'    => $tab['id'],
                'class' => Html::classes(['help-tab-content', $is_active ? 'active' : '']),
            ], $tab['content_html']);
        }
        return Html::tag('div', ['id' => 'contextual-help-wrap'],
            Html::tag('div', ['class' => 'contextual-help-tabs'],
                Html::tag('ul', [], $nav_items)
            ) .
            Html::tag('div', ['class' => 'contextual-help-tabs-wrap'], $contents)
        );
    }
}
