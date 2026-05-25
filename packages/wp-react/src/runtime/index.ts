/**
 * Plugin SDK — runtime types and client helpers (React / TS side).
 *
 * Today this is type-only. The PHP runtime is the canonical execution
 * engine; the TS side currently exists so an IDE can offer autocomplete
 * on plugin-sdk.json files and so future codegen (typed REST clients,
 * settings hooks) has a place to live without churning imports.
 *
 * See /STABILITY.md at the repo root for the semver contract covering
 * the exports below.
 */
export type {
  PluginManifest,
  Platform,
  Capability,
  WpHttpMethod,
  SettingsField,
  SettingsFieldType,
  SettingsSection,
  SettingsPage,
  SettingsParent,
  RestRoute,
  RestSurface,
  Column,
  Index,
  Table,
  DatabaseSurface,
} from './types.js';

/**
 * Plugin SDK runtime version (semver string).
 *
 * Plugins can assert a minimum at boot time:
 *
 *   import { SDK_VERSION } from '@plugin-sdk/wp-react/runtime';
 *   if (SDK_VERSION.split('.').map(Number)[0] < 1) {
 *     console.warn('This plugin requires Plugin SDK 1.x');
 *   }
 *
 * Bumped on every release. The matching PHP-side constant is
 * `PluginSDK\WP\Version::SDK`.
 */
export const SDK_VERSION = '0.1.0-rc.1';
