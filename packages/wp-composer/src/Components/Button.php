<?php
/**
 * Button — renders <button> or <a> with WordPress admin button classes.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Button {

    /**
     * @param string $label  Button text (will be HTML-escaped). Use `html_label`
     *                       in $args to pass pre-rendered HTML instead (e.g. for
     *                       icons + text).
     * @param array<string, mixed> $args {
     *     @var string $variant     'primary' | 'secondary' | 'link' | 'link-delete'
     *     @var string $size        'small' | 'large' | 'hero'
     *     @var string $type        'button' | 'submit' | 'reset' — default 'button'
     *     @var string $url         If set, renders as <a href=…> instead of <button>.
     *     @var bool   $disabled    Disabled state.
     *     @var string $class       Extra class names to append.
     *     @var array  $attrs       Extra HTML attributes (id, name, data-*…).
     *     @var string $html_label  Pre-rendered HTML inner content. Overrides $label
     *                              and skips escaping. Use for icon + text combos.
     * }
     */
    public static function render(string $label, array $args = []): string {
        $variant   = $args['variant']    ?? null;
        $size      = $args['size']       ?? null;
        $type      = $args['type']       ?? 'button';
        $url       = $args['url']        ?? null;
        $disabled  = !empty($args['disabled']);
        $extra     = $args['attrs']      ?? [];
        $extra_cls = $args['class']      ?? '';
        $html_lbl  = $args['html_label'] ?? null;

        $classes = [];
        if ($variant === 'link' || $variant === 'link-delete') {
            $classes[] = 'button-link';
            if ($variant === 'link-delete') {
                $classes[] = 'button-link-delete';
            }
        } else {
            $classes[] = 'button';
            if ($variant) {
                $classes[] = 'button-' . $variant;
            }
        }
        if ($size) {
            $classes[] = 'button-' . $size;
        }
        if ($extra_cls) {
            $classes[] = $extra_cls;
        }

        $attrs = array_merge($extra, [
            'class' => Html::classes($classes),
        ]);

        $inner = $html_lbl ?? Html::esc($label);

        if ($url !== null) {
            $attrs['href'] = Html::esc_url((string) $url);
            return Html::tag('a', $attrs, $inner);
        }

        $attrs['type'] = $type;
        if ($disabled) {
            $attrs['disabled'] = true;
        }
        return Html::tag('button', $attrs, $inner);
    }
}
