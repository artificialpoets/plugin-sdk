# Submission prep — go from "feature works" to "ready for the wp.org reviewer"

> Load this skill when: preparing the first submission to the WordPress.org Plugin Directory, preparing a subsequent release to push to wp.org SVN trunk, debugging the submission-prep script, writing or updating `readme.txt`, or trying to figure out why Plugin Check is flagging something.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/submission-prep.md`

Every plugin scaffolded by `npx @plugin-sdk/cli create` with a `wp.org` or `dual` distribution channel ships with `bin/submission-prep.sh` — a single command that walks the same checks a wp.org volunteer reviewer will run, in order, exiting non-zero on any blocker.

The script is the *human path* for the wp.org submission flow. The agent path is the same: invoke `npm run prep` (or `bash bin/submission-prep.sh`) and read the failure messages. Both paths produce identical output and identical exit codes.

For the GitHub release pipeline (different workflow, different artefact), load [`skills/release-pipeline.md`](./release-pipeline.md). For the underlying naming conventions, Plugin Check categories, and the `readme.txt` format, [`skills/publishing.md`](./publishing.md) is the long-form reference.

---

## 1. The one command

```bash
npm run prep              # or: bash bin/submission-prep.sh
```

Walk-through, in order:

```text
▸ Verifying working tree is clean
  Hard-fails if `git status` shows uncommitted changes. The dist
  built by this script ends up in build/<slug>.zip — if the source
  tree is dirty, the zip won't match what's in git, which is the
  thing reviewers will see when they pull from SVN trunk.

▸ Verifying version is consistent across header / constant / readme.txt
  All three must agree exactly. wp.org's SVN trunk shows the
  Stable tag, the runtime reads the constant, and reviewers
  read the header. A mismatch will fail review.

▸ Running composer run check (phpsyntax + phpcs)
  PHPCS with WPCS + PHPCompatibilityWP. Catches missing escapes,
  prepared-statement misuse, deprecated WP APIs, naming-prefix
  drift. ~30 of the ~50 things a reviewer would flag.

▸ Running composer test (if a test script + tests/ are present)
  Optional. --skip-tests to bypass.

▸ Building wp.org-clean dist via bin/build.sh
  Default mode `wporg` (no .use-github-updates marker). The dist
  is byte-for-byte what should be uploaded.

▸ Running Plugin Check locally (best-effort)
  Skips cleanly if `wp` is not on PATH. The CI workflow runs the
  canonical Plugin Check via the official GH Action; this local
  step is convenience only.

▸ Final summary
  Prints the next steps for first submission OR for subsequent
  release-to-trunk, with the slug + version substituted in.
```

If everything passes, the script exits 0 with the path to the zip you'd upload. Re-running is safe and cheap — the script is idempotent.

---

## 2. Before the first submission

A first-time wp.org submission has three things this script can't do for you, all of which need to happen *before* you press "Submit" on wordpress.org/plugins/developers/add/:

1. **Slug research** — pick a slug that's available + doesn't collide with a trademark. Run:

   ```bash
   bash bin/slug-research.sh <slug-you-want>
   # or use the scaffold's own slug:
   bash bin/slug-research.sh
   ```

   Exit 0 = available, exit 1 = taken or trademark conflict. Slugs cannot be renamed after wp.org approval — pick wisely.

2. **`readme.txt`** — the scaffolded boilerplate ships a template with placeholders. Edit the `Contributors:`, `Tags:`, `Description`, `FAQ`, and `Screenshots` sections to match your plugin. The version triple (header + constant + Stable tag) is already in sync from the scaffold; the script will keep them in sync on every bump. The full readme.txt format reference is in [`skills/publishing.md`](./publishing.md).

3. **A clean commit history**. wp.org reviewers will see the SVN tree, but if they ever check the GH repo (and they sometimes do), they'll judge the commit hygiene. Squash development noise before tagging the first version.

Then upload `build/<slug>.zip` to wordpress.org/plugins/developers/add/ and wait. Review typically takes 1–4 weeks. The reviewer will email a list of issues if anything fails — fix and re-submit. Common findings:

- **Calling home** without explicit user opt-in — analytics, telemetry, anything that pings your servers without permission.
- **External assets from your CDN** — wp.org requires plugins to be self-contained (bundle the CSS/JS, register WP-bundled scripts like jQuery via their handles, do not load from `cdn.example.com`).
- **Bundled frameworks** — don't ship jQuery / React in your plugin. Depend on WordPress's registered handles.
- **Modifying core or other plugins' data** — never.
- **Trademark issues** — the slug or display name uses a protected term you don't own.

The `bin/slug-research.sh` script catches the trademark issue ahead of time. The first three are policy decisions; Plugin Check doesn't flag them, the reviewer will.

---

## 3. For subsequent releases (after the first wp.org approval)

Once your plugin is approved, wp.org gives you SVN access at `https://plugins.svn.wordpress.org/<slug>/`. The trunk + tag dance is one-time-painful, then mechanical:

```bash
# 1. Cut a release locally
npm run prep                                     # builds + verifies the dist

# 2. Update wp.org via SVN. (You only do this once per release.)
svn co https://plugins.svn.wordpress.org/<slug>/ ./wpsvn
rm -rf ./wpsvn/trunk
cp -r build/<slug>/ ./wpsvn/trunk

cd ./wpsvn
svn add --force trunk
svn commit -m "<version>: release"

# 3. Tag it (this is what wp.org actually distributes)
svn cp trunk tags/<version>
svn commit -m "Tag <version>"
```

After `svn commit`, wp.org's CDN takes 5–10 minutes to pick up the new tag. Then `wp plugin update <slug>` on any installation pulls the new version.

If you're on a `dual` channel, your `.github/workflows/release.yml` separately publishes a GitHub release on the same commit — load [`skills/release-pipeline.md`](./release-pipeline.md) for that side of the flow. The two channels are independent: SVN serves the wp.org community; PUC checks the GH release for users who've opted into early access.

---

## 4. Why the script exits non-zero on a "clean" dirty tree

A common stumbling block: the script fails because `composer install` regenerated `composer.lock`, or because `bash bin/build.sh` left `build/` lying around. The `git diff-index --quiet HEAD` check the script uses considers any tracked file change a violation. Two fixes:

- **Add `build/` to `.gitignore`** — already done in the scaffolded boilerplate. If your `.gitignore` got out of sync, restore it.
- **Commit `composer.lock`** — it should be tracked. wp.org reviewers use it to verify dependency tree. The scaffolded `.distignore` excludes it from the dist (developer-only) but it stays in git for reproducibility.

If you really want to build a dist from a dirty tree (e.g. local debugging), the script has no flag for it — that's deliberate. Use `bash bin/build.sh` directly; it doesn't check the working tree.

---

## 5. Hook into the script — additional checks

`bin/submission-prep.sh` is shell, no plugins. To add a project-specific check, edit the script and insert before the "Building wp.org-clean dist" step:

```bash
step "Verifying CHANGELOG.md updated"
if ! grep -q "## ${HEADER_VERSION}$" CHANGELOG.md; then
    fail "CHANGELOG.md has no entry for version ${HEADER_VERSION}"
fi
pass "CHANGELOG entry present"
```

Use the existing `step` / `pass` / `warn` / `fail` helpers; they handle ANSI colours when running in an interactive TTY and degrade gracefully in CI.

---

## 6. CI alternative — same checks, just automated

The scaffolded `.github/workflows/ci.yml` runs the equivalent gate on every push: composer install → phpsyntax → phpcs → bash bin/build.sh → wordpress/plugin-check-action against the built dist. Green on CI ≈ green on local `npm run prep`. The two differ only in the working-tree check (CI always starts from a fresh checkout) and the local-Plugin-Check best-effort step (CI uses the official Action, which is the source of truth).

If you wanted, you could push a tag from a dirty tree, the CI would still build the same dist, and Plugin Check would pass or fail the same way. The submission-prep script just gives you that signal *before* you've burned a CI run.

---

## 7. Quick checklist before pressing Submit

- [ ] `npm run prep` exits 0.
- [ ] CI on the latest commit is green (lint + Plugin Check).
- [ ] `readme.txt` Stable tag matches `<slug>.php` header version + `<PREFIX>_VERSION` constant.
- [ ] `readme.txt` Tested up to is the current WP release (`wp core version` on a fresh install).
- [ ] `readme.txt` Requires PHP matches `composer.json` floor.
- [ ] `bin/slug-research.sh` says the slug is available + not trademarked.
- [ ] `uninstall.php` cleans up *every* option, transient, custom-table, post-meta the plugin writes.
- [ ] No `error_log()` / `var_dump()` / `console.log()` debug calls left in.
- [ ] No hardcoded credentials, API keys, internal URLs.
- [ ] `composer.lock` is committed (reproducibility) — Plugin Check warns if absent.
- [ ] Tested with `WP_DEBUG = true` — no notices/warnings during install or settings save.

If any item is checked sloppily, the plugin will eventually surface a real bug or look abandoned in directory rankings. Take the 30 minutes.
