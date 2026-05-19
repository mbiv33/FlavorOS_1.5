# Parallel Lanes Tracker

> Update this file at the **start** and **end** of every parallel agent session.  
> Historical slice progress checkboxes live in [archive/build_vertical_slice_tasks.md](./archive/build_vertical_slice_tasks.md).  
> **New session:** [next_session_handoff.md](./next_session_handoff.md)

## Slice lock (steps 1–5)

| Field | Value |
|---|---|
| **Owner** | Vertical slice agent |
| **Current step** | All steps 1–5 complete |
| **Branch** | `main` (local) |
| **Status** | `complete` |
| **Last updated** | 2026-05-19 (Phase 0 verify) |

**Rule:** While status ≠ `complete`, only the slice owner edits paths in the [Slice freeze zone](#slice-freeze-zone-steps-15--do-not-touch). Post-slice: freeze lifted; still respect per-lane allowed paths.

## Slice freeze zone (steps 1–5 — do not touch while slice in progress)

| Area | Paths |
|---|---|
| **Env / dev bootstrap** | `.env.example`, `apps/flavoros/.env.example`, `docker-compose.yml` (unless slice agent requests) |
| **Client auth & gate** | `apps/flavoros/src/app/login/**`, `onboarding/**`, `SessionGuard.tsx`, `onboarding-gate.ts`, `(client)/layout.tsx` |
| **API client (shared)** | `apps/flavoros/src/lib/api.ts`, `mappers.ts`, `hooks/useCommandCenterData.ts` |
| **Command Center & nav** | `command-center/page.tsx`, `LeftNav.tsx`, `ApprovalCard.tsx`, `ClientInbox.tsx` (if slice touches) |
| **Backend slice** | `services/api/app/routers/providers.py`, `approvals.py`, `onboarding.py`, `adapters/orchestrator.py`, `workflows/provider_first_sync.py` |
| **Schemas** | `services/api/app/schemas.py` |
| **Slice tests** | Tests for steps 2–5 owned by slice agent |
| **Slice planning** | `archive/build_vertical_slice_tasks.md` (historical checkbox record) |

## Active parallel lanes

| Lane | Owner | Status | Branch | Allowed paths | Open PR | Notes |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | No active lanes |

## Ready lanes (unlocked — slice lock = complete)

| Lane | Blocked by | Status | Notes |
|---|---|---|---|
| K — Lane J hardening | None | `done` | K1/K2/K3 + Gate K: pytest 35 pass, tsc clean; smoke requires live API on :8001 |
| K3 — Verification guardrails | None | `done` | Smoke status asserts, runbook restart section, CI outbound tests verified, post-deploy checklist |
| M — Calendar write-back follow-on | None | `done` | `calendar_outbound.py`, approve hook, calendar page outbound queue, seed hold approval, pytest calendar cases |

## Coordination checklist (every agent, every session)

1. Read **Slice lock** and **Ready lanes** first.
2. Claim your lane under **Active parallel lanes** before first commit.
3. Do not edit files in the slice freeze zone unless you are the slice owner.
4. Update your lane row when the lane moves from `in_progress` to `done` or `blocked`.
5. If blocked, note the blocker in **Session log** with a timestamp.
6. Historical slice checkboxes remain in `archive/build_vertical_slice_tasks.md`; active sessions should update live planning docs instead.
7. **Branch naming:** `parallel/lane-k-hardening`, `parallel/lane-l-taxonomy`, etc.

## Parallel agent handoff (copy into prompt)

```text
Read docs/planning/parallel_lanes_tracker.md first.
Check Ready lanes, then claim one lane under Active parallel lanes before editing.
You may ONLY edit paths listed for your lane or obviously-related files needed to complete it.
Do NOT touch apps/flavoros/src/lib/api.ts, (client) routes, or services/api/ unless your lane explicitly requires it.
Admin-only work should stay on admin-api.ts surfaces.
Context: next_session_handoff.md, build_roadmap_assessment.md, current_build_plan.md.
When done: move your lane out of Active parallel lanes, update the Completed lanes archive if needed, and append a timestamped Session log row.
```

---

## Completed lanes archive

### Former active parallel lanes

| Lane | Owner | Status | Branch | Allowed paths | Open PR | Notes |
|---|---|---|---|---|---|---|
| C — Admin console | Parallel agent | `done` | `parallel/lane-c-admin` | `apps/flavoros/src/app/admin/**`, `admin-api.ts`, `admin-surfaces.ts`, `components/admin/**`, `hooks/useAdmin*.ts` | — | Live tiles + lists via `admin-api.ts`; no `api.ts` extensions |
| E — CI additive | Parallel agent | `done` | `parallel/lane-e-ci` | `.github/workflows/api-integration-tests.yml` (new file only) | — | Slice integration tests job; did not edit `ci.yml` |
| G — Docs | Parallel agent | `done` | `parallel/lane-g-docs` | `docs/planning/*` (except slice task checkboxes), `docs/architecture/**`, `docs/workflows/**` | — | Runbook, handoff, tracker, inventory |
| H — GBrain | Parallel agent | `done` | `parallel/lane-h-gbrain` | `subsystems/gbrain/**` | — | FlavorOS monorepo integration doc |

### Completed post-slice queue

| Lane | Former blocker | Status | Notes |
|---|---|---|---|
| A — Backend step 4 | Was slice step 4 | `done` | Inline `provider_first_sync` processor |
| B — API tests 4/5 | Was slice steps 4–5 | `done` | `test_provider_first_sync.py`, `test_approvals_decide.py` |
| D — Env + smoke | Was slice step 1 | `done` | `scripts/smoke-vertical-slice.sh` |
| F — Settings | Was slice step 3 | `done` | `useSettingsData` |
| I — Channel surfaces | Was slice step 3 | `done` | I0–I6: `useChannelData`, all channel pages + CC widgets on API |
| J — Write-back | Session | `done` | Communications approval-gated write-back (MVP step 7): outbound_actions migration, communications_outbound, decide hook, client/admin UX, smoke + CI |
| K3 — Verification guardrails | Session | `done` | Hardened smoke-vertical-slice.sh, runbook restart section, post-deploy checklist, CI job name/doc sync |
| K1 — Backend extraction | Cursor agent | `done` | Split enqueue/execute; POST `/outbound-actions/{id}/execute`; GmailOutboundAdapter stub; defer-by-default approve |
| L — Taxonomy guide | Session | `done` | `docs/FLAVOROS_TAXONOMY.md` + planning README rank 1.5 + AGENTS.md pointer |
| M — Calendar write-back | Session | `done` | `send_calendar_hold` / `googlecalendar` / `calendar_create_hold`; client queue + seed + tests |

### Lane I sub-lanes (complete)

| Sub-lane | Owner | Status | Branch | Notes |
|---|---|---|---|---|
| I0 — Channel foundation | Session | `done` | — | `useChannelData.ts`, append-only `mappers.ts` helpers |
| I1 — Communications | Session | `done` | — | `useCommunicationsData`, `communications-config.ts` |
| I2 — Calendar | Session | `done` | — | `useCalendarData`, `MiniCalendar` props |
| I3 — Projects + Reports | Session | `done` | — | `useProjectsData`, `useReportsData` |
| I4 — Travel | Session | `done` | — | `useTravelData` |
| I5 — Meetings | Session | `done` | — | `useMeetingsData`, `MeetingTopicView` |
| I6 — CC widgets | Session | `done` | — | `GoalsStrip` + `MiniCalendar` on Command Center |

## Session log (last 5 entries)

| Timestamp | Agent | Lane | Action |
|---|---|---|---|
| 2026-05-19 (Phase 0) EDT | Subagent | Phase 0 | Baseline verified: pytest 30 pass, tsc clean, smoke OK; stale :8001 API replaced (migration 0005 + uvicorn restart) |
| 2026-05-19 | Cursor agent | M + Gate K | Lane M done: calendar_outbound + seed googlecalendar hold approval; calendar page outbound queue; executeOutboundAction in api.ts; pytest 35 pass (incl. calendar defer+execute); tsc clean; smoke not run (needs API :8001) |
| 2026-05-19 | Cursor agent | K1 | Lane K1 done: enqueue_for_approval + execute_outbound split; defer-by-default on approve; POST execute + 409 on non-queued; GmailOutboundAdapter stub; pytest test_outbound_actions 11 pass |
| 2026-05-19 | Cursor agent | K2 | Lane K2 done: pull-back on comms queue (queued only); optimistic decide via outbound_action; execution_result_json snippets; admin outbound filters + overview counts via admin-api; removed fake PileItemList pull-back; tsc clean |
| 2026-05-19 (K3) | Session | K3 | Smoke status asserts + defer path; runbook restart/migrate; CI outbound tests; handoff post-deploy checklist |