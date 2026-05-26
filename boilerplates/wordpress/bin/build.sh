#!/usr/bin/env bash
#
# Build a clean production distribution of the plugin.
#
# Produces:
#   build/${SLUG}/                — the unpacked tree (rsync target)
#   build/${SLUG}.zip             — "latest" zip pointer (handy URL)
#   build/${SLUG}-v${VERSION}.zip — versioned zip (the canonical artefact)
#
# The same script runs locally and in CI so the artefact reviewers see
# is byte-identical to what maintainers test on their own machine.
#
# Usage:
#   bash bin/build.sh           # produces a wp.org-clean dist (no GH updates marker)
#   bash bin/build.sh github    # produces a GitHub-flavoured dist (writes the
#                                 .use-github-updates marker so the dual-channel
#                                 PUC block activates at runtime)
#
# When BUILD_MODE is "github" the marker file is written into the dist
# directory before zipping. For wp.org-only or github-only channels the
# argument is irrelevant (no marker logic in source); for dual-channel
# plugins, this is what differentiates the two builds.

set -euo pipefail

SLUG="plugin-sdk-starter"            # ← substituted to <slug> at scaffold time
BUILD_MODE="${1:-wporg}"             # wporg (default) | github

# ─── Locate paths ──────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILD_DIR="${PLUGIN_ROOT}/build"
DIST_DIR="${BUILD_DIR}/${SLUG}"

cd "${PLUGIN_ROOT}"

# ─── Verify main file exists ───────────────────────────────────────────

MAIN_FILE="${SLUG}.php"
if [[ ! -f "${MAIN_FILE}" ]]; then
    echo "::error::Main plugin file not found: ${MAIN_FILE}" >&2
    echo "         Expected the file name to match SLUG=\"${SLUG}\" in this script." >&2
    exit 1
fi

# ─── Extract version from plugin header ────────────────────────────────
# Single source of truth: the `* Version:` line in the main file.
# Both the zip filename and the GH release tag are derived from this.

VERSION=$(grep -E '^\s*\*\s*Version:' "${MAIN_FILE}" | head -1 \
          | sed -E 's/.*Version:[[:space:]]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/')
if [[ -z "${VERSION}" ]]; then
    echo "::error::Could not read Version: from ${MAIN_FILE} header." >&2
    exit 1
fi
echo "Plugin: ${SLUG}  Version: ${VERSION}  Mode: ${BUILD_MODE}"

# ─── Composer install (production dependencies only) ───────────────────
# Skip if SKIP_COMPOSER=1 (caller already prepared vendor/).

if [[ "${SKIP_COMPOSER:-0}" != "1" ]]; then
    echo "Installing production composer dependencies …"
    composer install --no-dev --optimize-autoloader --prefer-dist --no-progress --quiet
else
    echo "SKIP_COMPOSER=1 — using existing vendor/"
fi

if [[ ! -f vendor/autoload.php ]]; then
    echo "::error::vendor/autoload.php missing — composer install did not run." >&2
    exit 1
fi

# ─── Stage the dist via rsync ──────────────────────────────────────────

rm -rf "${BUILD_DIR}"
mkdir -p "${DIST_DIR}"

# Build the exclusion list from .distignore. Each non-empty, non-comment
# line becomes an `--exclude=` flag.
EXCLUDES=()
if [[ -f .distignore ]]; then
    while IFS= read -r pattern || [[ -n "${pattern}" ]]; do
        # Strip whitespace; skip blanks and comments.
        pattern="${pattern#"${pattern%%[![:space:]]*}"}"
        pattern="${pattern%"${pattern##*[![:space:]]}"}"
        [[ -z "${pattern}" || "${pattern:0:1}" == "#" ]] && continue
        EXCLUDES+=(--exclude="${pattern}")
    done < .distignore
fi

rsync -a "${EXCLUDES[@]}" --exclude="build" --exclude=".git" \
    "${PLUGIN_ROOT}/" "${DIST_DIR}/"

# ─── Channel marker (dual-channel only) ────────────────────────────────
# The PUC block in plugin-sdk-starter.php (when scaffolded with channel
# = "dual") boots only when this file is present. Writing it here means
# the GitHub-release zip auto-checks for updates from GH; the wp.org zip
# (built with mode=wporg) doesn't and lets WP.org handle updates.

if [[ "${BUILD_MODE}" == "github" ]]; then
    touch "${DIST_DIR}/.use-github-updates"
fi

# ─── Sanity-check the dist ─────────────────────────────────────────────

if [[ ! -f "${DIST_DIR}/${MAIN_FILE}" ]]; then
    echo "::error::Main plugin file missing from dist: ${DIST_DIR}/${MAIN_FILE}" >&2
    exit 1
fi
if [[ ! -f "${DIST_DIR}/vendor/autoload.php" ]]; then
    echo "::error::vendor/autoload.php missing from dist — Composer artefacts not copied." >&2
    exit 1
fi

# ─── Zip both variants ─────────────────────────────────────────────────
# - ${SLUG}.zip               → "latest" pointer (handy URL)
# - ${SLUG}-v${VERSION}.zip   → canonical versioned asset (GH release upload)

cd "${BUILD_DIR}"
zip -rq "${SLUG}.zip" "${SLUG}"
zip -rq "${SLUG}-v${VERSION}.zip" "${SLUG}"
cd "${PLUGIN_ROOT}"

# ─── Done ──────────────────────────────────────────────────────────────

echo ""
echo "✓ Built ${SLUG} v${VERSION} (mode: ${BUILD_MODE})"
echo "    ${BUILD_DIR}/${SLUG}/"
echo "    ${BUILD_DIR}/${SLUG}.zip"
echo "    ${BUILD_DIR}/${SLUG}-v${VERSION}.zip"
echo ""
echo "Next:"
echo "  Run Plugin Check:    wp plugin check build/${SLUG}"
echo "  Submit to wp.org:    bash bin/submission-prep.sh"
echo "  Or attach to a GH release manually if not using release.yml."
