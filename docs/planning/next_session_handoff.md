# Next Session Handoff

**Last updated:** 2026-05-19  
**Purpose:** Single entry point for a new agent session. Read this first, then the linked docs.

---

## What is done (do not re-implement)

### Demo vertical slice (steps 1–5)

Documented in [build_vertical_slice_tasks.md](./build_vertical_slice_tasks.md). One demo tenant can:

1. Log in (`demo` / `client@demo.local` / `devclient`)
2. Complete onboarding + first provider sync
3. See real artifacts and pending approvals on Command Center
4. Approve or reject with audit trail

**Key implementation:** inline `process_provider_first_sync` after sync commit; stub orchestrator unchanged.

### Post-slice parallel lanes (complete)

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

**Slice lock:** `complete` — post-slice work is allowed; avoid drive-by edits to slice-owned files unless tasked.

---

## Doc map (read order)

| Order | File | Use when |
|---|---|---|
| 1 | **This file** | Picking up work in a new chat |
| 2 | [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) | Claiming a lane; session log |
| 3 | [local_dev_runbook.md](./local_dev_runbook.md) | Running API + Next locally |
| 4 | [build_roadmap_assessment.md](./build_roadmap_assessment.md) | Why / sequencing / MVP gaps |
| 5 | [build_vertical_slice_tasks.md](./build_vertical_slice_tasks.md) | File-level slice history (steps 1–5) |
| 6 | [current_build_plan.md](./current_build_plan.md) | Canonical phases (conflicts win here) |

---

## Constraints for parallel agents

1. **Admin HTTP:** Use `apps/flavoros/src/lib/admin-api.ts` — do **not** add admin-only helpers to `api.ts`.
2. **Slice-owned backend (touch only if explicitly tasked):**  
   `providers.py`, `approvals.py`, `orchestrator.py`, `workflows/provider_first_sync.py`, `schemas.py` (email fields).
3. **Slice-owned client UI (touch only if explicitly tasked):**  
   `command-center/page.tsx`, `onboarding/page.tsx`, `login/page.tsx`, `ApprovalCard.tsx`, `SessionGuard.tsx`, `api.ts` core auth/session.
4. **Lane C paths:** `apps/flavoros/src/app/admin/**`, `admin-api.ts`, `admin-surfaces.ts`, `components/admin/**`, `hooks/useAdmin*.ts`.
5. **Lane F paths:** `apps/flavoros/src/app/(client)/settings/**`, `hooks/useSettingsData.ts`.

Before first commit: update your lane row in [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) to `in_progress`, then `done` when finished.

---

## Ready work (pick one lane per session)

### Lane I — Channel surfaces (complete)

**Status:** `done`  
**Delivered:** `useChannelData.ts` + per-surface `*-config.ts` / `use*Data` hooks; communications, calendar, projects, reports, travel, meetings (+ topic detail), briefings, and Command Center goals/calendar widgets wired to live artifacts/approvals. Honest empty states; no fixture display rows on those pages.

**Pattern for future surfaces:** `useChannelData` → surface config → `buildPileDefs` / mapper helpers (see `briefings-config.ts`, `useBriefingsData.ts`).

---

### Lane D — Env + smoke script

**Status:** `done`  
**Delivered:** `scripts/smoke-vertical-slice.sh` for API reachability + local manual flow handoff.

**Reference:** curl examples in [local_dev_runbook.md](./local_dev_runbook.md).

---

### Lane H — GBrain

**Status:** `done`  
**Paths:** `subsystems/gbrain/**`, `services/api/tests/test_gbrain_adapter.py`  
**Delivered:** subsystem landing zone + integration doc; not blocking MVP proof loop completion.

---

### Lane E — CI (additive)

**Status:** `done`  
**Paths:** `.github/workflows/*` (new jobs only; do not break existing jobs)  
**Delivered:** additive API integration workflow covering first-sync + approvals decide.

---

### Lane J — Write-back (complete)

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

---

### Ready work (pick one lane per session)

#### K — Lane J hardening

**Paths:** `services/api/app/**`, `services/api/tests/**`  
**Goal:** extract execution from inline demo flow, tighten retries/idempotency/receipts, improve runbook clarity

#### L — Taxonomy guide

**Paths:** `docs/**`  
**Goal:** produce `docs/FLAVOROS_TAXONOMY.md` now that Lane J vocabulary is real

#### M — Calendar write-back follow-on

**Paths:** `services/api/**`, `apps/flavoros/src/app/(client)/calendar/**`, relevant shared hooks/mappers  
**Goal:** broaden outbound proof beyond communications only after J hardening settles

### Parallel follow-ons (safe to split)

#### K1 — Backend execution extraction

**Paths:** `services/api/app/**`, `services/api/tests/**`  
**Goal:** decouple outbound execution from inline first-sync path, preserve current UX

#### K2 — Client/admin outbound polish

**Paths:** `apps/flavoros/src/app/(client)/communications/**`, `apps/flavoros/src/app/admin/**`, related hooks/components  
**Goal:** clearer status/error states, pull-back polish, receipt visibility

#### K3 — Verification / rollout guardrails

**Paths:** `scripts/**`, `.github/workflows/**`, `docs/planning/**`  
**Goal:** stronger smoke coverage, restart/migrate/runbook clarity, post-deploy checklist

#### L1 — Taxonomy doc + doc index updates

**Paths:** `docs/**`, optional root `AGENTS.md` pointer  
**Goal:** canonical shared language before the repo broadens again

---

## Suggested pick-up plan (next 2–4 weeks)

```mermaid
flowchart TD
  start[New session]
  verify[Freeze current slice: pytest + tsc + smoke + manual]
  harden[Lane K: harden write-back]
  taxonomy[Lane L: taxonomy guide]
  runtime[Execution extraction]
  expand[Lane M: broaden outbound coverage]

  start --> verify
  verify --> harden
  harden --> taxonomy
  harden --> runtime
  runtime --> expand
```

| Week | Focus | Outcome |
|---|---|---|
| 1 | Verification freeze + Lane K | Stable outbound trust path |
| 1 | Parallel Lane L | Canonical taxonomy guide |
| 2 | Runtime extraction + rollout guardrails | Safer execution + cleaner execution boundaries |
| 3+ | Lane M | Broader outbound coverage beyond communications |

---

## Verification commands

From repo root unless noted.

```bash
# API tests (use venv — system Python 3.9 may fail on typing)
cd services/api && .venv/bin/python -m pytest tests/test_provider_first_sync.py tests/test_approvals_decide.py -q

# Next.js typecheck
cd apps/flavoros && pnpm exec tsc --noEmit

# API health
curl -sf http://127.0.0.1:8001/health
```

**Local URLs:** Next `http://localhost:3000`, API `http://127.0.0.1:8001` (see runbook).

**Manual E2E:** login → onboarding (if needed) → sync → Command Center → approve → `/admin` live lists → `/settings` profile + providers.

For post-J work, keep the outbound E2E in the loop: approve communication draft → queued outbound action visible → execution/receipt or failure state visible in client + admin.

---

## Key repo locations (post-slice)

| Area | Path |
|---|---|
| Admin API client | `apps/flavoros/src/lib/admin-api.ts` |
| Admin surfaces config | `apps/flavoros/src/lib/admin-surfaces.ts` |
| Admin UI panel | `apps/flavoros/src/components/admin/AdminSurfacePanel.tsx` |
| Settings hook | `apps/flavoros/src/lib/hooks/useSettingsData.ts` |
| Command Center mappers | `apps/flavoros/src/lib/mappers.ts` |
| Shared channel loader | `apps/flavoros/src/lib/hooks/useChannelData.ts` |
| Sync processor | `services/api/app/workflows/provider_first_sync.py` |
| Fixtures (types only) | `apps/flavoros/src/lib/fixtures.ts` — display arrays unused on client routes |
| Production app | `https://flavoros.vercel.app` |

---

## New Session Agent Prompt

Copy this into a new implementation session:

```text
Read docs/planning/next_session_handoff.md first, then docs/planning/build_roadmap_assessment.md and docs/planning/parallel_lanes_tracker.md.

Current reality:
- Vertical slice is complete.
- Post-slice lanes A through J are complete.
- The MVP demo proof loop is complete for a communications-first path.

Your assignment:
Choose one follow-on lane and stay inside it:
1. Lane K — harden communications write-back
2. Lane L — build docs/FLAVOROS_TAXONOMY.md
3. Lane M — plan/implement the next outbound breadth slice only if K is calm

Success target:
- preserve the current outbound proof path
- do not regress pytest/tsc/smoke/manual E2E
- keep vocabulary and status language aligned across client, admin, and docs

Scope guardrails:
- do not destabilize the current communications-first flow
- do not broaden multiple outbound lanes at once
- do not rewrite the orchestrator casually
- keep the diff aligned with existing api/mappers/hooks patterns

Before editing:
- confirm lane ownership in docs/planning/parallel_lanes_tracker.md
- preserve existing user changes
- verify with pytest, tsc --noEmit, scripts/smoke-vertical-slice.sh, and the outbound manual E2E

If splitting work:
- execution extraction / backend hardening
- client/admin outbound polish
- taxonomy guide + docs index wiring
- verification/rollout guardrails
```

---

## Session log template

When you finish a lane, append to [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) **Session log**:

```markdown
| YYYY-MM-DD | Your label | Lane X | One-line what shipped / verified |
```

Update the lane row **Status** and trim session log to last 5 entries if needed.
