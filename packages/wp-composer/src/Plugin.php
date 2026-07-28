<?php

declare(strict_types=1);

namespace PluginSDK\WP;

/**
 * Plugin bootstrap.
 *
 * Reads plugin-sdk.json and wires up Settings + REST + Migration with
 * a single Plugin::boot() call. The plugin author's __FILE__ becomes
 * the lifecycle anchor for activation/deactivation hooks.
 *
 * Typical usage in the plugin's main PHP file:
 *
 *     require_once __DIR__ . '/vendor/autoload.php';
 *     PluginSDK\WP\Plugin::fromManifest(__DIR__ . '/plugin-sdk.json', __FILE__)
 *       ->withRestHandler('Acme\\Forms\\REST\\Submissions::create', [
 *           Acme\Forms\REST\Submissions::class, 'create'
 *       ])
 *       ->boot();
 *
 * @api
 */
final class Plugin
{
    private Config $config;
    private string $pluginFile;
    /** Map of handler ref (string) → real callable, used to resolve
     *  manifest "handler": "Foo::bar" entries to actual code. */
    /** @var array<string, callable> */
    private array $handlerRegistry = [];
    /** @var array<string, Module> */
    private array $modules = [];
    private ?SiteConfig $siteConfig = null;

    private function __construct(Config $config, string $pluginFile)
    {
        $this->config     = $config;
        $this->pluginFile = $pluginFile;
    }

    /** @api */
    public static function fromManifest(string $manifestPath, string $pluginFile): self
    {
        return new self(Config::fromFile($manifestPath), $pluginFile);
    }

    /**
     * @api
     * @param array<string, mixed> $manifest
     */
    public static function fromArray(array $manifest, string $pluginFile): self
    {
        return new self(Config::fromArray($manifest), $pluginFile);
    }

    /**
     * Register a real callable for a manifest "handler" string.
     * The runtime falls back to autoloader-based resolution if a ref
     * isn't registered here, but this lets you opt into compile-time
     * checking (the IDE knows the class exists).
     *
     * @api
     * @param callable $callable
     */
    public function withRestHandler(string $ref, $callable): self
    {
        if (!is_callable($callable)) {
            throw new \InvalidArgumentException("Handler for '$ref' is not callable");
        }
        $this->handlerRegistry[$ref] = $callable;
        return $this;
    }

    /**
     * Register a real callable for a manifest route "handler" string.
     * Same registry semantics as {@see withRestHandler}.
     *
     * @api
     * @param callable $callable
     */
    public function withRouteHandler(string $ref, $callable): self
    {
        return $this->withRestHandler($ref, $callable);
    }

    /**
     * Register a code module under a public key. Modules boot after the
     * manifest surfaces, filtered through `{slug_snake}_modules` and
     * gated on `modules.{key}.enabled` when a SiteConfig is attached.
     *
     * @api
     */
    public function withModule(string $key, Module $module): self
    {
        $this->modules[$key] = $module;
        return $this;
    }

    /**
     * Attach a {@see SiteConfig} — module enable toggles and anything
     * the plugin's own code wants to read cascade-aware.
     *
     * @api
     */
    public function withSiteConfig(SiteConfig $siteConfig): self
    {
        $this->siteConfig = $siteConfig;
        return $this;
    }

    /** @api */
    public function config(): Config { return $this->config; }

    /** @api */
    public function siteConfig(): ?SiteConfig { return $this->siteConfig; }

    /**
     * Wire up every WP hook the manifest declares. Idempotent — safe to
     * call from plugins_loaded.
     *
     * @api
     */
    public function boot(): void
    {
        if ($this->config->hasSettings()) {
            $settings = $this->config->buildSettings();
            if ($settings !== null) $settings->register();
        }
        if ($this->config->hasRest()) {
            $rest = $this->config->buildRest();
            if ($rest !== null) {
                foreach ($rest->getRoutes() as $route) {
                    // Wire up registered handlers — REST::resolveHandler
                    // already falls back to autoloader-based resolution
                    // if the ref isn't here.
                    if (is_string($route->handler) && isset($this->handlerRegistry[$route->handler])) {
                        $route->setHandler($this->handlerRegistry[$route->handler]);
                    }
                }
                $rest->register();
            }
        }
        if ($this->config->hasDatabase() && function_exists('register_activation_hook')) {
            $migration = $this->config->buildMigration();
            if ($migration !== null) {
                \register_activation_hook($this->pluginFile, [$migration, 'run']);
            }
        }
        if ($this->config->hasRoutes()) {
            $routes = $this->config->buildRoutes();
            if ($routes !== null) {
                foreach ($routes->getRoutes() as $route) {
                    if (is_string($route->handler) && isset($this->handlerRegistry[$route->handler])) {
                        $route->setHandler($this->handlerRegistry[$route->handler]);
                    }
                }
                $routes->register();
                if (function_exists('register_activation_hook')) {
                    // Prime + flush so the first request after activation
                    // already resolves the virtual URLs.
                    \register_activation_hook($this->pluginFile, [$routes, 'prime']);
                }
            }
        }
        if ($this->modules !== []) {
            $registry = new Modules($this->config->slug(), $this->siteConfig);
            foreach ($this->modules as $key => $module) {
                $registry->add($key, $module);
            }
            $registry->register();
        }
    }
}
