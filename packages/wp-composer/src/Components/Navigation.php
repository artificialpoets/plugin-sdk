<?php
/**
 * Navigation components — NavTabs, Subsubsub.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Navigation {

    /**
     * Render WP admin navigation tabs.
     *
     * @param array<int, array{label: string, href: string, active?: bool}> $tabs
     */
    public static function nav_tabs(array $tabs): string {
        $links = '';
        foreach ($tabs as $tab) {
            $is_active = !empty($tab['active']);
            $links .= Html::tag('a', [
                'href'  => Html::esc_url($tab['href']),
                'class' => Html::classes(['nav-tab', $is_active ? 'nav-tab-active' : '']),
            ], Html::esc($tab['label']));
        }
        return Html::tag('nav', ['class' => 'nav-tab-wrapper'], $links);
    }

    /**
     * Render a "subsubsub" status filter row (All | Active | Draft | Trash).
     *
     * @param array<int, array{key: string, label: string, href: string, count?: int, active?: bool}> $items
     */
    public static function subsubsub(array $items): string {
        $li_html = '';
        $total   = count($items);
        foreach ($items as $i => $item) {
            $is_active = !empty($item['active']);
            $is_last   = ($i === $total - 1);
            $link_inner = Html::esc($item['label']);
            if (isset($item['count'])) {
                $link_inner .= ' ' . Html::tag('span', ['class' => 'count'], '(' . (int) $item['count'] . ')');
            }
            $link = Html::tag('a', [
                'href'  => Html::esc_url($item['href']),
                'class' => $is_active ? 'current' : null,
            ], $link_inner);
            $li_html .= Html::tag('li',
                ['class' => $item['key']],
                $link . ($is_last ? '' : ' |')
            );
        }
        return Html::tag('ul', ['class' => 'subsubsub'], $li_html);
    }
}
