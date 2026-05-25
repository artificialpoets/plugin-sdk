<?php
/**
 * HTML tag helper — escapes attributes and concatenates classes safely.
 *
 * Public surface used by the Components facade and by plugin code that
 * needs to escape a string when assembling pre-rendered HTML to pass to
 * one of the *_html-accepting methods on {@see Components}.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP;

final class Html {

    /**
     * Build an HTML tag string.
     *
     * @api
     * @param string                 $tag       The HTML tag name (button, div, …).
     * @param array<string, mixed>   $attrs     Attribute key/value map. Pass `true` for boolean attributes, `false`/`null` to omit.
     * @param string                 $inner     Already-escaped inner HTML. Pass an empty string for void elements.
     * @param bool                   $void      If true, render as a self-closing/void tag (no closing tag).
     */
    public static function tag(string $tag, array $attrs = [], string $inner = '', bool $void = false): string {
        $attr_str = '';
        foreach ($attrs as $key => $value) {
            if ($value === false || $value === null) {
                continue;
            }
            if ($value === true) {
                $attr_str .= ' ' . self::esc_attr_name($key);
                continue;
            }
            $attr_str .= sprintf(
                ' %s="%s"',
                self::esc_attr_name($key),
                self::esc_attr_value((string) $value)
            );
        }
        if ($void) {
            return sprintf('<%s%s>', $tag, $attr_str);
        }
        return sprintf('<%s%s>%s</%s>', $tag, $attr_str, $inner, $tag);
    }

    /**
     * Merge a list of class candidates into a single class string, dropping falsy values.
     *
     * @api
     * @param array<int|string, string|false|null> $classes
     */
    public static function classes(array $classes): string {
        $clean = array_filter($classes, static fn($c) => is_string($c) && $c !== '');
        return implode(' ', $clean);
    }

    /**
     * Escape text for placement inside an HTML element.
     *
     * @api
     */
    public static function esc(string $text): string {
        if (function_exists('esc_html')) {
            return esc_html($text);
        }
        return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
    }

    /**
     * Escape an attribute value.
     *
     * @api
     */
    public static function esc_attr_value(string $value): string {
        if (function_exists('esc_attr')) {
            return esc_attr($value);
        }
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
    }

    /**
     * Escape a URL.
     *
     * @api
     */
    public static function esc_url(string $url): string {
        if (function_exists('esc_url')) {
            return esc_url($url);
        }
        return self::esc_attr_value($url);
    }

    /**
     * Sanitize an attribute name to allow only safe characters.
     *
     * @internal
     */
    private static function esc_attr_name(string $name): string {
        return preg_replace('/[^a-zA-Z0-9_:\-]/', '', $name) ?? '';
    }
}
