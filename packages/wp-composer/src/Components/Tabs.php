<?php
/**
 * Tabs — full tabs primitive with content panels (extends the NavTabs strip).
 *
 * Two modes:
 *
 *  - PHP-rendered active tab: pass $active_id. Only that panel renders with
 *    the .is-active class; others render hidden so JS can swap. Drive tab
 *    selection via $_GET['tab'] in your handler.
 *
 *  - All panels rendered, JS swaps: don't pass $active_id (first tab is
 *    active by default). Wire JS to toggle .nav-tab-active on buttons and
 *    .is-active on .wp-admin-tab-panel.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Tabs {

    /**
     * @param array<int, array{id: string, label: string, content_html: string, disabled?: bool}> $tabs
     * @param string|null $active_id  Defaults to the first tab.
     */
    public static function render(array $tabs, ?string $active_id = null): string {
        if ($active_id === null && isset($tabs[0])) {
            $active_id = $tabs[0]['id'];
        }

        $strip = '';
        $panels = '';
        foreach ($tabs as $tab) {
            $is_active = ($tab['id'] === $active_id);
            $disabled  = !empty($tab['disabled']);

            $strip .= Html::tag('button', [
                'type'           => 'button',
                'role'           => 'tab',
                'id'             => 'tab-' . $tab['id'],
                'aria-selected'  => $is_active ? 'true' : 'false',
                'aria-controls'  => 'panel-' . $tab['id'],
                'disabled'       => $disabled,
                'class'          => Html::classes(['nav-tab', $is_active ? 'nav-tab-active' : '']),
            ], Html::esc($tab['label']));

            $panels .= Html::tag('div', [
                'id'              => 'panel-' . $tab['id'],
                'role'            => 'tabpanel',
                'aria-labelledby' => 'tab-' . $tab['id'],
                'class'           => Html::classes(['wp-admin-tab-panel', $is_active ? 'is-active' : '']),
            ], $tab['content_html']);
        }

        $nav = Html::tag('nav', ['class' => 'nav-tab-wrapper', 'role' => 'tablist'], $strip);

        return Html::tag('div', ['class' => 'wp-admin-tabs'], $nav . $panels);
    }
}
