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

*Updated 2026-05-19 after vertical slice + post-slice lanes A through J.*

FlavorOS has crossed the **first integration milestone**:

- **Demo vertical slice is complete:** login → onboarding → sync → Command Center artifact + approval → client decide with audit.
- **Operator console (admin)** reads live list data from the API (`/admin`).
- **Settings** shows profile and provider connections from the API.
- **API regression tests** now cover first-sync, approval decide, and outbound actions (45 tests).
- **Client channel surfaces** now read API-backed state instead of fixture display rows.
- **Smoke + CI scaffolding** exist for the post-slice loop.
- **Communications write-back** is live as a narrow approval-gated slice: approve draft -> `outbound_actions` -> queued/executed/failed/pulled-back state -> admin diagnostics.

The bottleneck has shifted from “can FlavorOS take an approved action back out into the world safely?” to **can we harden and generalize the new outbound path without losing trust?**

- **Write-back** (MVP step 7) is now proven for a communications-first slice.
- **Agent runtime** remains stub + inline processor (not durable multi-step workflows).
- **Provider hardening** still needs production-grade OAuth and execution trust boundaries.

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
| **UI → API (channels)** | Done (Lane I) | Client channel surfaces + Command Center widgets use shared channel loaders/mappers |
| **Onboarding** | Done (gate) | SessionGuard, readiness routing, sync on onboarding |
| **Provider ingestion** | Done (demo) | Inline `process_provider_first_sync` → artifact + pending approval |
| **Agent runtime** | Stub + inline | `StubOrchestratorAdapter`; demo loop in `provider_first_sync.py` |
| **Write-back** | Done (narrow slice) | Lane J shipped communications-first outbound actions + admin/client visibility |

### Phase Alignment (`current_build_plan.md`)

| Phase | Plan status | Assessment |
|---|---|---|
| 1 — Visualization & surfaces | Done (MVP breadth) | Command Center, admin, settings, and client channel pages are live on API data |
| 2 — Database & storage | Done (demo scope) | Models + CRUD; hero surfaces consume API |
| 3 — Integrations | Partial | Composio boundary + provider routes; prod OAuth matrix deferred |
| 4 — Onboarding | Done (demo scope) | Gate + sync path complete |
| 5 — Provider ingestion | Done (demo scope) | First-sync → inbox loop closed |
| 6 — Agent workflows | Partial | Inline processor only; real orchestration deferred |
| 7 — Write-back | Done (demo scope) | Communications-first proof exists; broader channel/provider depth deferred |

---

## MVP Proof Loop (What “Built” Means)

From `current_build_plan.md`, the MVP must prove:

1. Useful client and admin surfaces render. — **Yes**
2. Client, provider, workflow, artifact, approval, and audit state persist durably. — **Yes (demo path)**
3. Google Workspace (and boundaries) connect through approved adapters. — **Partial (demo OAuth)**
4. A client is onboarded into a governed Client Universe. — **Yes (demo scope)**
5. Provider events are captured, normalized, and routed. — **Partial (first sync)**
6. Agents produce workflow runs, artifacts, approvals, and completion summaries. — **Yes (inline demo loop)**
7. Approved actions can write back channel-correctly. — **Yes (communications-first demo path)**

**Achieved:** steps 1–7 for **one demo tenant** on the hero path. **Next proof:** harden the outbound execution path and broaden it deliberately.

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
- Communications write-back: `outbound_actions`, decide hook, client/admin status surfaces, smoke + CI coverage (Lane J)

### Closed: channel surfaces off fixtures

**Lane I completed:**

- `(client)/calendar`, `communications`, `travel`, `briefings/*`, `meetings/*`
- `apps/flavoros/src/components/GoalsStrip.tsx`, `MiniCalendar.tsx`
- shared `useChannelData` + per-surface config/hook pattern

### Remaining: production hardening

- Extract outbound execution from the inline demo loop
- Full Composio OAuth matrix
- Local/dev restart + migration hygiene so smoke hits the new outbound routes consistently
- Keep CI + smoke green as the trust gate for outbound work

### Remaining: platform depth

- Real orchestrator / multi-agent tasks (not stub-only)
- Broader write-back coverage beyond communications-first slice

### What is now done but should not be re-done

- Lane D: `scripts/smoke-vertical-slice.sh`
- Lane E: `.github/workflows/api-integration-tests.yml`
- Lane H: GBrain integration doc/subsystem landing zone
- Lane I: channel surfaces on API data
- Lane J: communications-first outbound write-back slice

---

## Recommended Build Order (Next 2–4 Weeks)

*Supersedes the pre-slice ordering below for **new** work. Steps 1–5 and post-slice lanes A–J are complete.*

### 1. Re-verify and freeze the current proof slice (~0.5 day)

- Run pytest, `tsc --noEmit`, and `scripts/smoke-vertical-slice.sh`
- Manual sweep: login → onboarding/sync → Command Center → approve/reject → outbound queue/status → `/admin` → `/settings` → communications/calendar
- Restart API + run migrations locally so smoke and manual E2E use the outbound routes

### 2. Harden Lane J into a trustworthy default (2–4 days)

**Goal:** Make the new outbound path boring to operate.

- tighten migration/reseed/runbook flow
- expand failure diagnostics and receipt visibility
- verify pull-back and deferred execution behavior under local + CI paths

### 3. Extract execution from the inline demo loop (2–4 days)

- Move outbound execution off the inline first-sync path
- Introduce durable execution lifecycle/state transitions before adding breadth
- Preserve the current demo flow while isolating write-back concerns

### 4. Publish the vocabulary layer (1–2 days)

- Add `docs/FLAVOROS_TAXONOMY.md`
- Lock outbound/status/workflow vocabulary now that Lane J terms are real
- Point humans and agents at it before they descend into domain docs

### 5. Harden provider execution trust boundaries (2–3 days)

- Production OAuth/credential handling for the chosen outbound lane
- Idempotency, retry, and pull-back semantics
- Failure diagnostics visible in admin

### 6. Only then expand breadth again

- Calendar write-back
- richer orchestrator/runtime behavior
- GBrain follow-on work that directly improves execution context

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
| **Broader client UX** | Lane I — **done** |
| **Full MVP demo loop** | Steps 1–7 — **done** |
| **Production-ready outbound trust path** | Verification pass → Lane J hardening → runtime extraction |

---

## Implementation Plan (Recommended)

### Primary objective

Harden the new **approval-gated, channel-correct write-back** path and make it the stable base for future outbound coverage.

### What just shipped

- `outbound_actions` durable table + model
- communications-first enqueue + execution path
- approval decide hook returning outbound action context
- client status chips/outbound queue
- admin outbound diagnostics
- smoke + CI coverage for outbound actions

### Next implementation focus

1. Extract execution from the inline processor.
2. Strengthen restart/reseed/migration ergonomics for local smoke.
3. Tighten provider-side trust boundaries and retry semantics.
4. Expand only after the communications path is operationally calm.

### Exit criteria for the hardening phase

- local smoke reliably exercises outbound routes after documented restart/migrate flow
- deferred execution + pull-back paths are easy to verify
- outbound failure states are obvious in admin and client surfaces
- runtime extraction plan is clear enough to implement without changing UX vocabulary

---

## Parallel Development Opportunities

These can be done in parallel **if ownership boundaries stay clean**.

### P1 — Lane J hardening backend

- Paths: `services/api/app/**`, `services/api/tests/**`
- Scope: execution extraction, retry/idempotency hardening, receipts, tests

### P2 — Client outbound UX polish

- Paths: `apps/flavoros/src/app/(client)/communications/**`, relevant shared components/hooks
- Scope: queued/executed/failed states, pull-back affordance polish, error messaging

### P3 — Admin outbound diagnostics polish

- Paths: `apps/flavoros/src/app/admin/**`, `admin-api.ts`, `admin-surfaces.ts`, `components/admin/**`
- Scope: failure diagnostics, filters by provider/state, receipt visibility

### P4 — Verification and rollout guardrails

- Paths: `scripts/**`, `.github/workflows/**`, docs/runbooks
- Scope: smoke expansion for outbound flow, CI coverage additions, post-deploy verification checklist

### P5 — Taxonomy guide

- Paths: `docs/**`
- Scope: `docs/FLAVOROS_TAXONOMY.md`, docs index wiring, vocabulary lock for post-Lane-J terms

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
| Shared channel loader | `apps/flavoros/src/lib/hooks/useChannelData.ts` |
| Fixtures (types only) | `apps/flavoros/src/lib/fixtures.ts` |
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
- **Next work:** [`next_session_handoff.md`](./next_session_handoff.md) — Lane J hardening + taxonomy + runtime follow-ons

When starting implementation in a new agent session, point the agent at:

1. [`next_session_handoff.md`](./next_session_handoff.md)
2. This assessment
3. [`current_build_plan.md`](./current_build_plan.md)
4. [`parallel_lanes_tracker.md`](./parallel_lanes_tracker.md) — claim a lane

---

## Assessment Provenance

- Initial capture: product review + repo inspection (May 2026).
- **2026-05-19:** Updated after vertical slice steps 1–5 and post-slice lanes A through J.
- Intended as a durable handoff for humans and coding agents.
