<?php

declare(strict_types=1);

use PluginSDK\WP\Settings;

/** Build the attach-to-reading page used across these tests. */
function psdk_attach_fixture(): Settings
{
    return Settings::fromArray([
        'title'      => 'Agents visibility',
        'capability' => 'manage_options',
        'attach'     => 'reading',
        'sections'   => [
            [
                'id'     => 'default',
                'title'  => 'Agents visibility',
                'fields' => [
                    ['id' => 'enabled', 'label' => 'Enabled', 'type' => 'checkbox'],
                ],
            ],
            [
                'id'     => 'rules',
                'title'  => 'Rules',
                'fields' => [
                    ['id' => 'mode', 'label' => 'Mode', 'type' => 'select', 'options' => ['a', 'b']],
                ],
            ],
        ],
    ], 'acme-agents');
}

psdk_test('attach parses from the manifest and moves the option group', function () {
    $settings = psdk_attach_fixture();
    psdk_assert_equals('reading', $settings->getAttach());
    psdk_assert_equals('reading', $settings->getOptionGroup(), 'core group id equals the screen id');
    psdk_assert_equals('reading', $settings->toArray()['attach']);
});

psdk_test('attach rejects unknown core screens', function () {
    psdk_assert_throws(function () {
        (new Settings('acme', 'Acme'))->attach('permalinks');
    }, InvalidArgumentException::class);
});

psdk_test('attached settings register no menu item', function () {
    $settings = psdk_attach_fixture();
    $settings->register();

    // Run the recorded admin_menu callback the way WP would.
    foreach ($GLOBALS['_PSDK_TEST_CALLS'] as $call) {
        if ($call['fn'] === 'add_action' && $call['args']['hook'] === 'admin_menu') {
            ($call['args']['callback'])();
        }
    }

    $menus = array_filter(
        $GLOBALS['_PSDK_TEST_CALLS'],
        static fn(array $c): bool => in_array($c['fn'], ['add_menu_page', 'add_submenu_page'], true)
    );
    psdk_assert_equals(0, count($menus));
});

psdk_test('attached fields land on the core screen', function () {
    $settings = psdk_attach_fixture();
    $settings->register();

    foreach ($GLOBALS['_PSDK_TEST_CALLS'] as $call) {
        if ($call['fn'] === 'add_action' && $call['args']['hook'] === 'admin_init') {
            ($call['args']['callback'])();
        }
    }

    $registered = array_values(array_filter(
        $GLOBALS['_PSDK_TEST_CALLS'],
        static fn(array $c): bool => $c['fn'] === 'register_setting'
    ));
    psdk_assert_equals('reading', $registered[0]['args']['optionGroup'], 'option joins the core group');
    psdk_assert_equals('acme-agents', $registered[0]['args']['optionName'], 'storage stays one option under the slug');

    $sections = array_values(array_filter(
        $GLOBALS['_PSDK_TEST_CALLS'],
        static fn(array $c): bool => $c['fn'] === 'add_settings_section'
    ));
    psdk_assert_equals(1, count($sections), "the core 'default' section is never re-added");
    psdk_assert_equals('rules', $sections[0]['args']['id']);
    psdk_assert_equals('reading', $sections[0]['args']['page']);

    $fields = array_values(array_filter(
        $GLOBALS['_PSDK_TEST_CALLS'],
        static fn(array $c): bool => $c['fn'] === 'add_settings_field'
    ));
    psdk_assert_equals(2, count($fields));
    psdk_assert_equals('reading', $fields[0]['args']['page']);
    psdk_assert_equals('default', $fields[0]['args']['section'], 'default-section fields join the core table');
    psdk_assert_equals('rules', $fields[1]['args']['section']);
});

psdk_test('a non-attached page keeps today\'s behavior byte-for-byte', function () {
    $settings = Settings::fromArray([
        'title'      => 'Acme',
        'capability' => 'manage_options',
        'sections'   => [[
            'id' => 'general', 'title' => 'General',
            'fields' => [['id' => 'k', 'label' => 'K', 'type' => 'text']],
        ]],
    ], 'acme');
    $settings->register();

    foreach ($GLOBALS['_PSDK_TEST_CALLS'] as $call) {
        if ($call['fn'] === 'add_action' && in_array($call['args']['hook'], ['admin_menu', 'admin_init'], true)) {
            ($call['args']['callback'])();
        }
    }

    $menus = array_values(array_filter(
        $GLOBALS['_PSDK_TEST_CALLS'],
        static fn(array $c): bool => $c['fn'] === 'add_submenu_page'
    ));
    psdk_assert_equals(1, count($menus));

    $registered = array_values(array_filter(
        $GLOBALS['_PSDK_TEST_CALLS'],
        static fn(array $c): bool => $c['fn'] === 'register_setting'
    ));
    psdk_assert_equals('acme_settings', $registered[0]['args']['optionGroup']);
});
