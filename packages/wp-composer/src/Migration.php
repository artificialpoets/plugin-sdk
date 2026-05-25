<?php

declare(strict_types=1);

namespace PluginSDK\WP;

use PluginSDK\WP\Migration\Table;

/**
 * Migration runner. Collects table definitions, renders dbDelta SQL,
 * and runs it on activate or version-bump.
 *
 * Usage (fluent):
 *     $migration = (new Migration('acme_forms_db_version', '0.1.0', 'acme_'))
 *       ->table('submissions')
 *         ->column('id', 'BIGINT UNSIGNED', primary: true, autoIncrement: true)
 *         ->column('email', 'VARCHAR(255)', notNull: true)
 *         ->column('created_at', 'DATETIME', notNull: true, default: 'CURRENT_TIMESTAMP');
 *
 *     $migration->run();
 *
 * Usage (declarative):
 *     $migration = Migration::fromArray($manifest['database'], 'acme_forms_db_version', '0.1.0', 'acme_');
 *     $migration->run();
 *
 * Behaviour:
 *   - First run: creates every table.
 *   - Subsequent runs: dbDelta computes the diff and applies it; safe
 *     to call on every plugin activate.
 *   - Stores the running version in $optionName so callers can gate
 *     migration on a version bump.
 *
 * @api
 */
final class Migration
{
    private string $optionName;
    private string $currentVersion;
    /** Optional plugin-specific prefix inserted after $wpdb->prefix. */
    private string $tablePrefix;
    /** @var array<int, Table> */
    private array $tables = [];

    /** @api */
    public function __construct(string $optionName, string $currentVersion, string $tablePrefix = '')
    {
        $this->optionName     = $optionName;
        $this->currentVersion = $currentVersion;
        $this->tablePrefix    = $tablePrefix;
    }

    /** @api */
    public function addTable(Table $table): self
    {
        $this->tables[] = $table;
        return $this;
    }

    /**
     * Pure data-rendering — useful for tests that don't want $wpdb.
     *
     * @api
     * @return array<int, string>
     */
    public function toSqlStatements(string $wpdbPrefix = 'wp_', string $charsetCollate = ''): array
    {
        $out = [];
        foreach ($this->tables as $table) {
            $fullName = $wpdbPrefix . $this->tablePrefix . $table->name;
            $out[] = $table->toSql($fullName, $charsetCollate);
        }
        return $out;
    }

    /**
     * @api
     * @return array<int, Table>
     */
    public function getTables(): array { return $this->tables; }
    /** @api */
    public function getOptionName(): string { return $this->optionName; }
    /** @api */
    public function getCurrentVersion(): string { return $this->currentVersion; }

    /**
     * Run the migration through dbDelta. No-op when $wpdb is absent
     * (tests / CLI contexts).
     *
     * @api
     */
    public function run(): void
    {
        if (!function_exists('dbDelta') && !function_exists('get_option')) {
            return;
        }
        // Load dbDelta if it hasn't been pulled in yet.
        if (!function_exists('dbDelta')) {
            require_once \ABSPATH . 'wp-admin/includes/upgrade.php';
        }
        global $wpdb;
        $charsetCollate = is_object($wpdb) ? $wpdb->get_charset_collate() : '';
        $wpdbPrefix = is_object($wpdb) ? (string) $wpdb->prefix : 'wp_';
        foreach ($this->toSqlStatements($wpdbPrefix, $charsetCollate) as $sql) {
            \dbDelta($sql);
        }
        \update_option($this->optionName, $this->currentVersion);
    }

    /**
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data, string $optionName, string $currentVersion, string $tablePrefix = ''): self
    {
        $tables = $data['tables'] ?? [];
        if (!is_array($tables) || $tables === []) {
            throw new \InvalidArgumentException('Migration.tables must be a non-empty array');
        }
        $migration = new self($optionName, $currentVersion, $tablePrefix);
        foreach ($tables as $tableData) {
            if (!is_array($tableData)) {
                throw new \InvalidArgumentException('Each table must be an object');
            }
            $migration->addTable(Table::fromArray($tableData));
        }
        return $migration;
    }
}
