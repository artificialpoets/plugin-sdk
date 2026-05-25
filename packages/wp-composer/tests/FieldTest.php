<?php

declare(strict_types=1);

use PluginSDK\WP\Settings\Field;

psdk_test('Field::sanitize strips HTML tags from text', function () {
    $f = new Field('api_key', 'API Key', Field::TYPE_TEXT);
    psdk_assert_equals('hello world', $f->sanitize('<b>hello</b> world'));
});

psdk_test('Field::sanitize trims and removes control chars from text', function () {
    $f = new Field('api_key', 'API Key', Field::TYPE_TEXT);
    psdk_assert_equals('hello', $f->sanitize("  \x00hello\x07  "));
});

psdk_test('Field::sanitize collapses whitespace in text but preserves newlines in textarea', function () {
    $text = new Field('t', 'Text', Field::TYPE_TEXT);
    psdk_assert_equals('a b', $text->sanitize("a\n\nb"));

    $textarea = new Field('ta', 'Textarea', Field::TYPE_TEXTAREA);
    psdk_assert_equals("a\n\nb", $textarea->sanitize("a\n\nb"));
});

psdk_test('Field::sanitize collapses 3+ blank lines in textarea', function () {
    $f = new Field('ta', 'Textarea', Field::TYPE_TEXTAREA);
    psdk_assert_equals("a\n\nb", $f->sanitize("a\n\n\n\nb"));
});

psdk_test('Field::sanitize for checkbox returns boolean from various input shapes', function () {
    $f = new Field('on', 'Toggle', Field::TYPE_CHECKBOX);
    psdk_assert_equals(true,  $f->sanitize('1'));
    psdk_assert_equals(true,  $f->sanitize('on'));
    psdk_assert_equals(true,  $f->sanitize(true));
    psdk_assert_equals(false, $f->sanitize('0'));
    psdk_assert_equals(false, $f->sanitize(''));
    psdk_assert_equals(false, $f->sanitize(null));
});

psdk_test('Field::sanitize for number clamps to min/max', function () {
    $f = new Field('n', 'N', Field::TYPE_NUMBER, '', '', false, null, [], 0.0, 100.0);
    psdk_assert_equals(0.0,   $f->sanitize(-5));
    psdk_assert_equals(100.0, $f->sanitize(500));
    psdk_assert_equals(42.0,  $f->sanitize('42'));
});

psdk_test('Field::sanitize for email returns empty on invalid', function () {
    $f = new Field('e', 'Email', Field::TYPE_EMAIL);
    psdk_assert_equals('a@b.com', $f->sanitize('  a@b.com  '));
    psdk_assert_equals('',        $f->sanitize('not-an-email'));
});

psdk_test('Field::sanitize for url returns empty on invalid', function () {
    $f = new Field('u', 'URL', Field::TYPE_URL);
    psdk_assert_equals('https://x.test', $f->sanitize('https://x.test'));
    psdk_assert_equals('',                $f->sanitize('not a url'));
});

psdk_test('Field::sanitize for select returns option value or default', function () {
    $f = new Field('env', 'Env', Field::TYPE_SELECT, '', '', false, 'production',
        ['production', ['value' => 'staging', 'label' => 'Staging']]);
    psdk_assert_equals('staging',    $f->sanitize('staging'));
    psdk_assert_equals('production', $f->sanitize('production'));
    psdk_assert_equals('production', $f->sanitize('unknown'));
});

psdk_test('Field::sanitize for password preserves all printable chars', function () {
    $f = new Field('p', 'Password', Field::TYPE_PASSWORD);
    psdk_assert_equals('P@ssw0rd!#$%', $f->sanitize('P@ssw0rd!#$%'));
});

psdk_test('Field::validate reports required-missing on empty value', function () {
    $f = new Field('a', 'API Key', Field::TYPE_TEXT, '', '', true);
    psdk_assert_contains('required', (string) $f->validate(''));
    psdk_assert_equals(null, $f->validate('present'));
});

psdk_test('Field::validate reports invalid email/url with field label in message', function () {
    $e = new Field('e', 'Email', Field::TYPE_EMAIL);
    psdk_assert_contains('Email', (string) $e->validate('not-an-email'));
    $u = new Field('u', 'URL', Field::TYPE_URL);
    psdk_assert_contains('URL', (string) $u->validate('not-a-url'));
});

psdk_test('Field normalises options array (string → {value, label})', function () {
    $f = new Field('s', 'S', Field::TYPE_SELECT, '', '', false, null, ['one', 'two']);
    psdk_assert_equals([
        ['value' => 'one', 'label' => 'one'],
        ['value' => 'two', 'label' => 'two'],
    ], $f->options);
});

psdk_test('Field::toArray round-trips the public surface', function () {
    $f = new Field('k', 'K', Field::TYPE_TEXT, 'hint', 'placeholder', true, 'def');
    $arr = $f->toArray();
    psdk_assert_equals('k',      $arr['id']);
    psdk_assert_equals('K',      $arr['label']);
    psdk_assert_equals('text',   $arr['type']);
    psdk_assert_equals('hint',   $arr['description']);
    psdk_assert_equals('placeholder', $arr['placeholder']);
    psdk_assert_equals(true,     $arr['required']);
    psdk_assert_equals('def',    $arr['default']);
});
