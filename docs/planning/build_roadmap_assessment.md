# Build Roadmap Assessment

## Status

This file memorializes a **point-in-time execution assessment** (May 2026): where the repo stands relative to the MVP proof loop, what actually blocks shipping, and the recommended build order for the next 2–4 weeks.

It does **not** replace the canonical development plan. If anything here conflicts with `current_build_plan.md`, the current build plan wins.

| Canon | Role |
|---|---|
| `current_build_plan.md` | Phases, proof loop, non-negotiables |
| **This file** | Snapshot assessment + practical sequencing toward first vertical slice |
| *(planned)* `build_vertical_slice_tasks.md` | File-level implementation checklist (follow-up to this assessment) |

## Executive Summary

FlavorOS is **not** at “start from zero.” The repo has:

- A navigable client app and operator console (mostly fixture-driven UI)
- A substantive FastAPI + Postgres substrate (auth, onboarding, providers, artifacts, approvals, workflows, universe, audit)
- A working login + onboarding path wired to the API

The bottleneck is **integration**, not vision or surface count: client surfaces still read `apps/flavoros/src/lib/fixtures.ts`, and the sync path stops at a **queued** workflow run without producing inbox-visible artifacts or approvals.

The highest-leverage next milestone:

> **Demo vertical slice:** Login → onboarding (Gmail connect + sync) → Command Center shows one real artifact and one real approval from the API → client approves it.

---

## Where The Repo Stands

| Layer | Status | Notes |
|---|---|---|
| **Client UI shells** | Strong | Command Center, briefings, meetings, channels, admin console exist and match MVP IA intent |
| **API + Postgres** | Substantial | Routers: auth, onboarding, profiles, universe, artifacts, approvals, workflows, providers, audit. Alembic migrations through agent/ingest models |
| **UI → API** | Thin | Only **login** and **onboarding** use `apiRequest`; all `(client)` surfaces import fixtures |
| **Onboarding** | Partial | OAuth connect-link + sync endpoints exist; no gate routing “ready” clients to Command Center |
| **Provider ingestion** | Partial | `POST /providers/{provider}/sync` creates `ProviderEvent`, `NormalizedItem`, queued `WorkflowRun`, `AgentTask`, audit — does not complete into Client Artifacts |
| **Agent runtime** | Stub | `StubOrchestratorAdapter` completes immediately in isolation; sync path does not drive artifact/approval creation for the UI |
| **Admin console** | Shell | Static tiles and copy; not wired to API lists |

### Phase Alignment (`current_build_plan.md`)

| Phase | Plan status | Assessment |
|---|---|---|
| 1 — Visualization & surfaces | Partial | Shells done; durable data binding not |
| 2 — Database & storage | Partial | Models and CRUD exist; UI does not consume them |
| 3 — Integrations | Partial | Composio adapter boundary + provider routes; one Google account enough for demo |
| 4 — Onboarding | Partial | UI + API exist; completion gate and Client Universe envelope flow incomplete |
| 5 — Provider ingestion | Partial | First-sync path writes events; end-to-end normalization → inbox not visible |
| 6 — Agent workflows | Partial | Skills/docs strong; runtime execution does not close the loop |

---

## MVP Proof Loop (What “Built” Means)

From `current_build_plan.md`, the MVP must prove:

1. Useful client and admin surfaces render.
2. Client, provider, workflow, artifact, approval, and audit state persist durably.
3. Google Workspace (and boundaries) connect through approved adapters.
4. A client is onboarded into a governed Client Universe.
5. Provider events are captured, normalized, and routed.
6. Agents produce workflow runs, artifacts, approvals, and completion summaries.
7. Approved actions can write back channel-correctly (approval-gated, audit-safe).

**First proof target:** demonstrate steps 1–6 once for one demo tenant; step 7 can start as audited stub write-back.

---

## Gap Diagnosis

### Primary gap: fixtures vs API

`apps/flavoros/src/lib/fixtures.ts` explicitly states surfaces are scaffolded and will wire to durable storage as Phase 2 lands. That wiring is now the critical path.

**Files still on fixtures (representative):**

- `apps/flavoros/src/app/(client)/command-center/page.tsx`
- All other `(client)/*` channel and briefing pages
- `apps/flavoros/src/components/LeftNav.tsx`, `GoalsStrip.tsx`, `MiniCalendar.tsx`
- `apps/flavoros/src/app/admin/page.tsx` (static tile metadata)

**Files already on API:**

- `apps/flavoros/src/app/login/page.tsx`
- `apps/flavoros/src/app/onboarding/page.tsx`

### Secondary gap: sync does not populate the inbox

`services/api/app/routers/providers.py` — `sync_provider` creates durable rows and queues `provider_first_sync` / `provider_first_sync_review`, but nothing promotes results into `artifacts` and `approvals` that the Command Center can list.

Until that promotion exists, API wiring on the frontend will show **empty** states even when sync succeeds.

### Tertiary gap: onboarding is not a gate

Login always routes to `/onboarding`. Ready clients should land on `/command-center` with provider status reflected in settings/admin.

---

## Recommended Build Order (Next 2–4 Weeks)

### 1. Stabilize local dev (~0.5 day)

**Goal:** Repeatable login → onboarding → API calls.

- Postgres up (`docker compose` or local)
- `services/api`: `alembic upgrade head`, run API
- `apps/flavoros`: `pnpm dev` with `NEXT_PUBLIC_FLAVOROS_API_URL=http://localhost:8000`
- Verify seed tenant: `demo` / `client@demo.local` / `devclient`

### 2. Onboarding gate (1–2 days)

**Goal:** Onboarding is entry governance, not a permanent home.

- After login, evaluate provider connection status (`ready` / connected set)
- Not ready → `/onboarding`
- Ready → `/command-center`
- Persist onboarding completion signal if not already on profile or provider metadata

### 3. Wire Command Center to API (3–5 days) — **highest leverage**

**Goal:** One hero surface on real data.

- `GET /profiles/me` — greeting, display name, timezone
- `GET /artifacts` — map to inbox piles (urgent / needs attention / updates)
- `GET /approvals` — “ready to approve” strip
- Optional: keep fixtures only as **empty-state** fallback when API returns `[]`
- Update `LeftNav` profile from API, not `clientProfile` fixture

### 4. Close sync → artifact loop (3–5 days, backend)

**Goal:** First sync produces inbox-visible work.

- When `provider_first_sync` workflow is queued, process it (inline after sync, worker, or explicit “process queue” endpoint)
- Complete `WorkflowRun` via orchestrator (stub acceptable if it creates real rows)
- Create **Client Artifact** (e.g. first-sweep summary) and **Approval** when the workflow requires sign-off
- Existing `artifacts` and `approvals` routers then feed step 3

### 5. Approvals in the UI (2–3 days)

**Goal:** Client can act on prepared work.

- Wire `ApprovalCard` to `GET /approvals` and `POST /approvals/{id}/decide`
- Surface on Command Center and/or Reports
- Audit events already modeled — ensure decide path writes them

### 6. Operator console read path (2–3 days)

**Goal:** Developer/admin can see the same truth as the client.

- Wire `/admin/*` surfaces to list: provider connections, workflow runs, artifacts, approvals, audit
- Replace static tile counts on admin home with API-derived summaries where cheap

### 7. Explicitly defer

Do not block the vertical slice on:

- Rewiring calendar, travel, communications, meetings to API (pattern comes from Command Center)
- InstantDB as primary realtime path
- Full Composio prod OAuth matrix (one Google account suffices)
- GBrain ingestion, voice, Twilio, finance connector execution
- Travel / Logistics and Finance as proof-loop dependencies

---

## Demo Vertical Slice (One-Milestone Definition)

Ship when a single demo tenant can:

1. Log in
2. Complete onboarding and connect Gmail (or one Google provider)
3. Run first sync
4. See **at least one** real artifact and **one** real approval on Command Center
5. Approve (or reject) from the UI with audit trail

This proves FlavorOS is a **client operating system** (artifact-first, approval-gated), not a UI mock.

---

## Scope Choices

| If your goal is… | Build through… |
|---|---|
| Something you can **show** this month | Steps 1–5 |
| **Internal operator alpha** | Add step 6 |
| **Full MVP** per `current_build_plan.md` | Then broaden surfaces, briefing workflows, then write-back |

---

## Key Repo Locations

| Area | Path |
|---|---|
| Canonical dev plan | `docs/planning/current_build_plan.md` |
| Client app | `apps/flavoros/` |
| API | `services/api/` |
| Fixtures (to replace) | `apps/flavoros/src/lib/fixtures.ts` |
| API client | `apps/flavoros/src/lib/api.ts` |
| Provider sync | `services/api/app/routers/providers.py` |
| Orchestrator stub | `services/api/app/adapters/orchestrator.py` |
| Models | `services/api/app/models.py` |
| Production deploy | `https://flavoros.vercel.app` (see root `CLAUDE.md` / `AGENTS.md`) |

---

## Follow-Up: File-Level Task List

The next planning artifact should be **`build_vertical_slice_tasks.md`** (or equivalent): concrete file touch points for Command Center wiring, onboarding gate, and sync → artifact promotion — derived from this assessment.

When starting that work in a new agent session, point the agent at:

1. This file
2. `docs/planning/current_build_plan.md`
3. The instruction: “Produce file-level tasks for demo vertical slice (steps 1–5).”

---

## Assessment Provenance

Captured from product comprehension review and repo inspection: docs canon, `apps/flavoros` surface inventory, `services/api` routers/models, and `fixtures.ts` / `api.ts` usage patterns. Intended as a durable handoff for humans and coding agents.
