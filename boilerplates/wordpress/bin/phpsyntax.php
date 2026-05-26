<?php
/**
 * phpsyntax.php — run `php -l` against every .php file in the plugin.
 *
 * Cheaper than the full PHPCS run and catches the one class of error
 * PHPCS sometimes misses (unparseable files). Composer wires it as
 * `composer run phpsyntax`; CI runs it before PHPCS so a broken file
 * fails fast with a clear message.
 *
 * Exits 0 on success, 1 on the first failure. Skips vendor/, build/,
 * node_modules/, and .git/.
 */

declare(strict_types=1);

$root  = dirname(__DIR__);
$it    = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS)
);
$count = 0;

foreach ($it as $file) {
    $path = $file->getPathname();

    // Skip dependency / build trees.
    if (preg_match('#[/\\\\](vendor|node_modules|build|\\.git)[/\\\\]#', $path)) {
        continue;
    }
    if (substr($path, -4) !== '.php') {
        continue;
    }

    $output    = [];
    $exit_code = 0;
    exec('php -l ' . escapeshellarg($path) . ' 2>&1', $output, $exit_code);

    if ($exit_code !== 0) {
        fwrite(STDERR, implode(PHP_EOL, $output) . PHP_EOL);
        exit(1);
    }
    $count++;
}

echo "PHP syntax OK ({$count} files)" . PHP_EOL;
