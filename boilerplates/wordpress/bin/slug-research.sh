#!/usr/bin/env bash
#
# slug-research.sh — check if a wp.org plugin slug is available.
#
# Slugs cannot be renamed after submission, so getting this right
# on day one matters. This script does three checks:
#
#   1. wp.org plugin info API           — definitive availability check
#   2. wp.org search URL                — visible to humans, surfaces
#                                         closed plugins + similar names
#   3. Trademark/protected term scan    — flags WP/Woo/Yoast/Stripe etc.
#                                         prefixes that wp.org reviewers
#                                         reject unless you own the mark
#
# Usage:
#   bash bin/slug-research.sh                  # research the plugin's own slug
#   bash bin/slug-research.sh my-other-slug    # research an alternative
#
# Exits 0 on "available", 1 on "taken or trademark conflict".

set -euo pipefail

DEFAULT_SLUG="plugin-sdk-starter"      # ← substituted to <slug> at scaffold time
SLUG="${1:-${DEFAULT_SLUG}}"

# ─── Tiny ANSI helpers ─────────────────────────────────────────────────

if [[ -t 1 ]]; then
    BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; RESET=$'\033[0m'
else
    BOLD=''; DIM=''; GREEN=''; YELLOW=''; RED=''; RESET=''
fi

step() { printf "%s▸%s %s\n" "${BOLD}" "${RESET}" "$1"; }
pass() { printf "  %s✓%s %s\n" "${GREEN}" "${RESET}" "$1"; }
warn() { printf "  %s⚠%s %s\n" "${YELLOW}" "${RESET}" "$1"; }
fail() { printf "  %s✗%s %s\n" "${RED}" "${RESET}" "$1"; }

# ─── 1. Format check ───────────────────────────────────────────────────

step "Checking slug format"
if [[ ! "${SLUG}" =~ ^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$ ]]; then
    fail "Slug '${SLUG}' is not valid for WordPress.org."
    cat <<EOF

    WP.org requires:
      • Lowercase letters, digits, and hyphens only (no underscores).
      • Must start and end with a letter or digit.
      • 3-60 characters long.

EOF
    exit 1
fi
pass "format looks valid"

# ─── 1b. Generic-slug advisory ─────────────────────────────────────────
# Observed in real reviews: the wp.org team renames overly generic slugs
# during review (e.g. a plugin submitted as "components" was renamed to
# "<org>-reusable-components-cdn" before review began). A single generic
# word is unlikely to survive; a distinctive org-prefixed slug is.

if [[ ! "${SLUG}" == *-* ]]; then
    warn "Slug '${SLUG}' is a single generic word."
    cat <<EOF

    The wp.org team renames generic slugs during review — a plugin
    submitted as "components" was renamed by the reviewers to an
    org-prefixed form before review even began. The renamed slug is
    what you keep forever. Pick your own distinctive slug instead of
    letting the team pick one for you:

        '${SLUG}'            ← likely renamed by the review team
        'your-org-${SLUG}'   ← distinctive, survives review

EOF
fi

# ─── 2. Trademark / protected-term scan ────────────────────────────────

step "Scanning for trademark and protected-term collisions"
PROTECTED='^(wp|wp-|wordpress|woo|woocommerce|yoast|elementor|stripe|paypal|google|facebook|amazon|microsoft|adobe|jetpack|gutenberg|cloudflare|akismet|youtube|twitter|instagram|tiktok|salesforce|hubspot|zoom)'

if echo "${SLUG}" | grep -Eqi "${PROTECTED}"; then
    fail "Slug '${SLUG}' starts with a protected/trademarked term."
    cat <<EOF

    WP.org rejects plugins whose slug starts with terms like
    'wp-', 'woo-', 'yoast-', 'stripe-', etc. unless the submitter
    is the rights holder. Prefix your own company name first:

        '${SLUG}'                    ← will be rejected
        'acme-${SLUG#*-}'                       ← acceptable
        'acme-${SLUG}'           ← also acceptable

EOF
    exit 1
fi
pass "no obvious trademark collision"

# ─── 3. WP.org plugin info API ─────────────────────────────────────────

step "Querying WordPress.org plugin info API"
API_URL="https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${SLUG}"

# `-g` (--globoff) tells curl not to treat the [slug] brackets as a
# URL-globbing range expression. `-sS` is silent except on connection
# errors. `-w "%{http_code}"` appends the HTTP status code AFTER the
# body so we can split it back out below; this is the canonical
# bash-only trick for getting both the body and the status code from
# a single curl call without jq.
RESPONSE=$(curl -gsS "${API_URL}" -w "HTTPSTATUS:%{http_code}" 2>/dev/null || true)

if [[ -z "${RESPONSE}" ]]; then
    fail "Couldn't reach api.wordpress.org. Retry, or use the browser fallback below."
    echo "    https://wordpress.org/plugins/${SLUG}/"
    exit 1
fi

# Split body from the HTTPSTATUS:NNN trailer we appended via -w.
HTTP_CODE="${RESPONSE##*HTTPSTATUS:}"
BODY="${RESPONSE%HTTPSTATUS:*}"

# Two response shapes signal availability:
#   - {"error":"Plugin not found."}
#   - HTTP 404 (older API behaviour)
if echo "${BODY}" | grep -q '"error":"Plugin not found.' || [[ "${HTTP_CODE}" == "404" ]]; then
    pass "API says slug is AVAILABLE"
    AVAILABLE=1
else
    fail "API returned plugin data — slug is TAKEN"
    AVAILABLE=0
fi

# ─── 4. Human-readable URL hint ────────────────────────────────────────

cat <<EOF

  ${DIM}For a human cross-check:${RESET}
    ${DIM}Plugin page${RESET}    https://wordpress.org/plugins/${SLUG}/
    ${DIM}Search${RESET}         https://wordpress.org/plugins/search/${SLUG}/

EOF

# ─── 5. Final verdict ──────────────────────────────────────────────────

if [[ "${AVAILABLE}" == "1" ]]; then
    cat <<EOF
${BOLD}✓ ${SLUG} appears available.${RESET}

Slugs cannot be renamed after wp.org approval. Before submitting:
  • Verify the search URL above doesn't show confusingly similar names.
  • Check the slug also reads naturally for users (it's the URL + folder name).

EOF
    exit 0
else
    cat <<EOF
${BOLD}✗ ${SLUG} is taken or closed.${RESET}

Pick a different slug. Run again:
  bash bin/slug-research.sh <alternative-slug>

EOF
    exit 1
fi
