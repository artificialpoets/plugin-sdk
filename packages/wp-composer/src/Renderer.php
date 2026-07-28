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
                $html = self::renderTextarea($field, $name, $value);
                break;
            case Field::TYPE_CHECKBOX:
                $html = self::renderCheckbox($field, $name, $value);
                break;
            case Field::TYPE_SELECT:
                $html = self::renderSelect($field, $name, $value);
                break;
            case Field::TYPE_NUMBER:
                $html = self::renderInput($field, $name, $value, 'number');
                break;
            case Field::TYPE_EMAIL:
                $html = self::renderInput($field, $name, $value, 'email');
                break;
            case Field::TYPE_URL:
                $html = self::renderInput($field, $name, $value, 'url');
                break;
            case Field::TYPE_PASSWORD:
                $html = self::renderInput($field, $name, $value, 'password');
                break;
            case Field::TYPE_LIST:
                $html = self::renderList($field, $name, $value);
                break;
            case Field::TYPE_KEYED_SELECT:
                $html = self::renderKeyedSelect($field, $name, $value);
                break;
            case Field::TYPE_TEXT:
            default:
                $html = self::renderInput($field, $name, $value, 'text');
        }

        // Conditional visibility rides a data-attribute marker; the
        // one-per-page script (showIfScript) toggles the enclosing row.
        if ($field->showIfField !== null) {
            $equals = is_bool($field->showIfEquals)
                ? ($field->showIfEquals ? '1' : '')
                : (string) $field->showIfEquals;
            $html = '<span class="psdk-show-if" data-psdk-controller="'
                . self::escAttr($field->showIfField)
                . '" data-psdk-equals="' . self::escAttr($equals) . '">'
                . $html
                . '</span>';
        }

        return $html;
    }

    /**
     * The tiny vanilla script that powers showIf: for every marker,
     * find the controller input in the same option (sibling name),
     * toggle the marker's table row (fallback: the marker) on change.
     * Emitted once per admin page by Settings when any field uses
     * showIf.
     */
    public static function showIfScript(): string
    {
        return <<<'HTML'
<script>
(function () {
    function controllerValue(el) {
        if (!el) return '';
        if (el.type === 'checkbox') return el.checked ? '1' : '';
        return String(el.value);
    }
    document.querySelectorAll('.psdk-show-if').forEach(function (marker) {
        var input = marker.querySelector('[name]');
        if (!input) return;
        var base = input.getAttribute('name').replace(/\[[^\]]*\]$/, '');
        var controller = document.querySelector('[name="' + base + '[' + marker.dataset.psdkController + ']"]');
        if (!controller) return;
        var row = marker.closest('tr') || marker;
        function sync() {
            row.style.display = controllerValue(controller) === marker.dataset.psdkEquals ? '' : 'none';
        }
        controller.addEventListener('change', sync);
        controller.addEventListener('input', sync);
        sync();
    });
})();
</script>
HTML;
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
     * type='list': a comma-separated text input backed by an array value.
     *
     * @param mixed $value
     */
    private static function renderList(Field $f, string $name, $value): string
    {
        $attrs = self::baseAttrs($f, $name, 'text');
        $attrs['value'] = is_array($value) ? implode(', ', array_map('strval', $value)) : self::stringify($value);
        if ($f->placeholder !== '') $attrs['placeholder'] = $f->placeholder;
        return '<input ' . self::serializeAttrs($attrs) . '>' . self::descriptionHtml($f);
    }

    /**
     * type='keyedSelect': one dropdown per row. Rows = the field's
     * static `rows` map plus any keys already present in the stored
     * value (so dynamically added keys keep their configured policy).
     * Markup uses core's own table classes (widefat/striped) so it
     * inherits the native admin styling — the wp-core-css philosophy.
     *
     * @param mixed $value
     */
    private static function renderKeyedSelect(Field $f, string $name, $value): string
    {
        $stored = is_array($value) ? $value : [];
        $rows = $f->rows;
        foreach (array_keys($stored) as $key) {
            if (!isset($rows[$key])) {
                $rows[(string) $key] = (string) $key;
            }
        }

        if ($rows === []) {
            return '<p class="description">' . self::escHtml($f->placeholder !== '' ? $f->placeholder : 'No rows yet.') . '</p>'
                . self::descriptionHtml($f);
        }

        $html = '<table class="widefat striped psdk-keyed-select"><tbody>';
        foreach ($rows as $key => $label) {
            $key = (string) $key;
            $current = isset($stored[$key]) ? (string) $stored[$key] : self::stringify($f->default);
            $opts = '';
            foreach ($f->options as $opt) {
                $selected = ((string) $opt['value']) === $current ? ' selected' : '';
                $opts .= '<option value="' . self::escAttr((string) $opt['value']) . '"' . $selected . '>'
                    . self::escHtml((string) $opt['label']) . '</option>';
            }
            $rowName = $name . '[' . $key . ']';
            $html .= '<tr><td><code>' . self::escHtml((string) $label) . '</code></td>'
                . '<td><select name="' . self::escAttr($rowName) . '" aria-label="'
                . self::escAttr((string) $label) . '">' . $opts . '</select></td></tr>';
        }
        $html .= '</tbody></table>';

        return $html . self::descriptionHtml($f);
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
