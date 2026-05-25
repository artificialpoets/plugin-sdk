<?php
/**
 * EventRepository — domain queries against the wpacs_events table.
 *
 * Demonstrates safe $wpdb usage with prepared statements.
 */

declare(strict_types=1);

namespace PluginSDK\Starter\Database;

final class EventRepository {

    /**
     * Insert a new event row.
     *
     * @return int|false The new row's ID on success, false on failure.
     */
    public function create(array $data): int|false {
        global $wpdb;

        $defaults = [
            'user_id'    => get_current_user_id(),
            'event_type' => '',
            'payload'    => null,
            'status'     => 'pending',
        ];
        $data = wp_parse_args($data, $defaults);

        $inserted = $wpdb->insert(
            Schema::events_table(),
            [
                'user_id'    => (int) $data['user_id'],
                'event_type' => sanitize_key($data['event_type']),
                'payload'    => is_string($data['payload']) ? $data['payload'] : wp_json_encode($data['payload']),
                'status'     => sanitize_key($data['status']),
                'created_at' => current_time('mysql', true),  // UTC
            ],
            ['%d', '%s', '%s', '%s', '%s']
        );

        if ($inserted === false) {
            error_log('WPACS event insert failed: ' . $wpdb->last_error);
            return false;
        }

        return (int) $wpdb->insert_id;
    }

    /** Find one event by ID, or null if missing. */
    public function find(int $id): ?object {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare(
            'SELECT * FROM ' . Schema::events_table() . ' WHERE id = %d',
            $id
        ));
        return $row ?: null;
    }

    /**
     * List events, optionally filtered by status, with pagination.
     *
     * @return array{rows: array<int, object>, total: int}
     */
    public function list(string $status = '', int $page = 1, int $per_page = 20): array {
        global $wpdb;
        $table = Schema::events_table();

        $where     = '';
        $where_arg = [];
        if ($status !== '') {
            $where = 'WHERE status = %s';
            $where_arg[] = sanitize_key($status);
        }

        $offset = max(0, ($page - 1) * $per_page);

        // Total count
        $count_sql = "SELECT COUNT(*) FROM $table $where";
        $total = (int) ($where_arg
            ? $wpdb->get_var($wpdb->prepare($count_sql, ...$where_arg))
            : $wpdb->get_var($count_sql));

        // Paged rows
        $list_sql = "SELECT * FROM $table $where ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $list_args = array_merge($where_arg, [$per_page, $offset]);
        $rows = $wpdb->get_results($wpdb->prepare($list_sql, ...$list_args));

        return ['rows' => $rows ?: [], 'total' => $total];
    }

    /** Update a row's status. Returns rows affected. */
    public function update_status(int $id, string $status): int {
        global $wpdb;
        $affected = $wpdb->update(
            Schema::events_table(),
            ['status' => sanitize_key($status), 'updated_at' => current_time('mysql', true)],
            ['id' => $id],
            ['%s', '%s'],
            ['%d']
        );
        return (int) $affected;
    }

    /** Delete a row by ID. Returns rows affected. */
    public function delete(int $id): int {
        global $wpdb;
        return (int) $wpdb->delete(Schema::events_table(), ['id' => $id], ['%d']);
    }
}
