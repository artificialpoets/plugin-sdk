/**
 * TypeScript types for plugin-sdk.json.
 *
 * Mirrors the JSON Schema at packages/wp-composer/schema/plugin-sdk.schema.json.
 * Edit the schema first; reflect the change here. The PHP runtime is the
 * source of truth for validation — these types are an IDE convenience.
 *
 * If you want compile-time guarantees that this file matches the schema,
 * the CLI's `plugin-sdk verify` command (coming) will diff the two.
 */

export type Platform = 'wordpress';

export type Capability = string;

export type WpHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type SettingsFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'url'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'password';

export type SettingsParent =
  | 'options-general.php'
  | 'tools.php'
  | 'edit.php'
  | 'themes.php'
  | 'plugins.php'
  | 'users.php'
  | 'top-level';

export interface SettingsField {
  /** Snake_case identifier within the section. */
  id: string;
  /** Label shown next to the input. */
  label: string;
  /** Field input type. Drives sanitisation + renderer. */
  type: SettingsFieldType;
  /** Help text below the input. */
  description?: string;
  /** HTML placeholder. */
  placeholder?: string;
  /** Marks the field required. */
  required?: boolean;
  /** Default value (must match the field's PHP type). */
  default?: string | number | boolean | null;
  /** Options for select-type fields. */
  options?: Array<string | { value: string | number; label: string }>;
  /** Numeric constraints for type=number. */
  min?: number;
  max?: number;
  step?: number;
}

export interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  fields: SettingsField[];
}

export interface SettingsPage {
  /** Menu slug. Defaults to the plugin slug. */
  slug?: string;
  /** Page title (shown as the H1 + in WP admin menu tooltip). */
  title: string;
  /** Optional shorter menu label. */
  menuTitle?: string;
  /** Parent menu page or 'top-level'. */
  parent?: SettingsParent;
  /** Dashicon name when parent='top-level'. */
  menuIcon?: string;
  /** WP capability required to access. */
  capability: Capability;
  /** Settings group passed to register_setting(). */
  optionGroup?: string;
  sections: SettingsSection[];
}

export interface RestRoute {
  /** Path under the namespace, starting with '/'. */
  path: string;
  method: WpHttpMethod;
  capability?: Capability;
  /** JSON Schema for the request body (POST/PUT/PATCH). */
  schema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
    [k: string]: unknown;
  };
  /**
   * PSR-4 handler reference. Either 'Acme\\Forms\\REST\\Foo::method'
   * or 'Acme\\Forms\\REST\\Foo' (invokable class).
   */
  handler?: string;
}

export interface RestSurface {
  /** e.g. "acme-forms/v1" */
  namespace: string;
  routes: RestRoute[];
}

export interface Column {
  name: string;
  /** Raw SQL type — "BIGINT UNSIGNED", "VARCHAR(255)", etc. */
  type: string;
  primary?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  unique?: boolean;
  default?: string | number | boolean | null;
}

export interface Index {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface Table {
  /** Table name without WP prefix. */
  name: string;
  columns: Column[];
  indexes?: Index[];
}

export interface DatabaseSurface {
  tables: Table[];
}

/**
 * Top-level shape of plugin-sdk.json.
 *
 * Every WordPress plugin built with Plugin SDK ships one of these at
 * its root. The PHP runtime (plugin-sdk/wp) reads + validates the file
 * at boot and wires up settings, REST, and migrations accordingly.
 */
export interface PluginManifest {
  platform: Platform;
  /** Human-readable name (appears in the WP plugins list). */
  name: string;
  /** Kebab slug used for the main PHP file + menu + assets. */
  slug: string;
  /** WP i18n text domain. Usually equals slug. */
  textDomain: string;
  /** Semver. Drives DB version checks + asset cache busting. */
  version?: string;
  /** PHP PSR-4 root namespace, e.g. "Acme\\Forms". */
  namespace?: string;
  settings?: { page: SettingsPage };
  rest?: RestSurface;
  database?: DatabaseSurface;
}
