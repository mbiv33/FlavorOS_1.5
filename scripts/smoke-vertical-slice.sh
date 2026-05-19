#!/usr/bin/env bash
# Post-slice smoke (Lane D): health + optional auth flow hints.
# Requires API on NEXT_PUBLIC_FLAVOROS_API_URL or http://127.0.0.1:8001

set -euo pipefail

API_BASE="${NEXT_PUBLIC_FLAVOROS_API_URL:-http://127.0.0.1:8001}"
API_BASE="${API_BASE%/}"

echo "== FlavorOS vertical slice smoke =="
echo "API: $API_BASE"

echo -n "GET /health ... "
health="$(curl -sf "$API_BASE/health")"
echo "$health"

if ! echo "$health" | grep -q '"status"'; then
  echo "FAIL: unexpected /health body" >&2
  exit 1
fi

echo -n "GET /docs (OpenAPI) ... "
code="$(curl -s -o /dev/null -w '%{http_code}' "$API_BASE/docs")"
echo "HTTP $code"
if [[ "$code" != "200" ]]; then
  echo "FAIL: /docs returned $code" >&2
  exit 1
fi

echo ""
echo "OK: API reachable."
echo "Manual: sign in at http://localhost:3000/login, complete onboarding, open /command-center."
echo "See docs/planning/local_dev_runbook.md"
