<?php

declare(strict_types=1);

use PluginSDK\WP\Renderer;
use PluginSDK\WP\Settings\Field;

psdk_test('list sanitize: comma string → clean array', function () {
    $field = new Field('agents', 'Agents', Field::TYPE_LIST);
    psdk_assert_equals(
        ['MyBot', 'OtherBot'],
        $field->sanitize(' MyBot , OtherBot,, mybot , <b>OtherBot</b> ')
    );
    psdk_assert_equals([], $field->sanitize('  ,  ,'));
    psdk_assert_equals(['a', 'b'], $field->sanitize(['a', 'b', 'a']));
});

psdk_test('list required validates against the empty array', function () {
    $field = new Field('agents', 'Agents', Field::TYPE_LIST, required: true);
    psdk_assert($field->validate([]) !== null, 'empty list must fail required');
    psdk_assert_equals(null, $field->validate(['x']));
});

psdk_test('keyedSelect sanitize keeps valid values, drops the rest', function () {
    $field = new Field(
        'policies',
        'Policies',
        Field::TYPE_KEYED_SELECT,
        options: ['allow', 'markdown', 'block']
    );

    $clean = $field->sanitize([
        'GPTBot'    => 'block',
        'ClaudeBot' => 'markdown',
        'Evil'      => 'banana',
        '<x>Tagged' => 'allow',
    ]);

    psdk_assert_equals('block', $clean['GPTBot']);
    psdk_assert_equals('markdown', $clean['ClaudeBot']);
    psdk_assert(!isset($clean['Evil']), 'out-of-options value dropped');
    psdk_assert(isset($clean['Tagged']) && !isset($clean['<x>Tagged']), 'keys are tag-stripped');
    psdk_assert_equals([], $field->sanitize('not an array'));
});

psdk_test('renderer: list joins the stored array back to a comma string', function () {
    $field = new Field('agents', 'Agents', Field::TYPE_LIST);
    $html = Renderer::field($field, 'acme[agents]', ['MyBot', 'OtherBot']);
    psdk_assert_contains('value="MyBot, OtherBot"', $html);
    psdk_assert_contains('regular-text', $html);
});

psdk_test('renderer: keyedSelect renders a native table with one select per row', function () {
    $field = new Field(
        'policies',
        'Policies',
        Field::TYPE_KEYED_SELECT,
        default: 'allow',
        options: [
            ['value' => 'allow', 'label' => 'Allow'],
            ['value' => 'block', 'label' => 'Block'],
        ],
        rows: ['GPTBot' => 'GPTBot', 'ClaudeBot' => 'ClaudeBot']
    );
    $html = Renderer::field($field, 'acme[policies]', ['GPTBot' => 'block', 'CustomBot' => 'allow']);

    psdk_assert_contains('widefat striped', $html, 'uses the native admin table classes');
    psdk_assert_contains('name="acme[policies][GPTBot]"', $html);
    psdk_assert_contains('name="acme[policies][CustomBot]"', $html, 'stored extra keys render too');
    psdk_assert_contains('value="block" selected', $html);
});

psdk_test('showIf wraps the control in a data-attribute marker', function () {
    $field = new Field(
        'mode',
        'Mode',
        Field::TYPE_SELECT,
        options: ['a', 'b'],
        showIfField: 'enabled',
        showIfEquals: true
    );
    $html = Renderer::field($field, 'acme[mode]', 'a');

    psdk_assert_contains('psdk-show-if', $html);
    psdk_assert_contains('data-psdk-controller="enabled"', $html);
    psdk_assert_contains('data-psdk-equals="1"', $html, 'boolean true compares against a checked checkbox');
});

psdk_test('showIf round-trips through the manifest shape', function () {
    $field = new Field('mode', 'Mode', Field::TYPE_SELECT, showIfField: 'enabled', showIfEquals: true);
    $out = $field->toArray();
    psdk_assert_equals(['field' => 'enabled', 'equals' => true], $out['showIf']);

    $plain = (new Field('k', 'K'))->toArray();
    psdk_assert(!isset($plain['showIf']), 'unused showIf stays absent for byte-identical round-trips');
});

psdk_test('showIfScript ships the row toggler', function () {
    $script = Renderer::showIfScript();
    psdk_assert_contains('psdk-show-if', $script);
    psdk_assert_contains("closest('tr')", $script);
});
