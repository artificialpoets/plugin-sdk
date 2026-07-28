<?php

declare(strict_types=1);

use PluginSDK\WP\Module;
use PluginSDK\WP\Modules;
use PluginSDK\WP\SiteConfig;

final class PsdkCountingModule implements Module
{
    public int $registered = 0;

    public function register(): void
    {
        $this->registered++;
    }
}

psdk_test('register boots added modules once', function () {
    $module = new PsdkCountingModule();
    $modules = (new Modules('acme-forms'))->add('digest', $module);

    $modules->register();
    $modules->register(); // idempotent

    psdk_assert_equals(1, $module->registered);
    psdk_assert_equals(['digest'], $modules->registered());
});

psdk_test('a disabled module is skipped via modules.{key}.enabled', function () {
    $config = new SiteConfig('acme-forms', [
        'modules' => ['digest' => ['enabled' => false]],
    ]);
    $module = new PsdkCountingModule();

    $modules = (new Modules('acme-forms', $config))->add('digest', $module);
    $modules->register();

    psdk_assert_equals(0, $module->registered);
    psdk_assert_equals([], $modules->registered());
});

psdk_test('the {slug_snake}_modules filter can add a module', function () {
    $injected = new PsdkCountingModule();
    $GLOBALS['_PSDK_FILTERS']['acme_forms_modules'] = static function (array $map) use ($injected): array {
        $map['injected'] = $injected;
        return $map;
    };

    $modules = new Modules('acme-forms');
    $modules->register();

    psdk_assert_equals(1, $injected->registered);
    psdk_assert_contains('injected', $modules->registered());
});

psdk_test('non-Module filter entries are ignored', function () {
    $GLOBALS['_PSDK_FILTERS']['acme_forms_modules'] = static function (array $map): array {
        $map['junk'] = 'not a module';
        return $map;
    };

    $modules = new Modules('acme-forms');
    $modules->register();

    psdk_assert_equals([], $modules->registered());
});

psdk_test('boot fires the {slug_snake}_modules_booted action', function () {
    $modules = (new Modules('acme-forms'))->add('digest', new PsdkCountingModule());
    $modules->register();

    $actions = array_values(array_filter(
        $GLOBALS['_PSDK_TEST_CALLS'],
        static fn(array $c): bool => $c['fn'] === 'do_action' && $c['args']['hook'] === 'acme_forms_modules_booted'
    ));
    psdk_assert_equals(1, count($actions));
});
