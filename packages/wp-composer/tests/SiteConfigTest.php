<?php

declare(strict_types=1);

use PluginSDK\WP\SiteConfig;

psdk_test('defaults read back through dot notation', function () {
    $config = new SiteConfig('acme-forms', [
        'enabled' => true,
        'agents'  => ['serve' => false, 'list' => ['GPTBot']],
    ]);

    psdk_assert_equals(true, $config->get('enabled'));
    psdk_assert_equals(false, $config->get('agents.serve'));
    psdk_assert_equals(['GPTBot'], $config->get('agents.list'));
    psdk_assert_equals('fallback', $config->get('missing.path', 'fallback'));
});

psdk_test('a wp-config constant overrides its leaf (typed)', function () {
    define('PSDKTESTCFG_ONE_ENABLED', '1');
    define('PSDKTESTCFG_ONE_AGENTS_SERVE', 1);

    $config = new SiteConfig('psdktestcfg-one', [
        'enabled' => false,
        'agents'  => ['serve' => false],
    ]);

    psdk_assert_equals(true, $config->get('enabled'), 'bool leaf casts the constant');
    psdk_assert_equals(true, $config->get('agents.serve'), 'nested constant maps through the path');
});

psdk_test('the project file merges recursively over defaults', function () {
    if (!defined('WP_CONTENT_DIR')) {
        define('WP_CONTENT_DIR', sys_get_temp_dir() . '/psdk-test-content');
    }
    $dir = constant('WP_CONTENT_DIR') . '/psdktestcfg-two';
    @mkdir($dir, 0777, true);
    file_put_contents(
        $dir . '/psdktestcfg-two.config.php',
        "<?php return ['agents' => ['serve' => true]];"
    );

    $config = new SiteConfig('psdktestcfg-two', [
        'enabled' => true,
        'agents'  => ['serve' => false, 'list' => ['GPTBot']],
    ]);

    psdk_assert_equals(true, $config->get('agents.serve'), 'file overrides the leaf');
    psdk_assert_equals(['GPTBot'], $config->get('agents.list'), 'untouched siblings survive');

    unlink($dir . '/psdktestcfg-two.config.php');
    @rmdir($dir);
});

psdk_test('the {slug_snake}_config filter runs last and wins', function () {
    $GLOBALS['_PSDK_FILTERS']['psdktestcfg_three_config'] = static function (array $config): array {
        $config['enabled'] = false;
        return $config;
    };

    $config = new SiteConfig('psdktestcfg-three', ['enabled' => true]);
    psdk_assert_equals(false, $config->get('enabled'));
});
