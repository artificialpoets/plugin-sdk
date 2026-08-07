# Release pipeline — auto-bump on merge, GitHub releases, dual-channel updates

> Load this skill when: cutting a release, debugging the release workflow, deciding which distribution channel a plugin should use, wiring up Plugin Update Checker, or merging a PR you intend to ship.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/release-pipeline.md`

Every plugin scaffolded by `npx @plugin-sdk/cli create` ships with two CI workflows:

- **`.github/workflows/ci.yml`** — lint + Plugin Check on every push and PR.
- **`.github/workflows/release.yml`** — auto-bump and publish on every merge to `main` (only emitted when the scaffold's distribution channel is `github` or `dual`).

This skill teaches what the release workflow does, how to control it, and how to debug it when it doesn't do what you wanted.

For the wp.org submission flow (different mental model, different tools), load [`skills/submission-prep.md`](./submission-prep.md) instead. For the underlying Plugin Check rules and naming conventions, [`skills/publishing.md`](./publishing.md). To publish to the wp.org SVN repo automatically from this same release job — CI wiring, secrets, and readme/assets updates without a version bump — load [`skills/wporg-svn-deploy.md`](./wporg-svn-deploy.md).

---

## 1. The distribution channels

Distribution channel is decided once, at scaffold time. The CLI's `--channel=<id>` flag (or interactive prompt) accepts three values:

| Channel | Updates from… | Ships `release.yml`? | Ships `readme.txt` + `submission-prep.sh`? | Includes PUC? |
|---|---|---|---|---|
| `wp.org` | WordPress.org SVN | no | yes | no |
| `github` | GitHub releases (via Plugin Update Checker) | yes | no | always-on |
| `dual` | wp.org **and** GitHub (early-access channel) | yes | yes | marker-gated |

`wp.org` is the default — it's the safest baseline for Plugin Check (no extra dependencies that might trip review). Pick `github` for plugins you don't intend to submit to wp.org (premium plugins, internal company plugins, niche tools). Pick `dual` when you want both — a stable channel on wp.org for the general user, plus a GitHub release channel for prerelease / early-access builds your power users opt into via a `.use-github-updates` marker file.

### Switching channels post-scaffold

The CLI doesn't have a `migrate-channel` command yet. If you need to change channels, edit the three places by hand:

1. `composer.json` — add or remove `yahnis-elsts/plugin-update-checker: ^5.0` from `require`.
2. `<slug>.php` — add, remove, or rewrite the `/* === PUC:BEGIN === */ … /* === PUC:END === */` block. For dual-channel it should match the original scaffolded form (marker-gated); for github-only the marker check is `true`; for wp.org-only the block is absent.
3. `.github/workflows/release.yml` — present for `github` + `dual`, absent for `wp.org`.

Plus: when adding the wp.org leg, write a `readme.txt` (load [`skills/publishing.md`](./publishing.md) for the format) and `bin/submission-prep.sh` (load [`skills/submission-prep.md`](./submission-prep.md)).

---

## 2. What release.yml does on every push to main

```text
push to main
   │
   │ commit message contains [skip-release]?
   ├─── yes ──→ skip the whole job. (The workflow's own bump
   │            commits always carry [skip-release] so it never recurses.)
   │
   └─── no ──→ continue:
        ▸ checkout (fetch-depth: 0 — full history)
        ▸ composer install (dev deps included)
        ▸ composer run phpsyntax  ─┐ same quality gate ci.yml runs;
        ▸ composer run lint       ─┘ defends against direct pushes
                                     to main that bypassed ci.yml.
        ▸ read current header version from <slug>.php
        ▸ decide release version:
            • tag v<header> doesn't exist?  ship verbatim.
            • tag exists + [major] in msg?  bump major.
            • tag exists + [minor] in msg?  bump minor.
            • tag exists + anything else?   bump patch.
        ▸ rewrite Version: header + <PREFIX>_VERSION constant
          + readme.txt Stable tag (only on bump).
        ▸ commit + push the bump with [skip-release] in the message.
        ▸ bash bin/build.sh github
            → writes .use-github-updates marker into the dist
            → produces build/<slug>.zip + build/<slug>-v<version>.zip
        ▸ wordpress/plugin-check-action@v1 against the built dist
        ▸ gh release create v<version> \
              build/<slug>-v<version>.zip \
              build/<slug>.zip \
              --generate-notes --latest
```

---

## 3. Controlling the bump

The bump level is decided by tokens in the head commit's message:

```bash
git commit -m "Fix off-by-one in cron schedule"            # → patch bump
git commit -m "Add CSV export endpoint [minor]"            # → minor bump
git commit -m "Drop PHP 7.4 support [major]"               # → major bump
git commit -m "Fix typo in readme [skip-release]"           # → no release
```

The `[major]` / `[minor]` tokens are case-insensitive. `[skip-release]` short-circuits the whole job.

### First release — ship the header version verbatim

The very first time you push to main with a version in the header that hasn't been tagged yet, the workflow ships that version unchanged. So if the scaffolded plugin starts at `0.1.0` and you've added a feature you want to call `0.2.0`, edit the header to `* Version: 0.2.0` and push — that becomes the first release tag. The next push will *bump* (not stay at `0.2.0`), so the header is the "starting line", the auto-bump takes it from there.

---

## 4. Three-place version sync

WordPress wants the version in three independent places:

```php
/* <slug>.php — plugin header */
* Version: 1.2.3

/* <slug>.php — PHP constant the runtime reads */
define('<PREFIX>_VERSION', '1.2.3');
```

```text
/* readme.txt — what wp.org's SVN trunk advertises as the current release */
Stable tag: 1.2.3
```

`release.yml` updates all three in lockstep on every bump. If you ever bump by hand, sync all three or `bin/submission-prep.sh` will refuse to build a dist (version triple mismatch is its first hard check). The `composer run check` in CI doesn't validate the three-way agreement — that's the submission-prep step's responsibility.

---

## 5. Common failure modes + fixes

**Workflow runs, says "tag v0.1.0 exists" but no GH release shows up.**
The bump commit can't push back. Open Settings → Actions → General → Workflow permissions and switch to "Read and write permissions". The release step uses `GITHUB_TOKEN` with `contents: write` granted at the workflow level; the org-level policy can override that.

**Plugin Check fails on the release dist but passes in ci.yml.**
ci.yml runs Plugin Check on the same build artefact (`bash bin/build.sh`). Almost always means the dist differs because `release.yml` runs `bash bin/build.sh github` (mode = github, writes the marker file). The marker file itself isn't a Plugin Check issue, but the PUC code path in `<slug>.php` is — review the PUC block + comments and make sure your handler URL and slug match.

**Release shows up with two zips but the bigger one is the wp.org dist.**
That's intentional. `<slug>.zip` is the "latest" pointer. `<slug>-v<version>.zip` is the canonical versioned asset. Both contain the same files; only the filenames differ. Plugin Update Checker reads either.

**You hand-pushed a tag (`git tag v0.1.0 && git push --tags`) and the workflow didn't fire.**
Releases are only triggered by pushes to `main`, not by tag pushes. The auto-bump tag is a *side effect* of pushing to main, not an input. If you really want to ship a specific commit as a release, push the commit to main; the workflow will tag it.

**You pushed a commit, the workflow ran, and now there's an extra `chore(release):` commit on main you didn't make.**
That's the version-bump commit from `release.yml`. It carries `[skip-release]` so it doesn't itself trigger another release. You can git-pull to keep your local in sync; you don't need to do anything with the commit otherwise.

---

## 6. The PUC block — Plugin Update Checker

The boilerplate ships with a PUC block in `<slug>.php`:

```php
/* === PUC:BEGIN === */
if (
    file_exists(PSDK_DIR . '.use-github-updates')
    && class_exists(\YahnisElsts\PluginUpdateChecker\v5\PucFactory::class)
) {
    \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/your-org/<slug>/',     // ← edit me
        PSDK_FILE,
        '<slug>'
    );
}
/* === PUC:END === */
```

The CLI rewrites this block per channel at scaffold time (see the table in §1). Once scaffolded, **the GitHub URL is a placeholder** — change it to your actual repo URL before the first GH release. PUC reads release metadata from that URL, parses the readme.txt inside the latest release zip, and pushes the update prompt into WP Dashboard → Updates the same way WordPress.org itself does.

Pin a major version of PUC (`^5.0`) — they ship breaking changes between major versions. If you need to upgrade, read [yahnis-elsts/plugin-update-checker](https://github.com/yahnis-elsts/plugin-update-checker) release notes.

---

## 7. Quick checklist before merging to main

- [ ] Header version is what you want the release to be (or you've checked the commit message includes the right bump token).
- [ ] Changelog entry matches the version you're about to ship.
- [ ] PR's CI run (lint + Plugin Check) was green — `release.yml` re-runs the gate, but failing it again wastes a workflow run.
- [ ] For github / dual channel: the PUC URL in `<slug>.php` points at the real repo, not the `your-org/<slug>` placeholder.
- [ ] You're OK with the auto-generated GH release notes (`--generate-notes`) — they pull from PR titles + commits since the last tag.
