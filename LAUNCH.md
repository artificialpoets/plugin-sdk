# Launch runbook — v0.1.0-rc.1 → v0.1.0

This file is the operational playbook for taking Plugin SDK from
"working in the monorepo" to "installable from npm + Packagist + the
public CDN." Track each step here so we know what's done and what's
still gating a `0.1.0` promotion.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 1 — Pre-publish prep (working tree)

Everything below should be in the working tree, tested, and ready to
push. Do **not** push the tag until Phase 2 succeeds.

- [x] `Version::SDK` → `'0.1.0-rc.1'` (PHP)
- [x] `SDK_VERSION` → `'0.1.0-rc.1'` (TS)
- [x] `Assets::VERSION` → `'0.1.0-rc.1'`
- [x] Every workspace `package.json` `version` field → `'0.1.0-rc.1'`
- [x] Root `package.json` → `0.1.0-rc.1`
- [x] Boilerplate composer.json switched from `path` repo to a `^0.1.0-rc.1 || ^0.1` versioned require
- [x] CHANGELOG.md at repo root
- [x] Domain references switched to `plugin-sdk.com`
- [x] `@plugin-sdk/wp-react` `tsup` build produces a valid `dist/` (verified locally; runtime subpath exports `SDK_VERSION`)
- [x] PHP test matrix runs on 7.4, 8.0, 8.2, 8.3 in CI (test.yml split into js-tests + php-tests jobs)
- [x] Versioned CDN paths land (`/wordpress/v0.1.0-rc.1/AGENTS.md` etc.) — verified in `cdn/wordpress/v0.1.0-rc.1/`
- [x] Mirror repo `artificialpoets/plugin-sdk-wp` created + bootstrapped with rc.1 content + `v0.1.0-rc.1` tag
- [x] `.github/workflows/sync-mirror-wp-composer.yml` written (auto-syncs on tag + workflow_dispatch)
- [x] `packages/wp-composer/LICENSE` (Apache 2.0) added so the mirror has its own LICENSE at root
- [x] `packages/wp-composer/README.md` opens with a "Read-only mirror" notice

---

## Phase 2 — GitHub repo migration

These are manual GitHub-side operations. Done outside this codebase.

- [ ] Settings → General → rename `artificialpoets/wp-admincss` to `artificialpoets/plugin-sdk`
- [ ] Settings → General → flip visibility to **public**
- [ ] Update local remote: `git remote set-url origin git@github.com:artificialpoets/plugin-sdk.git`
- [ ] Verify the autoredirect: visit the old URL, expect a 301 to the new one
- [ ] Push current `dev` branch to the new origin
- [x] **Mirror repo** `artificialpoets/plugin-sdk-wp` already exists, public, with `main` + `v0.1.0-rc.1` tag

---

## Phase 3 — Domain + Cloudflare Pages

`plugin-sdk.com` is not registered yet. Until it is, the site stays at
`wp-admincss.com`.

- [ ] Register `plugin-sdk.com` (Cloudflare Registrar or wherever)
- [ ] Add `plugin-sdk.com` + `www.plugin-sdk.com` as custom domains on the existing `wp-admincss-site` Cloudflare Pages project (so both work during the transition)
- [ ] Add `cdn.plugin-sdk.com` as a custom domain on the existing `wp-admincss-cdn` project
- [ ] Set up redirects from `wp-admincss.com` → `plugin-sdk.com` (Cloudflare Bulk Redirects or page rules)
- [ ] Update the site's canonical / OG URLs in a follow-up commit
- [ ] When everything resolves: rename Cloudflare Pages projects from `wp-admincss-*` to `plugin-sdk-*`

These can happen after Phase 2 but BEFORE Phase 4 so the CDN URLs in
the published packages don't immediately go stale.

---

## Phase 4 — npm + Packagist publishing

Do these in order. Each later step depends on the previous one resolving.

### 4a. npm

You need to be logged in (`npm login`) with publish rights to the `@plugin-sdk` scope.

```bash
# From the repo root, each in its own package dir:

cd packages/wp-tokens
npm publish --access=public --tag=next

cd packages/wp-core-css
npm publish --access=public --tag=next

cd packages/wp-react
npm run build           # produces dist/
npm publish --access=public --tag=next

cd packages/cli
npm publish --access=public --tag=next
```

The `--tag=next` flag means `npm install @plugin-sdk/cli` (without a
tag) **does not** install rc.1. Users have to opt in:
`npm install @plugin-sdk/cli@next` or `@plugin-sdk/cli@0.1.0-rc.1`.

When we promote to `0.1.0`, the same packages get published with
`--tag=latest` (the default) and the `next` tag stops auto-pointing at rc.1.

### 4b. Composer mirror — `artificialpoets/plugin-sdk-wp`

Packagist can't index a sub-directory of a monorepo, so the
`packages/wp-composer/` tree mirrors to its own GitHub repo via a
`git subtree split` GitHub Action. The mirror is what Packagist
indexes; Composer users `composer require plugin-sdk/wp` and resolve
through Packagist normally.

The mirror was bootstrapped at `https://github.com/artificialpoets/plugin-sdk-wp`
on rc.1 prep day. Its `main` branch already points at the rc.1 contents
and the `v0.1.0-rc.1` tag is in place. From here onward, every tag pushed
to the monorepo triggers `.github/workflows/sync-mirror-wp-composer.yml`
to refresh the mirror automatically.

**One-time setup before the first tag-triggered sync runs:**

1. **Create a fine-grained PAT for the mirror.**
   - Visit <https://github.com/settings/personal-access-tokens/new>
   - **Resource owner**: `artificialpoets`
   - **Repository access**: only `artificialpoets/plugin-sdk-wp`
   - **Permissions** → Repository → **Contents: Read and write**
   - Save the token string.

2. **Add it as a secret on the monorepo.**
   ```bash
   gh secret set MIRROR_PAT \
     --repo artificialpoets/plugin-sdk \
     --body 'ghp_xxxxxxxxxxxxxxxxxxxxxxxx'
   ```

3. **(Optional) Verify the workflow works without a tag** by running it
   manually:
   ```bash
   gh workflow run sync-mirror-wp-composer.yml \
     --repo artificialpoets/plugin-sdk \
     --ref main
   ```
   This force-pushes the current `main`'s wp-composer subtree to the
   mirror without creating a new tag — useful for sanity-checking the
   PAT + workflow before relying on it for tag pushes.

### 4c. Packagist registration

Once the mirror exists + has a tag (both true today), submit it.

1. Sign in at <https://packagist.org/login/github> with your GitHub
   account. No separate password — Packagist auth is GitHub OAuth.
2. Visit <https://packagist.org/packages/submit>.
3. Paste **`https://github.com/artificialpoets/plugin-sdk-wp`** (the
   mirror, not the monorepo).
4. Packagist reads the root `composer.json`, detects `plugin-sdk/wp`,
   and registers the package. Existing tags become available
   immediately (`v0.1.0-rc.1` shows up as version `0.1.0-rc.1`).
5. **Set up the auto-update webhook** so future tags appear without
   waiting for Packagist's nightly crawl:
   - On the mirror repo (`artificialpoets/plugin-sdk-wp`):
     Settings → Webhooks → Add webhook
   - **Payload URL**: `https://packagist.org/api/github?username=YOUR_PACKAGIST_USERNAME`
   - **Content type**: `application/json`
   - **Secret**: your Packagist API token (Settings → Profile on packagist.org)
   - **Events**: "Just the push event"

After this lands, tagging the monorepo with `v0.1.0-rc.2` does the full
chain end-to-end: GH Action → mirror push → mirror tag → Packagist
webhook → version visible to `composer require plugin-sdk/wp:0.1.0-rc.2`
within ~5 minutes.

### 4c. Smoke-test from the outside

In a throwaway dir, with nothing related to the SDK on disk:

```bash
mkdir /tmp/sdk-smoke && cd /tmp/sdk-smoke
npx @plugin-sdk/cli@next create "Smoke Test"
cd smoke-test
composer install        # should pull plugin-sdk/wp from Packagist
ls vendor/plugin-sdk/wp # confirm the package landed
```

If this fails, fix it before continuing.

---

## Phase 5 — End-to-end activation in WordPress

The single most important verification we still owe. Until this passes
on a clean WP, the SDK is unproven.

### Set up `wp-env`

```bash
npm install -g @wordpress/env
mkdir /tmp/sdk-e2e && cd /tmp/sdk-e2e

# minimal .wp-env.json that includes the scaffolded plugin
cat > .wp-env.json <<'EOF'
{
  "core": null,
  "plugins": ["./smoke-test"]
}
EOF

# scaffold the plugin
npx @plugin-sdk/cli@next create "Smoke Test" --slug=smoke-test --yes
cd smoke-test
composer install
cd ..

wp-env start
```

### Verify

- [ ] `wp-env start` succeeds
- [ ] Visit `http://localhost:8888/wp-admin` and log in (admin/password)
- [ ] Plugins page shows "Smoke Test" — activate it
- [ ] Settings → Smoke Test renders the page with the API Key field
- [ ] Save a value → reload → field still populated, no PHP warnings
- [ ] `wp db query "SELECT * FROM wp_smoke_test_submissions"` returns the empty table (proves the migration ran)
- [ ] POST `/wp-json/smoke-test/v1/submissions` with `{"email": "a@b.com"}` → 201
- [ ] POST same with invalid body → 400 with `rest_invalid_body`
- [ ] Deactivate → reactivate → no DB error (migration is idempotent)

Any failure → fix before promoting.

---

## Phase 6 — Plugin Check CI green

- [ ] Open a throwaway PR on the public repo to trigger `.github/workflows/plugin-check.yml`
- [ ] Action completes
- [ ] If it errors: fix the boilerplate / action config, iterate
- [ ] Once green, archive the run URL so the README can link to a known-green check

---

## Phase 7 — Tag + GitHub Release

Only after Phases 1–6 pass:

```bash
git tag v0.1.0-rc.1
git push origin v0.1.0-rc.1

# GitHub Release:
#   - Title: "v0.1.0-rc.1 — Developer Preview"
#   - Body: copy the v0.1.0-rc.1 section from CHANGELOG.md
#   - "Set as the latest release": NO (this is pre-release)
#   - "Set as pre-release": YES
```

---

## Phase 8 — Promotion to v0.1.0

When ready (every checkbox in Phase 5 passes, Plugin Check is green,
one real plugin has been built on rc.1 in the wild):

1. Bump every `0.1.0-rc.1` → `0.1.0` (mechanical search-replace)
2. CHANGELOG entry: "Promoted from rc.1; no behaviour changes."
3. Re-publish each npm package with `--tag=latest` (the default).
4. Tag `v0.1.0`, GitHub Release, mark as **latest**.
5. The CSS bundle's `cdn.wp-admincss.com/css/v0.1.0/wp-admin.css` path was published at rc.1 time — verify it actually points at the rc.1 content; if you want a separate stable URL, publish to `/css/v0.1.0/` again at promotion.

---

## Communication

After v0.1.0-rc.1 lands:

- [ ] Newsletter via `wp-admincss-newsletter` list (the embed on the footer; the lead-capture data is in api.poets.sh)
- [ ] Post on Hacker News (Show HN: Plugin SDK — the open-source SDK for WordPress)
- [ ] Tweet/X
- [ ] r/Wordpress + r/php
- [ ] Optional: comment in the WP/agent-skills GitHub repo since they're working on a related thing

For the rc, lead with "Developer Preview — we're looking for the first
external testers" rather than "Just shipped 0.1." Sets the right tone.

After v0.1.0 promotion, same surfaces with stronger language.
