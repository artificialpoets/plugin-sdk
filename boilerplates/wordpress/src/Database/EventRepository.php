<?php
/**
 * EventRepository — domain queries against the events table.
 *
 * Demonstrates safe $wpdb usage with prepared statements (`%s`, `%d`)
 * and identifier placeholders (`%i`, WordPress 6.2+). Each public
 * method is one query; centralising the SQL here keeps the rest of
 * the plugin from ever touching $wpdb directly.
 *
 * Read this file as the template for your own table-backed repositories.
 */

declare(strict_types=1);

namespace PluginSDK\Starter\Database;

final class EventRepository {

    /**
     * Insert a new event row.
     *
     * @return int|false The new row's ID on success, false on failure.
     */
    public function create( array $data ) {
        global $wpdb;

        $defaults = array(
            'user_id'    => get_current_user_id(),
            'event_type' => '',
            'payload'    => null,
            'status'     => 'pending',
        );
        $data     = wp_parse_args( $data, $defaults );

        // $wpdb->insert IS the correct API for a row insert into a
        // custom table — there is no higher-level WP wrapper for tables
        // outside the core schema. Caching is irrelevant for writes.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $inserted = $wpdb->insert(
            Schema::events_table(),
            array(
                'user_id'    => (int) $data['user_id'],
                'event_type' => sanitize_key( $data['event_type'] ),
                'payload'    => is_string( $data['payload'] ) ? $data['payload'] : wp_json_encode( $data['payload'] ),
                'status'     => sanitize_key( $data['status'] ),
                'created_at' => current_time( 'mysql', true ),
            ),
            array( '%d', '%s', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return false;
        }

        return (int) $wpdb->insert_id;
    }

    /** Find one event by ID, or null if missing. */
    public function find( int $id ) {
        global $wpdb;

        // Custom-table read; no higher-level WP wrapper exists. Caching
        // is the caller's concern (a real plugin would wrap this in
        // wp_cache_get/set when the row is read repeatedly).
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $row = $wpdb->get_row(
            $wpdb->prepare(
                'SELECT * FROM %i WHERE id = %d',
                Schema::events_table(),
                $id
            )
        );
        return $row ? $row : null;
    }

    /**
     * List events, optionally filtered by status, with pagination.
     *
     * @return array{rows: array<int, object>, total: int}
     */
    public function list( string $status = '', int $page = 1, int $per_page = 20 ): array {
        global $wpdb;
        $table = Schema::events_table();

        $offset = max( 0, ( $page - 1 ) * $per_page );

        if ( '' !== $status ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $total = (int) $wpdb->get_var(
                $wpdb->prepare(
                    'SELECT COUNT(*) FROM %i WHERE status = %s',
                    $table,
                    sanitize_key( $status )
                )
            );
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    'SELECT * FROM %i WHERE status = %s ORDER BY created_at DESC LIMIT %d OFFSET %d',
                    $table,
                    sanitize_key( $status ),
                    $per_page,
                    $offset
                )
            );
        } else {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $total = (int) $wpdb->get_var(
                $wpdb->prepare( 'SELECT COUNT(*) FROM %i', $table )
            );
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    'SELECT * FROM %i ORDER BY created_at DESC LIMIT %d OFFSET %d',
                    $table,
                    $per_page,
                    $offset
                )
            );
        }

        return array(
            'rows'  => $rows ? $rows : array(),
            'total' => $total,
        );
    }

    /** Update a row's status. Returns rows affected. */
    public function update_status( int $id, string $status ): int {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $affected = $wpdb->update(
            Schema::events_table(),
            array(
                'status'     => sanitize_key( $status ),
                'updated_at' => current_time( 'mysql', true ),
            ),
            array( 'id' => $id ),
            array( '%s', '%s' ),
            array( '%d' )
        );
        return (int) $affected;
    }

    /** Delete a row by ID. Returns rows affected. */
    public function delete( int $id ): int {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        return (int) $wpdb->delete( Schema::events_table(), array( 'id' => $id ), array( '%d' ) );
    }
}
