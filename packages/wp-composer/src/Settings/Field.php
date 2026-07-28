<?php

declare(strict_types=1);

namespace PluginSDK\WP\Settings;

/**
 * Single settings field — type, label, sanitizer.
 *
 * Stays as a plain immutable value object so the runtime can serialize
 * it back to the manifest shape and so tests can introspect without
 * mocking WordPress.
 *
 * @api
 */
final class Field
{
    /** @api */
    public const TYPE_TEXT     = 'text';
    /** @api */
    public const TYPE_TEXTAREA = 'textarea';
    /** @api */
    public const TYPE_EMAIL    = 'email';
    /** @api */
    public const TYPE_URL      = 'url';
    /** @api */
    public const TYPE_NUMBER   = 'number';
    /** @api */
    public const TYPE_CHECKBOX = 'checkbox';
    /** @api */
    public const TYPE_SELECT   = 'select';
    /** @api */
    public const TYPE_PASSWORD = 'password';
    /**
     * Comma-separated list — renders as a text input, stores an array of
     * trimmed, de-duplicated strings.
     *
     * @api
     */
    public const TYPE_LIST = 'list';
    /**
     * A table of rows, one select per row: the field's `rows` map (key →
     * row label) plus any keys already present in the stored value each
     * get a dropdown of the field's options. Stores an assoc array of
     * key → selected option value.
     *
     * @api
     */
    public const TYPE_KEYED_SELECT = 'keyedSelect';

    public string $id;
    public string $label;
    public string $type;
    public string $description;
    public string $placeholder;
    public bool $required;
    /** @var mixed */
    public $default;
    /** @var array<int, array{value: string|int, label: string}> */
    public array $options;
    public ?float $min;
    public ?float $max;
    public ?float $step;
    /** Sibling field id controlling this field's visibility; null = always shown. */
    public ?string $showIfField;
    /** @var mixed Value the controller must hold for this field to show. */
    public $showIfEquals;
    /** @var array<string, string> Static row map for keyedSelect (key → label). */
    public array $rows;

    /**
     * @api
     * @param mixed                                                    $default
     * @param array<int, string|array{value: string|int, label: string}> $options
     * @param mixed                                                    $showIfEquals
     * @param array<string, string>                                    $rows
     */
    public function __construct(
        string $id,
        string $label,
        string $type = self::TYPE_TEXT,
        string $description = '',
        string $placeholder = '',
        bool $required = false,
        $default = null,
        array $options = [],
        ?float $min = null,
        ?float $max = null,
        ?float $step = null,
        ?string $showIfField = null,
        $showIfEquals = true,
        array $rows = []
    ) {
        $this->id           = $id;
        $this->label        = $label;
        $this->type         = $type;
        $this->description  = $description;
        $this->placeholder  = $placeholder;
        $this->required     = $required;
        $this->default      = $default;
        $this->options      = self::normalizeOptions($options);
        $this->min          = $min;
        $this->max          = $max;
        $this->step         = $step;
        $this->showIfField  = $showIfField;
        $this->showIfEquals = $showIfEquals;
        $this->rows         = $rows;
    }

    /**
     * Run an inbound value through the right sanitizer for this field.
     * Pure PHP — no calls into WordPress; safe to unit-test directly.
     *
     * @api
     * @param mixed $value
     * @return mixed
     */
    public function sanitize($value)
    {
        // Checkboxes have a special case: an unchecked box doesn't get
        // submitted at all (the field arrives as null). Treat that as
        // boolean false rather than falling through to the default.
        if ($this->type === self::TYPE_CHECKBOX) {
            return self::toBool($value);
        }

        if ($value === null) {
            return $this->default;
        }

        switch ($this->type) {

            case self::TYPE_NUMBER:
                if ($value === '' || $value === null) return $this->default;
                $n = is_numeric($value) ? (float) $value : 0.0;
                if ($this->min !== null && $n < $this->min) $n = $this->min;
                if ($this->max !== null && $n > $this->max) $n = $this->max;
                return $n;

            case self::TYPE_EMAIL:
                // Strip tags first so HTML-contaminated submissions
                // (e.g. wrapped in a paste from an editor) still validate
                // their underlying address rather than failing outright.
                $s = is_string($value) ? trim(strip_tags($value)) : '';
                return filter_var($s, FILTER_VALIDATE_EMAIL) ? $s : '';

            case self::TYPE_URL:
                $s = is_string($value) ? trim(strip_tags($value)) : '';
                return filter_var($s, FILTER_VALIDATE_URL) ? $s : '';

            case self::TYPE_SELECT:
                $s = is_scalar($value) ? (string) $value : '';
                foreach ($this->options as $opt) {
                    if ((string) $opt['value'] === $s) return $opt['value'];
                }
                return $this->default;

            case self::TYPE_TEXTAREA:
                return is_string($value) ? self::stripTags($value, multiline: true) : '';

            case self::TYPE_LIST:
                return self::toList($value);

            case self::TYPE_KEYED_SELECT:
                return $this->toKeyedMap($value);

            case self::TYPE_PASSWORD:
                // Passwords aren't HTML-stripped — they may contain any char.
                // We only trim and reject control characters.
                $s = is_string($value) ? $value : '';
                return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s);

            case self::TYPE_TEXT:
            default:
                return is_string($value) ? self::stripTags($value) : '';
        }
    }

    /**
     * Validate a sanitized value against the field's constraints.
     * Returns null on success, or a human-readable error string.
     *
     * @api
     * @param mixed $value
     */
    public function validate($value): ?string
    {
        if ($this->required) {
            if ($value === null || $value === '' || $value === false || $value === []) {
                return sprintf('Field "%s" is required', $this->label);
            }
        }
        if ($this->type === self::TYPE_EMAIL && $value !== '' && $value !== null) {
            if (!is_string($value) || !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                return sprintf('Field "%s" must be a valid email', $this->label);
            }
        }
        if ($this->type === self::TYPE_URL && $value !== '' && $value !== null) {
            if (!is_string($value) || !filter_var($value, FILTER_VALIDATE_URL)) {
                return sprintf('Field "%s" must be a valid URL', $this->label);
            }
        }
        if ($this->type === self::TYPE_SELECT && $value !== null && $value !== '') {
            foreach ($this->options as $opt) {
                if ((string) $opt['value'] === (string) $value) return null;
            }
            return sprintf('Field "%s" has an invalid selection', $this->label);
        }
        return null;
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $out = [
            'id'          => $this->id,
            'label'       => $this->label,
            'type'        => $this->type,
            'description' => $this->description,
            'placeholder' => $this->placeholder,
            'required'    => $this->required,
            'default'     => $this->default,
            'options'     => $this->options,
            'min'         => $this->min,
            'max'         => $this->max,
            'step'        => $this->step,
        ];
        // Additive keys appear only when used, so pre-existing manifests
        // round-trip byte-identically.
        if ($this->showIfField !== null) {
            $out['showIf'] = ['field' => $this->showIfField, 'equals' => $this->showIfEquals];
        }
        if ($this->rows !== []) {
            $out['rows'] = $this->rows;
        }
        return $out;
    }

    /**
     * @internal
     * @param array<int, string|array{value: string|int, label: string}> $opts
     * @return array<int, array{value: string|int, label: string}>
     */
    private static function normalizeOptions(array $opts): array
    {
        $out = [];
        foreach ($opts as $opt) {
            if (is_string($opt)) {
                $out[] = ['value' => $opt, 'label' => $opt];
                continue;
            }
            if (is_array($opt) && isset($opt['value']) && isset($opt['label'])) {
                $out[] = ['value' => $opt['value'], 'label' => (string) $opt['label']];
            }
        }
        return $out;
    }

    /**
     * Lightweight tag stripper. Mirrors WP's sanitize_text_field /
     * sanitize_textarea_field in shape so unit tests don't need the WP
     * runtime, but real plugins should call this through Settings::save
     * which delegates to the WP equivalents when WordPress is present.
     *
     * @internal
     * @param bool $multiline keep newlines when true
     */
    private static function stripTags(string $s, bool $multiline = false): string
    {
        $s = strip_tags($s);
        // Remove control chars except tab + newline; collapse runs of WS
        // unless multiline (where line breaks are meaningful).
        $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s) ?? $s;
        if (!$multiline) {
            $s = preg_replace('/\s+/u', ' ', $s) ?? $s;
        } else {
            // Normalise CRLF to LF, collapse 3+ blank lines.
            $s = str_replace(["\r\n", "\r"], "\n", $s);
            $s = preg_replace('/\n{3,}/u', "\n\n", $s) ?? $s;
        }
        return trim($s);
    }

    /**
     * Comma-separated string (or already-array) → clean string list:
     * tags stripped, trimmed, empties dropped, case-insensitive dedupe.
     *
     * @internal
     * @param mixed $v
     * @return array<int, string>
     */
    private static function toList($v): array
    {
        $pieces = is_array($v) ? $v : explode(',', is_string($v) ? $v : '');
        $seen = [];
        $out = [];
        foreach ($pieces as $piece) {
            if (!is_scalar($piece)) continue;
            $item = trim(strip_tags((string) $piece));
            if ($item === '' || strlen($item) > 200) continue;
            $key = strtolower($item);
            if (isset($seen[$key])) continue;
            $seen[$key] = true;
            $out[] = $item;
        }
        return $out;
    }

    /**
     * Assoc submission → clean key/value map: keys trimmed + tag-
     * stripped, values must be one of the field's options.
     *
     * @internal
     * @param mixed $v
     * @return array<string, string|int>
     */
    private function toKeyedMap($v): array
    {
        if (!is_array($v)) return [];
        $out = [];
        foreach ($v as $key => $value) {
            $key = trim(strip_tags((string) $key));
            if ($key === '' || strlen($key) > 200) continue;
            foreach ($this->options as $opt) {
                if ((string) $opt['value'] === (string) $value) {
                    $out[$key] = $opt['value'];
                    break;
                }
            }
        }
        return $out;
    }

    /**
     * @internal
     * @param mixed $v
     */
    private static function toBool($v): bool
    {
        if (is_bool($v)) return $v;
        if (is_int($v)) return $v !== 0;
        if (is_string($v)) {
            $l = strtolower(trim($v));
            return in_array($l, ['1', 'true', 'on', 'yes'], true);
        }
        return false;
    }
}
