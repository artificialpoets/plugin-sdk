# WordPress.org SVN deploy — sync a GitHub repo to the plugin directory

> Load this skill when: automating deploys to the WordPress.org SVN repo from a GitHub repo, setting up the SVN secrets, pushing a readme/assets update without a version bump, or debugging why a release didn't reach wp.org.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/wporg-svn-deploy.md`

WordPress.org hosts approved plugins in **Subversion (SVN)**, not Git. You develop on GitHub; the directory serves from SVN. This skill wires the two together so a merge to `main` publishes to wp.org automatically — no manual `svn` dance per release.

It builds on two neighbours:

- [`skills/submission-prep.md`](./submission-prep.md) — the **manual** trunk → tag flow and the one-time first upload. Read that first if you've never pushed to SVN.
- [`skills/release-pipeline.md`](./release-pipeline.md) — the GitHub release side (auto-bump, GH releases). The SVN deploy runs as the **last step of the same release job**, reusing the dist it already built.

---

## 1. The mental model

| | Git / GitHub | SVN / wp.org |
|---|---|---|
| Where code lives | branches, tags, commits | `trunk/`, `tags/<version>/`, `assets/` |
| What ships to users | a GitHub release zip (optional) | the `tags/<stable>/` directory |
| Which version is "live" | the latest release tag | the **`Stable Tag`** field in `trunk/readme.txt` |
| Marketing page assets | (n/a) | `assets/` (banner, icon, screenshots) — **not** in the plugin zip |

Two facts that trip people up:

1. **`trunk/readme.txt` `Stable Tag` is the switch.** wp.org reads it from *trunk* to decide which `tags/` folder to serve. If Stable Tag says `1.2.0`, the directory serves `tags/1.2.0/`.
2. **`assets/` lives in SVN only.** Banner/icon/screenshots go in the SVN `assets/` directory (mirrored from a `.wordpress-org/` folder in the repo), never in the shipped plugin.

There are therefore **two kinds of deploy**, and good automation handles both:

- **Versioned release** — new code → new `tags/<version>/` + `trunk/` update. Requires a version bump.
- **Readme / assets refresh** — update the listing text ("Tested up to", description, screenshots) with **no code change and no version bump**. Touches `trunk/readme.txt` and `assets/` only.

---

## 2. Why deploy from the *release job*, not a separate workflow

The obvious design — a workflow triggered by `release: published` or `push: tags: ['v*']` — **does not fire** when the release/tag was created by the built-in `GITHUB_TOKEN`. GitHub deliberately suppresses that to prevent recursive workflow runs. So a `release.yml` that does `gh release create …` will *not* trigger a separate `svn-deploy.yml`.

Two ways out:

1. **Run the SVN deploy as the final step of the same job that cuts the release.** No cross-workflow trigger needed, and it reuses the dist already built. **This is the recommended default.**
2. Trigger the separate workflow with a **Personal Access Token** instead of `GITHUB_TOKEN`. More moving parts, another secret to rotate. Only worth it if the deploy genuinely needs to be its own workflow.

This skill uses option 1.

---

## 3. The deploy script

A self-contained `bin/deploy-svn.sh` keeps the logic testable locally and identical in CI. It:

1. Reads the version from the plugin header (single source of truth).
2. Builds the dist (unless `SKIP_BUILD=1` — CI sets this because an earlier step already built it).
3. Checks out the SVN repo, syncs the dist into `trunk/`, and stages adds **and** deletions.
4. Mirrors `.wordpress-org/` into `assets/` if that folder exists.
5. Creates `tags/<version>/` **only if it doesn't already exist** (idempotent — safe to re-run; readme-only deploys skip the tag).
6. Commits with credentials from env or a creds file.

```bash
#!/usr/bin/env bash
# bin/deploy-svn.sh — publish the built plugin to the WordPress.org SVN repo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"

SLUG="your-plugin-slug"                         # ← the wp.org slug (== folder + text domain)
MAIN_FILE="${SLUG}.php"
SVN_URL="https://plugins.svn.wordpress.org/${SLUG}"
DIST_DIR="${ROOT}/build/${SLUG}"
SVN_DIR="${ROOT}/build/svn"

# Credentials: env vars, or a file passed as $1 ("Username:" / "Password:" lines).
if [[ -n "${1:-}" && -f "${1}" ]]; then
  SVN_USERNAME="$(grep -i '^Username:' "$1" | awk '{print $2}')"
  SVN_PASSWORD="$(grep -i '^Password:' "$1" | awk '{print $2}')"
fi
: "${SVN_USERNAME:?Set SVN_USERNAME (or pass a credentials file)}"
: "${SVN_PASSWORD:?Set SVN_PASSWORD (or pass a credentials file)}"
command -v svn >/dev/null || { echo "::error:: svn is not installed"; exit 1; }

VERSION="$(grep -E '^\s*\*\s*Version:' "${MAIN_FILE}" | head -1 \
           | sed -E 's/.*Version:[[:space:]]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/')"
[[ -n "$VERSION" ]] || { echo "::error:: no Version in ${MAIN_FILE}"; exit 1; }
echo "→ Deploying ${SLUG} v${VERSION}"

[[ "${SKIP_BUILD:-0}" == "1" ]] || bash bin/build.sh
[[ -f "${DIST_DIR}/${MAIN_FILE}" ]] || { echo "::error:: dist missing — run bin/build.sh"; exit 1; }

rm -rf "${SVN_DIR}"
svn checkout --depth immediates "${SVN_URL}" "${SVN_DIR}"
svn update --set-depth infinity "${SVN_DIR}/trunk"
rsync -a --delete --exclude='.svn' "${DIST_DIR}/" "${SVN_DIR}/trunk/"

cd "${SVN_DIR}"
svn add trunk/* --force >/dev/null 2>&1 || true
svn status trunk | awk '/^!/ {print $2}' | while read -r p; do svn rm --force "$p" >/dev/null 2>&1 || true; done

if [[ -d "${ROOT}/.wordpress-org" ]]; then
  svn update --set-depth infinity assets
  rsync -a --delete --exclude='.svn' "${ROOT}/.wordpress-org/" assets/
  svn add assets/* --force >/dev/null 2>&1 || true
  svn status assets | awk '/^!/ {print $2}' | while read -r p; do svn rm --force "$p" >/dev/null 2>&1 || true; done
fi

if svn ls "${SVN_URL}/tags/${VERSION}" >/dev/null 2>&1; then
  echo "→ tags/${VERSION} exists; committing trunk/assets changes only."
else
  svn cp "trunk" "tags/${VERSION}"
fi

svn commit --username "${SVN_USERNAME}" --password "${SVN_PASSWORD}" \
  --no-auth-cache --non-interactive -m "Release ${VERSION}"
echo "✓ Deployed to ${SVN_URL}"
```

> **The `--depth immediates` + `--set-depth infinity` two-step** is deliberate: a full checkout of a mature plugin can be hundreds of MB (every historical tag). We fetch the directory shells, then deepen only `trunk` (and `assets`), never the old tags.

> **`svn cp trunk tags/<v>` copies server-side history, not a fresh dir.** Always tag *from trunk* after trunk is staged, so the tag captures exactly what you committed.

---

## 4. The CI wiring

Append these steps to the end of the release job in `.github/workflows/release.yml` (the job that already built the dist and created the GitHub release):

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    # Exposed job-wide so the deploy steps can self-skip until secrets exist.
    env:
      SVN_USERNAME: ${{ secrets.SVN_USERNAME }}
    steps:
      # … build dist, run Plugin Check, create the GitHub release …

      - name: Install Subversion
        if: ${{ env.SVN_USERNAME != '' }}
        run: sudo apt-get update && sudo apt-get install -y subversion

      - name: Deploy to WordPress.org
        if: ${{ env.SVN_USERNAME != '' }}
        env:
          SVN_PASSWORD: ${{ secrets.SVN_PASSWORD }}
          SKIP_BUILD: '1'          # dist already built earlier in this job
        run: bash bin/deploy-svn.sh
```

Two things make this safe:

- **`env.SVN_USERNAME` is promoted to the job level** so the step-level `if:` can read it. A step's own `env:` is *not* available to that step's `if:` — the condition is evaluated before step env is applied. This is the single most common mistake wiring this up.
- **Both steps self-skip when the secret is absent** (`if: env.SVN_USERNAME != ''`). The workflow stays green on forks and before you've configured secrets; it only deploys once the credentials are set on the canonical repo.

### Alternative: the 10up action

If you'd rather not own the script, [`10up/action-wordpress-plugin-deploy`](https://github.com/10up/action-wordpress-plugin-deploy) does the same job (and [`action-wordpress-plugin-asset-update`](https://github.com/10up/action-wordpress-plugin-asset-update) for readme/assets-only). Trade-off: less code to maintain, but a third-party action in your supply chain and it keys off tag/release events (so you still confront the `GITHUB_TOKEN` trigger problem — you'd run it as a step with an explicit `SLUG`/`VERSION`, or trigger via PAT). The self-contained script above avoids both.

---

## 5. Setting the secrets

wp.org gives you an **SVN password** distinct from your account password — generate it in your profile's *Account & Security → SVN* section (`https://profiles.wordpress.org/<user>/profile/edit/group/3/`). It is **not** your wordpress.org login password.

Set two repo secrets, `SVN_USERNAME` (your wp.org username, case-sensitive) and `SVN_PASSWORD` (the SVN password):

```bash
# Via gh CLI (piped, so the value never lands in shell history):
printf '%s' 'your-wporg-username' | gh secret set SVN_USERNAME --repo OWNER/REPO
printf '%s' 'your-svn-password'   | gh secret set SVN_PASSWORD --repo OWNER/REPO

# Confirm (names only; values are write-only):
gh secret list --repo OWNER/REPO
```

Or in the browser: **repo → Settings → Secrets and variables → Actions → New repository secret**.

**Security notes:**

- Repo secrets are **not exposed to workflows triggered by pull requests from forks** — a PR from a fork can't exfiltrate them. That's why the `if: env.SVN_USERNAME != ''` guard matters: forks and PRs run the workflow with an empty secret and skip the deploy cleanly.
- Prefer the SVN-specific password over your account password so you can rotate it independently, and revoke it without touching your login.
- Never echo the password in a `run:` step. Pass it through `env:` and let `svn` read it; avoid `--password "$X"` in a line that also runs `set -x`.

---

## 6. Readme / assets updates without a version bump

You do **not** need a release to fix a typo, bump "Tested up to", or add screenshots. Those live in `trunk/readme.txt` and `assets/`.

The lowest-risk way to test the whole SVN pipeline is exactly this: change `readme.txt`, deploy **trunk only**, leave `Stable Tag` and every `tags/` folder untouched. Locally:

```bash
# edit readme.txt (e.g. Tested up to, description), then:
bin/deploy-svn.sh ~/path/to/svn-creds
# → tags/<current> already exists, so the script commits trunk (+ assets) only.
#   No new tag, no version change, zero risk to the served download.
```

**What updates, and when:**

- **`assets/`** (banner/icon/screenshots) refresh on the plugin page within minutes — they're read straight from SVN `assets/`.
- **"Tested up to" and the description** are read from the **stable tag's** `readme.txt`. Updating only `trunk/readme.txt` refreshes some fields but not reliably all of them. To force the listing to match without shipping code, either (a) bump to a new patch version (cleanest), or (b) also copy the new readme into the current stable tag folder (`tags/<stable>/readme.txt`) — editing readme/assets inside an existing tag is permitted; editing *code* inside a shipped tag is not.

For a routine "we tested against the new WP release" bump, most maintainers just do a patch release — it's the honest signal to users and sidesteps the ambiguity.

---

## 7. Reconciling an existing repo before turning auto-deploy on

If the repo already has GitHub tags/releases from before it was on wp.org, line them up first or the auto-bump logic will fight you:

- If `release.yml` auto-bumps when the header tag already exists on GitHub, a stale `v<current>` tag makes it bump to the *next* version and deploy that — a version ahead of what's actually on wp.org.
- **Fix:** delete stale GitHub tags/releases that were never published to SVN, so the next merge ships the intended version verbatim. The deploy script is idempotent on the SVN side — if `tags/<version>/` already exists there, it commits only trunk/assets and won't duplicate the tag.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Deploy step skipped | `SVN_USERNAME` secret unset (or on a fork) | Set the secrets on the canonical repo; forks are meant to skip. |
| `svn: E170001: Authorization failed` | Using account password, not the SVN password; or wrong username case | Generate the SVN password in your profile; usernames are case-sensitive. |
| `svn: E160020: File already exists … tags/<v>` | Re-running a deploy for a version already tagged | Expected; the script guards this — ensure you didn't remove the `svn ls … tags/<v>` check. |
| New version live on GitHub but not wp.org | Deploy step didn't run, or `Stable Tag` in `trunk/readme.txt` wasn't bumped | Confirm the deploy step ran; ensure the release bump also rewrites `readme.txt` Stable Tag. |
| Plugin page shows old description after a readme-only trunk commit | Display fields read from the stable tag, not trunk | Ship a patch release, or update `tags/<stable>/readme.txt` too (§6). |
| Banner/icon not showing | Assets in the plugin zip instead of SVN `assets/` | Move them to a `.wordpress-org/` repo folder; the script mirrors it to SVN `assets/`. |

---

## Checklist — wiring auto-deploy into a repo

- [ ] `bin/deploy-svn.sh` present, `SLUG` set, `chmod +x`.
- [ ] `bin/build.sh` produces `build/<slug>/` (the dist the deploy syncs to trunk).
- [ ] `release.yml` has the two deploy steps, with `SVN_USERNAME` promoted to **job-level** `env`.
- [ ] `SVN_USERNAME` + `SVN_PASSWORD` repo secrets set (SVN password, not account password).
- [ ] Stale pre-wp.org GitHub tags reconciled (§7).
- [ ] Verified once with a **readme-only** trunk deploy before trusting a real release (§6).
- [ ] (Optional) `.wordpress-org/` folder with `banner-1544x500`, `icon-256x256`, `screenshot-1.png`, … for the listing.
