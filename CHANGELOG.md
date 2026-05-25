# Changelog

Plugin SDK follows [semver](https://semver.org). Pre-1.0 minor releases
may introduce breaking changes; see [STABILITY.md](./STABILITY.md) for
the public-API contract.

## [0.1.0-rc.1] — Developer Preview

> First public release. Tagged as a release candidate so adopters know
> the verified-end-to-end surface is still being widened. We expect to
> promote to `0.1.0` once items 1, 2, 4, 5 in the [launch runbook](./LAUNCH.md)
> are green in CI.

Plugin SDK is the declarative SDK for building WordPress plugins.
Write a `plugin-sdk.json` describing what the plugin needs — a settings
page, REST routes, custom tables — and one line in your main PHP file
boots a runtime that wires every WordPress hook with capability checks,
nonce verification, sanitisation, and JSON-schema body validation built
in. The plugin's own code stays focused on business logic.

### What's in v0.1.0-rc.1

**Composer — `plugin-sdk/wp`**
- `Plugin::fromManifest($path, __FILE__)->boot()` — single-call bootstrap
- `Config` — loads + validates `plugin-sdk.json` against the embedded JSON Schema (throws `ConfigException` with the full validation path on failure)
- `Settings` + `Settings\Section` + `Settings\Field` — fluent settings page builder with type-aware sanitisation (text strips tags, email/url filter-validate, number clamps to min/max, select whitelists against options, password preserves printable chars)
- `REST` + `REST\Route` + `REST\Schema` — REST routes with cap check + JSON-schema body validation before handler dispatch. Errors wrap into `WP_Error` with `rest_invalid_body` (400) or `rest_handler_error` (500)
- `Migration` + `Migration\Table` — dbDelta wrapper with the two-space `PRIMARY KEY  (col)` quirk baked in, version-stamped via an option so reactivations are no-ops
- `Version` — runtime version + `Version::requireAtLeast()` compatibility helper
- `Components` + 14 sub-classes — admin UI render helpers emitting real WP class names
- `Assets`, `Html` — enqueue + escape helpers

**npm**
- `@plugin-sdk/cli` — `plugin-sdk create <name>` scaffolds a working plugin (zero runtime dependencies; uses Node's built-in `--test`); `plugin-sdk codegen` turns a manifest's REST schemas into a typed TypeScript client
- `@plugin-sdk/wp-tokens` — CSS custom properties mirroring WP admin's design system, including all 9 WP color schemes
- `@plugin-sdk/wp-core-css` — full WP admin CSS bundle + an extensions layer (status badges, stat cards, toggle switches, skeleton loaders, dropdowns, modals)
- `@plugin-sdk/wp-react` — typed React components rendering real WP class names; runtime types mirror the JSON Schema

**Boilerplate**
- `boilerplates/wordpress/` — runnable WP plugin template with `plugin-sdk.json` declaring a settings page + REST route + custom table. Scaffolded via `npx @plugin-sdk/cli create`.

**Agent docs**
- `platforms/wordpress/AGENTS.md` — entry point for coding agents (Claude Code, Cursor, Aider, Cline)
- 8 focused skills covering security, database, data modelling, enqueue, plugin structure, i18n, publishing, and the new `plugin-manifest.md` reference
- Published at `cdn.wp-admincss.com/wordpress/AGENTS.md` and `/wordpress/skills/<name>.md`. Legacy `/AGENTS.md` and `/skills/` aliases preserved for one release.

**Stability contract**
- [`STABILITY.md`](./STABILITY.md) declares public-vs-internal API per package
- Every public PHP symbol carries `@api`; internals carry `@internal`
- A drift check fails the build if a new public symbol lacks a tag

**Tests**
- 177 tests across both runtimes (109 JS, 68 PHP). All green.

### Known limitations

Stated openly so you don't hit them blind:

- **WordPress only.** The architecture supports more platforms; no Shopify / Figma / VSCode adapter ships in this release.
- **Plugin Check CI workflow has not been verified against a real run.** It's wired (`wordpress/plugin-check-action@v1`, `categories: plugin_repo`) but the first execution against a public repo will likely surface bugs to fix. Watch the first PR after the public flip.
- **The runtime has never activated inside a real WordPress install.** Tests use WP function stubs. End-to-end verification (wp-env → `composer install` → activate → click settings → call REST → inspect table) is on the launch runbook before the `0.1.0` promotion.
- **JSON Schema validator covers a subset of Draft 2020-12.** Object/string/integer/number/boolean/array/null types, `required`, `properties`, `additionalProperties`, `enum`, `format=email|uri`, `pattern`, `minLength`/`maxLength`, `minimum`/`maximum`, `items`. Not implemented: `$ref` (manually inlined for the manifest schema only), `oneOf`/`anyOf`/`allOf`, conditional schemas.
- **PHP version matrix in CI is single-version (PHP 8.2).** Multi-version matrix (7.4 → 8.3) lands before `0.1.0` promotion.
- **`@plugin-sdk/wp-react` build hasn't been verified.** `tsup` config is in place; the `dist/` tarball will be verified before npm publish.
- **No block editor / Gutenberg integration.** The SDK targets classic admin pages. Blocks remain a manual `register_block_type()` away.
- **`plugin-sdk.com` domain isn't live yet.** Until the redirect lands, the canonical site stays at `wp-admincss.com`. Links in this changelog and the docs use whatever resolves today.

### Distribution

- npm: tagged `next` (`npm install @plugin-sdk/cli@next`). Default `latest` pointer waits for the `0.1.0` promotion.
- Packagist: `composer require plugin-sdk/wp:^0.1.0-rc.1`.
- GitHub: pre-release tag on the repo. Plug it into Dependabot / Renovate via the version range you pin.

### Upgrade path to `0.1.0`

When we promote, the public API will be byte-identical to what's in
this RC — that's the contract. The promotion changes:

1. The `Version::SDK` constant: `'0.1.0-rc.1'` → `'0.1.0'`
2. The `SDK_VERSION` TS constant: same
3. The `Plugin SDK v0.1.0-rc.1` banner in the CSS bundle
4. The published `latest` tag on npm

Bumping your `composer.json` from `^0.1.0-rc.1` to `^0.1` will pick up
the release; no code change needed.

### Acknowledgements

Built by [Artificial Poets](https://artificialpoets.com). Feedback,
bugs, and PRs at <https://github.com/artificialpoets/plugin-sdk/issues>.
