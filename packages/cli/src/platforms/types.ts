import type { PluginContext } from '../template.ts';

/**
 * A platform adapter ties three pieces together:
 *   1. The interactive prompts that build the PluginContext
 *   2. The location of the template tree on disk
 *   3. Any post-scaffold actions specific to that platform
 *
 * Each platform owns its own variant of the boilerplate. The CLI core
 * doesn't know anything WordPress- or Shopify-specific; it just calls
 * the adapter's methods.
 */
export interface Platform {
  id: string;
  displayName: string;
  /** Suggested default plugin name in the prompt. */
  defaultName: string;
  /**
   * Returns an absolute path to the template directory. Implementations
   * may resolve relative to import.meta.url so the CLI works whether
   * it's run from the monorepo (cwd = packages/cli/) or installed
   * globally via npx.
   */
  resolveTemplateDir(): string;
  /**
   * Post-scaffold hook. Receives the output directory and the context
   * used for substitution. Implementations can spawn child processes
   * (composer install, etc.). Throw on failure.
   */
  postCreate?(outDir: string, ctx: PluginContext): Promise<void>;
  /**
   * Per-file emission gate. Receives the original (pre-rename) relative
   * path and the plugin context. Returns `false` to skip the file
   * entirely. Default: emit every file.
   *
   * Used for channel-conditional output — e.g. `wp.org`-only plugins
   * don't need `.github/workflows/release.yml` because their release
   * flow is wp.org SVN, not a GitHub release.
   */
  shouldEmit?(relPath: string, ctx: PluginContext): boolean;
  /**
   * Pre-substitution content patch. Runs BEFORE the substitution rules
   * are applied. Returns the (possibly modified) text. Default: pass-through.
   *
   * Used for channel-conditional content — e.g. stripping the Plugin
   * Update Checker block from the main PHP file when the channel is
   * `wp.org`, or making the marker check unconditional when it's
   * `github`.
   */
  patchFile?(relPath: string, text: string, ctx: PluginContext): string;
}
