<?php

declare(strict_types=1);

namespace PluginSDK\WP;

/**
 * A plugin module: one cohesive feature that attaches its own hooks.
 *
 * Modules are the SDK's extension contract for code the manifest can't
 * describe declaratively. Each module is registered under a string key
 * on {@see Modules}; the key is the module's public identity — it is
 * simultaneously the config toggle path (`modules.{key}.enabled` via
 * {@see SiteConfig}), the handle add-ons use with the
 * `{slug_snake}_modules` filter, and the name used in docs.
 *
 * @api
 */
interface Module
{
    /**
     * Attach the module's hooks. Called once during boot, only when the
     * module is enabled.
     */
    public function register(): void;
}
