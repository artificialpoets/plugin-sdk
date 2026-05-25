<?php
/**
 * Overlay components — Modal, ConfirmDialog, DropdownMenu, Tooltip.
 *
 * PHP emits the markup. Open/close interactivity is the user's responsibility
 * — typically a few lines of vanilla JS that toggle .wp-admin-modal-backdrop
 * visibility, or use HTML5 <dialog>, or wire to a JS framework.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Overlays {

    /**
     * Render a Modal markup. By default it's hidden (display:none via inline
     * style) — flip the style to display:flex from JS to show.
     *
     * @param string $title         Pre-escaped title HTML (use Html::esc()).
     * @param string $body_html     Pre-rendered body HTML.
     * @param array<string, mixed> $args {
     *     @var string $size               'small' | 'medium' | 'large'. Default 'medium'.
     *     @var string $footer_html        Pre-rendered footer (usually buttons).
     *     @var string $id                 Element id for JS to target.
     *     @var bool   $open               Render initially open. Default false.
     *     @var bool   $hide_close_button  Omit the × close button.
     * }
     */
    public static function modal(string $title, string $body_html, array $args = []): string {
        $size              = $args['size'] ?? 'medium';
        $footer            = $args['footer_html'] ?? '';
        $id                = $args['id'] ?? null;
        $open              = !empty($args['open']);
        $hide_close_button = !empty($args['hide_close_button']);

        $header = '';
        if ($title !== '' || !$hide_close_button) {
            $title_html = $title !== ''
                ? Html::tag('h2', ['class' => 'wp-admin-modal__title'], $title)
                : '';
            $close_html = $hide_close_button ? '' : self::close_button();
            $header = Html::tag('header', ['class' => 'wp-admin-modal__header'], $title_html . $close_html);
        }

        $body = Html::tag('div', ['class' => 'wp-admin-modal__body'], $body_html);

        $footer_el = $footer !== ''
            ? Html::tag('footer', ['class' => 'wp-admin-modal__footer'], $footer)
            : '';

        $modal = Html::tag('div', [
            'class' => Html::classes(['wp-admin-modal', 'is-' . $size]),
            'role'  => 'document',
        ], $header . $body . $footer_el);

        $attrs = [
            'class'      => 'wp-admin-modal-backdrop',
            'role'       => 'dialog',
            'aria-modal' => 'true',
            'id'         => $id,
            'style'      => $open ? null : 'display:none',
        ];

        return Html::tag('div', $attrs, $modal);
    }

    /**
     * Render a Confirm Dialog (Modal with title + message + Cancel / Confirm buttons).
     *
     * @param string $title         Title text.
     * @param string $message_html  Pre-rendered message body.
     * @param array<string, mixed> $args {
     *     @var string $confirm_label   Default 'Confirm'.
     *     @var string $cancel_label    Default 'Cancel'.
     *     @var bool   $destructive     Use red filled button for confirm. Default false.
     *     @var string $id              Element id for JS to target.
     *     @var bool   $open            Render initially open.
     *     @var string $confirm_attrs   Extra HTML attributes on the confirm button (e.g. data-action).
     *     @var string $cancel_attrs    Extra HTML attributes on the cancel button.
     * }
     */
    public static function confirm_dialog(string $title, string $message_html, array $args = []): string {
        $confirm_label = $args['confirm_label'] ?? 'Confirm';
        $cancel_label  = $args['cancel_label']  ?? 'Cancel';
        $destructive   = !empty($args['destructive']);

        $cancel = Button::render($cancel_label, [
            'attrs' => array_merge(
                ['data-wpadmin-modal-close' => 'true'],
                isset($args['cancel_attrs']) && is_array($args['cancel_attrs']) ? $args['cancel_attrs'] : []
            ),
        ]);

        $confirm_attrs = isset($args['confirm_attrs']) && is_array($args['confirm_attrs'])
            ? $args['confirm_attrs']
            : [];

        $confirm = Button::render($confirm_label, [
            'variant' => 'primary',
            'class'   => $destructive ? 'is-destructive' : '',
            'attrs'   => $confirm_attrs,
        ]);

        return self::modal($title, $message_html, [
            'size'        => 'small',
            'footer_html' => $cancel . $confirm,
            'id'          => $args['id'] ?? null,
            'open'        => !empty($args['open']),
        ]);
    }

    /**
     * Render a DropdownMenu.
     *
     * @param string $trigger_html   Pre-rendered trigger HTML (e.g. a button).
     * @param array<int, array<string, mixed>> $items {
     *     @var string $key
     *     @var string $label
     *     @var string $href           If set, item renders as <a>.
     *     @var bool   $destructive    Red styling.
     *     @var bool   $disabled
     *     @var bool   $separator      If true, render as <li class="wp-admin-dropdown__separator">.
     * }
     * @param array<string, mixed> $args {
     *     @var string $align   'left' | 'right'. Default 'left'.
     *     @var bool   $open    Render initially open.
     * }
     */
    public static function dropdown_menu(string $trigger_html, array $items, array $args = []): string {
        $align = $args['align'] ?? 'left';
        $open  = !empty($args['open']);

        $items_html = '';
        foreach ($items as $item) {
            if (!empty($item['separator'])) {
                $items_html .= Html::tag('li', [
                    'class' => 'wp-admin-dropdown__separator',
                    'role'  => 'separator',
                ], '');
                continue;
            }
            $cls = Html::classes([
                'wp-admin-dropdown__item',
                !empty($item['destructive']) ? 'is-destructive' : '',
            ]);
            $label = Html::esc($item['label'] ?? '');
            if (isset($item['href'])) {
                $link = Html::tag('a', [
                    'class' => $cls,
                    'href'  => Html::esc_url((string) $item['href']),
                    'role'  => 'menuitem',
                ], $label);
            } else {
                $link = Html::tag('button', [
                    'type'     => 'button',
                    'class'    => $cls,
                    'role'     => 'menuitem',
                    'disabled' => !empty($item['disabled']),
                ], $label);
            }
            $items_html .= Html::tag('li', ['role' => 'none'], $link);
        }

        $menu = Html::tag('ul', [
            'class'  => Html::classes(['wp-admin-dropdown__menu', $align === 'right' ? 'is-right' : '']),
            'role'   => 'menu',
            'hidden' => $open ? false : true,
        ], $items_html);

        return Html::tag('div', ['class' => 'wp-admin-dropdown'], $trigger_html . $menu);
    }

    /**
     * Wrap any HTML element with a CSS-only hover/focus tooltip.
     *
     * @param string $child_html  Pre-rendered child HTML.
     * @param string $tip_text    Tooltip text (will be escaped).
     */
    public static function tooltip(string $child_html, string $tip_text): string {
        $content = Html::tag('span', [
            'class' => 'wp-admin-tooltip__content',
            'role'  => 'tooltip',
        ], Html::esc($tip_text));
        return Html::tag('span', [
            'class'    => 'wp-admin-tooltip',
            'tabindex' => '0',
        ], $child_html . $content);
    }

    private static function close_button(): string {
        $svg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
             . '<path d="M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z"/>'
             . '</svg>';
        return Html::tag('button', [
            'type'                       => 'button',
            'class'                      => 'wp-admin-modal__close',
            'aria-label'                 => 'Close',
            'data-wpadmin-modal-close'   => 'true',
        ], $svg);
    }
}
