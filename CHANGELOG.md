# Changelog

Plugin SDK follows [semver](https://semver.org). Pre-1.0 minor releases
may introduce breaking changes; see [STABILITY.md](./STABILITY.md) for
the public-API contract.

## [Unreleased]

> Targeting `0.1.0-rc.2`. Adds the release pipeline + wp.org submission
> pipeline to every scaffolded plugin, plus the `--channel` CLI flag
> that decides which files ship.

### Added

**Runtime — virtual routes (`plugin-sdk/wp`)**
- New top-level `routes` manifest section + `Routes` / `Routes\Route` runtime: serve URL patterns yourself (llms.txt, `.md` renditions, manifests, feeds). Wires the full battle-tested pattern — rewrite rule on init, whitelisted query var, `parse_request`@0 interception, self-healing rewrite flush after updates, activation priming, clean-404 fallthrough. Handlers return a string, a `{body, status?, contentType?, headers?}` array, or null. `Plugin::withRouteHandler()` mirrors REST handler registration. Extracted from the pattern proven in wp-headless (`LlmsTxt`) and wp2md.

**Runtime — core-screen settings (`attach`)**
- `settings.page.attach: "general"|"writing"|"reading"|"discussion"|"media"` puts fields on a CORE Settings screen instead of creating a page (no menu item; fields in the `default` section join the core table — e.g. directly under "Search engine visibility" on Reading; other sections render below). Storage unchanged: one autoloaded option, saved by the native form. Small plugins stop shipping whole pages for two checkboxes.

**Runtime — module registry + site config**
- `Module` interface + `Modules` keyed registry (filterable via `{slug_snake}_modules`, per-module `modules.{key}.enabled` toggles, `{slug_snake}_modules_booted` action) and `SiteConfig` (defaults → wp-config constants → `wp-content/{slug}/{slug}.config.php` project file → `{slug_snake}_config` filter cascade, dot-notation reads). The extension architecture both production plugins (wp-headless, wp2md) independently converged on, now first-class. `Plugin::withModule()` / `withSiteConfig()` integrate with manifest boot.

**Settings fields**
- `showIf` conditional visibility on any field (sibling-controlled row toggling; dependency-free script shipped automatically).
- `type: "list"` — comma-separated input storing a clean string array.
- `type: "keyedSelect"` — a native `widefat striped` table with one dropdown per row; rows = the field's `rows` map plus keys already stored, so dynamically added keys keep their setting.

**Uninstall manifest**
- Top-level `uninstall` section (`options`, `dropTables`) + `Config::uninstall()`; the boilerplate's `uninstall.php` now reads it standalone (no SDK boot) so cleanup stays in sync with the manifest as the plugin grows.

**Integration smoke tier (boilerplate)**
- `.wp-env.json` + `bin/smoke.sh`: activation, settings round-trip, and virtual-route resolution against a real WordPress — the layer PHPCS/Plugin Check can't see.

### Changed

**Licensing — wp.org compatibility**
- `plugin-sdk/wp`, `@plugin-sdk/wp-tokens`, and `@plugin-sdk/wp-react` are now dual-licensed **Apache-2.0 OR GPL-2.0-or-later** (each package ships `LICENSE-GPL2`). Apache-2.0 alone is GPLv3-compatible but NOT GPLv2-compatible, and the wp.org directory requires GPLv2-or-later compatibility for everything a plugin ships — plugins simply elect the GPL branch. README licensing sections rewritten accordingly (the previous "one-way compatible" note had it backwards).

**Build pipeline (every scaffolded plugin)**
- `bin/build.sh` — rsync-based dist builder driven by `.distignore`. Reads VERSION from the plugin header, runs `composer install --no-dev`, produces `build/<slug>/` + two zips (latest + versioned). Supports `wporg` (default) and `github` modes — the latter writes a `.use-github-updates` marker for the dual-channel updater.
- `bin/phpsyntax.php` — `php -l` over every plugin file. Wired as `composer run phpsyntax`.
- `bin/submission-prep.sh` — one command to go from "feature works" to "ready for wp.org reviewer". Working-tree check → version triple agreement → composer run check → `composer test` (optional) → build → local Plugin Check (best-effort) → SVN dance instructions. `npm run prep`.
- `bin/slug-research.sh` — wp.org slug-availability + trademark scanner. `npm run slug-research`.
- `.distignore`, `phpcs.xml.dist`, `package.json`, `readme.txt` — wp.org-conformant project tooling.
- `composer.json` — dev dependencies (WPCS, PHPCompatibilityWP) + scripts (`test`, `lint`, `lint:fix`, `phpsyntax`, `build`, `check`, `prep`).

**CI workflows (every scaffolded plugin)**
- `.github/workflows/ci.yml` — lint + Plugin Check on every push/PR. Plugin Check runs against the BUILT dist (not source), so dev-only files don't trip Plugin Check's `file_type` and `application_files` checks.
- `.github/workflows/release.yml` (github + dual channels) — auto-bump on push to main, version-rewrite-in-three-places (header + constant + readme.txt Stable tag), commit bump back with `[skip-release]`, build with the github marker, Plugin Check, publish GH release with versioned + latest zips.

**CLI**
- `--channel=<wp.org|github|dual>` flag + interactive prompt (`@plugin-sdk/cli create`). Default: `wp.org`. Decides which workflow files, helper scripts, and update-checker code ship with the scaffold.
- New `askChoice` helper in prompts.ts. Numbered list, accepts position or value name.
- New `parseChannel` / `validateChannel` helpers in `util/slug.ts`.
- `Platform.shouldEmit(rel, ctx)` + `Platform.patchFile(rel, text, ctx)` hooks: scaffolder asks the platform per-file whether to emit and how to rewrite content before substitution.
- New mustache-style template tokens used by `phpcs.xml.dist`: `{{prefixLower}}`, `{{prefixUpper}}`, `{{namespaceRoot}}`, `{{slug}}`, `{{slugSnake}}`, `{{textDomain}}`.
- New substitution rule: `plugin_sdk_starter → ${slugSnake}` for option keys, nonces, REST error codes, and JS globals.

**Agent docs**
- `skills/release-pipeline.md` — walkthrough of `release.yml` with channel diagram, bump tokens, three-place version sync, Plugin Update Checker block, common failure modes.
- `skills/submission-prep.md` — walkthrough of `submission-prep.sh` with pre-first-submission steps, SVN dance for subsequent releases, and a pre-Submit checklist.
- Both skills registered in `platforms/wordpress/AGENTS.md`. `skills/publishing.md` gains a cross-link at the top so agents land on the operational skill when the task is "prepare submission" and stay on `publishing.md` when the task is "understand the rules".

**Boilerplate**
- `plugin-sdk-starter.php` gains a Plugin Update Checker block (with the `.use-github-updates` marker check + `class_exists` guard + placeholder GH URL + comments explaining each channel's patch).
- `composer.json` gains `yahnis-elsts/plugin-update-checker: ^5.0`. Stripped at scaffold time for `wp.org`-only plugins.
- Boilerplate `src/` cleaned up: stripped legacy `wpacs_*` strings (option keys, nonces, REST namespace, custom table name, JS global); switched custom-table queries to use WP 6.2+ `%i` identifier placeholder; added documented `phpcs:ignore` lines for legitimate direct $wpdb usage and the SDK Components helpers (which escape internally); proper `wp_unslash` + `sanitize_*` flow on every $_SERVER / $_GET / $_POST read. `composer run lint` passes 0/0 on every channel after this.

**SDK CI**
- `.github/workflows/plugin-check.yml` now runs `bash bin/build.sh` inside the scaffold before pointing Plugin Check at `build/plugin-check-subject/` — matches the wp-components reference and the wp.org reviewer's actual view.

**Hardened against real wp.org review findings** (from two live review cycles of a plugin built on the SDK):
- **Boolean sanitization** — the runtime already normalises strictly; the boilerplate + `security.md` now use `rest_sanitize_boolean()` everywhere instead of raw `(bool)` casts / `!empty()`, which the automated reviewer flags as "too loose."
- **`permission_callback` rigor** — `security.md` + `AGENTS.md` now teach that `__return_true` is audited by data flow (a public passthrough of credential-fetched data is rejected even with an "intentionally public" comment) and that `is_user_logged_in()` is not a capability check (any subscriber is logged in). Manifest routes gate on `capability`.
- **Prefix rules** — `validateConstantPrefix` now hard-blocks prefixes shorter than 4 characters and WordPress-reserved prefixes (`WP_`, `_`, `__`) at scaffold time; the CLI re-validates the `--prefix`/`--yes` paths, not just the interactive prompt. `phpcs.xml.dist` stops excluding `PrefixAllGlobals.ShortPrefixPassed` so short prefixes surface in `composer run lint`. `publishing.md` documents the ≥4-char / no-reserved / no-`if(!function_exists)` / prefixed-menu-slug rules.
- **Header URLs** — two rules, and they interact. wp.org fetches every declared URL and rejects dead links; it *also* rejects headers that give `Plugin URI` and `Author URI` the **same** value ("Those two must be different. You are not required to provide both"). The trap is that the obvious fix for a dead `Plugin URI` — repointing it at the author homepage — clears the first rule and trips the second. The boilerplate omits both by default; `publishing.md` documents both rules, the interaction, and how to spot the soft-404s that make a never-built plugin page look live to `curl`. `submission-prep.sh` step 7e-2 fails on identical URIs (trailing-slash insensitive).
- **`Tested up to` is a hard failure** — the submission scan returns `ERROR: outdated_tested_upto_header` the moment the readme value trails the current core release ("Tested up to: 7.0 < 7.1"), and wp.org states the plugin will not appear in directory searches until it matches. `publishing.md` had this filed under "looks abandoned / downranked", which understated it; corrected in the field reference, the maintenance list and the pre-submit checklist. It is the only check here that goes stale on its own schedule — the day core ships, a submission that passed last week fails — so `submission-prep.sh` step 7i now compares the readme against `api.wordpress.org/core/stable-check/1.0/` at run time rather than trusting a value written once.
- **Inline `<script>` / `<style>` from PHP** — wp.org pends the submission over this and quotes the file:line back at you ("Use wp_enqueue commands"). `enqueue.md` opens with the verbatim finding and the reviewer's own function mapping, and names the trap: "don't echo tags in templates" reads as a front-end rule, so a `<script>` at the bottom of an `add_settings_field()` render callback doesn't feel like it counts — it does. Also documents that `style=""` attributes survive the automated pass and get flagged by the human a round later, and that `false` is a legal `src` for registering an inline-only handle. `submission-prep.sh` gains step 7g (tags in PHP, hard warn) and 7h (more than a handful of `style=""` attributes); `AGENTS.md` gains the ❌/✅ pair with a screen-scoped `admin_enqueue_scripts` example.
- **`bin/submission-prep.sh` reviewer-flag scan** — greps the plugin source for the six patterns the reviewer is known to flag (`__return_true`, loose boolean casts, `register_setting` without `sanitize_callback`, `is_user_logged_in` callbacks, non-resolving header URLs via a live curl check, `function_exists`/`class_exists` self-wraps) so they surface locally instead of in a ~1-week review round-trip. `bin/slug-research.sh` warns on generic single-word slugs (the review team renames them).
- **Submission-prep / slug-research skills** — document the automated first-pass review's actual behaviour: AI-annotated findings, generic-slug renaming, data-flow tracing, sanitizer inspection, and the reviewer's resubmission checklist.

### Verified

End-to-end on each of the three channels (`/tmp/_scaffold_<channel>`):
- `wp.org`: composer install (9 packages, no PUC dep) → `composer run lint` 10/10 → `bash bin/build.sh wporg` → dist with no marker.
- `github`: composer install (10 packages, includes PUC) → `composer run lint` 10/10 → `bash bin/build.sh github` writes the marker → PUC always-on in source.
- `dual`: composer install (10 packages, includes PUC) → `composer run lint` 10/10 → `bash bin/build.sh github` writes the marker; `bash bin/build.sh wporg` does not.

CLI test count: 109 → 128 (passing). New `channels.test.ts` covers every gate × channel combination, plus the `parseChannel` + content-patch behaviour.

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
