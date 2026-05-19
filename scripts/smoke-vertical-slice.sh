#!/usr/bin/env bash
# Post-slice smoke (Lane D + K3): health + optional auth + outbound lifecycle.
# Requires API on NEXT_PUBLIC_FLAVOROS_API_URL or http://127.0.0.1:8001
#
# Outbound defer path: start API with OUTBOUND_DEFER_EXECUTION=true and run:
#   SMOKE_OUTBOUND_DEFER=1 ./scripts/smoke-vertical-slice.sh

set -euo pipefail

API_BASE="${NEXT_PUBLIC_FLAVOROS_API_URL:-http://127.0.0.1:8001}"
API_BASE="${API_BASE%/}"

_smoke_bool() {
  case "${1:-}" in
    1 | true | yes | TRUE | YES) return 0 ;;
    *) return 1 ;;
  esac
}

echo "== FlavorOS vertical slice smoke =="
echo "API: $API_BASE"
if _smoke_bool "${SMOKE_OUTBOUND_DEFER:-}"; then
  echo "Outbound mode: defer (expect queued after approve; API needs OUTBOUND_DEFER_EXECUTION=true)"
else
  echo "Outbound mode: inline (expect executed or failed after approve)"
fi

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

  decide_outbound_status=""
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
    decide_outbound_status="$(python3 -c "
import json
with open('/tmp/flavoros-decide.json') as f:
    oa = json.load(f).get('outbound_action')
print(oa.get('status', '') if oa else '')
" 2>/dev/null || true)"
    if [[ -z "$decide_outbound_status" ]]; then
      echo "FAIL: decide response missing outbound_action.status" >&2
      cat /tmp/flavoros-decide.json >&2
      exit 1
    fi
    echo "  outbound_action.status=$decide_outbound_status"
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
    echo "SKIP: /outbound-actions unavailable (restart API after migration — see local_dev_runbook.md)"
  else
    after="$(cat /tmp/flavoros-outbound.json)"
    after_count="$(echo "$after" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")"
    echo "  $after_count row(s)"
    if [[ -n "$pending_id" ]] && [[ "$after_count" -lt 1 ]]; then
      echo "FAIL: expected outbound_actions after comms approval" >&2
      exit 1
    fi

    list_statuses="$(echo "$after" | python3 -c "
import sys, json
rows = json.load(sys.stdin)
print(','.join(sorted({r.get('status','') for r in rows if r.get('status')})))
" 2>/dev/null || true)"

    if [[ -n "$pending_id" ]]; then
      if _smoke_bool "${SMOKE_OUTBOUND_DEFER:-}"; then
        if [[ "$decide_outbound_status" != "queued" ]]; then
          echo "FAIL: SMOKE_OUTBOUND_DEFER=1 but decide status is '$decide_outbound_status'" >&2
          echo "  Start API with OUTBOUND_DEFER_EXECUTION=true for defer smoke." >&2
          exit 1
        fi
        if ! echo "$list_statuses" | grep -q 'queued'; then
          echo "FAIL: expected queued in /outbound-actions list (got: $list_statuses)" >&2
          exit 1
        fi
        echo "OK: defer path — outbound remains queued after approve."
      else
        case "$decide_outbound_status" in
          executed | failed) ;;
          queued)
            echo "FAIL: outbound stayed queued (inline smoke expects executed or failed)" >&2
            echo "  API may have OUTBOUND_DEFER_EXECUTION=true — unset it or run SMOKE_OUTBOUND_DEFER=1." >&2
            exit 1
            ;;
          *)
            echo "FAIL: unexpected outbound_action.status '$decide_outbound_status'" >&2
            exit 1
            ;;
        esac
        if ! echo "$list_statuses" | grep -qE 'executed|failed|queued'; then
          echo "FAIL: /outbound-actions rows missing lifecycle status (got: $list_statuses)" >&2
          exit 1
        fi
        echo "OK: outbound lifecycle visible (decide=$decide_outbound_status; list=$list_statuses)."
      fi
    elif [[ "$after_count" -eq 0 ]]; then
      echo "OK: outbound endpoint reachable (no rows yet; re-seed for full E2E)."
    elif echo "$after" | grep -q '"status"'; then
      echo "OK: outbound lifecycle visible via API (list=$list_statuses)."
    fi
  fi
fi

echo ""
echo "OK: API reachable."
echo "Manual: sign in at http://localhost:3000/login, complete onboarding, open /command-center."
echo "See docs/planning/local_dev_runbook.md"
