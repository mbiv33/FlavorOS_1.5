# Parallel Lanes Tracker

> Update this file at the **start** and **end** of every parallel agent session.  
> Slice progress checkboxes live in [build_vertical_slice_tasks.md](./build_vertical_slice_tasks.md).  
> **New session:** [next_session_handoff.md](./next_session_handoff.md)

## Slice lock (steps 1–5)

| Field | Value |
|---|---|
| **Owner** | Vertical slice agent |
| **Current step** | All steps 1–5 complete |
| **Branch** | `main` (local) |
| **Status** | `complete` |
| **Last updated** | 2026-05-19 |

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
| **Slice planning** | `build_vertical_slice_tasks.md` (checkboxes = slice progress) |

## Active parallel lanes

| Lane | Owner | Status | Branch | Allowed paths | Open PR | Notes |
|---|---|---|---|---|---|---|
| C — Admin console | Parallel agent | `done` | `parallel/lane-c-admin` | `apps/flavoros/src/app/admin/**`, `admin-api.ts`, `admin-surfaces.ts`, `components/admin/**`, `hooks/useAdmin*.ts` | — | Live tiles + lists via `admin-api.ts`; no `api.ts` extensions |
| G — Docs | Parallel agent | `done` | `parallel/lane-g-docs` | `docs/planning/*` (except slice task checkboxes), `docs/architecture/**`, `docs/workflows/**` | — | Runbook, handoff, tracker, inventory |
| H — GBrain | Parallel agent | `done` | `parallel/lane-h-gbrain` | `subsystems/gbrain/**` | — | FlavorOS monorepo integration doc |
| E — CI additive | Parallel agent | `done` | `parallel/lane-e-ci` | `.github/workflows/api-integration-tests.yml` (new file only) | — | Slice integration tests job; did not edit `ci.yml` |

## Post-slice queue (unlocked — slice lock = complete)

| Lane | Blocked by | Status | Notes |
|---|---|---|---|
| A — Backend step 4 | Was slice step 4 | `done` | Inline `provider_first_sync` processor |
| B — API tests 4/5 | Was slice steps 4–5 | `done` | `test_provider_first_sync.py`, `test_approvals_decide.py` |
| D — Env + smoke | Was slice step 1 | `done` | `scripts/smoke-vertical-slice.sh` |
| F — Settings | Was slice step 3 | `done` | `useSettingsData` |
| I — Channel surfaces | Was slice step 3 | `done` | I0–I6: `useChannelData`, all channel pages + CC widgets on API |
| J — Write-back | Slice step 5 + stable decide | `blocked` | MVP step 7 |

## Lane I sub-lanes (complete)

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

| Date | Agent | Lane | Action |
|---|---|---|---|
| 2026-05-19 | Session | I (I0–I6) | Channel surfaces: useChannelData + hooks/configs; pytest 22 pass; tsc clean; smoke OK |
| 2026-05-19 | Parallel plan | E, H, D, tracker | Plan implementation: freeze zone in tracker, CI workflow, gbrain integration doc, smoke script |
| 2026-05-19 | Subagent | I | Briefings wired: useBriefingsData, mappers, briefings-config |
| 2026-05-19 | Planning sync | G | Handoff + assessment + runbook sync |
| 2026-05-19 | Parallel agent | C, B, F | Admin + settings + pytest 22 pass; tsc clean |
| 2026-05-19 | Parallel agent | C | Shipped admin-api, AdminSurfacePanel, SessionGuard on admin layout |

## Coordination checklist (every agent, every session)

1. Read **Slice lock** — if not `complete`, confirm your lane is in **Active parallel lanes** and paths are allowed.
2. Do not edit files in the slice freeze zone unless you are the slice owner.
3. Update your lane row **before** first commit and **after** PR merge.
4. If you need a frozen file, set lane to `blocked` and note in **Session log**.
5. Slice owner updates step checkboxes in `build_vertical_slice_tasks.md`; parallel agents do not.
6. **Branch naming:** `parallel/lane-c-admin`, `parallel/lane-h-gbrain`, etc.
7. **Merge order:** Slice branch → `main` first; parallel lanes rebase; then post-slice queue.

## Parallel agent handoff (copy into prompt)

```text
Read docs/planning/parallel_lanes_tracker.md first.
Confirm slice lock status and your lane allowed paths.
You may ONLY edit paths listed for your lane.
Do NOT touch apps/flavoros/src/lib/api.ts, (client) routes, or services/api/ unless your lane explicitly allows it.
Admin lane: use admin-api.ts only.
Context: next_session_handoff.md, build_roadmap_assessment.md, current_build_plan.md.
When done: update tracker lane row + session log.
```
