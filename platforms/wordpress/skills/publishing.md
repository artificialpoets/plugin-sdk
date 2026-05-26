# Publishing — Plugin Check, slug research, WP.org submission

> Load this skill when: preparing a plugin for release, picking a plugin name, writing `readme.txt`, or submitting to the WordPress.org Plugin Directory. This is the **reference** for the wp.org submission flow — what to know, what the rules are. For the operational scripts that automate this flow, see [`skills/submission-prep.md`](./submission-prep.md). For the GitHub release pipeline, see [`skills/release-pipeline.md`](./release-pipeline.md).
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/publishing.md`

A plugin isn't done when the feature works. Two checks must pass before you ship:

1. **Plugin Check** finds security holes, deprecated APIs, missing escaping, and WP.org policy violations — automatically.
2. **Slug research** verifies the plugin name + slug aren't already taken on WordPress.org (and aren't reserved / trademarked).

Both should run *before* the user calls a release "done" — definitely before submitting to the WP.org Plugin Directory.

If the plugin was scaffolded by `npx @plugin-sdk/cli create`, both checks have one-command entry points already wired:

```bash
npm run prep              # full pre-submission check (composer + lint + build + local Plugin Check)
npm run slug-research     # is your slug available + not trademarked?
```

See [`skills/submission-prep.md`](./submission-prep.md) for the operational walkthrough. This skill is the conceptual reference that explains *why* those checks exist and what each one catches.

## Plugin SDK already runs Plugin Check in CI

If the project was scaffolded via `npx @plugin-sdk/cli create`, the repo ships with `.github/workflows/plugin-check.yml` — a GitHub Action that scaffolds a fresh plugin from the SDK boilerplate, installs Composer deps, and runs WordPress's official [Plugin Check](https://wordpress.org/plugins/plugin-check/) action with `categories: plugin_repo` (the WP.org submission ruleset). Errors fail the workflow; reports upload as artifacts on failure.

That workflow is the same set of checks reviewers run before approving a plugin for the WP.org directory. Green on every commit = scaffold output is review-ready.

For a plugin that hand-rolls its workflow, copy `.github/workflows/plugin-check.yml` from the SDK repo and adjust the scaffold step to point at your plugin's directory directly (no scaffolding needed). The rest of this skill teaches Plugin Check itself and the WP.org submission flow.

---

## 1. Self-test with Plugin Check

[Plugin Check](https://wordpress.org/plugins/plugin-check/) (PCP) is the official static analyzer maintained by Automattic. It's the same tool the WP.org review team runs on every submission. Running it locally before submitting saves 1–4 weeks of review back-and-forth.

### Install

The recommended path is via Composer for CI / scripted runs, plus the plugin form for interactive review:

```bash
# CLI (works in CI, runs without WordPress booted)
composer require --dev wordpress/plugin-check

# OR install the plugin itself in a local WP install
wp plugin install plugin-check --activate
```

### Run it

#### Inside WordPress admin

1. Activate Plugin Check.
2. Tools → Plugin Check.
3. Pick your plugin from the dropdown, click *Check it!*
4. Review findings, fix, repeat.

#### From the command line (WP-CLI)

```bash
wp plugin check my-plugin
```

Use `--checks=<slug>` to run a subset, `--exclude-checks=<slug>` to skip noisy ones. Categories include `general`, `security`, `performance`, `accessibility`, `plugin_repo`.

### What it catches

| Category | Examples |
|---|---|
| **Security** | Missing nonces, unescaped output, direct `$_POST` access, missing capability checks, vulnerable file operations |
| **Plugin repo policies** | Hardcoded URLs/keys, calling home, restricted code, license issues, trademark violations |
| **Performance** | Bad `wp_options` autoloading, queries inside loops, missing caching, large auto-loaded options |
| **Accessibility** | Missing `aria-label`, color-contrast issues, missing form labels |
| **Code quality** | Deprecated WP function calls, undefined functions, PHP syntax errors, missing text domain |
| **i18n** | `__()` calls without a text domain, variable text domains, untranslated strings |

### Severity levels

| Level | Meaning | Action |
|---|---|---|
| **Error** | Will be flagged in WP.org review. Must fix before submission. | Fix. |
| **Warning** | Won't block submission, but represents real risk. | Fix unless intentional. |
| **Info** | Informational best practice. | Fix when convenient. |

### Common findings and how to fix

- **`prepared_sql`** → unprepared SQL. See [`skills/database.md`](./database.md). Use `$wpdb->prepare()`.
- **`escape_output`** → echoed variable without escaping. Use `esc_html()` / `esc_attr()` / `esc_url()` at the output point.
- **`nonce_verification`** → form handler missing nonce check. Add `check_admin_referer()` or `wp_verify_nonce()`. See [`skills/security.md`](./security.md).
- **`direct_db_access`** → using `$wpdb` for data that has a high-level API. Prefer `update_option`, `update_post_meta` etc. See [`skills/data-modeling.md`](./data-modeling.md).
- **`missing_text_domain`** → translation function with no domain. See [`skills/i18n.md`](./i18n.md).
- **`hardcoded_text_domain`** → translation function using a variable for the domain. Must be a literal string.
- **`unhardcoded_paths`** → using `__DIR__` or absolute paths instead of `plugin_dir_path(__FILE__)`.
- **`file_includes`** → including files outside the plugin directory. Restrict to your plugin.
- **`prefix_all_globals`** → unprefixed function / class / constant names. Will collide with other plugins.

### Run it in CI

Add to your CI workflow so every PR is checked:

```yaml
# .github/workflows/plugin-check.yml
name: Plugin Check
on: [pull_request]
jobs:
  plugin-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.2' }
      - run: composer install --no-progress
      - run: vendor/bin/plugin-check check .
```

### Don't ignore findings without comment

Plugin Check has an exemption mechanism (annotations or config), but each exemption needs a comment explaining *why* it's safe. Reviewers (human or AI) need to see the reasoning. A silent exemption looks like the developer didn't understand the warning.

---

## 2. Slug research — is the name available?

Plugins on WordPress.org have a **slug** (URL-safe identifier) and a **display name**. Both must be unique. The slug also becomes:

- The folder name in `wp-content/plugins/`
- The text domain
- The URL: `https://wordpress.org/plugins/<slug>/`
- The prefix for option keys, hooks, etc.

Pick wrong and you can't change it later without losing all your reviews/downloads.

### Step 1 — search the directory

Check whether the slug is taken:

```
https://wordpress.org/plugins/search/<your-proposed-slug>/
https://wordpress.org/plugins/<your-proposed-slug>/
```

If the second URL returns a plugin page, the slug is taken (active or closed). Pick a different one.

Also check the search results page — even if your exact slug is free, very similar names may exist and create user confusion (or trademark issues).

### Step 2 — search the API

The plugin info API gives a programmatic check:

```bash
curl "https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=my-proposed-slug"
```

A 404-style response (`{"error":"Plugin not found."}`) means the slug is available.

### Step 3 — check for closed plugins

Some slugs are reserved because a plugin previously existed and was removed. The directory tracks these — even though the page may say "this plugin has been closed", the slug is still claimed and unavailable for new submissions. The `/search/<slug>/` page or the info API both surface this.

### Step 4 — check for trademark conflicts

WordPress.org rejects plugin names that:

- Include "WordPress", "WP-", "Woo", "WooCommerce", "Yoast", "Elementor", etc. as a *prefix* unless the developer is the trademark holder.
- Confusingly mimic a well-known brand or service ("Stripe Payments" by someone who isn't Stripe).
- Use protected terms (e.g. "Official", "Plus", "Pro" without justification).

Run a quick search:

```
https://wordpress.org/plugins/search/<related-brand>/
https://www.google.com/search?q=site:wordpress.org/plugins "<your-slug>"
```

If your name is similar to an existing brand, prefix it with your own company name: "Acme — Stripe Integration", not "Stripe Integration".

### Naming guidelines

| Rule | Why |
|---|---|
| **Lowercase, hyphens-only slug** | Required by WP.org. `my-plugin`, not `myPlugin` or `my_plugin`. |
| **3–60 characters** | Practical limit; longer slugs get truncated in UI. |
| **No leading prefix you don't own** | "WP-Anything" reads like an official WordPress product. |
| **Descriptive over clever** | "Image Optimizer" > "PicSquish". Future-you and SEO will thank you. |
| **Match folder + text domain** | If the slug is `my-plugin`, the folder is `my-plugin/`, the text domain is `my-plugin`. Mismatches break translations. |

### Use the slug consistently

Once you pick `my-plugin`:

```
my-plugin/                            ← folder
my-plugin/my-plugin.php               ← main file (matches the slug)
Text Domain: my-plugin                ← header field
namespace MyPlugin\…                  ← PascalCase variant
define('MY_PLUGIN_VERSION', '1.0.0'); ← UPPER_SNAKE_CASE variant
update_option('my_plugin_settings');  ← snake_case prefix
'my_plugin_before_save'               ← hook prefix
```

Inconsistency is a Plugin Check finding (`text_domain_mismatch`) and a real source of bugs.

---

## 3. `readme.txt` — the WP.org plugin page format

The directory parses `readme.txt` to build the plugin page (description, screenshots, FAQ, changelog). It's NOT regular Markdown — it's a custom format. Lint with [readme validator](https://wordpress.org/plugins/developers/readme-validator/).

### Template

```
=== My Plugin ===
Contributors: yourwporgusername
Tags: forms, settings, ai
Requires at least: 6.4
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html

One-sentence description (max 150 chars). Shows in search results.

== Description ==

Longer Markdown-style description. Headings use `= Title =` syntax.

= Why use this plugin? =

Bullet points work as you expect.

* Feature one
* Feature two

== Installation ==

1. Upload `my-plugin` to `/wp-content/plugins/`.
2. Activate in the Plugins menu.
3. Configure under Settings → My Plugin.

== Frequently Asked Questions ==

= Does this work with multisite? =

Yes — network-activate or per-site.

== Screenshots ==

1. The settings page.
2. The dashboard widget.

== Changelog ==

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.0 =
First public release.
```

### Required fields

- **Contributors** — WP.org usernames, comma-separated. The plugin owner + collaborators.
- **Tags** — up to 5 lowercase tags, comma-separated. Used for browse/search.
- **Requires at least** — minimum WordPress version. Bump only when you actually use a newer API.
- **Tested up to** — the WordPress version you've tested against. **Update this on every WordPress release.** Out-of-date "Tested up to" makes your plugin look abandoned.
- **Requires PHP** — minimum PHP version. Match the `composer.json` requirement.
- **Stable tag** — the version that should be served from the directory. Match this to the version in your main plugin header.
- **License** — SPDX identifier. Use `GPLv2 or later` (the WordPress ecosystem convention; required for WP.org).

### Screenshots

Place `screenshot-1.png`, `screenshot-2.png`, … in the plugin's `assets/` folder (or root). Numbering matches the order in the *Screenshots* section.

Recommended size: 1280×720 or 1544×500 for the header. Make them actually informative — first screenshot is the social-share thumbnail.

### Markdown subset

Inside sections:

```
**bold** *italic* `code`
[Link text](https://example.com)
* bullet item
1. numbered item
```

Triple-backtick code blocks work in recent versions. Single-backtick inline code does too.

---

## 4. Versioning

Use [semantic versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

| Bump | When |
|---|---|
| **MAJOR** | Breaking changes — option keys renamed, hooks removed, minimum WP version raised. |
| **MINOR** | New features that are backward-compatible. |
| **PATCH** | Bug fixes only, no new features. |

### Three places version lives

```php
/* Plugin header */
* Version: 1.2.3

/* PHP constant */
define('MY_PLUGIN_VERSION', '1.2.3');

/* readme.txt */
Stable tag: 1.2.3
```

These MUST match. Use a script in CI to verify:

```bash
# scripts/version-check.sh
HEADER=$(grep -oE 'Version:\s*[0-9.]+' my-plugin.php | grep -oE '[0-9.]+')
CONST=$(grep -oE "MY_PLUGIN_VERSION', '[0-9.]+'" my-plugin.php | grep -oE '[0-9.]+')
README=$(grep -oE 'Stable tag:\s*[0-9.]+' readme.txt | grep -oE '[0-9.]+')

if [ "$HEADER" != "$CONST" ] || [ "$HEADER" != "$README" ]; then
    echo "Version mismatch: header=$HEADER const=$CONST readme=$README"
    exit 1
fi
```

---

## 5. WP.org submission flow

1. **Self-check** — Plugin Check passes, slug verified available, `readme.txt` validated.
2. **Submit at** <https://wordpress.org/plugins/developers/add/>. You upload a ZIP of your plugin folder.
3. **Initial review** — automated checks (Plugin Check + WP.org's own scanners) run within minutes.
4. **Human review** — a volunteer reviews your code. Response time is typically 1–4 weeks. They'll email you a list of issues if anything fails. Common findings:
   - Calling home (analytics, telemetry) without explicit user opt-in
   - Loading external JS/CSS from your own CDN (must be self-contained or use WP-bundled libraries)
   - Including frameworks (jQuery, React) bundled in the plugin instead of depending on WP-registered handles
   - Modifying core files or other plugins' data
   - Trademark/naming issues
5. **Approval** — you get SVN access. Tag your release as `tags/<version>/` in the SVN repo. The directory's CDN syncs from there.
6. **Updates** — each new version commits to `trunk/`, then tags as `tags/<new-version>/`. The directory auto-builds the ZIP and pushes updates to all users.

### Post-approval maintenance

- **Update "Tested up to"** within ~2 weeks of every WP release. Plugins without recent updates are downranked.
- **Respond to support-forum posts** at `wordpress.org/support/plugin/<your-slug>` within a reasonable window.
- **Patch reported vulnerabilities** quickly — the WP.org security team will reach out via email if researchers file a CVE.

---

## 6. Quick checklist before each release

- [ ] Plugin Check runs clean (no Errors; Warnings explained or fixed)
- [ ] All `__()` / `_e()` calls use the literal text domain
- [ ] Slug verified unique on WordPress.org (only relevant for first release)
- [ ] Version is bumped + matches across header, constant, and `readme.txt`
- [ ] `readme.txt` "Tested up to" reflects the latest WP version actually tested
- [ ] Changelog entry written
- [ ] `uninstall.php` cleans up the data the new version writes
- [ ] No `error_log()` / `var_dump()` / `console.log()` debug calls left in
- [ ] No hardcoded credentials, API keys, internal URLs
- [ ] `composer.lock` (if using Composer) committed for reproducible builds
- [ ] Tested on the minimum supported WP version + minimum PHP version
- [ ] Tested with WP_DEBUG enabled — no notices/warnings

If any item is checked sloppily, the plugin will eventually surface a vulnerability or an "abandoned" appearance. Take the 30 minutes.
