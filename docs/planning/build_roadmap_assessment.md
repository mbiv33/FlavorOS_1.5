# Build Roadmap Assessment

## Status

**Last updated:** 2026-05-21 EDT

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

*Updated 2026-05-21 EDT after VPS deployment, Client Universe wiring, and onboarding rewrite.*

FlavorOS has crossed the **first production deployment milestone**:

- **VPS deployed:** API live at `https://api.flavoros.cc` (Hostinger VPS, Cloudflare tunnel, systemd, Postgres with 7 migrations).
- **Frontend deployed:** `https://flavoros.vercel.app` pointing at production API.
- **Client Universe wired:** Onboarding saves contexts, provider connections, and universe envelope through the real API.
- **Onboarding rewritten:** Sequential single-connection form with progress bar, server-side state hydration, dev reset support.
- **Demo vertical slice + post-slice lanes A through M complete.**
- **Communications write-back** proven end-to-end.

The bottleneck has shifted to **production UX polish and deployment automation**:

- **Onboarding connect-advance bug** — step 3 doesn't properly advance after OAuth return in production (Lane O — high priority).
- **Manual VPS deploys** — no CI/CD yet; pushes require SSH + git pull + systemctl restart (Lane P).
- **Provider hardening** — real Gmail send, dedup, async LLM, SDK timeout still open (Lane N).
- **Agent runtime** remains stub + inline processor (not durable multi-step workflows).

**Next agents:** read [`next_session_handoff.md`](./next_session_handoff.md) before claiming work.

---

## Where The Repo Stands

*Updated 2026-05-21 EDT.*

| Layer | Status | Notes |
|---|---|---|
| **Client UI shells** | Strong | Command Center, briefings, meetings, channels, admin exist; match MVP IA |
| **API + Postgres** | Substantial | Auth, onboarding, profiles, universe, artifacts, approvals, workflows, providers, audit |
| **UI → API (hero path)** | Done (slice) | Login, onboarding, Command Center, LeftNav, Settings use `api.ts` |
| **UI → API (admin)** | Done (Lane C) | `/admin` via `admin-api.ts` + list endpoints; `SessionGuard` on admin layout |
| **UI → API (channels)** | Done (Lane I) | Client channel surfaces + Command Center widgets use shared channel loaders/mappers |
| **Onboarding** | Done (bug) | Sequential form with progress bar; server hydration; connect-advance bug in step 3 |
| **Provider ingestion** | Done (demo) | Inline `process_provider_first_sync` → artifact + pending approval |
| **Agent runtime** | Stub + inline | `StubOrchestratorAdapter`; demo loop in `provider_first_sync.py` |
| **Write-back** | Done (narrow slice) | Lane J shipped communications-first outbound actions + admin/client visibility |
| **VPS production** | Done | API at api.flavoros.cc; manual deploy; GitHub Actions CD not yet wired |
| **Client Universe** | Done | Onboarding → contexts → provider connections → universe envelope |

### Phase Alignment (`current_build_plan.md`)

| Phase | Plan status | Assessment |
|---|---|---|
| 1 — Visualization & surfaces | Done (MVP breadth) | Command Center, admin, settings, and client channel pages are live on API data |
| 2 — Database & storage | Done (demo scope) | Models + CRUD; hero surfaces consume API |
| 3 — Integrations | Partial | Composio boundary + provider routes; prod OAuth matrix deferred |
| 4 — Onboarding | Done (production, bug) | Sequential flow + progress bar deployed; connect-advance bug in step 3 |
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

### Remaining: production UX + deployment

- **Onboarding connect-advance bug** — step 3 doesn't advance after OAuth return (Lane O, high priority)
- **GitHub Actions auto-deploy** — manual VPS deploy is fragile (Lane P)
- **Real Gmail send** — wire `ComposioGmailOutboundAdapter` calling `GMAIL_SEND_EMAIL` (TODO-4)
- **User invite/registration** — `invite_tokens` table, invite endpoints (TODO-3 / Lane Q)

### Remaining: production hardening

- Per-message ProviderEvent dedup (TODO-5)
- Async LLM call off request thread (TODO-6)
- Composio SDK HTTP timeout
- Full Composio OAuth matrix
- Extract outbound execution from the inline demo loop

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

### 1. Fix onboarding connect-advance bug (Lane O — ~1 day)

- Debug why step 3 doesn't advance after OAuth completes in new tab
- Test with `?reset=1` to wipe state and restart flow end-to-end
- Verify all 4 steps work in production (Vercel + VPS)

### 2. Wire GitHub Actions auto-deploy (Lane P — ~0.5 day)

- `.github/workflows/deploy-api.yml`: SSH into VPS on push to main
- `git pull && systemctl restart flavoros-api` on the VPS
- Health check after deploy

### 3. Provider stabilization (Lane N — 2–3 days)

- TODO-4: wire real Gmail send (`GMAIL_SEND_EMAIL`)
- TODO-5: per-message dedup
- TODO-6: async LLM call
- Composio SDK timeout

### 4. User invite/registration (Lane Q — 2–3 days)

- `invite_tokens` table + migration
- Invite endpoints
- Self-registration flow

### 5. Only then expand breadth again

- Richer orchestrator/runtime behavior
- GBrain follow-on work
- Broader outbound coverage

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
| **Production onboarding** | Lane O — fix connect-advance bug |
| **Automated deploys** | Lane P — GitHub Actions CD for VPS |
| **Real email sending** | Lane N — wire `GMAIL_SEND_EMAIL` via Composio |
| **Multi-user** | Lane Q — invite tokens + registration |

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
- Intended as a durable handoff for humans and coding agents.
