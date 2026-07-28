# Stability contract

This document declares which Plugin SDK surfaces are **public API**
(covered by semver guarantees) and which are **internal** (free to
change without bumping the major). Plugins built on the public API can
expect predictable upgrade paths; plugins reaching into internals are
on their own.

## TL;DR — semver promises

| Version change | What it means for the public API |
|---|---|
| **Patch** (`0.1.0` → `0.1.1`) | Bug fixes only. No public-API change. |
| **Minor** (`0.1.0` → `0.2.0`) | Additions only. Existing public API keeps working. Deprecations may land. |
| **Major** (`0.1.0` → `1.0.0`) | Breaking changes allowed; only items deprecated in a previous minor for ≥ 6 months are removed. |

We are pre-1.0 today, so the contract above is best-effort. **Once the
SDK reaches `1.0.0`, the contract becomes binding.**

## Public API surface

Everything below is covered by semver. The PHP runtime, the CLI flags,
the JSON Schema, and the TypeScript exports listed here will not break
in a minor release.

### `@plugin-sdk/cli` (npm)

Public:
- The `plugin-sdk` binary's **command names** (`create`, `codegen`)
- The **flags** documented in `--help`
- The **scaffolder output shape**: file layout, `plugin-sdk.json`
  structure, PHP namespace pattern, constant prefix pattern. (The
  exact rendered values inside the boilerplate are bumped by minor
  releases as we improve the starter, but the structural shape is
  stable.)
- The codegen **output module's public exports**:
  `PluginSDKClient`, `PluginSDKClientOptions`, `createPluginSDKClient`,
  and one `<Resource><Verb>Body` interface per route.

Internal:
- All `src/` modules (`schema-to-ts`, `route-names`, `emit`, etc.).
  Import path: `from '@plugin-sdk/cli/...'` is unsupported.
- The exact prompt order during interactive `create`.
- Console output formatting / colors.

### `plugin-sdk/wp` (Composer)

Public (full PSR-4 surface under `PluginSDK\WP\`):
- `Plugin` — `fromManifest()`, `fromArray()`, `withRestHandler()`, `withRouteHandler()`, `withModule()`, `withSiteConfig()`, `boot()`, `config()`, `siteConfig()`
- `Config` — `fromFile()`, `fromArray()`, `validate()`, `platform()`, `name()`, `slug()`, `version()`, `namespacePhp()`, `textDomain()`, `hasSettings()`, `hasRest()`, `hasDatabase()`, `hasRoutes()`, `hasUninstall()`, `buildSettings()`, `buildRest()`, `buildMigration()`, `buildRoutes()`, `uninstall()`, `toArray()`
- `ConfigException`
- `Settings` — all fluent (incl. `attach()`) + `CORE_SCREENS` + `fromArray()` + `register()` + `sanitize()` + `getErrors()` + getters
- `Settings\Section` — fluent + `fromArray()` + `addField()` + `toArray()`
- `Settings\Field` — constructor + `TYPE_*` constants (incl. `TYPE_LIST`, `TYPE_KEYED_SELECT`) + `showIf`/`rows` properties + `sanitize()` + `validate()` + `toArray()`
- `REST` — fluent + `fromArray()` + `register()` + `getNamespace()` + `getRoutes()` + `validateRouteBody()` + `addRoute()`
- `REST\Route` — constructor + `setHandler()` + `capability()` + `schema()` + `authorize()` + `validateBody()` + `fromArray()` + `toArray()`
- `REST\Schema` — constructor + `validate()`
- `Migration` — constructor + `addTable()` + `toSqlStatements()` + `run()` + `fromArray()` + getters
- `Migration\Table` — constructor + `toSql()` + `fromArray()`
- `Routes` — fluent + `fromArray()` + `register()` + `registerRules()` + `prime()` + `maybeFlushRewrites()` + `rewriteTarget()` + `queryVars()` + `maybeServe()` + `dispatch()` + `normalizeResponse()` + `resolveHandler()` + `getRoutes()` + `addRoute()` + `toArray()`
- `Routes\Route` — constructor + `setHandler()` + `contentType()` + `cache()` + `fromArray()` + `toArray()`
- `Module` — the module interface (`register()`)
- `Modules` — constructor + `add()` + `register()` + `all()` + `registered()`
- `SiteConfig` — constructor + `get()` + `toArray()` + the cascade order (defaults → constants → project file → filter)
- `Components`, `Components\*` — the render helpers (signatures stable across minors)
- `Assets`, `Html`

Internal:
- `Renderer` — settings-field HTML rendering details. The HTML shape
  stays WP-native (uses real WP class names) but specific markup may
  evolve.
- The internal layout of `REST::resolveHandler()`'s fallback chain.
- `Schema::inlineRefs()` and similar manifest-loading helpers.
- The `PluginSDK\WP\Tests\` namespace.

### `@plugin-sdk/wp-tokens` (CSS)

Public:
- Every `--wpadmin-*` custom property declared in `src/tokens.css`
- The `[data-color-scheme="…"]` selector pattern
- The list of supported WP color schemes

Internal:
- The exact RGB values for each scheme (these track WP core).
- File structure of `src/`.

### `@plugin-sdk/wp-core-css` (CSS)

Public:
- The CSS bundle URL: `https://cdn.wp-admincss.com/css/v<MAJOR.MINOR>/wp-admin.css`
- The pinned versioned URLs (immutable, 1-year cache)
- The set of WP admin class names exposed (mirrors WP core)
- The extension class names introduced under `.wp-admin-*` (e.g.
  `.wp-admin-status`, `.wp-admin-statcard`)

Internal:
- The exact byte content of `latest.css` (rolling).
- File ordering inside the bundle.

### `@plugin-sdk/wp-react` (npm)

Public:
- Every component exported from `src/components/index.ts` — props
  contract is semver-stable.
- Every type exported from `src/runtime/index.ts` — these mirror the
  JSON Schema.

Internal:
- The implementation details of each component (DOM tree may change
  to track WP core).
- Util functions under `src/utils/`.

### `plugin-sdk.json` manifest

Public:
- The schema at `cdn.wp-admincss.com/wordpress/plugin-sdk.schema.json`.
  Existing fields will stay where they are.

Internal:
- Validation error message wording.
- The exact order of property listing in `Config::toArray()`.

## Deprecation policy

When a public-API item is going to be removed in the next major:

1. **Minor release N**: add a runtime deprecation warning where
   possible (PHP `trigger_error(..., E_USER_DEPRECATED)`, TS JSDoc
   `@deprecated` tag, CLI `--flag` prints to stderr).
2. **Document** the replacement in the package's `CHANGELOG.md`.
3. **Minor release N + at least 6 months**: the deprecated item is
   still present.
4. **Next major release**: removal allowed.

Special case: **security**. Anything required to keep plugins reviewer-
approvable may be removed sooner if necessary. We will document it,
push the patch, and notify maintainers via GitHub Security Advisory.

## Asserting compatibility at runtime

### PHP

```php
use PluginSDK\WP\Version;

// Throws \PluginSDK\WP\Version\IncompatibleException if running against
// an SDK older than 0.2.0.
Version::requireAtLeast('0.2.0');
```

`Version::SDK` exposes the running version as a string.

### TypeScript

```ts
import { SDK_VERSION } from '@plugin-sdk/wp-react/runtime';
// SDK_VERSION === '0.1.0' (semver string)
```

### Composer

Standard semver in `composer.json`:

```json
"require": {
  "plugin-sdk/wp": "^0.2"
}
```

## Tagging convention (PHP side)

Every public class + method listed above carries the `@api` PHPDoc
tag. Internal helpers — those callers shouldn't reach into — carry
`@internal`. This is the PHP-FIG convention recognised by
PHPDocumentor, PhpStorm, and PHPStan.

```php
/**
 * @api
 * Boot the SDK runtime …
 */
public function boot(): void { … }

/**
 * @internal
 * Inline $ref / $defs lookups …
 */
private static function inlineRefs(array $schema): array { … }
```

The tags are advisory — there's no runtime enforcement — but they let
static analysers warn you when a consumer reaches into something the
project hasn't promised to keep stable. The list in this file is the
source of truth; the tags are a mechanically-verifiable mirror of it.

A drift-check script at `packages/wp-composer/tests/stability-drift.php`
runs on every push and fails if a public method exists without `@api`
or a method has `@api` but isn't listed in this file.

## Reporting a stability bug

If a minor release breaks something in the table above, that's a
stability bug — file it at:

  <https://github.com/artificialpoets/plugin-sdk/issues>

with the `stability` label. We treat these as high priority.
