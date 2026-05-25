<?php
/**
 * Example plugin admin page using Plugin SDK PHP helpers.
 *
 * Drop this into a plugin file and register it with add_menu_page().
 *
 * @example
 *   add_action('admin_menu', function () {
 *       add_menu_page(
 *           'My Plugin',
 *           'My Plugin',
 *           'manage_options',
 *           'my-plugin',
 *           'my_plugin_render_settings_page'
 *       );
 *   });
 *   add_action('admin_enqueue_scripts', ['\PluginSDK\WP\Assets', 'enqueue_cdn']);
 */

declare(strict_types=1);

use PluginSDK\WP\Components;

function my_plugin_render_settings_page(): void {

    // ─── Top: header + notice ─────────────────────────────────────────
    $header = Components::page_header('My Plugin', [
        'action' => ['label' => 'Add New', 'href' => '?page=add-new'],
    ]);

    $notice = Components::notice_success(
        'Settings saved successfully.',
        ['dismissible' => true]
    );

    // ─── Tabs ─────────────────────────────────────────────────────────
    $tabs = Components::nav_tabs([
        ['label' => 'General',      'href' => '?tab=general',      'active' => true],
        ['label' => 'Advanced',     'href' => '?tab=advanced'],
        ['label' => 'Integrations', 'href' => '?tab=integrations'],
    ]);

    // ─── Stat cards ───────────────────────────────────────────────────
    $stats = '';
    $stats .= Components::stat_card([
        'label' => 'Total events',
        'value' => '1,284',
        'delta' => '↑ 12 this week',
        'trend' => 'up',
    ]);
    $stats .= Components::stat_card([
        'label' => 'Active users',
        'value' => '82',
        'delta' => '↓ 3 this week',
        'trend' => 'down',
    ]);
    $stats = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:20px 0">' . $stats . '</div>';

    // ─── Settings form ────────────────────────────────────────────────
    $form_rows = '';

    $form_rows .= Components::form_row(
        'API Key',
        Components::input([
            'name' => 'api_key',
            'id'   => 'api-key',
            'value' => '',
            'placeholder' => 'sk-...',
        ]),
        [
            'for'         => 'api-key',
            'description' => 'Find your API key in the dashboard.',
        ]
    );

    $form_rows .= Components::form_row(
        'Mode',
        Components::select(
            ['production' => 'Production', 'sandbox' => 'Sandbox'],
            ['name' => 'mode', 'value' => 'production']
        )
    );

    $form_rows .= Components::form_row(
        'Notifications',
        Components::toggle([
            'name'    => 'notify',
            'label'   => 'Email me when events fire',
            'checked' => true,
        ])
    );

    $form = '<form method="post" action="">'
        . Components::form_table($form_rows)
        . Components::submit(
            Components::button('Save Changes', ['variant' => 'primary', 'type' => 'submit'])
            . Components::spinner(false)
          )
        . '</form>';

    // ─── Sidebar postbox ──────────────────────────────────────────────
    $sidebar = Components::postbox(
        'Recent Activity',
        Components::activity_item([
            'initials'  => 'JD',
            'body_html' => '<strong>Jane</strong> published "Hello World"',
            'time'      => '2 hours ago',
        ]) .
        Components::activity_item([
            'initials'  => 'AS',
            'body_html' => '<strong>Alex</strong> updated settings',
            'time'      => 'Yesterday',
        ])
    );

    // ─── Output ───────────────────────────────────────────────────────
    echo Components::wrap(
        $header .
        $notice .
        $tabs .
        $stats .
        Components::two_column($form, $sidebar)
    );
}
