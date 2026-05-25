<?php

declare(strict_types=1);

namespace PluginSDK\WP\REST;

/**
 * Tiny JSON Schema validator — covers the subset Plugin SDK manifests
 * use today (object/string/integer/number/boolean/array, required,
 * properties, enum, format=email/uri, minLength/maxLength, minimum/
 * maximum, pattern, items).
 *
 * Not a full Draft 2020-12 implementation — refs, allOf, conditional
 * schemas (if/then/else) are not supported. oneOf/anyOf land in the
 * codegen-only path, not here. The schema file used by the framework
 * itself is restricted to what's covered here, so manifests that
 * validate clean here will validate clean against any compliant
 * validator.
 *
 * Pure PHP, zero deps. Designed to be unit-testable without WP.
 *
 * @api
 */
final class Schema
{
    /** @var array<string, mixed> */
    private array $schema;

    /**
     * @api
     * @param array<string, mixed> $schema
     */
    public function __construct(array $schema)
    {
        $this->schema = $schema;
    }

    /**
     * Validate a value. Returns an array of human-readable errors;
     * empty array means valid.
     *
     * @api
     * @param mixed $value
     * @return array<int, string>
     */
    public function validate($value, string $path = ''): array
    {
        return $this->validateAgainst($this->schema, $value, $path === '' ? '$' : $path);
    }

    /**
     * @internal
     * @param array<string, mixed> $schema
     * @param mixed $value
     * @return array<int, string>
     */
    private function validateAgainst(array $schema, $value, string $path): array
    {
        $errors = [];

        if (isset($schema['enum']) && is_array($schema['enum'])) {
            if (!in_array($value, $schema['enum'], true)) {
                $errors[] = sprintf('%s: must be one of %s', $path, json_encode($schema['enum']));
                return $errors;
            }
        }

        $type = $schema['type'] ?? null;
        if (is_string($type)) {
            if (!self::typeMatches($type, $value)) {
                $errors[] = sprintf('%s: expected %s, got %s', $path, $type, self::describeType($value));
                return $errors;
            }
        }

        if ($type === 'object' || (is_array($value) && self::isAssoc($value))) {
            $errors = array_merge($errors, $this->validateObject($schema, (array) $value, $path));
        }

        if ($type === 'array' || (is_array($value) && !self::isAssoc($value))) {
            $errors = array_merge($errors, $this->validateArray($schema, (array) $value, $path));
        }

        if ($type === 'string' && is_string($value)) {
            $errors = array_merge($errors, $this->validateString($schema, $value, $path));
        }

        if (($type === 'integer' || $type === 'number') && is_numeric($value)) {
            $errors = array_merge($errors, $this->validateNumber($schema, (float) $value, $path));
        }

        return $errors;
    }

    /**
     * @internal
     * @param array<string, mixed> $schema
     * @param array<string|int, mixed> $value
     * @return array<int, string>
     */
    private function validateObject(array $schema, array $value, string $path): array
    {
        $errors = [];
        $required = $schema['required'] ?? [];
        if (is_array($required)) {
            foreach ($required as $key) {
                if (!is_string($key)) continue;
                if (!array_key_exists($key, $value)) {
                    $errors[] = sprintf('%s.%s: required property missing', $path, $key);
                }
            }
        }
        $properties = $schema['properties'] ?? [];
        if (is_array($properties)) {
            foreach ($properties as $prop => $propSchema) {
                if (!is_string($prop)) continue;
                if (array_key_exists($prop, $value) && is_array($propSchema)) {
                    $errors = array_merge(
                        $errors,
                        $this->validateAgainst($propSchema, $value[$prop], $path . '.' . $prop)
                    );
                }
            }
        }
        $additional = $schema['additionalProperties'] ?? null;
        if ($additional === false && is_array($properties)) {
            foreach ($value as $key => $_) {
                if (!array_key_exists($key, $properties)) {
                    $errors[] = sprintf('%s: unknown property "%s"', $path, $key);
                }
            }
        }
        return $errors;
    }

    /**
     * @internal
     * @param array<string, mixed> $schema
     * @param array<int, mixed> $value
     * @return array<int, string>
     */
    private function validateArray(array $schema, array $value, string $path): array
    {
        $errors = [];
        $items = $schema['items'] ?? null;
        if (is_array($items)) {
            foreach ($value as $i => $entry) {
                $errors = array_merge(
                    $errors,
                    $this->validateAgainst($items, $entry, $path . '[' . $i . ']')
                );
            }
        }
        if (isset($schema['minItems']) && count($value) < (int) $schema['minItems']) {
            $errors[] = sprintf('%s: must have at least %d items', $path, (int) $schema['minItems']);
        }
        if (isset($schema['maxItems']) && count($value) > (int) $schema['maxItems']) {
            $errors[] = sprintf('%s: must have at most %d items', $path, (int) $schema['maxItems']);
        }
        return $errors;
    }

    /**
     * @internal
     * @param array<string, mixed> $schema
     * @return array<int, string>
     */
    private function validateString(array $schema, string $value, string $path): array
    {
        $errors = [];
        if (isset($schema['minLength']) && mb_strlen($value) < (int) $schema['minLength']) {
            $errors[] = sprintf('%s: must be at least %d chars', $path, (int) $schema['minLength']);
        }
        if (isset($schema['maxLength']) && mb_strlen($value) > (int) $schema['maxLength']) {
            $errors[] = sprintf('%s: must be at most %d chars', $path, (int) $schema['maxLength']);
        }
        if (isset($schema['pattern']) && is_string($schema['pattern'])) {
            // Use `#` as the delimiter so we don't need to escape `/`
            // inside the pattern. If the pattern itself contains a `#`
            // (rare), we fall back to `~`.
            $delim = strpos($schema['pattern'], '#') === false ? '#' : '~';
            $regex = $delim . $schema['pattern'] . $delim . 'u';
            if (@preg_match($regex, $value) !== 1) {
                $errors[] = sprintf('%s: does not match required pattern', $path);
            }
        }
        if (isset($schema['format']) && is_string($schema['format'])) {
            switch ($schema['format']) {
                case 'email':
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[] = sprintf('%s: must be a valid email', $path);
                    }
                    break;
                case 'uri':
                case 'url':
                    if (!filter_var($value, FILTER_VALIDATE_URL)) {
                        $errors[] = sprintf('%s: must be a valid URL', $path);
                    }
                    break;
            }
        }
        return $errors;
    }

    /**
     * @internal
     * @param array<string, mixed> $schema
     * @return array<int, string>
     */
    private function validateNumber(array $schema, float $value, string $path): array
    {
        $errors = [];
        if (isset($schema['minimum']) && $value < (float) $schema['minimum']) {
            $errors[] = sprintf('%s: must be >= %s', $path, $schema['minimum']);
        }
        if (isset($schema['maximum']) && $value > (float) $schema['maximum']) {
            $errors[] = sprintf('%s: must be <= %s', $path, $schema['maximum']);
        }
        if (($schema['type'] ?? '') === 'integer' && floor($value) !== $value) {
            $errors[] = sprintf('%s: must be an integer', $path);
        }
        return $errors;
    }

    /**
     * @internal
     * @param mixed $v
     */
    private static function typeMatches(string $type, $v): bool
    {
        switch ($type) {
            case 'string':  return is_string($v);
            case 'integer':
                // JSON Schema treats 5.0 and 5 as the same integer; the
                // fractional-rejection happens in validateNumber.
                if (is_int($v)) return true;
                if (is_float($v)) return true;
                return is_string($v) && ctype_digit($v);
            case 'number':  return is_int($v) || is_float($v) || (is_string($v) && is_numeric($v));
            case 'boolean': return is_bool($v);
            case 'array':   return is_array($v) && !self::isAssoc($v);
            case 'object':  return is_array($v) && (self::isAssoc($v) || $v === []);
            case 'null':    return $v === null;
            default:        return true;
        }
    }

    /**
     * @internal
     * @param mixed $v
     */
    private static function describeType($v): string
    {
        if (is_array($v)) return self::isAssoc($v) ? 'object' : 'array';
        if (is_null($v))  return 'null';
        return gettype($v);
    }

    /**
     * @internal
     * @param array<int|string, mixed> $a
     */
    private static function isAssoc(array $a): bool
    {
        if ($a === []) return false;
        return array_keys($a) !== range(0, count($a) - 1);
    }
}
