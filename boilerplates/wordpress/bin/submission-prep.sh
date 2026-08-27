#!/usr/bin/env bash
#
# submission-prep.sh — one command to go from "feature works" to
# "ready to submit to WordPress.org".
#
# Walks the same checks a reviewer will run, in order, so anything
# that would fail review fails here first. Exits non-zero on any
# blocker. Prints a short summary at the end with the next steps.
#
# Usage:
#   bash bin/submission-prep.sh        # full prep
#   bash bin/submission-prep.sh --skip-tests  # skip composer test step
#
# Designed to be re-runnable. Each step is idempotent.

set -euo pipefail

SLUG="plugin-sdk-starter"            # ← substituted to <slug> at scaffold time
SKIP_TESTS=0

for arg in "$@"; do
    case "$arg" in
        --skip-tests) SKIP_TESTS=1 ;;
        *) echo "Unknown flag: $arg" >&2; exit 1 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PLUGIN_ROOT}"

# ─── Tiny ANSI helpers ─────────────────────────────────────────────────

if [[ -t 1 ]]; then
    BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; RESET=$'\033[0m'
else
    BOLD=''; DIM=''; GREEN=''; YELLOW=''; RED=''; RESET=''
fi

step() { printf "%s▸%s %s\n" "${BOLD}" "${RESET}" "$1"; }
pass() { printf "  %s✓%s %s\n" "${GREEN}" "${RESET}" "$1"; }
warn() { printf "  %s⚠%s %s\n" "${YELLOW}" "${RESET}" "$1"; }
fail() { printf "  %s✗%s %s\n" "${RED}" "${RESET}" "$1"; exit 1; }

# ─── 1. Working tree must be clean ─────────────────────────────────────

step "Verifying working tree is clean"
if [[ -d .git ]] && ! git diff-index --quiet HEAD -- 2>/dev/null; then
    git status --short
    fail "Uncommitted changes. Commit or stash before preparing a submission build."
fi
pass "working tree is clean (or not a git repo)"

# ─── 2. Version triple must agree ──────────────────────────────────────

step "Verifying version is consistent across header / constant / readme.txt"

MAIN_FILE="${SLUG}.php"
if [[ ! -f "${MAIN_FILE}" ]]; then
    fail "Main plugin file not found: ${MAIN_FILE}"
fi

HEADER_VERSION=$(grep -E '^\s*\*\s*Version:' "${MAIN_FILE}" | head -1 \
                 | sed -E 's/.*Version:[[:space:]]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/')
CONST_VERSION=$(grep -E "define\([[:space:]]*'[A-Z_]*VERSION'" "${MAIN_FILE}" | head -1 \
                | sed -E "s/.*'([0-9]+\.[0-9]+\.[0-9]+)'.*/\1/")
README_VERSION=""
if [[ -f readme.txt ]]; then
    README_VERSION=$(grep -E '^\s*Stable tag:' readme.txt | head -1 \
                     | sed -E 's/.*Stable tag:[[:space:]]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/')
fi

echo "  ${DIM}header  =${RESET} ${HEADER_VERSION:-?}"
echo "  ${DIM}constant=${RESET} ${CONST_VERSION:-?}"
echo "  ${DIM}readme  =${RESET} ${README_VERSION:-?}"

if [[ -z "${HEADER_VERSION}" || -z "${CONST_VERSION}" || -z "${README_VERSION}" ]]; then
    fail "Missing one of: plugin header Version, *_VERSION constant, readme.txt Stable tag."
fi
if [[ "${HEADER_VERSION}" != "${CONST_VERSION}" || "${HEADER_VERSION}" != "${README_VERSION}" ]]; then
    fail "Version mismatch — sync header + constant + readme.txt Stable tag before submitting."
fi
pass "all three say ${HEADER_VERSION}"

# ─── 3. Lint + syntax ──────────────────────────────────────────────────

step "Running composer run check (phpsyntax + phpcs)"
composer run check
pass "lint clean"

# ─── 4. Tests (optional) ───────────────────────────────────────────────

if [[ "${SKIP_TESTS}" == "0" ]]; then
    if grep -q '"test":' composer.json 2>/dev/null && [[ -d tests ]]; then
        step "Running composer test"
        composer test
        pass "tests pass"
    else
        warn "No composer.json test script or tests/ directory found — skipping."
    fi
fi

# ─── 5. Build the wp.org dist ──────────────────────────────────────────

step "Building wp.org-clean dist via bin/build.sh"
bash bin/build.sh wporg
pass "dist built"

# ─── 6. Local Plugin Check (optional — only if wp-cli is installed) ────

step "Running Plugin Check locally (best-effort)"
if command -v wp >/dev/null 2>&1; then
    # wp-cli is on PATH; try running plugin-check against the built dist.
    if wp plugin check --help >/dev/null 2>&1; then
        # Plugin Check command exists. Need a path it understands.
        # Many setups need the plugin to be in wp-content/plugins/ — for
        # other setups, --path makes wp-cli use the built dist directly.
        if wp plugin check "${SLUG}" --path="${PLUGIN_ROOT}/build" 2>/dev/null; then
            pass "Plugin Check passed locally"
        else
            warn "Local Plugin Check returned issues — review output above."
            warn "CI will run the same check on the GitHub Action runner."
        fi
    else
        warn "wp-cli is installed but the 'wp plugin check' subcommand is not."
        warn "  Install: wp plugin install plugin-check --activate"
        warn "  CI runs Plugin Check via the GitHub Action — that's the source of truth."
    fi
else
    warn "wp-cli not on PATH — skipping local Plugin Check."
    warn "  The CI workflow (.github/workflows/ci.yml) runs Plugin Check"
    warn "  on every push; merging green there means wp.org-ready."
fi

# ─── 7. Reviewer-flag scan ─────────────────────────────────────────────
# Greps the source for patterns wp.org's AUTOMATED first-pass review is
# known to flag (observed in real review cycles). These are warnings,
# not failures — each has legitimate uses — but every hit costs a
# review round-trip (~1 week) if the reviewer's AI disagrees with you.

step "Scanning for patterns the wp.org automated reviewer flags"

SCAN_DIRS=("src" ".")
REVIEW_WARNINGS=0

# 7a. __return_true permission callbacks. The automated reviewer traces
#     the DATA FLOW of public endpoints: if the served data was fetched
#     with stored credentials (API keys, Application Passwords), a
#     public passthrough bypasses the upstream's access control — and
#     an "intentionally public" comment does not satisfy the check.
PUBLIC_ROUTES=$(grep -rn "__return_true" --include="*.php" src/ "${SLUG}.php" 2>/dev/null || true)
if [[ -n "${PUBLIC_ROUTES}" ]]; then
    REVIEW_WARNINGS=1
    warn "Found permission_callback => '__return_true' — audit each one:"
    echo "${PUBLIC_ROUTES}" | while IFS= read -r line; do
        echo "      ${line}"
    done
    warn "  OK only for intrinsically public data. If the endpoint re-serves"
    warn "  anything fetched with stored credentials, the reviewer WILL flag"
    warn "  it (even with an 'intentionally public' comment). See"
    warn "  skills/security.md → 'Public endpoints: __return_true is audited"
    warn "  by data flow'."
fi

# 7b. Loose boolean sanitization. The reviewer flags raw casts in
#     sanitize callbacks: "(bool)", "!empty(", "boolval(" — arbitrary
#     non-empty strings become true. rest_sanitize_boolean() passes.
LOOSE_BOOLS=$(grep -rnE "sanitize_callback[^)]*\((bool)\)|'sanitize_callback'[^,]*=>[^,]*\(bool\)|=> *! *empty\(" --include="*.php" src/ "${SLUG}.php" 2>/dev/null || true)
if [[ -n "${LOOSE_BOOLS}" ]]; then
    REVIEW_WARNINGS=1
    warn "Possible loose boolean sanitization (raw cast / !empty):"
    echo "${LOOSE_BOOLS}" | while IFS= read -r line; do
        echo "      ${line}"
    done
    warn "  The automated reviewer flags raw boolean casts as 'too loose'."
    warn "  Use rest_sanitize_boolean() instead. See skills/security.md."
fi

# 7c. register_setting without a sanitize_callback. Every setting must
#     name its sanitizer explicitly — the reviewer checks for this.
UNSANITIZED_SETTINGS=$(grep -rn "register_setting" --include="*.php" src/ "${SLUG}.php" 2>/dev/null \
    | grep -v "sanitize_callback" || true)
if [[ -n "${UNSANITIZED_SETTINGS}" ]]; then
    REVIEW_WARNINGS=1
    warn "register_setting() call(s) with no sanitize_callback on the same line:"
    echo "${UNSANITIZED_SETTINGS}" | while IFS= read -r line; do
        echo "      ${line}"
    done
    warn "  If the callback is declared on a following line this is a false"
    warn "  positive — but verify each one names a proper sanitizer."
fi

# 7d. is_user_logged_in() as a permission_callback. "Any logged-in user"
#     is not an authorization boundary for non-public data — the reviewer
#     flags it and wants a capability check matching the data sensitivity.
LOGGED_IN_ONLY=$(grep -rnE "permission_callback['\"]?[^,]*is_user_logged_in" --include="*.php" src/ "${SLUG}.php" 2>/dev/null || true)
if [[ -n "${LOGGED_IN_ONLY}" ]]; then
    REVIEW_WARNINGS=1
    warn "permission_callback resolving to is_user_logged_in():"
    echo "${LOGGED_IN_ONLY}" | while IFS= read -r line; do
        echo "      ${line}"
    done
    warn "  A subscriber is logged in. For non-public data, gate on a"
    warn "  capability (current_user_can('manage_options')) instead. See"
    warn "  skills/security.md → 'is_user_logged_in() is not a capability check'."
fi

# 7e. Non-resolving header URLs. The reviewer fetches Plugin URI /
#     Author URI and fails the plugin if they don't resolve. This is a
#     best-effort HTTP check (skipped offline); the safe default is to
#     omit these headers until you have a live homepage.
HEADER_URLS=$(grep -iE "^\s*\*\s*(Plugin URI|Author URI):" "${SLUG}.php" 2>/dev/null \
    | sed -E 's/.*URI:[[:space:]]*//' | tr -d '\r' || true)
if [[ -n "${HEADER_URLS}" ]]; then
    while IFS= read -r url; do
        [[ -z "${url}" ]] && continue
        if command -v curl >/dev/null 2>&1; then
            if ! curl -sSfL --max-time 8 -o /dev/null "${url}" 2>/dev/null; then
                REVIEW_WARNINGS=1
                warn "Header URL does not resolve: ${url}"
                warn "  wp.org fetches Plugin URI / Author URI and rejects dead"
                warn "  links. Fix the URL or remove the header line entirely."
            fi
        else
            warn "Header declares a URL (${url}) — verify it resolves; curl"
            warn "  not available to check automatically."
        fi
    done <<< "${HEADER_URLS}"
fi

# 7e-2. Plugin URI and Author URI must not carry the same value. A real
#       review (2026) failed a plugin with: "Your plugin and author URIs
#       are the same ... Those two must be different. You are not required
#       to provide both, so pick the one that best applies." A Plugin URI
#       is a page about THIS plugin; an Author URI is a page about the
#       author. Note the interaction with 7e: pointing a dead Plugin URI
#       at your homepage to make it resolve trips THIS check instead.
PLUGIN_URI=$(grep -iE "^\s*\*\s*Plugin URI:" "${SLUG}.php" 2>/dev/null \
    | head -1 | sed -E 's/.*URI:[[:space:]]*//' | tr -d '\r' || true)
AUTHOR_URI=$(grep -iE "^\s*\*\s*Author URI:" "${SLUG}.php" 2>/dev/null \
    | head -1 | sed -E 's/.*URI:[[:space:]]*//' | tr -d '\r' || true)
if [[ -n "${PLUGIN_URI}" && "${PLUGIN_URI%/}" == "${AUTHOR_URI%/}" ]]; then
    REVIEW_WARNINGS=1
    warn "Plugin URI and Author URI are identical: ${PLUGIN_URI}"
    warn "  wp.org rejects this outright. Neither header is required —"
    warn "  delete whichever one you can't point at a distinct, live page."
    warn "  See skills/publishing.md → 'Plugin header URLs'."
fi

# 7i. readme.txt "Tested up to" vs the CURRENT core release. wp.org's
#     automated scan hard-FAILS on a stale value
#     (ERROR: outdated_tested_upto_header, "Tested up to: 7.0 < 7.1") and
#     says the plugin will not appear in directory searches. Unique among
#     these checks: it goes stale on its own the day core ships, so a
#     submission that passed last week fails today. Best-effort — skips
#     cleanly offline.
TESTED_UPTO=$(grep -E '^Tested up to:' readme.txt 2>/dev/null | sed -E 's/.*:[[:space:]]*//' | tr -d '[:space:]')
if [[ -n "${TESTED_UPTO}" ]] && command -v curl >/dev/null 2>&1; then
    CORE_LATEST=$(curl -sf --max-time 10 https://api.wordpress.org/core/stable-check/1.0/ 2>/dev/null \
        | tr ',' '\n' | grep '"latest"' | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1)
    if [[ -n "${CORE_LATEST}" && "${TESTED_UPTO}" != "${CORE_LATEST}" ]]; then
        REVIEW_WARNINGS=1
        warn "readme.txt 'Tested up to: ${TESTED_UPTO}' != current core ${CORE_LATEST}"
        warn "  wp.org fails the submission scan on this and drops the plugin"
        warn "  out of directory search. Test against ${CORE_LATEST}, then bump."
    fi
fi

# 7g. Inline <script> / <style> tags emitted from PHP. wp.org quotes the
#     file and line back at you ("Use wp_enqueue commands") and pends the
#     submission. Every case has a function: wp_enqueue_script/style for
#     files, wp_add_inline_script/style for code. A `false` src registers
#     a handle for inline-only payloads.
INLINE_TAGS=$(grep -rnE "<(script|style)[ >]" --include="*.php" src/ "${SLUG}.php" 2>/dev/null || true)
if [[ -n "${INLINE_TAGS}" ]]; then
    REVIEW_WARNINGS=1
    warn "Inline <script>/<style> tag(s) emitted from PHP:"
    echo "${INLINE_TAGS}" | while IFS= read -r line; do
        echo "      ${line}"
    done
    warn "  Admin render callbacks count too — that is the spot reviewers"
    warn "  actually flag. See skills/enqueue.md → 'This is a review"
    warn "  blocker, not a style preference'."
fi

# 7h. style="" attributes in PHP output. Not what the automated pass
#     greps for, but the same finding one round later from the human.
#     A couple is fine; a settings screen built out of them is not.
INLINE_STYLE_ATTRS=$(grep -rnoE 'style="[^"]+"' --include="*.php" src/ "${SLUG}.php" 2>/dev/null | wc -l | tr -d ' ')
if [[ "${INLINE_STYLE_ATTRS}" -gt 3 ]]; then
    warn "${INLINE_STYLE_ATTRS} inline style=\"\" attributes in PHP output."
    warn "  Past a handful this reads as a stylesheet that was never"
    warn "  written. Enqueue one and use classes."
fi

# 7f. if (!function_exists(...)) / if (!class_exists(...)) wrapping your
#     OWN code. If another plugin defines the name and loads first, your
#     version silently never loads. Reserve these for shared libraries.
EXISTS_GUARDS=$(grep -rnE "if\s*\(\s*!\s*(function_exists|class_exists)\s*\(" --include="*.php" src/ "${SLUG}.php" 2>/dev/null || true)
if [[ -n "${EXISTS_GUARDS}" ]]; then
    warn "function_exists/class_exists guard(s) found:"
    echo "${EXISTS_GUARDS}" | while IFS= read -r line; do
        echo "      ${line}"
    done
    warn "  Fine for genuinely shared libraries; a code-smell around your"
    warn "  own plugin's names (a name collision makes YOUR code silently"
    warn "  not load). Verify each is a library guard, not a self-wrap."
fi

if [[ "${REVIEW_WARNINGS}" == "0" ]]; then
    pass "no known reviewer-flag patterns found"
else
    warn "Reviewer-flag patterns found (see above). Each unaddressed hit"
    warn "risks a ~1-week automated-review round-trip. Fix or prepare a"
    warn "concise justification for the review reply."
fi

# ─── 8. Final summary ──────────────────────────────────────────────────

cat <<EOF

${BOLD}Submission build ready: build/${SLUG}-v${HEADER_VERSION}.zip${RESET}

Next steps for WordPress.org submission:

  1. First-time submission?
     - Verify the slug is available: bash bin/slug-research.sh ${SLUG}
     - Submit at https://wordpress.org/plugins/developers/add/
       Upload build/${SLUG}.zip and wait for the review email (1–4 weeks).

  2. Subsequent release on an already-approved plugin?
     - svn co https://plugins.svn.wordpress.org/${SLUG}/ wpsvn
     - Replace wpsvn/trunk/ with build/${SLUG}/
     - cd wpsvn && svn add --force trunk && svn commit -m "${HEADER_VERSION}: release"
     - svn cp trunk tags/${HEADER_VERSION} && svn commit -m "Tag ${HEADER_VERSION}"

  3. Need to also publish to GitHub? Merging to main triggers
     .github/workflows/release.yml which builds, runs Plugin Check,
     and creates a GitHub release with both zips automatically.

EOF
