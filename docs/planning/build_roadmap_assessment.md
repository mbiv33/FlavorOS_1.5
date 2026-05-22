# Build Roadmap Assessment

## Status

**Last updated:** 2026-05-22 EDT

This file memorializes a **point-in-time execution assessment** (May 2026): where the repo stands relative to the MVP proof loop, what actually blocks shipping, and the recommended build order for the next 2–4 weeks.

It does **not** replace the canonical development plan. If anything here conflicts with `current_build_plan.md`, the current build plan wins.

| Canon | Role |
|---|---|
| `current_build_plan.md` | Phases, proof loop, non-negotiables |
| **This file** | Snapshot assessment + practical sequencing |
| [`archive/build_vertical_slice_tasks.md`](./archive/build_vertical_slice_tasks.md) | Archived file-level checklist for demo vertical slice (steps 1–5) |
| [`next_session_handoff.md`](./next_session_handoff.md) | **Start here** in a new agent session — done work, ready lanes, constraints |
| [`parallel_lanes_tracker.md`](./parallel_lanes_tracker.md) | Parallel lane ownership and session log |

## Executive Summary

*Updated 2026-05-22 EDT after Phases 2–7 complete.*

FlavorOS has crossed the **real orchestrator milestone**:

- **VPS deployed:** API live at `https://api.flavoros.cc` (Hostinger VPS, Cloudflare tunnel, systemd, Postgres with 7 migrations).
- **Frontend deployed:** `https://flavoros.vercel.app` pointing at production API.
- **Phases 2–7 complete on `main`:**
  - Phase 2: full DB schema (sync checkpoints, PAC/PTQ, AgentTaskEvent, AgentReport)
  - Phase 3: GBrain CLI adapter, admin `/system-health` endpoint
  - Phase 5: incremental sync cursors (SyncCheckpoint), re-sync → `communication_sweep` routing
  - Phase 6: `InProcessOrchestratorAdapter`, async executor, Khadijah `morning_standup` + `cob_workday` skills, `/workflows/launch`
  - Phase 7: all 9 workflow skills registered; Sinclair `provider_first_sync_review`, `communication_sweep_review`, `comms_calendar`; Khadijah `morning_standup_seed`, `projects_review`, `client_onboarding`; Regine `travel_research_seed`; `WorkflowLaunchButton` + "Prepare" on briefing/meeting surfaces; front-end 2s polling to terminal state
- **Demo vertical slice + post-slice lanes A through M, O complete.**
- **Communications write-back** proven end-to-end.
- **Onboarding connect-advance bug fixed** (prod verified 2026-05-21).

The bottleneck has shifted to **integration depth and invite-based multi-user**:

- **GitHub Actions auto-deploy** — `deploy-api.yml` ready on `origin/parallel/lane-p-deploy`; needs cherry-pick (Lane R — fast, 1 file).
- **User invite/registration** — `invite_tokens` + routes + tests ready on `origin/parallel/lane-q-invite`; needs cherry-pick with conflict resolution (Lane S).
- **Real Gmail send** — `StubGmailOutboundAdapter` still in place; approved drafts don't actually send (TODO-4, Lane U).
- **Provider sync hardening** — per-message dedup and async first-sync LLM call still open (TODO-5/6, Lane V).
- **Full `client_onboarding` orchestration** — skill exists but only writes a summary; does not create governed universe or fan-out to seed workflows (TODO-2b, Lane T).

**Next agents:** read [`next_session_handoff.md`](./next_session_handoff.md) before claiming work.

---

## Where The Repo Stands

*Updated 2026-05-21 EDT.*

| Layer | Status | Notes |
|---|---|---|
| **Client UI shells** | Strong | Command Center, briefings, meetings, channels, admin exist; match MVP IA |
| **API + Postgres** | Substantial | Auth, onboarding, profiles, universe, artifacts, approvals, workflows, providers, audit, PAC/PTQ, AgentEvents |
| **UI → API (hero path)** | Done (slice) | Login, onboarding, Command Center, LeftNav, Settings use `api.ts` |
| **UI → API (admin)** | Done (Lane C) | `/admin` via `admin-api.ts` + list endpoints; `SessionGuard` on admin layout |
| **UI → API (channels)** | Done (Lane I) | Client channel surfaces + Command Center widgets use shared channel loaders/mappers |
| **Onboarding** | Done | Sequential form with progress bar; server hydration; connect-advance fixed (prod verified) |
| **Provider ingestion** | Done (Phase 5) | Incremental sync cursors; SyncCheckpoint; first sync → `provider_first_sync`; re-sync → `communication_sweep` |
| **Agent runtime** | Done (Phases 6–7) | `InProcessOrchestratorAdapter` live; all 9 skills registered; fire-and-forget via `asyncio.create_task` |
| **Workflow launch UI** | Done (Phase 7) | `WorkflowLaunchButton` + 2s polling hook; "Prepare" buttons on briefing/meeting surfaces |
| **Write-back** | Done (narrow slice) | Lane J shipped communications-first outbound actions + admin/client visibility |
| **VPS production** | Done | API at api.flavoros.cc; manual deploy; `deploy-api.yml` pending merge (Lane R) |
| **Client Universe** | Done | Onboarding → contexts → provider connections → universe envelope |
| **User invite/registration** | Pending merge | `0008` migration + routes + tests on `origin/parallel/lane-q-invite` (Lane S) |

### Phase Alignment (`current_build_plan.md`)

| Phase | Plan status | Assessment |
|---|---|---|
| 1 — Visualization & surfaces | Done (MVP breadth) | Command Center, admin, settings, and client channel pages are live on API data |
| 2 — Database & storage | Done (`9b77ce3`) | Full schema: sync checkpoints, PAC/PTQ, AgentTaskEvent, AgentReport, migrations 0006–0007 |
| 3 — Integrations | Done (`23da10b`) | GBrain CLI adapter; admin `/system-health`; Composio boundary stable |
| 4 — Onboarding | Done | Sequential flow + progress bar; connect-advance fixed and prod-verified |
| 5 — Provider ingestion | Done (`b6071ea`) | Incremental sync cursors; SyncCheckpoint; re-sync → `communication_sweep` routing |
| 6 — Agent workflows | Done (`251cf66`) | `InProcessOrchestratorAdapter`; async executor; Khadijah skills; `/workflows/launch` |
| 7 — Real orchestrator | Done (`1ef6e4e`) | All 9 workflow skills; front-end launch + 2s polling; "Prepare" buttons live |

---

## MVP Proof Loop (What “Built” Means)

From `current_build_plan.md`, the MVP must prove:

1. Useful client and admin surfaces render. — **Yes**
2. Client, provider, workflow, artifact, approval, and audit state persist durably. — **Yes (full schema: Phase 2)**
3. Google Workspace (and boundaries) connect through approved adapters. — **Partial (real Composio OAuth; `gmail.send` scope / real send not yet wired)**
4. A client is onboarded into a governed Client Universe. — **Yes (demo scope; full `client_onboarding` orchestration pending Lane T)**
5. Provider events are captured, normalized, and routed. — **Yes (Phase 5: incremental sync + communication_sweep)**
6. Agents produce workflow runs, artifacts, approvals, and completion summaries. — **Yes (Phase 6–7: all 9 skills live)**
7. Approved actions can write back channel-correctly. — **Structural yes; Gmail still stubbed (TODO-4 / Lane U)**

**Achieved:** steps 1–7 structurally proven. **Next proof:** real Gmail send, invite-based multi-user, and full client_onboarding orchestration.

---

## Gap Diagnosis

*Updated 2026-05-19 14:22 EDT.*

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

### Remaining: branch merges (fast)

- **Lane R** — cherry-pick `deploy-api.yml` onto main (1 file, no conflicts expected)
- **Lane S** — cherry-pick invite/registration (`0008` migration + auth routes + tests) with conflict resolution on `models.py`/`auth.py`

### Remaining: integration depth

- **Real Gmail send** — wire `ComposioGmailOutboundAdapter` calling `GMAIL_SEND_EMAIL` (TODO-4 / Lane U)
- **Full `client_onboarding` skill** — create governed universe, set expectations, fan-out to seed workflows (TODO-2b / Lane T)
- **Per-message ProviderEvent dedup** — per-message rows with idempotency keys (TODO-5 / Lane V)
- **Async first-sync LLM call** — migrate inline `process_provider_first_sync` to launch via orchestrator (TODO-6 / Lane V)

### Remaining: production hardening

- Composio SDK HTTP timeout (critical gap — no timeout set on client init)
- Full Composio OAuth matrix (beyond Gmail)
- Retry/backoff in executor for failed skills

### What is now done but should not be re-done

- Lane D: `scripts/smoke-vertical-slice.sh`
- Lane E: `.github/workflows/api-integration-tests.yml`
- Lane H: GBrain integration doc/subsystem landing zone
- Lane I: channel surfaces on API data
- Lane J: communications-first outbound write-back slice

---

## Recommended Build Order (Next 2–4 Weeks)

*Supersedes the pre-Phase-7 ordering. Phases 2–7 and lanes A–O are complete.*

### 1. Merge lane branches (Lanes R + S — 1 day combined)

- **Lane R:** `git cherry-pick 6fa9549` — adds `deploy-api.yml` (1 file, fast)
- **Lane S:** `git cherry-pick cc0f5cf` + resolve conflicts on `models.py` / `auth.py` — adds invite/registration

### 2. Real Gmail send (Lane U — ~0.5 day)

- Replace `StubGmailOutboundAdapter` with `ComposioGmailOutboundAdapter` calling `GMAIL_SEND_EMAIL`
- Test: approve a communication draft in production, confirm the email lands

### 3. Full client_onboarding orchestration (Lane T — 2–3 days)

- Expand `skills/client_onboarding.py` to create governed Client Universe contexts, set provider expectations, fan-out to seed workflows
- Verify via `?reset=1` + workflow launch in production

### 4. Provider sync hardening (Lane V — 1–2 days)

- Per-message `ProviderEvent` rows with idempotency keys (TODO-5)
- Migrate inline `process_provider_first_sync` call to orchestrator dispatch (TODO-6)

### 5. Only then expand breadth again

- GBrain follow-on work
- Broader write-back coverage (Calendar, Docs)
- Retry/backoff in executor

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
| Something you can **show** this month | Steps 1–7 — **done**; all 9 workflow skills live |
| **Internal operator alpha** | Admin read path — **done** (Lane C); polish optional |
| **Broader client UX** | Lane I — **done**; briefing/meeting launch — **done** (Phase 7) |
| **Full MVP demo loop** | Steps 1–7 — **done** structurally |
| **Automated deploys** | Lane R — cherry-pick `deploy-api.yml` (1 file) |
| **Multi-user / invite** | Lane S — cherry-pick invite/registration |
| **Real email sending** | Lane U — wire `GMAIL_SEND_EMAIL` via `ComposioGmailOutboundAdapter` |
| **Governed onboarding workflow** | Lane T — full `client_onboarding` skill with universe creation |
| **Safe incremental sync** | Lane V — per-message dedup + async LLM call |

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
| Production app | `https://flavoros.vercel.app` |
| Production API | `https://api.flavoros.cc` (Hostinger VPS via Cloudflare tunnel) |
| VPS deploy path | `/opt/flavoros/api/repo` on `2.24.65.59` |
| Onboarding page | `apps/flavoros/src/app/onboarding/page.tsx` |

---

## Follow-Up: File-Level Task List

- **Slice (historical):** [`archive/build_vertical_slice_tasks.md`](./archive/build_vertical_slice_tasks.md) — steps 1–5 complete
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
- **2026-05-21:** Updated after VPS deployment, Client Universe wiring, and onboarding rewrite.
- **2026-05-22:** Updated after Phases 2–7 complete (real orchestrator, all 9 skills, front-end launch). Lane N superseded by Phase commits; lanes P/Q pending cherry-pick as R/S.
- Intended as a durable handoff for humans and coding agents.
