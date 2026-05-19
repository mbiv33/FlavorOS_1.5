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
| **F** — Settings | Done | `useSettingsData` → `getProfile` + `listProviderConnections` |
| **G** — Docs | Done | [local_dev_runbook.md](./local_dev_runbook.md), tracker updates |
| **I** — Channel surfaces | Done | `useChannelData`, I1–I6 surfaces + CC widgets on API data |

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

**Status:** `ready`  
**Goal:** Optional `scripts/smoke-vertical-slice.sh` — health, login, artifacts/approvals list, admin list endpoints.

**Reference:** curl examples in [local_dev_runbook.md](./local_dev_runbook.md).

---

### Lane H — GBrain

**Status:** `idle`  
**Paths:** `subsystems/gbrain/**`, `services/api/tests/test_gbrain_adapter.py`  
**Goal:** Per [current_build_plan.md](./current_build_plan.md) — ingestion/context boundary; not required for demo slice.

---

### Lane E — CI (additive)

**Status:** `idle`  
**Paths:** `.github/workflows/*` (new jobs only; do not break existing jobs)  
**Goal:** Postgres service + `alembic upgrade head` + `pytest` on PR.

---

### Lane J — Write-back (blocked)

**Status:** `blocked`  
**Unblock when:** Decide path stable in production; Lane B tests green in CI.  
**Goal:** MVP proof loop step 7 — approval-gated, channel-correct outbound actions (stub acceptable initially).

---

## Suggested pick-up plan (next 2–4 weeks)

```mermaid
flowchart TD
  start[New session]
  smoke[Lane D: smoke script optional]
  ci[Lane E: pytest in CI]
  gbrain[Lane H: GBrain when prioritized]
  writeback[Lane J: write-back when unblocked]

  start --> smoke
  smoke --> ci
  ci --> gbrain
  gbrain --> writeback
```

| Week | Focus | Outcome |
|---|---|---|
| 1 | Lane D + dogfood slice + refresh any bugs | Repeatable local + optional CI smoke |
| 2 | Lane E | API tests run on every PR |
| 3+ | Lane H or J | Platform depth vs outbound trust boundary |

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

## Session log template

When you finish a lane, append to [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) **Session log**:

```markdown
| YYYY-MM-DD | Your label | Lane X | One-line what shipped / verified |
```

Update the lane row **Status** and trim session log to last 5 entries if needed.
