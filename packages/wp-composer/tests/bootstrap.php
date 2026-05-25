<?php

declare(strict_types=1);

/**
 * Test bootstrap.
 *
 *  1. PSR-4 autoloader for `PluginSDK\WP\…` and `PluginSDK\WP\Tests\…`
 *     so we don't need composer dump-autoload.
 *  2. WP function stubs (add_action, esc_html, current_user_can, …)
 *     so the runtime can be unit-tested without WordPress installed.
 */

spl_autoload_register(static function (string $class): void {
    static $roots = [
        'PluginSDK\\WP\\Tests\\' => __DIR__ . '/',
        'PluginSDK\\WP\\'        => __DIR__ . '/../src/',
    ];
    foreach ($roots as $prefix => $dir) {
        if (strpos($class, $prefix) !== 0) continue;
        $relative = substr($class, strlen($prefix));
        $path = $dir . str_replace('\\', '/', $relative) . '.php';
        if (is_file($path)) {
            require_once $path;
            return;
        }
    }
});

require_once __DIR__ . '/wp-stubs.php';

// Tiny test harness — collects `test_*` functions and runs them.
require_once __DIR__ . '/harness.php';
