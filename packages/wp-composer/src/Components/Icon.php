<?php
/**
 * Icon — renders an inline SVG icon (modern WordPress direction).
 *
 * Per make.wordpress.org/design/2020/04/20/next-steps-for-dashicons/ —
 * new WordPress UI work uses SVG icons rather than the Dashicons font.
 *
 * This class ships a small curated set of essential icons. For the full
 * Gutenberg icon catalog, supply your own SVG via the `svg_html` option:
 *
 *     echo Components::icon('custom', ['svg_html' => '<path d="…"/>']);
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Icon {

    /** SVG path data for each built-in icon (24×24 viewBox, fill=currentColor). */
    private const PATHS = [
        'plus'            => 'M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z',
        'minus'           => 'M19 11H5v2h14v-2z',
        'close'           => 'M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z',
        'check'           => 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
        'chevron-up'      => 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
        'chevron-down'    => 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
        'chevron-left'    => 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
        'chevron-right'   => 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z',
        'arrow-up'        => 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z',
        'arrow-down'      => 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8z',
        'arrow-left'      => 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
        'arrow-right'     => 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
        'edit'            => 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
        'trash'           => 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
        'search'          => 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
        'more-horizontal' => 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
        'more-vertical'   => 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
        'info'            => 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v2h-2zm0 4h2v6h-2z',
        'warning'         => 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
        'external-link'   => 'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    ];

    /**
     * @param string $name  Name from the built-in set, or any string when supplying $args['svg_html'].
     * @param array<string, mixed> $args {
     *     @var int    $size       Pixel size — default 24.
     *     @var string $label      Accessible label. Omit for decorative icons.
     *     @var string $class      Extra class names.
     *     @var string $svg_html   Custom inner SVG markup (overrides the built-in path).
     *     @var array  $attrs      Extra SVG attributes.
     * }
     */
    public static function render(string $name, array $args = []): string {
        $size      = $args['size']     ?? 24;
        $label     = $args['label']    ?? null;
        $extra_cls = $args['class']    ?? '';
        $custom    = $args['svg_html'] ?? null;
        $extra     = $args['attrs']    ?? [];

        $inner = $custom;
        if ($inner === null) {
            if (!isset(self::PATHS[$name])) {
                // Unknown name and no custom SVG — return empty rather than throw.
                return '';
            }
            $inner = sprintf('<path d="%s" fill="currentColor"/>', Html::esc_attr_value(self::PATHS[$name]));
        }

        $a11y = $label
            ? ['role' => 'img', 'aria-label' => $label]
            : ['aria-hidden' => 'true'];

        $attrs = array_merge($extra, $a11y, [
            'xmlns'   => 'http://www.w3.org/2000/svg',
            'viewBox' => '0 0 24 24',
            'width'   => (string) $size,
            'height'  => (string) $size,
            'class'   => Html::classes(['wp-admin-icon', $extra_cls]),
        ]);

        return Html::tag('svg', $attrs, $inner);
    }

    /**
     * Get the raw path data for a built-in icon, or null if unknown.
     * Useful when you want to compose icons into your own SVG markup.
     */
    public static function path(string $name): ?string {
        return self::PATHS[$name] ?? null;
    }

    /**
     * Return the list of built-in icon names.
     *
     * @return array<int, string>
     */
    public static function names(): array {
        return array_keys(self::PATHS);
    }
}
