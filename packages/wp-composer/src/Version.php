<?php

declare(strict_types=1);

namespace PluginSDK\WP;

/**
 * Plugin SDK version + compatibility helper.
 *
 * Plugins consuming `plugin-sdk/wp` can pin a minimum SDK version at
 * boot time:
 *
 *     use PluginSDK\WP\Version;
 *
 *     Version::requireAtLeast('0.2.0'); // throws if older
 *
 * The semver guarantees are documented in /STABILITY.md at the repo
 * root. Anything in the "Public API surface" list there will continue
 * to work without modification across patch + minor releases.
 *
 * Constants:
 *   Version::SDK         The running SDK version (semver string).
 *
 * Methods:
 *   Version::current()         Returns the version string.
 *   Version::compare()         Pure semver comparison (-1 / 0 / 1).
 *   Version::satisfies()       Boolean check against a min/max range.
 *   Version::requireAtLeast()  Throws if the running version is older.
 *
 * @api
 */
final class Version
{
    /**
     * Bump on every release. Source of truth for the runtime.
     *
     * @api
     */
    public const SDK = '0.1.0-rc.1';

    /** @api */
    public static function current(): string
    {
        return self::SDK;
    }

    /**
     * Compare two semver strings. Returns -1 if $a < $b, 0 if equal,
     * 1 if $a > $b.
     *
     * Pre-release tags ('0.2.0-rc.1' < '0.2.0') are honoured per the
     * semver spec. Build metadata (after '+') is ignored.
     *
     * @api
     */
    public static function compare(string $a, string $b): int
    {
        [$aBase, $aPre] = self::splitPrerelease($a);
        [$bBase, $bPre] = self::splitPrerelease($b);

        $aParts = self::partsOf($aBase);
        $bParts = self::partsOf($bBase);
        for ($i = 0; $i < 3; $i++) {
            if ($aParts[$i] !== $bParts[$i]) {
                return $aParts[$i] < $bParts[$i] ? -1 : 1;
            }
        }

        // A prereleased version is < the non-prereleased equivalent.
        if ($aPre === '' && $bPre === '') return 0;
        if ($aPre === '') return 1;
        if ($bPre === '') return -1;
        return strcmp($aPre, $bPre) <=> 0;
    }

    /**
     * Returns true when the running SDK version is at least $min and,
     * if provided, strictly less than $exclusiveMax.
     *
     * @api
     */
    public static function satisfies(string $min, ?string $exclusiveMax = null): bool
    {
        if (self::compare(self::SDK, $min) < 0) return false;
        if ($exclusiveMax !== null && self::compare(self::SDK, $exclusiveMax) >= 0) return false;
        return true;
    }

    /**
     * Throw if the running SDK is older than $min. Caller decides how
     * to handle the exception — usually surfaced as an admin notice via
     * Plugin::fromManifest()'s error path.
     *
     * @api
     * @throws Version\IncompatibleException
     */
    public static function requireAtLeast(string $min): void
    {
        if (self::compare(self::SDK, $min) < 0) {
            throw new Version\IncompatibleException(sprintf(
                'Plugin SDK version %s required, but %s is installed. Run `composer update plugin-sdk/wp`.',
                $min,
                self::SDK
            ));
        }
    }

    /**
     * @internal
     * @return array{int, int, int}
     */
    private static function partsOf(string $base): array
    {
        $segments = explode('.', $base);
        return [
            (int) ($segments[0] ?? 0),
            (int) ($segments[1] ?? 0),
            (int) ($segments[2] ?? 0),
        ];
    }

    /**
     * @internal
     * @return array{string, string} [baseVersion, prereleaseSuffix]
     */
    private static function splitPrerelease(string $v): array
    {
        // Drop build metadata first.
        $plus = strpos($v, '+');
        if ($plus !== false) $v = substr($v, 0, $plus);
        $dash = strpos($v, '-');
        if ($dash === false) return [$v, ''];
        return [substr($v, 0, $dash), substr($v, $dash + 1)];
    }
}
