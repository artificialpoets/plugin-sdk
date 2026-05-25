<?php

declare(strict_types=1);

/**
 * Zero-dep PHP test harness.
 *
 * - Each test file defines functions named `test_*` and the harness
 *   discovers + runs them.
 * - Assertions throw on failure; the harness catches and reports.
 * - Exit code = 0 if every test passed, 1 otherwise.
 *
 * Usage:
 *     php tests/run.php
 */

/** @var array<int, array{file: string, name: string}> */
$GLOBALS['_PSDK_TESTS'] = [];

/**
 * Register a test. Each test file calls this once per `test_*` function
 * (manually — keeps the harness simple, no reflection over functions).
 */
function psdk_test(string $name, callable $fn): void
{
    $GLOBALS['_PSDK_TESTS'][] = ['name' => $name, 'fn' => $fn];
}

function psdk_assert(bool $cond, string $message = 'assertion failed'): void
{
    if (!$cond) {
        throw new AssertionError($message);
    }
}

/** @param mixed $expected @param mixed $actual */
function psdk_assert_equals($expected, $actual, string $message = ''): void
{
    if ($expected !== $actual) {
        $msg = $message !== '' ? $message . ' — ' : '';
        $exp = is_scalar($expected) ? var_export($expected, true) : json_encode($expected);
        $act = is_scalar($actual)   ? var_export($actual, true)   : json_encode($actual);
        throw new AssertionError($msg . "expected $exp, got $act");
    }
}

/** @param mixed $value */
function psdk_assert_contains($needle, $value, string $message = ''): void
{
    if (is_string($value)) {
        if (strpos($value, (string) $needle) === false) {
            throw new AssertionError(($message ?: 'assert_contains') . ": '$needle' not found in '$value'");
        }
        return;
    }
    if (is_array($value)) {
        if (!in_array($needle, $value, true)) {
            throw new AssertionError(($message ?: 'assert_contains') . ': value not in array — ' . json_encode($value));
        }
        return;
    }
    throw new AssertionError('assert_contains: unsupported haystack type');
}

function psdk_assert_throws(callable $fn, string $exceptionClass = 'Throwable', string $message = ''): void
{
    try {
        $fn();
    } catch (\Throwable $e) {
        if (!is_a($e, $exceptionClass)) {
            throw new AssertionError("expected $exceptionClass, got " . get_class($e) . ' — ' . $e->getMessage());
        }
        return;
    }
    throw new AssertionError(($message ?: 'expected exception') . " ($exceptionClass) — none thrown");
}

function psdk_run_tests(): int
{
    $passed = 0;
    $failed = 0;
    $failures = [];

    foreach ($GLOBALS['_PSDK_TESTS'] as $test) {
        _psdk_reset_calls();
        $GLOBALS['_PSDK_USER_CAN'] = true;
        $GLOBALS['_PSDK_OPTIONS']  = [];

        try {
            ($test['fn'])();
            $passed++;
            echo "  \e[32m✓\e[0m {$test['name']}\n";
        } catch (\Throwable $e) {
            $failed++;
            echo "  \e[31m✗\e[0m {$test['name']}\n";
            echo "      " . $e->getMessage() . "\n";
            $failures[] = $test['name'] . ': ' . $e->getMessage();
        }
    }

    echo "\n";
    if ($failed === 0) {
        echo "\e[32m" . sprintf('%d/%d tests passed.', $passed, $passed) . "\e[0m\n";
        return 0;
    }
    echo "\e[31m" . sprintf('%d passed, %d failed.', $passed, $failed) . "\e[0m\n";
    return 1;
}
