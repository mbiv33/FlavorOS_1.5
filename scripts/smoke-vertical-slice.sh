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
echo "== Lane J: outbound actions (optional auth) =="
CLIENT_EMAIL="${SMOKE_CLIENT_EMAIL:-client@demo.local}"
CLIENT_PASSWORD="${SMOKE_CLIENT_PASSWORD:-devclient}"
TENANT_SLUG="${SMOKE_TENANT_SLUG:-demo}"

login_body="$(printf '{"tenant_slug":"%s","email":"%s","password":"%s"}' \
  "$TENANT_SLUG" "$CLIENT_EMAIL" "$CLIENT_PASSWORD")"
login_resp="$(curl -sf -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "$login_body" 2>/dev/null || true)"

if [[ -z "$login_resp" ]] || ! echo "$login_resp" | grep -q 'access_token'; then
  echo "SKIP: auth/login unavailable (seed DB or start API with fresh seed)"
else
  token="$(echo "$login_resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")"
  auth_hdr=(-H "Authorization: Bearer $token" -H "X-Client-ID: $TENANT_SLUG")

  echo -n "GET /outbound-actions (before approve) ... "
  before="$(curl -sf "${auth_hdr[@]}" "$API_BASE/outbound-actions" 2>/dev/null || echo '[]')"
  before_count="$(echo "$before" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")"
  echo "$before_count row(s)"

  pending_id="$(curl -sf "${auth_hdr[@]}" "$API_BASE/approvals?decision=pending" | python3 -c "
import sys, json
for a in json.load(sys.stdin):
    if a.get('governed_action') == 'send_communication_draft':
        print(a['id'])
        break
" 2>/dev/null || true)"

  if [[ -n "$pending_id" ]]; then
    echo -n "POST /approvals/$pending_id/decide (approved) ... "
    decide_code="$(curl -s -o /tmp/flavoros-decide.json -w '%{http_code}' -X POST \
      "${auth_hdr[@]}" \
      -H "Content-Type: application/json" \
      -d '{"decision":"approved","reason":"smoke test"}' \
      "$API_BASE/approvals/$pending_id/decide")"
    echo "HTTP $decide_code"
    if [[ "$decide_code" != "200" ]]; then
      echo "FAIL: decide returned $decide_code" >&2
      cat /tmp/flavoros-decide.json >&2
      exit 1
    fi
  else
    echo "SKIP: no pending send_communication_draft approval (re-seed or approve manually)"
  fi

  echo -n "GET /outbound-actions (after approve) ... "
  after_code="$(curl -s -o /tmp/flavoros-outbound.json -w '%{http_code}' \
    "${auth_hdr[@]}" "$API_BASE/outbound-actions")"
  echo "HTTP $after_code"
  if [[ "$after_code" != "200" ]]; then
    if [[ -n "$pending_id" ]]; then
      echo "FAIL: /outbound-actions returned $after_code after approve" >&2
      cat /tmp/flavoros-outbound.json >&2
      exit 1
    fi
    echo "SKIP: /outbound-actions unavailable (restart API after migration)"
  else
    after="$(cat /tmp/flavoros-outbound.json)"
    after_count="$(echo "$after" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")"
    echo "  $after_count row(s)"
    if [[ -n "$pending_id" ]] && [[ "$after_count" -lt 1 ]]; then
      echo "FAIL: expected outbound_actions after comms approval" >&2
      exit 1
    fi
    if echo "$after" | grep -q '"status"'; then
      echo "OK: outbound lifecycle visible via API."
    elif [[ "$after_count" -eq 0 ]] && [[ -z "$pending_id" ]]; then
      echo "OK: outbound endpoint reachable (no rows yet; re-seed for full E2E)."
    fi
  fi
fi

echo ""
echo "OK: API reachable."
echo "Manual: sign in at http://localhost:3000/login, complete onboarding, open /command-center."
echo "See docs/planning/local_dev_runbook.md"
