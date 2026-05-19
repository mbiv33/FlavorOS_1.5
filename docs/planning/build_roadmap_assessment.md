# Build Roadmap Assessment

## Status

This file memorializes a **point-in-time execution assessment** (May 2026): where the repo stands relative to the MVP proof loop, what actually blocks shipping, and the recommended build order for the next 2–4 weeks.

It does **not** replace the canonical development plan. If anything here conflicts with `current_build_plan.md`, the current build plan wins.

| Canon | Role |
|---|---|
| `current_build_plan.md` | Phases, proof loop, non-negotiables |
| **This file** | Snapshot assessment + practical sequencing |
| [`build_vertical_slice_tasks.md`](./build_vertical_slice_tasks.md) | File-level checklist for demo vertical slice (steps 1–5) |
| [`next_session_handoff.md`](./next_session_handoff.md) | **Start here** in a new agent session — done work, ready lanes, constraints |
| [`parallel_lanes_tracker.md`](./parallel_lanes_tracker.md) | Parallel lane ownership and session log |

## Executive Summary

*Updated 2026-05-19 after vertical slice + post-slice lanes B, C, F, G.*

FlavorOS has crossed the **first integration milestone**:

- **Demo vertical slice is complete:** login → onboarding → sync → Command Center artifact + approval → client decide with audit.
- **Operator console (admin)** reads live list data from the API (`/admin`).
- **Settings** shows profile and provider connections from the API.
- **API regression tests** cover first-sync processor and approval decide paths (22 tests).

The bottleneck has shifted from “no end-to-end loop” to **breadth and depth**:

- Remaining **client channel surfaces** still use `fixtures.ts` (calendar, briefings, travel, etc.).
- **Agent runtime** remains stub + inline processor (not durable multi-step workflows).
- **Write-back** (MVP step 7) is not started and remains the highest-trust integration.

**Next agents:** read [`next_session_handoff.md`](./next_session_handoff.md) before claiming work.

---

## Where The Repo Stands

*Updated 2026-05-19.*

| Layer | Status | Notes |
|---|---|---|
| **Client UI shells** | Strong | Command Center, briefings, meetings, channels, admin exist; match MVP IA |
| **API + Postgres** | Substantial | Auth, onboarding, profiles, universe, artifacts, approvals, workflows, providers, audit |
| **UI → API (hero path)** | Done (slice) | Login, onboarding, Command Center, LeftNav, Settings use `api.ts` |
| **UI → API (admin)** | Done (Lane C) | `/admin` via `admin-api.ts` + list endpoints; `SessionGuard` on admin layout |
| **UI → API (channels)** | Partial | Other `(client)` surfaces still fixture-driven — **Lane I** |
| **Onboarding** | Done (gate) | SessionGuard, readiness routing, sync on onboarding |
| **Provider ingestion** | Done (demo) | Inline `process_provider_first_sync` → artifact + pending approval |
| **Agent runtime** | Stub + inline | `StubOrchestratorAdapter`; demo loop in `provider_first_sync.py` |
| **Write-back** | Not started | Lane J blocked until decide path stable in prod/CI |

### Phase Alignment (`current_build_plan.md`)

| Phase | Plan status | Assessment |
|---|---|---|
| 1 — Visualization & surfaces | Partial | Command Center + admin + settings wired; channel pages on fixtures |
| 2 — Database & storage | Done (demo scope) | Models + CRUD; hero surfaces consume API |
| 3 — Integrations | Partial | Composio boundary + provider routes; prod OAuth matrix deferred |
| 4 — Onboarding | Done (demo scope) | Gate + sync path complete |
| 5 — Provider ingestion | Done (demo scope) | First-sync → inbox loop closed |
| 6 — Agent workflows | Partial | Inline processor only; real orchestration deferred |
| 7 — Write-back | Not started | Highest complexity remaining for full MVP |

---

## MVP Proof Loop (What “Built” Means)

From `current_build_plan.md`, the MVP must prove:

1. Useful client and admin surfaces render. — **Partial:** admin live; channels mostly fixtures
2. Client, provider, workflow, artifact, approval, and audit state persist durably. — **Yes (demo path)**
3. Google Workspace (and boundaries) connect through approved adapters. — **Partial (demo OAuth)**
4. A client is onboarded into a governed Client Universe. — **Yes (demo scope)**
5. Provider events are captured, normalized, and routed. — **Partial (first sync)**
6. Agents produce workflow runs, artifacts, approvals, and completion summaries. — **Yes (inline demo loop)**
7. Approved actions can write back channel-correctly. — **No (Lane J)**

**Achieved:** steps 1–6 for **one demo tenant** on the hero path. **Next proof:** broaden surfaces (step 1 depth) then write-back (step 7).

---

## Gap Diagnosis

*Updated 2026-05-19.*

### Closed (vertical slice + post-slice)

- Sync → artifact + approval → Command Center inbox
- Onboarding gate and SessionGuard
- Command Center / LeftNav off fixtures
- Approvals decide UI + audit on decide
- Admin console list surfaces + overview counts (Lane C)
- Settings profile + provider connections (Lane F)
- API tests for processor and decide (Lane B)

### Remaining: channel surfaces on fixtures

**Still fixture-driven (Lane I):**

- `(client)/calendar`, `communications`, `travel`, `briefings/*`, `meetings/*`
- `apps/flavoros/src/components/GoalsStrip.tsx`, `MiniCalendar.tsx`

**Pattern:** reuse `mappers.ts` + hooks pattern from Command Center.

### Remaining: production hardening

- Async/worker processing for workflows (inline sync acceptable for demo only)
- Full Composio OAuth matrix
- CI running pytest (Lane E)
- Optional smoke script (Lane D)

### Remaining: platform depth

- GBrain ingestion (Lane H)
- Real orchestrator / multi-agent tasks (not stub-only)
- Write-back (Lane J)

---

## Recommended Build Order (Next 2–4 Weeks)

*Supersedes the pre-slice ordering below for **new** work. Steps 1–5 and post-slice lanes A–G are complete.*

### 1. Stabilize verification (~0.5 day) — Lane D optional

- Document or script: health, login, artifacts, approvals, admin lists
- See [local_dev_runbook.md](./local_dev_runbook.md)

### 2. Channel surfaces off fixtures (1–2 weeks) — Lane I

**Goal:** Extend API wiring surface-by-surface (do not big-bang).

- Start with one channel (e.g. calendar or briefings)
- `GET /artifacts`, `GET /approvals`, `mappers.ts`, session from `api.ts`
- Keep fixtures only as optional empty-state fallback if desired

### 3. CI for API (1–2 days) — Lane E

- Postgres service job + `alembic upgrade head` + `pytest` on PR
- Use `services/api/.venv` or documented Python 3.11+ in workflow

### 4. Operator / internal alpha polish (ongoing)

- Admin is live; improve empty states, errors, pagination as needed
- Do not expand `api.ts` for admin — stay on `admin-api.ts`

### 5. GBrain (when prioritized) — Lane H

- `subsystems/gbrain/**` per architecture docs
- Not blocking demo or operator read path

### 6. Write-back (when unblocked) — Lane J

**Goal:** Approval-gated outbound stub with audit.

- Unblock after decide path trusted in CI/production
- Highest product + security complexity

### Explicitly defer

- InstantDB as primary realtime path
- Voice, Twilio, finance connector execution
- Rewriting entire fixture tree in one PR

---

## Demo Vertical Slice (Definition — Achieved)

Shipped for demo tenant:

1. Log in
2. Complete onboarding and connect Gmail (or one Google provider)
3. Run first sync
4. See at least one real artifact and one real approval on Command Center
5. Approve or reject from the UI with audit trail

Plus post-slice: **admin** live lists, **settings** wired, **API tests** for core mutations.

---

## Scope Choices

| If your goal is… | Build through… |
|---|---|
| Something you can **show** this month | Steps 1–5 — **done** |
| **Internal operator alpha** | Admin read path — **done** (Lane C); polish optional |
| **Broader client UX** | Lane I (channel surfaces) |
| **Full MVP** per `current_build_plan.md` | Lane I → CI (E) → GBrain (H) → write-back (J) |

---

## Key Repo Locations

| Area | Path |
|---|---|
| **New session start** | `docs/planning/next_session_handoff.md` |
| Canonical dev plan | `docs/planning/current_build_plan.md` |
| Parallel lanes | `docs/planning/parallel_lanes_tracker.md` |
| Local dev | `docs/planning/local_dev_runbook.md` |
| Client app | `apps/flavoros/` |
| API | `services/api/` |
| Fixtures (remaining) | `apps/flavoros/src/lib/fixtures.ts` |
| API client | `apps/flavoros/src/lib/api.ts` |
| Admin API client | `apps/flavoros/src/lib/admin-api.ts` |
| Mappers | `apps/flavoros/src/lib/mappers.ts` |
| Provider sync | `services/api/app/routers/providers.py` |
| Sync processor | `services/api/app/workflows/provider_first_sync.py` |
| Orchestrator stub | `services/api/app/adapters/orchestrator.py` |
| Production deploy | `https://flavoros.vercel.app` (see root `AGENTS.md`) |

---

## Follow-Up: File-Level Task List

- **Slice (historical):** [`build_vertical_slice_tasks.md`](./build_vertical_slice_tasks.md) — steps 1–5 complete
- **Next work:** [`next_session_handoff.md`](./next_session_handoff.md) — lanes I, D, E, H, J

When starting implementation in a new agent session, point the agent at:

1. [`next_session_handoff.md`](./next_session_handoff.md)
2. This assessment
3. [`current_build_plan.md`](./current_build_plan.md)
4. [`parallel_lanes_tracker.md`](./parallel_lanes_tracker.md) — claim a lane

---

## Assessment Provenance

- Initial capture: product review + repo inspection (May 2026).
- **2026-05-19:** Updated after vertical slice steps 1–5 and parallel lanes A, B, C, F, G.
- Intended as a durable handoff for humans and coding agents.
