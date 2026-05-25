<?php

declare(strict_types=1);

use PluginSDK\WP\Config;
use PluginSDK\WP\ConfigException;

psdk_test('Config::fromArray accepts a minimal valid manifest', function () {
    $config = Config::fromArray([
        'platform'   => 'wordpress',
        'name'       => 'Acme Forms',
        'slug'       => 'acme-forms',
        'textDomain' => 'acme-forms',
    ]);
    psdk_assert_equals('Acme Forms', $config->name());
    psdk_assert_equals('acme-forms', $config->slug());
    psdk_assert_equals('wordpress', $config->platform());
    psdk_assert_equals(false, $config->hasSettings());
    psdk_assert_equals(false, $config->hasRest());
    psdk_assert_equals(false, $config->hasDatabase());
});

psdk_test('Config::fromArray rejects missing required fields', function () {
    psdk_assert_throws(
        fn() => Config::fromArray(['platform' => 'wordpress']),
        ConfigException::class
    );
});

psdk_test('Config::fromArray rejects invalid slug pattern', function () {
    psdk_assert_throws(
        fn() => Config::fromArray([
            'platform'   => 'wordpress',
            'name'       => 'X',
            'slug'       => 'Invalid Slug',
            'textDomain' => 'x',
        ]),
        ConfigException::class
    );
});

psdk_test('Config builds Settings from settings.page fragment', function () {
    $config = Config::fromArray([
        'platform'   => 'wordpress',
        'name'       => 'Acme Forms',
        'slug'       => 'acme-forms',
        'textDomain' => 'acme-forms',
        'settings'   => [
            'page' => [
                'title'      => 'Acme Forms',
                'capability' => 'manage_options',
                'sections'   => [[
                    'id'    => 'general',
                    'title' => 'General',
                    'fields' => [
                        ['id' => 'api_key', 'label' => 'API Key', 'type' => 'text', 'required' => true],
                    ],
                ]],
            ],
        ],
    ]);
    psdk_assert_equals(true, $config->hasSettings());
    $settings = $config->buildSettings();
    psdk_assert_equals('acme-forms', $settings->getSlug());
    psdk_assert_equals(1, count($settings->getSections()));
});

psdk_test('Config builds REST from rest fragment', function () {
    $config = Config::fromArray([
        'platform'   => 'wordpress',
        'name'       => 'Acme',
        'slug'       => 'acme',
        'textDomain' => 'acme',
        'rest'       => [
            'namespace' => 'acme/v1',
            'routes' => [
                ['path' => '/submissions', 'method' => 'POST', 'capability' => 'manage_options'],
            ],
        ],
    ]);
    psdk_assert_equals(true, $config->hasRest());
    $rest = $config->buildRest();
    psdk_assert_equals('acme/v1', $rest->getNamespace());
    psdk_assert_equals('/submissions', $rest->getRoutes()[0]->path);
});

psdk_test('Config builds Migration with derived option name from slug', function () {
    $config = Config::fromArray([
        'platform'   => 'wordpress',
        'name'       => 'Acme Forms',
        'slug'       => 'acme-forms',
        'textDomain' => 'acme-forms',
        'version'    => '0.2.0',
        'database'   => [
            'tables' => [[
                'name' => 'submissions',
                'columns' => [
                    ['name' => 'id', 'type' => 'BIGINT', 'primary' => true, 'autoIncrement' => true],
                ],
            ]],
        ],
    ]);
    $migration = $config->buildMigration('acme_');
    psdk_assert_equals('acme_forms_db_version', $migration->getOptionName());
    psdk_assert_equals('0.2.0', $migration->getCurrentVersion());
});

psdk_test('Config::fromFile reads from disk + validates', function () {
    $tmp = tempnam(sys_get_temp_dir(), 'psdk-test-');
    psdk_assert(is_string($tmp), 'tempnam returned a path');
    file_put_contents($tmp, json_encode([
        'platform'   => 'wordpress',
        'name'       => 'On Disk',
        'slug'       => 'on-disk',
        'textDomain' => 'on-disk',
    ]));
    $config = Config::fromFile($tmp);
    psdk_assert_equals('on-disk', $config->slug());
    unlink($tmp);
});

psdk_test('Config::fromFile throws when path missing', function () {
    psdk_assert_throws(
        fn() => Config::fromFile('/nonexistent/path/plugin-sdk.json'),
        ConfigException::class
    );
});

psdk_test('Config::fromFile throws when JSON malformed', function () {
    $tmp = tempnam(sys_get_temp_dir(), 'psdk-test-');
    file_put_contents($tmp, '{not valid json');
    psdk_assert_throws(
        fn() => Config::fromFile($tmp),
        ConfigException::class
    );
    unlink($tmp);
});
