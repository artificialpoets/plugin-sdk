<?php

declare(strict_types=1);

namespace PluginSDK\WP;

/**
 * Site-level runtime configuration with a four-stage cascade:
 *
 *     defaults → wp-config constants → project file → filter
 *
 * 1. **Defaults** — the array the plugin constructs this with. May read
 *    autoloaded options (a get_option on an autoloaded option is an
 *    in-memory lookup — zero extra SQL).
 * 2. **Constants** — for every leaf in the defaults shape, a matching
 *    `SLUG_PATH_TO_LEAF` constant overrides it (dots become
 *    underscores, upper-cased; e.g. slug `acme-forms`, key
 *    `agents.serve` → `ACME_FORMS_AGENTS_SERVE`).
 * 3. **Project file** — `wp-content/{slug}/{slug}.config.php` returning
 *    an array, merged recursively over the config.
 * 4. **Filter** — `{slug_snake}_config` runs last; values returned here
 *    are authoritative for the site.
 *
 * Reads are dot-notation: `$config->get('agents.serve', false)`.
 * The cascade runs once, in the constructor — construct one instance
 * per request (a plugin-singleton) and reads are free.
 *
 * @api
 */
final class SiteConfig
{
    private string $slugSnake;
    /** @var array<string, mixed> */
    private array $config;

    /**
     * @api
     * @param array<string, mixed> $defaults
     */
    public function __construct(string $slug, array $defaults)
    {
        $this->slugSnake = str_replace('-', '_', $slug);

        $config = $this->applyConstantOverrides($defaults);
        $config = $this->applyProjectOverrides($config);

        if (function_exists('apply_filters')) {
            /**
             * Last stage of the cascade — values returned here are
             * authoritative for the site.
             *
             * @param array<string, mixed> $config Merged config.
             */
            $filtered = \apply_filters($this->slugSnake . '_config', $config);
            if (is_array($filtered)) {
                $config = $filtered;
            }
        }

        $this->config = $config;
    }

    /**
     * Dot-notation getter.
     *
     * @api
     * @param mixed $default
     * @return mixed
     */
    public function get(string $key, $default = null)
    {
        $segments = explode('.', $key);
        $value    = $this->config;

        foreach ($segments as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }

        return $value;
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array { return $this->config; }

    /**
     * Walk the defaults shape; a defined `SLUG_PATH` constant overrides
     * the leaf at that path (cast to the leaf's default type when the
     * default is bool/int/float).
     *
     * @internal
     * @param array<string, mixed> $config
     * @return array<string, mixed>
     */
    private function applyConstantOverrides(array $config, string $prefix = ''): array
    {
        foreach ($config as $key => $value) {
            $constant = strtoupper($this->slugSnake . '_' . $prefix . (string) $key);
            $constant = str_replace(['.', '-'], '_', $constant);

            if (is_array($value)) {
                $config[$key] = $this->applyConstantOverrides($value, $prefix . (string) $key . '_');
                continue;
            }
            if (!defined($constant)) {
                continue;
            }

            $override = constant($constant);
            if (is_bool($value)) {
                $config[$key] = (bool) $override;
            } elseif (is_int($value)) {
                $config[$key] = (int) $override;
            } elseif (is_float($value)) {
                $config[$key] = (float) $override;
            } else {
                $config[$key] = $override;
            }
        }

        return $config;
    }

    /**
     * @internal
     * @param array<string, mixed> $config
     * @return array<string, mixed>
     */
    private function applyProjectOverrides(array $config): array
    {
        if (!defined('WP_CONTENT_DIR')) {
            return $config;
        }

        $slug = str_replace('_', '-', $this->slugSnake);
        $path = rtrim((string) constant('WP_CONTENT_DIR'), '/\\')
            . '/' . $slug . '/' . $slug . '.config.php';

        if (!is_file($path) || !is_readable($path)) {
            return $config;
        }

        $overrides = require $path;
        if (!is_array($overrides)) {
            return $config;
        }

        return array_replace_recursive($config, $overrides);
    }
}
