<?php

declare(strict_types=1);

use PluginSDK\WP\Version;
use PluginSDK\WP\Version\IncompatibleException;

psdk_test('Version::SDK is a semver string', function () {
    psdk_assert((bool) preg_match('/^\d+\.\d+\.\d+/', Version::SDK), 'Version::SDK should be semver');
});

psdk_test('Version::compare orders patch / minor / major correctly', function () {
    psdk_assert_equals(-1, Version::compare('0.1.0', '0.1.1'));
    psdk_assert_equals(-1, Version::compare('0.1.9', '0.2.0'));
    psdk_assert_equals(-1, Version::compare('0.9.9', '1.0.0'));
    psdk_assert_equals(1,  Version::compare('2.0.0', '1.9.9'));
    psdk_assert_equals(0,  Version::compare('1.2.3', '1.2.3'));
});

psdk_test('Version::compare ranks pre-releases below the release', function () {
    psdk_assert_equals(-1, Version::compare('0.2.0-rc.1', '0.2.0'));
    psdk_assert_equals(1,  Version::compare('0.2.0', '0.2.0-rc.1'));
    psdk_assert_equals(-1, Version::compare('0.2.0-alpha', '0.2.0-beta'));
});

psdk_test('Version::compare ignores build metadata', function () {
    psdk_assert_equals(0, Version::compare('1.0.0+build.42', '1.0.0+build.99'));
});

psdk_test('Version::satisfies accepts min bounds', function () {
    // Current SDK is a pre-release (0.1.0-rc.X). It IS >= 0.0.1 but NOT >= 0.1.0
    // because semver ranks pre-releases below the matching release.
    psdk_assert_equals(true,  Version::satisfies('0.0.1'));
    psdk_assert_equals(false, Version::satisfies('1.0.0'));
    psdk_assert_equals(false, Version::satisfies('0.1.0'));
});

psdk_test('Version::satisfies honors exclusive max bound', function () {
    // SDK (0.1.0-rc.X) satisfies ">= 0.0.1, < 0.2.0"
    psdk_assert_equals(true,  Version::satisfies('0.0.1', '0.2.0'));
    psdk_assert_equals(false, Version::satisfies('0.0.1', '0.0.1'));
});

psdk_test('Version::requireAtLeast throws when SDK is too old', function () {
    psdk_assert_throws(
        fn() => Version::requireAtLeast('99.0.0'),
        IncompatibleException::class
    );
});

psdk_test('Version::requireAtLeast is a no-op when SDK is new enough', function () {
    // Should not throw; if it does, the test framework will catch it.
    Version::requireAtLeast('0.0.1');
    psdk_assert(true, 'no exception');
});
