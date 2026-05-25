<?php

declare(strict_types=1);

/*
 * Stability drift check.
 *
 * Walks every PHP source file under src/, finds every:
 *   - public class declaration
 *   - public method (excluding magic methods)
 *   - public class constant
 * and asserts each has either a `@api` or `@internal` PHPDoc tag.
 *
 * Private + protected methods don't need tags (they're implicitly
 * internal). Magic methods (__construct in classes that opt into
 * private construction, __toString, etc.) are skipped.
 *
 * If this test fails, the offender either needs to be tagged in source
 * or removed from STABILITY.md's public surface list — whichever
 * matches the intent.
 */

require_once __DIR__ . '/wp-stubs.php';

$SRC_DIR = realpath(__DIR__ . '/../src');

/**
 * Find every .php file under $dir, recursive.
 *
 * @return array<int, string>
 */
function psdk_list_php_files(string $dir): array
{
    $out = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($it as $file) {
        if ($file->isFile() && substr($file->getFilename(), -4) === '.php') {
            $out[] = $file->getPathname();
        }
    }
    sort($out);
    return $out;
}

/**
 * For a given PHP file, extract every public symbol declaration plus
 * the docblock immediately above it.
 *
 * Returns a list of records:
 *   ['file' => …, 'line' => …, 'kind' => 'class'|'method'|'const',
 *    'name' => …, 'doc' => string]
 *
 * Where 'doc' is the raw docblock contents ('' if none).
 *
 * @return array<int, array{file: string, line: int, kind: string, name: string, doc: string}>
 */
function psdk_extract_public_symbols(string $file): array
{
    $contents = file_get_contents($file);
    if ($contents === false) return [];

    $lines = explode("\n", $contents);
    $results = [];
    $pendingDoc = '';
    $inClass = false;
    $className = '';
    $skipUntil = -1; // last line index of the in-progress docblock

    foreach ($lines as $i => $line) {
        $lineNo = $i + 1;
        $trim = ltrim($line);

        // Skip lines that are inside a docblock we already captured.
        if ($i <= $skipUntil) {
            continue;
        }

        // Track docblock — accumulate from /** until */.
        if (preg_match('/^\s*\/\*\*/', $line)) {
            $pendingDoc = $line . "\n";
            $j = $i + 1;
            while ($j < count($lines)) {
                $pendingDoc .= $lines[$j] . "\n";
                if (preg_match('/\*\//', $lines[$j])) { $skipUntil = $j; break; }
                $j++;
            }
            continue;
        }

        // class declaration
        if (preg_match('/^\s*(?:final\s+|abstract\s+)?class\s+(\w+)/', $line, $m)) {
            $results[] = [
                'file' => $file,
                'line' => $lineNo,
                'kind' => 'class',
                'name' => $m[1],
                'doc'  => $pendingDoc,
            ];
            $className = $m[1];
            $inClass = true;
            $pendingDoc = '';
            continue;
        }

        // public method or const at class scope
        if ($inClass && preg_match('/^\s*public\s+(?:static\s+)?(?:function\s+(\w+)|const\s+(\w+))/', $line, $m)) {
            $name = $m[1] !== '' ? $m[1] : ($m[2] ?? '');
            // Skip magic methods that don't need stability tags.
            $magic = ['__construct', '__destruct', '__toString', '__invoke', '__call', '__callStatic', '__get', '__set', '__isset', '__unset', '__clone'];
            if (in_array($name, $magic, true)) {
                $pendingDoc = '';
                continue;
            }
            $results[] = [
                'file' => $file,
                'line' => $lineNo,
                'kind' => isset($m[1]) && $m[1] !== '' ? 'method' : 'const',
                'name' => ($className !== '' ? $className . '::' : '') . $name,
                'doc'  => $pendingDoc,
            ];
            $pendingDoc = '';
            continue;
        }

        // A non-doc, non-symbol line resets the pendingDoc only if
        // it has actual code on it (skip blank lines).
        if ($trim !== '' && !preg_match('/^\s*(?:use|namespace|<\?php|declare|\?>|}|{)/', $trim)) {
            // Likely we passed code without consuming the docblock; drop it.
            if (strpos($line, '//') === false) {
                $pendingDoc = '';
            }
        }
    }
    return $results;
}

function psdk_doc_has(string $doc, string $tag): bool
{
    return strpos($doc, '@' . $tag) !== false;
}

psdk_test('Every public class / method / const carries @api or @internal', function () use ($SRC_DIR) {
    $files = psdk_list_php_files($SRC_DIR);
    $missing = [];
    foreach ($files as $file) {
        // The Renderer class is marked @internal at the class level; its
        // methods inherit that classification. Skip per-symbol checks
        // inside @internal classes.
        $symbols = psdk_extract_public_symbols($file);

        // Pass 1: classify each class as @api / @internal / unset.
        // A class-level tag implicitly covers its members; per-member
        // tags can override (e.g. an @internal helper inside an @api
        // class). The check fails only on classes that have neither
        // tag, or on members that lack a tag inside an unclassified
        // class.
        $classClass = [];
        foreach ($symbols as $s) {
            if ($s['kind'] !== 'class') continue;
            if (psdk_doc_has($s['doc'], 'api'))      { $classClass[$s['name']] = 'api';      continue; }
            if (psdk_doc_has($s['doc'], 'internal')) { $classClass[$s['name']] = 'internal'; continue; }
            $classClass[$s['name']] = 'unset';
        }

        foreach ($symbols as $s) {
            if ($s['kind'] === 'class') {
                if ($classClass[$s['name']] === 'unset') {
                    $missing[] = sprintf(
                        '  - %s:%d  class %s  (no @api / @internal)',
                        str_replace($SRC_DIR . '/', '', $s['file']),
                        $s['line'],
                        $s['name']
                    );
                }
                continue;
            }
            // Member symbol. If the enclosing class is tagged, members
            // inherit unless they declare their own.
            $cls = explode('::', $s['name'])[0];
            $inherited = $classClass[$cls] ?? 'unset';
            $hasApi      = psdk_doc_has($s['doc'], 'api');
            $hasInternal = psdk_doc_has($s['doc'], 'internal');

            if ($hasApi || $hasInternal) continue;                // explicitly tagged
            if ($inherited === 'api' || $inherited === 'internal') continue; // inherits
            $missing[] = sprintf(
                '  - %s:%d  %s %s  (no @api / @internal, enclosing class also untagged)',
                str_replace($SRC_DIR . '/', '', $s['file']),
                $s['line'],
                $s['kind'],
                $s['name']
            );
        }
    }
    if ($missing !== []) {
        throw new AssertionError(
            "Stability drift — these public symbols need @api or @internal tags:\n"
            . implode("\n", $missing)
        );
    }
    psdk_assert(true, 'all symbols tagged');
});

psdk_test('STABILITY.md lists every @api class', function () use ($SRC_DIR) {
    $stabilityPath = realpath($SRC_DIR . '/../../../STABILITY.md');
    if ($stabilityPath === false || !is_file($stabilityPath)) {
        // Stability file might not be present in some test environments;
        // soft-skip in that case.
        psdk_assert(true, 'STABILITY.md not present in this run');
        return;
    }
    $stability = file_get_contents($stabilityPath) ?: '';

    $files = psdk_list_php_files($SRC_DIR);
    $missing = [];
    foreach ($files as $file) {
        $symbols = psdk_extract_public_symbols($file);
        foreach ($symbols as $s) {
            if ($s['kind'] !== 'class') continue;
            if (!psdk_doc_has($s['doc'], 'api')) continue;
            // Strip a leading namespace tail and check the short name appears
            // somewhere in the doc (rough but catches forgetfulness).
            $shortName = $s['name'];
            // Components/Subclasses (Button, Cards, etc.) are referenced
            // collectively as "Components\*" in STABILITY.md; treat them
            // as covered by that umbrella.
            if (str_contains($s['file'], '/Components/')) continue;
            if (strpos($stability, $shortName) === false) {
                $missing[] = sprintf('  - %s (in %s)', $shortName, basename($file));
            }
        }
    }
    if ($missing !== []) {
        throw new AssertionError(
            "These @api classes aren't mentioned in STABILITY.md:\n"
            . implode("\n", $missing)
        );
    }
    psdk_assert(true, 'STABILITY.md covers every @api class');
});
