<?php
/**
 * Form components — Input, Select, FormTable rows, Toggle, HelpTip.
 *
 * Each method returns a string of escaped HTML. Use them in your settings
 * page templates either as <?php echo Components::input(...); ?> or build
 * up a string with sprintf().
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Forms {

    /**
     * Render an <input>.
     *
     * @param array<string, mixed> $args {
     *     @var string $name
     *     @var string $type   Default 'text'.
     *     @var string $value
     *     @var string $width  'regular' | 'large' | 'small' — default 'regular'.
     *     @var string $id
     *     @var string $placeholder
     *     @var array  $attrs  Extra HTML attributes.
     * }
     */
    public static function input(array $args = []): string {
        $width = $args['width'] ?? 'regular';
        $cls   = $width . '-text';
        if (!empty($args['class'])) {
            $cls .= ' ' . $args['class'];
        }
        $attrs = array_merge($args['attrs'] ?? [], [
            'type'  => $args['type']  ?? 'text',
            'name'  => $args['name']  ?? null,
            'id'    => $args['id']    ?? null,
            'value' => $args['value'] ?? null,
            'placeholder' => $args['placeholder'] ?? null,
            'class' => $cls,
        ]);
        return Html::tag('input', $attrs, '', true);
    }

    /**
     * Render a <textarea>.
     */
    public static function textarea(array $args = []): string {
        $width = $args['width'] ?? 'large';
        $cls   = $width . '-text';
        $value = $args['value'] ?? '';
        $attrs = array_merge($args['attrs'] ?? [], [
            'name'  => $args['name'] ?? null,
            'id'    => $args['id']   ?? null,
            'rows'  => $args['rows'] ?? 4,
            'class' => $cls,
        ]);
        return Html::tag('textarea', $attrs, Html::esc((string) $value));
    }

    /**
     * Render a <select> with a list of options.
     *
     * @param array<string, string> $options  value => label map.
     */
    public static function select(array $options, array $args = []): string {
        $selected = $args['value'] ?? null;
        $option_html = '';
        foreach ($options as $value => $label) {
            $option_attrs = ['value' => $value];
            if ((string) $value === (string) $selected) {
                $option_attrs['selected'] = true;
            }
            $option_html .= Html::tag('option', $option_attrs, Html::esc($label));
        }
        $attrs = array_merge($args['attrs'] ?? [], [
            'name' => $args['name'] ?? null,
            'id'   => $args['id']   ?? null,
        ]);
        return Html::tag('select', $attrs, $option_html);
    }

    /**
     * Wrap rows inside a <table class="form-table">.
     *
     * @param string $rows_html  The pre-rendered <tr>…</tr> rows.
     */
    public static function form_table(string $rows_html): string {
        return Html::tag('table', ['class' => 'form-table'],
            Html::tag('tbody', [], $rows_html)
        );
    }

    /**
     * Render a single form-table row (label/control pair).
     *
     * @param string $label        Label text (will be escaped).
     * @param string $control_html Pre-rendered control HTML.
     * @param array<string, mixed> $args {
     *     @var string $for         Label "for" attribute pointing to the control id.
     *     @var string $description Help text shown below the control.
     * }
     */
    public static function form_row(string $label, string $control_html, array $args = []): string {
        $label_html = isset($args['for'])
            ? Html::tag('label', ['for' => $args['for']], Html::esc($label))
            : Html::esc($label);

        $td_html = $control_html;
        if (!empty($args['description'])) {
            $td_html .= Html::tag('p', ['class' => 'description'], Html::esc($args['description']));
        }

        return Html::tag('tr', [],
            Html::tag('th', ['scope' => 'row'], $label_html) .
            Html::tag('td', [], $td_html)
        );
    }

    /**
     * Render a <p class="description">.
     */
    public static function description(string $text): string {
        return Html::tag('p', ['class' => 'description'], Html::esc($text));
    }

    /**
     * Render a "?" help tip with a hover tooltip.
     */
    public static function help_tip(string $tip): string {
        return Html::tag('span', [
            'class'      => 'wp-admin-helptip',
            'data-tip'   => $tip,
            'role'       => 'tooltip',
            'aria-label' => $tip,
        ], '');
    }

    /**
     * Render a toggle switch.
     */
    public static function toggle(array $args = []): string {
        $name    = $args['name']    ?? null;
        $checked = !empty($args['checked']);
        $label   = $args['label']   ?? '';

        $input = Html::tag('input', [
            'type'    => 'checkbox',
            'class'   => 'wp-admin-toggle__input',
            'name'    => $name,
            'value'   => $args['value'] ?? '1',
            'checked' => $checked,
            'id'      => $args['id'] ?? null,
        ], '', true);

        $inner = $input
            . Html::tag('span', ['class' => 'wp-admin-toggle__track'], '')
            . ($label ? Html::tag('span', ['class' => 'wp-admin-toggle__label'], Html::esc($label)) : '');

        return Html::tag('label', ['class' => 'wp-admin-toggle'], $inner);
    }

    /**
     * Render the submit row.
     *
     * @param string $children_html  Pre-rendered button(s) and spinner.
     */
    public static function submit(string $children_html): string {
        return Html::tag('p', ['class' => 'submit'], $children_html);
    }

    /**
     * Render a color-picker input.
     *
     * Emits a text input with the .wp-color-picker class — WordPress's Iris
     * picker auto-upgrades these inputs when the wp-color-picker script is
     * enqueued. Without Iris, it falls back to a plain text input.
     *
     * In your plugin admin enqueue:
     *
     *     wp_enqueue_style('wp-color-picker');
     *     wp_enqueue_script('wp-color-picker');
     *     wp_add_inline_script('wp-color-picker',
     *         'jQuery(function($){ $(".wp-color-picker").wpColorPicker(); })');
     *
     * @param array<string, mixed> $args  See Forms::input(). Adds a default value of #2271b1.
     */
    public static function color_picker(array $args = []): string {
        $defaults = [
            'type'  => 'text',
            'value' => $args['value'] ?? '#2271b1',
            'class' => trim('wp-color-picker ' . ($args['class'] ?? '')),
        ];
        return self::input(array_merge($args, $defaults));
    }

    /**
     * Render a native HTML5 date input.
     *
     * For the older jQuery UI datepicker convention (text input + datepicker
     * init), pass `'type' => 'text'` and add `'class' => 'wp-admin-datepicker'`,
     * then call jQuery.datepicker on it in your enqueue script.
     *
     * @param array<string, mixed> $args  See Forms::input().
     */
    public static function date_picker(array $args = []): string {
        $defaults = ['type' => 'date'];
        return self::input(array_merge($args, $defaults));
    }
}
