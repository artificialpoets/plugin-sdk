<?php

declare(strict_types=1);

/**
 * Test runner. Loads bootstrap, includes every test file, prints
 * results, exits with the appropriate code.
 */

require_once __DIR__ . '/bootstrap.php';

$tests = glob(__DIR__ . '/*Test.php');
if ($tests === false) {
    echo "Could not find test files\n";
    exit(1);
}
sort($tests);

foreach ($tests as $file) {
    echo "\n\e[1m" . basename($file, '.php') . "\e[0m\n";
    require_once $file;
    $code = psdk_run_tests();
    $GLOBALS['_PSDK_TESTS'] = []; // reset so each suite is reported independently
    if ($code !== 0) {
        // Continue running remaining suites but remember we have failures.
        $GLOBALS['_PSDK_SUITE_FAILED'] = true;
    }
}

exit(empty($GLOBALS['_PSDK_SUITE_FAILED']) ? 0 : 1);
