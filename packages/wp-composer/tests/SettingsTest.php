<?php

declare(strict_types=1);

use PluginSDK\WP\Settings;
use PluginSDK\WP\Settings\Field;

psdk_test('Settings fluent API records section + field', function () {
    $settings = (new Settings('acme', 'Acme'))
        ->capability('manage_options');
    $settings->section('general', 'General')
        ->field('api_key', 'API Key', Field::TYPE_TEXT, required: true);

    $sections = $settings->getSections();
    psdk_assert_equals(1, count($sections));
    psdk_assert_equals('general', $sections[0]->id);
    psdk_assert_equals(1, count($sections[0]->fields));
    psdk_assert_equals('api_key', $sections[0]->fields[0]->id);
    psdk_assert_equals('manage_options', $settings->getCapability());
});

psdk_test('Settings::fromArray builds from manifest fragment', function () {
    $page = [
        'title'      => 'Acme Forms',
        'capability' => 'manage_options',
        'sections'   => [[
            'id'    => 'general',
            'title' => 'General',
            'fields' => [
                ['id' => 'api_key', 'label' => 'API Key', 'type' => 'text', 'required' => true],
                ['id' => 'env', 'label' => 'Env', 'type' => 'select',
                 'options' => ['production', 'staging'], 'default' => 'production'],
            ],
        ]],
    ];
    $settings = Settings::fromArray($page, 'acme-forms');
    psdk_assert_equals('acme-forms', $settings->getSlug());

    $sections = $settings->getSections();
    psdk_assert_equals(1, count($sections));
    psdk_assert_equals(2, count($sections[0]->fields));
    psdk_assert_equals('select', $sections[0]->fields[1]->type);
});

psdk_test('Settings::fromArray throws when title missing', function () {
    psdk_assert_throws(
        fn() => Settings::fromArray([
            'capability' => 'manage_options',
            'sections'   => [['id' => 's', 'title' => 'S', 'fields' => [['id' => 'f', 'label' => 'L', 'type' => 'text']]]],
        ], 'acme'),
        \InvalidArgumentException::class
    );
});

psdk_test('Settings::fromArray throws when sections empty', function () {
    psdk_assert_throws(
        fn() => Settings::fromArray([
            'title'      => 'T',
            'capability' => 'manage_options',
            'sections'   => [],
        ], 'acme'),
        \InvalidArgumentException::class
    );
});

psdk_test('Settings::sanitize cleans every field + records errors', function () {
    $settings = (new Settings('acme', 'Acme'));
    $settings->section('s', 'S')
        ->field('email', 'Email', Field::TYPE_EMAIL, required: true)
        ->field('count', 'Count', Field::TYPE_NUMBER, min: 0, max: 10);

    $clean = $settings->sanitize(['email' => '<b>a@b.com</b>', 'count' => '20']);
    // tags stripped → still passes filter_var, since we use FILTER_VALIDATE_EMAIL
    psdk_assert_equals('a@b.com', $clean['email']);
    psdk_assert_equals(10.0, $clean['count']);
    psdk_assert_equals([], $settings->getErrors());

    $bad = $settings->sanitize(['email' => '', 'count' => '5']);
    psdk_assert_equals('', $bad['email']);
    psdk_assert_contains('required', $settings->getErrors()[0]);
});

psdk_test('Settings::register adds admin_menu + admin_init actions', function () {
    $settings = (new Settings('acme', 'Acme'));
    $settings->section('s', 'S')->field('k', 'K', Field::TYPE_TEXT);
    $settings->register();

    $hooks = array_column(array_column($GLOBALS['_PSDK_TEST_CALLS'], 'args'), 'hook');
    psdk_assert_contains('admin_menu', $hooks);
    psdk_assert_contains('admin_init', $hooks);
});

psdk_test('Settings::toArray round-trips the configuration', function () {
    $settings = (new Settings('acme', 'Acme'))->capability('edit_posts');
    $settings->section('g', 'General')
        ->field('k', 'Key', Field::TYPE_TEXT, required: true);

    $arr = $settings->toArray();
    psdk_assert_equals('acme', $arr['slug']);
    psdk_assert_equals('edit_posts', $arr['capability']);
    psdk_assert_equals('g', $arr['sections'][0]['id']);
    psdk_assert_equals('k', $arr['sections'][0]['fields'][0]['id']);
});
