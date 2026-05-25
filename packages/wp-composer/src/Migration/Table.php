<?php

declare(strict_types=1);

namespace PluginSDK\WP\Migration;

/**
 * A single table — name, columns, indexes.
 *
 * Renders to a dbDelta-compatible CREATE TABLE statement. dbDelta is
 * picky about the SQL it accepts (KEY not INDEX, two spaces after
 * PRIMARY KEY, exact column type capitalisation), so the renderer
 * encodes those quirks rather than letting the user trip on them.
 *
 * @api
 */
final class Table
{
    public string $name;
    /** @var array<int, array<string, mixed>> */
    public array $columns;
    /** @var array<int, array<string, mixed>> */
    public array $indexes;

    /**
     * @api
     * @param array<int, array<string, mixed>> $columns
     * @param array<int, array<string, mixed>> $indexes
     */
    public function __construct(string $name, array $columns, array $indexes = [])
    {
        $this->name    = $name;
        $this->columns = $columns;
        $this->indexes = $indexes;
    }

    /**
     * Render the CREATE TABLE statement.
     *
     * @api
     * @param string $fullName The fully-qualified table name including WP
     *                         prefix. The caller supplies this so the
     *                         Table itself stays unaware of $wpdb.
     * @param string $charsetCollate dbDelta-compatible suffix.
     *                                Empty by default for tests.
     */
    public function toSql(string $fullName, string $charsetCollate = ''): string
    {
        $lines = [];
        $primary = [];
        foreach ($this->columns as $col) {
            $lines[] = $this->columnLine($col);
            if (!empty($col['primary'])) {
                $primary[] = (string) $col['name'];
            }
        }
        if ($primary !== []) {
            // dbDelta requires exactly two spaces inside PRIMARY KEY (col)
            $lines[] = sprintf('PRIMARY KEY  (%s)', implode(', ', $primary));
        }
        foreach ($this->indexes as $idx) {
            $cols = implode(', ', array_map('strval', $idx['columns'] ?? []));
            $kind = !empty($idx['unique']) ? 'UNIQUE KEY' : 'KEY';
            $lines[] = sprintf('%s %s (%s)', $kind, (string) $idx['name'], $cols);
        }
        $body = implode(",\n  ", $lines);
        $suffix = $charsetCollate === '' ? '' : ' ' . $charsetCollate;
        return "CREATE TABLE $fullName (\n  $body\n)$suffix;";
    }

    /**
     * @internal
     * @param array<string, mixed> $col
     */
    private function columnLine(array $col): string
    {
        $parts = [(string) $col['name'], (string) $col['type']];
        if (!empty($col['notNull']) || !empty($col['primary'])) {
            $parts[] = 'NOT NULL';
        }
        if (!empty($col['autoIncrement'])) {
            $parts[] = 'AUTO_INCREMENT';
        }
        if (!empty($col['unique']) && empty($col['primary'])) {
            $parts[] = 'UNIQUE';
        }
        if (array_key_exists('default', $col) && $col['default'] !== null) {
            $parts[] = 'DEFAULT ' . $this->renderDefault($col['default']);
        }
        return implode(' ', $parts);
    }

    /**
     * @internal
     * @param mixed $value
     */
    private function renderDefault($value): string
    {
        if (is_bool($value)) return $value ? '1' : '0';
        if (is_int($value) || is_float($value)) return (string) $value;
        if (is_string($value)) {
            // SQL constants stay unquoted; everything else gets quoted.
            $upper = strtoupper($value);
            if (in_array($upper, ['CURRENT_TIMESTAMP', 'NULL', 'NOW()'], true)) {
                return $upper;
            }
            return "'" . str_replace("'", "''", $value) . "'";
        }
        return 'NULL';
    }

    /**
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $name = (string) ($data['name'] ?? '');
        if ($name === '') {
            throw new \InvalidArgumentException('Table.name is required');
        }
        $columns = $data['columns'] ?? [];
        if (!is_array($columns) || $columns === []) {
            throw new \InvalidArgumentException('Table.columns must be a non-empty array');
        }
        $indexes = $data['indexes'] ?? [];
        if (!is_array($indexes)) $indexes = [];

        // Normalise: ensure name/type strings exist.
        $normColumns = [];
        foreach ($columns as $col) {
            if (!is_array($col)) {
                throw new \InvalidArgumentException('Each column must be an object');
            }
            if (!isset($col['name']) || !is_string($col['name']) || $col['name'] === '') {
                throw new \InvalidArgumentException('Each column requires a name');
            }
            if (!isset($col['type']) || !is_string($col['type']) || $col['type'] === '') {
                throw new \InvalidArgumentException("Column {$col['name']} requires a type");
            }
            $normColumns[] = $col;
        }

        return new self($name, $normColumns, $indexes);
    }
}
