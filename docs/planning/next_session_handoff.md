# Next Session Handoff

**Last updated:** 2026-05-21 (VPS deployed, Client Universe wired, onboarding rewrite)  
**Purpose:** Single entry point for a new agent session. Read this first, then the linked docs.

---

## Session handoff close-out procedure

Before ending a session that changes project state:

1. Update timestamps on every planning doc you touched.
2. Update `parallel_lanes_tracker.md` lane state and append a timestamped session-log row.
3. Update `build_roadmap_assessment.md` if the bottleneck, recommended order, or proof status changed.
4. Update this handoff so the top of the file reflects only active or next-up work.
5. Search for references to the completed lane/task in planning docs and then:
   - remove stale “next step” references
   - move useful completion details into archive/completed sections
   - rewrite any leftover “owned by lane X” language into current, role-based guidance if needed
6. Re-read the opening sections of this file, `parallel_lanes_tracker.md`, and `build_roadmap_assessment.md` to confirm completed work has been downshifted or removed where appropriate.

Rule of thumb:

- if a completed item is still visible near the top of a planning doc, it should be there only because it explains the current state, not because it still reads like active work.

---

**Slice lock:** `complete` — post-slice work is allowed; avoid drive-by edits to slice-owned files unless tasked.

---

## Doc map (read order)

| Order | File | Use when |
|---|---|---|
| 1 | **This file** | Picking up work in a new chat |
| 2 | [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) | Claiming a lane; session log |
| 3 | [local_dev_runbook.md](./local_dev_runbook.md) | Running API + Next locally |
| 4 | [build_roadmap_assessment.md](./build_roadmap_assessment.md) | Why / sequencing / MVP gaps |
| 5 | [archive/build_vertical_slice_tasks.md](./archive/build_vertical_slice_tasks.md) | Archived slice history (steps 1–5) |
| 6 | [current_build_plan.md](./current_build_plan.md) | Canonical phases (conflicts win here) |

---

## Constraints for parallel agents

1. **Admin HTTP:** Use `apps/flavoros/src/lib/admin-api.ts` — do **not** add admin-only helpers to `api.ts`.
2. **High-collision shared backend:**  
   `providers.py`, `approvals.py`, `orchestrator.py`, `workflows/provider_first_sync.py`, `schemas.py` (email fields).
3. **High-collision shared client UI:**  
   `command-center/page.tsx`, `onboarding/page.tsx`, `login/page.tsx`, `ApprovalCard.tsx`, `SessionGuard.tsx`, `api.ts` core auth/session.
4. **Interpretation:** these are not “owned by completed lanes” anymore. They are listed because they are still shared-core files where parallel edits need extra care.

Before first commit: update your lane row in [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) to `in_progress`, then `done` when finished.

---

## Ready work (pick one lane per session)

#### O — Fix onboarding connect-advance bug (HIGH PRIORITY)

**Paths:** `apps/flavoros/src/app/onboarding/page.tsx`, `services/api/app/routers/onboarding.py`, `services/api/app/schemas.py`  
**Goal:** Fix the remaining bug where the sequential onboarding flow doesn't properly advance to the next account after OAuth completes in a new tab  
**Context:** Onboarding step 3 was rewritten as a sequential single-connection form with a progress bar. OAuth opens in a new tab while the current page advances. User reports it still doesn't work correctly — the page either doesn't advance or shows incorrect state after returning from OAuth.  
**Backend changes already made:** `identity` is optional in `OnboardingSaveRequest`, `contexts` defaults to empty list, `DELETE /onboarding/reset` exists for dev testing (`?reset=1` query param)  
**Test with:** `?reset=1` to wipe state, then walk through all 4 steps

#### P — GitHub Actions auto-deploy for VPS

**Paths:** `.github/workflows/deploy-api.yml` (new), VPS systemd  
**Goal:** Wire CI/CD so pushes to `main` auto-deploy the API to the Hostinger VPS  
**Context:** Currently manual: `ssh root@2.24.65.59`, `cd /opt/flavoros/api/repo && git pull && systemctl restart flavoros-api`  
**VPS details:** Ubuntu 24.04, deploy path `/opt/flavoros/api/repo`, systemd service `flavoros-api`, Cloudflare tunnel handles routing

#### N — Real provider stabilization (post-first-user)

**Paths:** `services/api/app/adapters/composio.py`, `services/api/app/routers/providers.py`, `services/api/tests/**`  
**Goal:** harden the real Composio path now that one real user is connected
- TODO-4: wire real Gmail send via `ComposioGmailOutboundAdapter` calling `GMAIL_SEND_EMAIL`
- TODO-5: per-message ProviderEvent deduplication (`idempotency_key: “{provider_connection_id}:gmail:{message_id}”`)
- TODO-6: move sync LLM call off request thread (`asyncio.to_thread`) — currently blocks HTTP for up to 30s
- Verify `Action.GMAIL_FETCH_EMAILS` is the exact Composio SDK action name against current docs
- Add Composio SDK HTTP timeout (`timeout=10.0` on client init — critical gap noted in eng review)

#### Q — User invite/registration flow

**Paths:** `services/api/app/models.py`, `services/api/app/routers/auth.py`, `services/api/alembic/versions/`  
**Goal:** `invite_tokens` table, invite endpoints, self-registration for new clients (TODO-3)

---

## Suggested pick-up plan (next 2–4 weeks)

```mermaid
flowchart TD
  start[New session]
  fix_onboard[Lane O: Fix onboarding connect bug]
  auto_deploy[Lane P: GitHub Actions auto-deploy]
  stabilize[Lane N: Provider stabilization]
  invite[Lane Q: User invite flow]

  start --> fix_onboard
  fix_onboard --> auto_deploy
  auto_deploy --> stabilize
  stabilize --> invite
```

| Week | Focus | Outcome |
|---|---|---|
| 1 | Lane O — Fix onboarding connect-advance | Sequential onboarding works end-to-end in production |
| 1 | Lane P — GitHub Actions auto-deploy | Push to main auto-deploys API to VPS |
| 2 | Lane N — Provider stabilization | TODO-4/5/6, SDK timeout, real Gmail send |
| 3+ | Lane Q — User invite/registration | New clients can be invited and self-register |

---

## Verification commands

From repo root unless noted.

```bash
# API tests (use venv — system Python 3.9 may fail on typing)
cd services/api && .venv/bin/python -m pytest \
  tests/test_provider_first_sync.py \
  tests/test_approvals_decide.py \
  tests/test_outbound_actions.py \
  -q

# Next.js typecheck
cd apps/flavoros && pnpm exec tsc --noEmit

# API health + outbound smoke (API must be on 127.0.0.1:8008, migrated + seeded)
curl -sf http://127.0.0.1:8008/health
./scripts/smoke-vertical-slice.sh
```

**Local URLs:** Next `http://localhost:3000`, API `http://127.0.0.1:8008` (see runbook).  
**Production URLs:** App `https://flavoros.vercel.app`, API `https://api.flavoros.cc`

**Operational note:** `ANTHROPIC_API_KEY` must not be set as an empty string in the shell. pydantic-settings prioritizes shell env vars over `.env` — if `ANTHROPIC_API_KEY=` is exported (even empty), it shadows the real key in `services/api/.env`. Run `unset ANTHROPIC_API_KEY` before starting the API process if the key lives only in `.env`.

**Manual E2E:** login → onboarding (if needed) → sync → Command Center → approve → `/admin` live lists → `/settings` profile + providers.

**Onboarding dev reset:** Append `?reset=1` to the onboarding URL to wipe contexts + connections and restart the flow. Calls `DELETE /onboarding/reset` on the API.

For post-J work, keep the outbound E2E in the loop: approve communication draft → queued outbound action visible → execution/receipt or failure state visible in client + admin.

### Post-deploy outbound checklist (production / Vercel)

Run after promoting the app or API host:

1. **API health** — `curl -sfI` (or `curl -sf`) the production API base URL `/health`. Local API now runs on port **8008** (changed from 8001); `NEXT_PUBLIC_FLAVOROS_API_URL` in `apps/flavoros/.env.local` reflects this.
2. **App shell** — open `https://flavoros.vercel.app` (or your production URL); confirm login loads without CORS errors.
3. **Outbound route** — with a client session token, `GET /outbound-actions` returns **200** (not 404). If 404, production API likely needs restart after migration + env deploy.
4. **Communications approve path** — log in as demo or pilot client → Command Center → approve a `send_communication_draft` item → confirm outbound row shows `executed` or `failed` (or `queued` only if defer is intentionally enabled).
5. **Admin visibility** — `/admin` outbound surface lists the same row with matching status.
6. **CI parity** — confirm latest `main` PR ran [api-integration-tests.yml](../.github/workflows/api-integration-tests.yml) including `test_outbound_actions.py`.

Local parity before deploy: [local_dev_runbook.md](./local_dev_runbook.md) → “Restart API after outbound migration” + `./scripts/smoke-vertical-slice.sh`.

---

## Key repo locations (post-slice)

| Area | Path |
|---|---|
| Onboarding page | `apps/flavoros/src/app/onboarding/page.tsx` |
| Onboarding backend | `services/api/app/routers/onboarding.py`, `services/api/app/onboarding.py` |
| Onboarding schemas | `services/api/app/schemas.py` (`OnboardingSaveRequest`, `OnboardingIdentity`) |
| Admin API client | `apps/flavoros/src/lib/admin-api.ts` |
| Admin surfaces config | `apps/flavoros/src/lib/admin-surfaces.ts` |
| Admin UI panel | `apps/flavoros/src/components/admin/AdminSurfacePanel.tsx` |
| Settings hook | `apps/flavoros/src/lib/hooks/useSettingsData.ts` |
| Command Center mappers | `apps/flavoros/src/lib/mappers.ts` |
| Shared channel loader | `apps/flavoros/src/lib/hooks/useChannelData.ts` |
| Sync processor | `services/api/app/workflows/provider_first_sync.py` |
| Fixtures (types only) | `apps/flavoros/src/lib/fixtures.ts` — display arrays unused on client routes |
| Production app | `https://flavoros.vercel.app` |
| Production API | `https://api.flavoros.cc` (Hostinger VPS via Cloudflare tunnel) |
| VPS deploy path | `/opt/flavoros/api/repo` on `2.24.65.59` |
| VPS systemd service | `flavoros-api` — `systemctl restart flavoros-api` |

---

## New Session Agent Prompt

Copy this into a new implementation session:

```text
Read docs/planning/next_session_handoff.md first, then docs/planning/build_roadmap_assessment.md and docs/planning/parallel_lanes_tracker.md.

Current reality:
- Vertical slice + post-slice lanes A through M are complete.
- MVP demo proof loop complete for communications-first path.
- One real user (marcus@bivinesgroup.com) connected via Composio OAuth.
- VPS deployed: API live at https://api.flavoros.cc (Hostinger VPS, systemd, Cloudflare tunnel).
- Frontend deployed: https://flavoros.vercel.app (Vercel, NEXT_PUBLIC_FLAVOROS_API_URL=https://api.flavoros.cc).
- Client Universe wired: onboarding → contexts → provider connections → universe envelope.
- Onboarding rewritten as sequential single-connection form with progress bar.
- Known bug: onboarding step 3 connect-advance doesn't work correctly after OAuth return.
- VPS deploy is manual (git pull + systemctl restart); GitHub Actions CD not yet wired.
- DB at head: Alembic migrations 0001–0007.

Your assignment:
Choose one follow-on lane and stay inside it:
1. Lane O — Fix onboarding connect-advance bug (HIGH PRIORITY)
2. Lane P — GitHub Actions auto-deploy for VPS
3. Lane N — Stabilize real Composio path (TODO-4/5/6, SDK timeout)
4. Lane Q — User invite/registration flow

IMPORTANT: Always explain the problem + approach before writing code. Wait for confirmation.

Success target:
- preserve the current outbound proof path
- do not regress pytest/tsc/smoke/manual E2E
- test onboarding changes with ?reset=1 to wipe and restart

Scope guardrails:
- do not destabilize the current communications-first flow
- do not broaden multiple outbound lanes at once
- keep the diff aligned with existing api/mappers/hooks patterns

Before editing:
- confirm lane ownership in docs/planning/parallel_lanes_tracker.md
- preserve existing user changes
- verify with pytest, tsc --noEmit, scripts/smoke-vertical-slice.sh

VPS manual deploy (until Lane P ships):
  ssh root@2.24.65.59
  cd /opt/flavoros/api/repo && git pull && systemctl restart flavoros-api
```

---

## Session log template

When you finish a lane, append to [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) **Session log**:

```markdown
| YYYY-MM-DD HH:MM TZ | Your label | Lane X | One-line what shipped / verified |
```

Update the lane row **Status** and trim session log to last 5 entries if needed.

---

## Completed work archive

### Demo vertical slice (steps 1–5)

Documented in [archive/build_vertical_slice_tasks.md](./archive/build_vertical_slice_tasks.md). One demo tenant can:

1. Log in (`demo` / `client@demo.local` / `devclient`)
2. Complete onboarding + first provider sync
3. See real artifacts and pending approvals on Command Center
4. Approve or reject with audit trail

**Key implementation:** inline `process_provider_first_sync` after sync commit; stub orchestrator unchanged.

### Post-slice completed lanes

| Lane | Status | Deliverable |
|---|---|---|
| **A** — Backend step 4 | Done | Inline processor in `services/api/app/workflows/provider_first_sync.py` |
| **B** — API tests | Done | `test_provider_first_sync.py`, `test_approvals_decide.py` (22 tests) |
| **C** — Admin console | Done | Live `/admin` via `admin-api.ts`, `admin-surfaces.ts`, `AdminSurfacePanel`, `useAdminOverview` |
| **D** — Env + smoke | Done | `scripts/smoke-vertical-slice.sh` |
| **E** — CI (additive) | Done | `.github/workflows/api-integration-tests.yml` |
| **F** — Settings | Done | `useSettingsData` → `getProfile` + `listProviderConnections` |
| **G** — Docs | Done | [local_dev_runbook.md](./local_dev_runbook.md), tracker updates |
| **H** — GBrain | Done | subsystem landing zone + integration doc |
| **I** — Channel surfaces | Done | `useChannelData`, I1–I6 surfaces + CC widgets on API data |
| **J** — Write-back | Done | communications-first outbound actions, client/admin visibility, smoke + CI coverage |
| **First real user** | Done | Composio OAuth live, real Gmail synced, Sinclair LLM body, Command Center wired, 54 tests pass |
| **VPS deploy** | Done | API at api.flavoros.cc, Hostinger VPS, Cloudflare tunnel, systemd service, Postgres + Alembic 0001–0007 |
| **Client Universe (Cursor)** | Done | Wire Client Universe: onboarding save → contexts → provider connections → universe envelope |
| **Onboarding rewrite** | Done (bug) | Sequential single-connection form with progress bar; server-side hydration; ?reset=1 dev reset; connect-advance bug remains |

### Completed lane notes

#### VPS deployment (2026-05-20)

**Status:** `done`  
**Delivered:** Production API running on Hostinger VPS accessible at `https://api.flavoros.cc`.

**Shipped:**

- Postgres 16 on VPS: `flavoros` DB + user, Alembic migrations 0001–0007
- systemd service `flavoros-api` at `/opt/flavoros/api/repo/services/api`
- Cloudflare named tunnel `bcc8b555-8eb5-495e-943e-5a99f93c8528` routing `api.flavoros.cc` → `127.0.0.1:8008`
- Vercel env `NEXT_PUBLIC_FLAVOROS_API_URL=https://api.flavoros.cc` for production frontend
- `.env` on VPS with production secrets (git-ignored)

**Manual deploy:** `ssh root@2.24.65.59`, `cd /opt/flavoros/api/repo && git pull && systemctl restart flavoros-api`

#### Onboarding rewrite (2026-05-20–21)

**Status:** `done` (with known connect-advance bug — see Lane O)  
**Delivered:** Sequential onboarding flow with progress bar, server-side hydration, dev reset.

**Shipped:**

- Step 3 shows ONE connection at a time with `currentSlotIndex` state
- ProgressBar component replaces StepIndicator
- Server-side hydration on mount: `GET /contexts` + `GET /providers` rebuild React state
- Contexts sorted personal → professional → business
- OAuth opens in new tab, current page advances immediately
- `DELETE /onboarding/reset` endpoint + `?reset=1` query param for dev testing
- Backend: `identity` optional in `OnboardingSaveRequest`, `contexts` defaults to empty list

**Known bug:** After OAuth return, the page sometimes doesn't advance to the next account or shows incorrect state. See Lane O.

#### First real user (2026-05-19)

**Status:** `done`  
**Delivered:** end-to-end real provider integration for the first human user session.

**Shipped:**

- `RealComposioAdapter` with lazy `ComposioToolSet` init (avoids pydantic validation on startup)
- `/providers/callback` made public; `provider_connection_id` embedded in redirect URI
- Composio OAuth quirks handled: `status=success`, `connectedAccountId` camelCase
- `ANTHROPIC_API_KEY` + `COMPOSIO_API_KEY` in `services/api/.env` (git-ignored)
- Sinclair LLM call (claude-sonnet-4-6, timeout=30s, fallback-to-canned on exception) in `provider_first_sync.py`
- Cloudflare named tunnel: `api.flavoros.cc` → `localhost:8008` (tunnel ID: `bcc8b555-8eb5-495e-943e-5a99f93c8528`)
- Command Center wired to live API: `useChannelData` + `applyDecideResult` for optimistic updates
- `approvalToInboxItem` joins artifact map; agent name detection (Gmail → "Sinclair")
- conftest `settings` fixture pins `composio_api_key=""` + `anthropic_api_key=""` to prevent env leakage

**Open TODOs (carry forward as Lane N):**

- TODO-5: per-message ProviderEvent dedup (`idempotency_key: "{provider_connection_id}:gmail:{message_id}"`)
- TODO-6: async LLM call off request thread (`asyncio.to_thread`)
- Composio SDK HTTP timeout on client init (critical gap from eng review)
- Verify `Action.GMAIL_FETCH_EMAILS` exact name against current Composio docs

---

#### Lane J — Write-back

**Status:** `done`  
**Delivered:** communications-first write-back slice for MVP step 7.

**Shipped:**

- `outbound_actions` table + model
- `communications_outbound.py` enqueue/execution path
- approval decide response with optional outbound action
- queued/executed/failed/pulled_back states in client + admin
- pull-back route for queued actions
- smoke + CI coverage for outbound actions

**Known local caveat:**

- If your API process predates this branch, `/outbound-actions` may 404 until restart + migrations + seed refresh.

#### Lane I — Channel surfaces

**Status:** `done`  
**Delivered:** `useChannelData.ts` + per-surface `*-config.ts` / `use*Data` hooks; communications, calendar, projects, reports, travel, meetings (+ topic detail), briefings, and Command Center goals/calendar widgets wired to live artifacts/approvals. Honest empty states; no fixture display rows on those pages.

**Pattern for future surfaces:** `useChannelData` → surface config → `buildPileDefs` / mapper helpers (see `briefings-config.ts`, `useBriefingsData.ts`).
