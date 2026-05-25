<?php

declare(strict_types=1);

use PluginSDK\WP\REST\Schema;

psdk_test('Schema validates a simple object with required props', function () {
    $s = new Schema([
        'type'       => 'object',
        'required'   => ['email'],
        'properties' => ['email' => ['type' => 'string']],
    ]);
    psdk_assert_equals([], $s->validate(['email' => 'a@b.com']));
    psdk_assert_contains('email: required property missing', $s->validate([])[0] ?? '');
});

psdk_test('Schema reports type mismatch with type names', function () {
    $s = new Schema(['type' => 'string']);
    $errs = $s->validate(42);
    psdk_assert_contains('expected string', $errs[0]);
});

psdk_test('Schema validates enum membership', function () {
    $s = new Schema(['enum' => ['production', 'staging']]);
    psdk_assert_equals([], $s->validate('production'));
    psdk_assert_contains('must be one of', $s->validate('unknown')[0]);
});

psdk_test('Schema enforces string format=email', function () {
    $s = new Schema(['type' => 'string', 'format' => 'email']);
    psdk_assert_equals([], $s->validate('a@b.com'));
    psdk_assert_contains('valid email', $s->validate('not-an-email')[0]);
});

psdk_test('Schema enforces minLength + maxLength', function () {
    $s = new Schema(['type' => 'string', 'minLength' => 3, 'maxLength' => 5]);
    psdk_assert_equals([], $s->validate('abc'));
    psdk_assert_equals([], $s->validate('abcde'));
    psdk_assert_contains('at least 3', $s->validate('ab')[0]);
    psdk_assert_contains('at most 5',  $s->validate('abcdef')[0]);
});

psdk_test('Schema enforces minimum + maximum on numbers', function () {
    $s = new Schema(['type' => 'integer', 'minimum' => 1, 'maximum' => 10]);
    psdk_assert_equals([], $s->validate(5));
    psdk_assert_contains('>= 1',  $s->validate(0)[0]);
    psdk_assert_contains('<= 10', $s->validate(11)[0]);
});

psdk_test('Schema validates integer type rejects floats with fractional', function () {
    $s = new Schema(['type' => 'integer']);
    $errs = $s->validate(1.5);
    psdk_assert_contains('must be an integer', $errs[0]);
});

psdk_test('Schema validates array items recursively', function () {
    $s = new Schema([
        'type'  => 'array',
        'items' => ['type' => 'string', 'minLength' => 2],
    ]);
    psdk_assert_equals([], $s->validate(['ab', 'cd']));
    $errs = $s->validate(['ab', 'c']);
    psdk_assert_contains('at least 2', $errs[0]);
});

psdk_test('Schema rejects additionalProperties when disabled', function () {
    $s = new Schema([
        'type' => 'object',
        'additionalProperties' => false,
        'properties' => ['email' => ['type' => 'string']],
    ]);
    $errs = $s->validate(['email' => 'a@b.com', 'evil' => 'x']);
    psdk_assert_contains('unknown property', $errs[0]);
});

psdk_test('Schema validates regex pattern', function () {
    $s = new Schema(['type' => 'string', 'pattern' => '^[a-z]+$']);
    psdk_assert_equals([], $s->validate('abc'));
    psdk_assert_contains('pattern', $s->validate('ABC')[0]);
});

psdk_test('Schema produces a structured error path through nested objects', function () {
    $s = new Schema([
        'type' => 'object',
        'properties' => [
            'user' => [
                'type' => 'object',
                'properties' => [
                    'email' => ['type' => 'string', 'format' => 'email'],
                ],
            ],
        ],
    ]);
    $errs = $s->validate(['user' => ['email' => 'invalid']]);
    psdk_assert_contains('user.email', $errs[0]);
});
