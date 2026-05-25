<?php
/**
 * List-table primitives — ListTable wrapper, BulkActions, SearchBox, Pagination, EmptyState.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Tables {

    /**
     * Wrap rows in <table class="wp-list-table widefat fixed striped">.
     *
     * @param string $inner_html  The <thead>…</thead><tbody>…</tbody> markup.
     */
    public static function list_table(string $inner_html, array $args = []): string {
        $classes = Html::classes([
            'wp-list-table',
            ($args['widefat'] ?? true) ? 'widefat' : '',
            ($args['fixed'] ?? true) ? 'fixed' : '',
            ($args['striped'] ?? true) ? 'striped' : '',
        ]);
        return Html::tag('table', ['class' => $classes], $inner_html);
    }

    /**
     * Render hover-revealed row actions.
     *
     * @param array<int, array{key: string, label: string, href: string, variant?: string}> $actions
     */
    public static function row_actions(array $actions): string {
        $total  = count($actions);
        $inner  = '';
        foreach ($actions as $i => $action) {
            $last = ($i === $total - 1);
            $cls  = ($action['variant'] ?? '') === 'delete' ? 'submitdelete' : null;
            $link = Html::tag('a', [
                'href'  => Html::esc_url($action['href']),
                'class' => $cls,
            ], Html::esc($action['label']));
            $inner .= Html::tag('span', ['class' => $action['key']], $link . ($last ? '' : ' | '));
        }
        return Html::tag('div', ['class' => 'row-actions'], $inner);
    }

    /**
     * Render the bulk-actions toolbar above a list table.
     *
     * @param array<string, string> $actions  value => label map.
     */
    public static function bulk_actions(array $actions, array $args = []): string {
        $name = $args['name'] ?? 'action';
        $position = $args['position'] ?? 'top';
        $apply_label = $args['apply_label'] ?? 'Apply';

        $options = '<option value="-1">' . Html::esc('Bulk actions') . '</option>';
        foreach ($actions as $value => $label) {
            $options .= Html::tag('option', ['value' => $value], Html::esc($label));
        }

        $controls = Html::tag('label', [
            'class' => 'screen-reader-text',
            'for'   => 'bulk-' . $name,
        ], 'Select bulk action');

        $controls .= Html::tag('select', ['id' => 'bulk-' . $name, 'name' => $name], $options);

        $controls .= Html::tag('button', [
            'type'  => 'submit',
            'class' => 'button action',
        ], Html::esc($apply_label));

        return Html::tag('div', ['class' => Html::classes(['tablenav', $position])],
            Html::tag('div', ['class' => 'alignleft actions bulkactions'], $controls)
        );
    }

    /**
     * Render the search box above a list table.
     */
    public static function search_box(array $args = []): string {
        $name         = $args['name']        ?? 's';
        $id           = $args['id']          ?? 'post-search-input';
        $label        = $args['label']       ?? 'Search:';
        $button_label = $args['button_label'] ?? 'Search';
        $value        = $args['value']       ?? '';
        $placeholder  = $args['placeholder'] ?? '';

        $inner  = Html::tag('label', ['class' => 'screen-reader-text', 'for' => $id], Html::esc($label));
        $inner .= Html::tag('input', [
            'type'        => 'search',
            'id'          => $id,
            'name'        => $name,
            'value'       => $value,
            'placeholder' => $placeholder,
        ], '', true);
        $inner .= Html::tag('button', ['type' => 'submit', 'class' => 'button'], Html::esc($button_label));

        return Html::tag('p', ['class' => 'search-box'], $inner);
    }

    /**
     * Render the list-table pagination control.
     *
     * @param array<string, mixed> $args {
     *     @var int    $total_items   Total item count.
     *     @var int    $page          Current page (1-based).
     *     @var int    $total_pages   Total page count.
     *     @var string $item_label    Label for the total. Default 'items'.
     *     @var string $base_url      Base href; gets `?paged=N` appended. Default '?'.
     * }
     */
    public static function pagination(array $args = []): string {
        $total_items = (int) ($args['total_items'] ?? 0);
        $page        = max(1, (int) ($args['page'] ?? 1));
        $total_pages = max(1, (int) ($args['total_pages'] ?? 1));
        $item_label  = $args['item_label'] ?? 'items';
        $base_url    = $args['base_url']   ?? '';

        $href = static function (int $p) use ($base_url): string {
            $sep = (strpos($base_url, '?') !== false) ? '&' : '?';
            return ($base_url ?: '') . $sep . 'paged=' . $p;
        };

        $has_prev = $page > 1;
        $has_next = $page < $total_pages;

        $first_link = Html::tag('a', [
            'class' => Html::classes(['first-page', 'button', $has_prev ? '' : 'disabled']),
            'href'  => Html::esc_url($href(1)),
        ], '<span aria-hidden="true">«</span>');
        $prev_link  = Html::tag('a', [
            'class' => Html::classes(['prev-page', 'button', $has_prev ? '' : 'disabled']),
            'href'  => Html::esc_url($href(max(1, $page - 1))),
        ], '<span aria-hidden="true">‹</span>');
        $next_link  = Html::tag('a', [
            'class' => Html::classes(['next-page', 'button', $has_next ? '' : 'disabled']),
            'href'  => Html::esc_url($href(min($total_pages, $page + 1))),
        ], '<span aria-hidden="true">›</span>');
        $last_link  = Html::tag('a', [
            'class' => Html::classes(['last-page', 'button', $has_next ? '' : 'disabled']),
            'href'  => Html::esc_url($href($total_pages)),
        ], '<span aria-hidden="true">»</span>');

        $paging_input = Html::tag('span', ['class' => 'paging-input'],
            Html::tag('span', ['class' => 'tablenav-paging-text'],
                $page . ' of ' . Html::tag('span', ['class' => 'total-pages'], (string) $total_pages)
            )
        );

        return Html::tag('div', ['class' => 'tablenav-pages'],
            Html::tag('span', ['class' => 'displaying-num'],
                Html::esc($total_items . ' ' . $item_label)
            ) .
            Html::tag('span', ['class' => 'pagination-links'],
                $first_link . $prev_link . $paging_input . $next_link . $last_link
            )
        );
    }

    /**
     * Render an empty-state placeholder.
     *
     * @param array<string, mixed> $args {
     *     @var string $icon          Icon character or HTML. Default '∅'.
     *     @var string $title         Heading text.
     *     @var string $description   Body text.
     *     @var array  $action        ['label' => string, 'href' => string]
     * }
     */
    public static function empty_state(array $args = []): string {
        $icon  = $args['icon']  ?? '∅';
        $title = $args['title'] ?? '';
        $desc  = $args['description'] ?? '';
        $cta   = $args['action'] ?? null;

        $inner  = Html::tag('div', ['class' => 'wp-admin-empty__icon'], Html::esc($icon));
        $inner .= Html::tag('div', ['class' => 'wp-admin-empty__title'], Html::esc($title));
        if ($desc !== '') {
            $inner .= Html::tag('div', ['class' => 'wp-admin-empty__description'], Html::esc($desc));
        }
        if (is_array($cta)) {
            $inner .= Html::tag('a', [
                'href'  => Html::esc_url($cta['href']),
                'class' => 'button button-primary',
            ], Html::esc($cta['label']));
        }
        return Html::tag('div', ['class' => 'wp-admin-empty'], $inner);
    }
}
