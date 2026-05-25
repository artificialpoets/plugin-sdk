<?php

declare(strict_types=1);

namespace PluginSDK\WP;

use PluginSDK\WP\Settings\Field;

/**
 * Pure-PHP HTML renderer for settings fields.
 *
 * Kept separate from Settings so unit tests can hit it without going
 * through the WP options API. Every escape is via WP's esc_* helpers
 * when present, falling back to htmlspecialchars in test environments.
 *
 * @internal
 * This is implementation detail of {@see Settings}. The exact HTML
 * shape stays WP-native (uses real WP class names) but specific markup
 * may evolve to track WP core changes without a major bump.
 */
final class Renderer
{
    /**
     * @param mixed $value
     */
    public static function field(Field $field, string $name, $value): string
    {
        switch ($field->type) {
            case Field::TYPE_TEXTAREA:
                return self::renderTextarea($field, $name, $value);
            case Field::TYPE_CHECKBOX:
                return self::renderCheckbox($field, $name, $value);
            case Field::TYPE_SELECT:
                return self::renderSelect($field, $name, $value);
            case Field::TYPE_NUMBER:
                return self::renderInput($field, $name, $value, 'number');
            case Field::TYPE_EMAIL:
                return self::renderInput($field, $name, $value, 'email');
            case Field::TYPE_URL:
                return self::renderInput($field, $name, $value, 'url');
            case Field::TYPE_PASSWORD:
                return self::renderInput($field, $name, $value, 'password');
            case Field::TYPE_TEXT:
            default:
                return self::renderInput($field, $name, $value, 'text');
        }
    }

    /**
     * @param mixed $value
     */
    private static function renderInput(Field $f, string $name, $value, string $htmlType): string
    {
        $attrs = self::baseAttrs($f, $name, $htmlType);
        $attrs['value'] = self::stringify($value);
        if ($f->placeholder !== '') $attrs['placeholder'] = $f->placeholder;
        if ($htmlType === 'number') {
            if ($f->min !== null)  $attrs['min']  = (string) $f->min;
            if ($f->max !== null)  $attrs['max']  = (string) $f->max;
            if ($f->step !== null) $attrs['step'] = (string) $f->step;
        }
        return '<input ' . self::serializeAttrs($attrs) . '>' . self::descriptionHtml($f);
    }

    /**
     * @param mixed $value
     */
    private static function renderTextarea(Field $f, string $name, $value): string
    {
        $attrs = self::baseAttrs($f, $name, null);
        $attrs['rows'] = '5';
        $attrs['cols'] = '50';
        if ($f->placeholder !== '') $attrs['placeholder'] = $f->placeholder;
        return '<textarea ' . self::serializeAttrs($attrs) . '>'
            . self::escHtml(self::stringify($value))
            . '</textarea>' . self::descriptionHtml($f);
    }

    /**
     * @param mixed $value
     */
    private static function renderCheckbox(Field $f, string $name, $value): string
    {
        $attrs = self::baseAttrs($f, $name, 'checkbox');
        $attrs['value'] = '1';
        if ($value) $attrs['checked'] = 'checked';
        $label = self::escHtml($f->label);
        return '<label><input ' . self::serializeAttrs($attrs) . '> ' . $label . '</label>'
            . self::descriptionHtml($f);
    }

    /**
     * @param mixed $value
     */
    private static function renderSelect(Field $f, string $name, $value): string
    {
        $attrs = self::baseAttrs($f, $name, null);
        $opts = '';
        $current = self::stringify($value);
        foreach ($f->options as $opt) {
            $selected = ((string) $opt['value']) === $current ? ' selected' : '';
            $opts .= '<option value="' . self::escAttr((string) $opt['value']) . '"' . $selected . '>'
                . self::escHtml((string) $opt['label']) . '</option>';
        }
        return '<select ' . self::serializeAttrs($attrs) . '>' . $opts . '</select>'
            . self::descriptionHtml($f);
    }

    /**
     * @return array<string, string>
     */
    private static function baseAttrs(Field $f, string $name, ?string $type): array
    {
        $attrs = [
            'id'   => self::idFromName($name),
            'name' => $name,
        ];
        if ($type !== null) $attrs['type'] = $type;
        if ($f->required) $attrs['required'] = 'required';
        // Mirror the WP admin class names so the rendered form matches
        // native Settings API output and inherits color schemes.
        $attrs['class'] = self::cssClass($f);
        return $attrs;
    }

    private static function cssClass(Field $f): string
    {
        switch ($f->type) {
            case Field::TYPE_TEXTAREA: return 'large-text';
            case Field::TYPE_CHECKBOX: return '';
            case Field::TYPE_SELECT:   return '';
            default:                    return 'regular-text';
        }
    }

    private static function idFromName(string $name): string
    {
        // Convert "myplugin[api_key]" → "myplugin-api_key"
        return preg_replace('/[\[\]]+/', '-', rtrim($name, ']')) ?? $name;
    }

    private static function descriptionHtml(Field $f): string
    {
        if ($f->description === '') return '';
        return '<p class="description">' . self::escHtml($f->description) . '</p>';
    }

    /** @param array<string, string> $attrs */
    private static function serializeAttrs(array $attrs): string
    {
        $parts = [];
        foreach ($attrs as $key => $val) {
            $parts[] = $key . '="' . self::escAttr($val) . '"';
        }
        return implode(' ', $parts);
    }

    /** @param mixed $v */
    private static function stringify($v): string
    {
        if ($v === null || $v === false) return '';
        if (is_bool($v)) return $v ? '1' : '';
        if (is_array($v)) return ''; // shouldn't happen for these field types
        return (string) $v;
    }

    private static function escHtml(string $s): string
    {
        return function_exists('esc_html') ? \esc_html($s) : htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private static function escAttr(string $s): string
    {
        return function_exists('esc_attr') ? \esc_attr($s) : htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
