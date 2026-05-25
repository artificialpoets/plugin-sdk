<?php

declare(strict_types=1);

use PluginSDK\WP\Migration;
use PluginSDK\WP\Migration\Table;

psdk_test('Table::toSql produces dbDelta-compatible CREATE statement', function () {
    $table = new Table('submissions', [
        ['name' => 'id', 'type' => 'BIGINT UNSIGNED', 'primary' => true, 'autoIncrement' => true],
        ['name' => 'email', 'type' => 'VARCHAR(255)', 'notNull' => true],
        ['name' => 'created_at', 'type' => 'DATETIME', 'notNull' => true, 'default' => 'CURRENT_TIMESTAMP'],
    ]);
    $sql = $table->toSql('wp_acme_submissions', 'DEFAULT CHARACTER SET utf8mb4');

    psdk_assert_contains('CREATE TABLE wp_acme_submissions', $sql);
    psdk_assert_contains('id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT', $sql);
    psdk_assert_contains('email VARCHAR(255) NOT NULL', $sql);
    psdk_assert_contains('created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP', $sql);
    // dbDelta requires exactly two spaces inside PRIMARY KEY  (col)
    psdk_assert_contains('PRIMARY KEY  (id)', $sql);
    psdk_assert_contains('DEFAULT CHARACTER SET utf8mb4', $sql);
});

psdk_test('Table::toSql renders KEY for non-unique indexes', function () {
    $t = new Table('items', [
        ['name' => 'id', 'type' => 'INT', 'primary' => true],
        ['name' => 'status', 'type' => 'VARCHAR(32)'],
    ], [
        ['name' => 'status_idx', 'columns' => ['status']],
        ['name' => 'unique_idx', 'columns' => ['id', 'status'], 'unique' => true],
    ]);
    $sql = $t->toSql('wp_items');
    psdk_assert_contains('KEY status_idx (status)', $sql);
    psdk_assert_contains('UNIQUE KEY unique_idx (id, status)', $sql);
});

psdk_test('Table::toSql quotes string defaults', function () {
    $t = new Table('items', [
        ['name' => 'id', 'type' => 'INT', 'primary' => true],
        ['name' => 'kind', 'type' => 'VARCHAR(16)', 'default' => 'general'],
    ]);
    $sql = $t->toSql('wp_items');
    psdk_assert_contains("DEFAULT 'general'", $sql);
});

psdk_test('Table::fromArray validates name + columns presence', function () {
    psdk_assert_throws(
        fn() => Table::fromArray(['columns' => []]),
        \InvalidArgumentException::class
    );
    psdk_assert_throws(
        fn() => Table::fromArray(['name' => 't', 'columns' => []]),
        \InvalidArgumentException::class
    );
    psdk_assert_throws(
        fn() => Table::fromArray(['name' => 't', 'columns' => [['name' => 'c']]]),
        \InvalidArgumentException::class
    );
});

psdk_test('Migration toSqlStatements applies prefix + plugin-specific prefix', function () {
    $migration = new Migration('acme_db_version', '0.1.0', 'acme_');
    $migration->addTable(new Table('submissions', [
        ['name' => 'id', 'type' => 'INT', 'primary' => true, 'autoIncrement' => true],
    ]));
    $sql = $migration->toSqlStatements('wp_', '');
    psdk_assert_equals(1, count($sql));
    psdk_assert_contains('CREATE TABLE wp_acme_submissions', $sql[0]);
});

psdk_test('Migration::fromArray reads table list', function () {
    $migration = Migration::fromArray([
        'tables' => [
            [
                'name' => 'submissions',
                'columns' => [
                    ['name' => 'id', 'type' => 'BIGINT', 'primary' => true, 'autoIncrement' => true],
                ],
            ],
        ],
    ], 'acme_db_version', '0.1.0', 'acme_');
    psdk_assert_equals(1, count($migration->getTables()));
    psdk_assert_equals('submissions', $migration->getTables()[0]->name);
    psdk_assert_equals('acme_db_version', $migration->getOptionName());
});

psdk_test('Migration::fromArray rejects empty tables array', function () {
    psdk_assert_throws(
        fn() => Migration::fromArray(['tables' => []], 'x', '0.0.1'),
        \InvalidArgumentException::class
    );
});
