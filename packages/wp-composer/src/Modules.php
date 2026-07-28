<?php

declare(strict_types=1);

namespace PluginSDK\WP;

/**
 * Keyed module registry.
 *
 * The pattern proven by production plugins (wp-headless, wp2md): a map
 * of string key → {@see Module}, filterable by themes and add-on
 * plugins before boot, with per-module enable toggles read from
 * {@see SiteConfig} (`modules.{key}.enabled`, default true).
 *
 *     $modules = (new Modules('acme-forms', $siteConfig))
 *         ->add('routes', new Routes\LlmsModule($siteConfig))
 *         ->add('digest', new Digest($siteConfig));
 *     $modules->register(); // applies acme_forms_modules, boots enabled
 *
 * Boot late enough that themes can hook the filter — plugins typically
 * call register() from `after_setup_theme` priority 100 rather than
 * `plugins_loaded`, which fires before themes load.
 *
 * @api
 */
final class Modules
{
    private string $slugSnake;
    private ?SiteConfig $config;
    /** @var array<string, Module> */
    private array $modules = [];
    /** @var array<string, true> */
    private array $registered = [];
    private bool $booted = false;

    /** @api */
    public function __construct(string $slug, ?SiteConfig $config = null)
    {
        $this->slugSnake = str_replace('-', '_', $slug);
        $this->config    = $config;
    }

    /** @api */
    public function add(string $key, Module $module): self
    {
        $this->modules[$key] = $module;
        return $this;
    }

    /**
     * @api
     * @return array<string, Module>
     */
    public function all(): array { return $this->modules; }

    /**
     * Keys of the modules that actually booted (enabled + registered).
     *
     * @api
     * @return array<int, string>
     */
    public function registered(): array { return array_keys($this->registered); }

    /**
     * Apply the `{slug_snake}_modules` filter, then boot every enabled
     * module. Idempotent. Fires `{slug_snake}_modules_booted` after.
     *
     * @api
     */
    public function register(): void
    {
        if ($this->booted) {
            return;
        }
        $this->booted = true;

        $modules = $this->modules;
        if (function_exists('apply_filters')) {
            /**
             * Filter the module map before boot. Add-ons and themes can
             * add, replace, or remove modules here.
             *
             * @param array<string, Module> $modules Keyed module map.
             * @param SiteConfig|null       $config  Site config, when present.
             */
            $filtered = \apply_filters($this->slugSnake . '_modules', $modules, $this->config);
            if (is_array($filtered)) {
                $modules = $filtered;
            }
        }

        foreach ($modules as $key => $module) {
            if (!$module instanceof Module) {
                continue;
            }
            $key = (string) $key;
            $this->modules[$key] = $module;
            if (!$this->enabled($key)) {
                continue;
            }
            $module->register();
            $this->registered[$key] = true;
        }

        if (function_exists('do_action')) {
            /**
             * Fires after every enabled module registered its hooks.
             *
             * @param Modules $modules The booted registry.
             */
            \do_action($this->slugSnake . '_modules_booted', $this);
        }
    }

    /** @internal */
    private function enabled(string $key): bool
    {
        if ($this->config === null) {
            return true;
        }
        return false !== $this->config->get('modules.' . $key . '.enabled', true);
    }
}
