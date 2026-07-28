#!/usr/bin/env bash
# Integration smoke test against a real WordPress via wp-env.
#
# The unit layer (PHPCS + Plugin Check + the SDK's own suite) never
# touches a live WordPress; this script closes that gap for the parts
# only an install can verify: activation, the settings option round-trip,
# and any virtual routes resolving after the rewrite flush.
#
# Requires Docker + node (npx). One-time: `npx @wordpress/env start`.
#
#   bash bin/smoke.sh
set -euo pipefail

cd "$(dirname "$0")/.."

SLUG="$(grep -E '^\s*"slug"' plugin-sdk.json | head -1 | sed -E 's/.*"slug"\s*:\s*"([^"]+)".*/\1/')"
PORT="$(grep -E '^\s*"port"' .wp-env.json | head -1 | sed -E 's/[^0-9]*([0-9]+).*/\1/')"
BASE="http://localhost:${PORT}"

echo "→ starting wp-env (idempotent)…"
npx --yes @wordpress/env start >/dev/null

echo "→ activating ${SLUG}…"
npx @wordpress/env run cli wp plugin activate "${SLUG}" >/dev/null

echo "→ site responds…"
CODE="$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/")"
[[ "$CODE" == "200" ]] || { echo "::error::homepage returned ${CODE}"; exit 1; }

echo "→ activation left no fatal (plugin still active)…"
npx @wordpress/env run cli wp plugin is-active "${SLUG}"

echo "→ settings option round-trips…"
npx @wordpress/env run cli wp option update "${SLUG}" '{"smoke":"1"}' --format=json >/dev/null
VALUE="$(npx @wordpress/env run cli wp option get "${SLUG}" --format=json)"
[[ "$VALUE" == *'"smoke":"1"'* ]] || { echo "::error::option round-trip failed: ${VALUE}"; exit 1; }
npx @wordpress/env run cli wp option delete "${SLUG}" >/dev/null

# Virtual routes: flush rewrites, then every manifest route pattern that
# is a plain literal (no capture group) must NOT 500.
if grep -q '"routes"' plugin-sdk.json; then
    echo "→ flushing rewrites for virtual routes…"
    npx @wordpress/env run cli wp rewrite flush >/dev/null
    while IFS= read -r pattern; do
        literal="$(echo "$pattern" | sed -E 's/^\^//; s/\$$//; s/\\\\\./\./g')"
        [[ "$literal" == *'('* ]] && continue
        CODE="$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/${literal}")"
        echo "   /${literal} → ${CODE}"
        [[ "$CODE" == "500" ]] && { echo "::error::route /${literal} returned 500"; exit 1; }
    done < <(grep -oE '"pattern"\s*:\s*"[^"]+"' plugin-sdk.json | sed -E 's/.*:\s*"([^"]+)"/\1/')
fi

echo ""
echo "✓ smoke passed"
