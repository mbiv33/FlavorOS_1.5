# Parallel Lanes Tracker

> **New session?** Read [next_session_handoff.md](./next_session_handoff.md) first, then update this file when you claim or finish a lane.

Update this file at the **start** and **end** of every parallel agent session.  
Slice progress checkboxes live in [build_vertical_slice_tasks.md](./build_vertical_slice_tasks.md).

## Slice lock (steps 1–5)

| Field | Value |
|---|---|
| **Owner** | Vertical slice agent |
| **Current step** | All steps 1–5 complete |
| **Branch** | `main` (local) |
| **Status** | `complete` |
| **Last updated** | 2026-05-19 |

**Rule:** Slice freeze zone is lifted for **post-slice lanes** below. Prefer isolated paths; avoid drive-by refactors in slice-owned files unless explicitly tasked.

Per [build_vertical_slice_tasks.md](./build_vertical_slice_tasks.md): steps 1–5 done; demo vertical slice verified.

## Active parallel lanes

| Lane | Owner | Status | Branch | Allowed paths | Open PR | Notes |
|---|---|---|---|---|---|---|
| C — Admin console | Parallel agent | `done` | `main` | `apps/flavoros/src/app/admin/**`, `admin-api.ts`, `admin-surfaces.ts`, `components/admin/**`, `hooks/useAdmin*.ts` | — | Live tiles + list surfaces via `admin-api.ts` |
| G — Docs | Parallel agent | `done` | `main` | `docs/planning/local_dev_runbook.md`, this tracker, handoff docs | — | Runbook + planning sync |
| H — GBrain | — | `idle` | — | `subsystems/gbrain/**` | — | Not started |
| E — CI additive | — | `idle` | — | `.github/workflows/*` (new jobs only) | — | Optional; not started |

## Post-slice queue (unlocked — slice lock complete)

| Lane | Status | Ready when | Notes |
|---|---|---|---|
| A — Backend step 4 | `done` | — | Inline `provider_first_sync` processor |
| B — API tests 4/5 | `done` | — | `test_provider_first_sync.py`, `test_approvals_decide.py` (22 tests pass) |
| C — Admin console | `done` | — | `admin-api.ts`, `AdminSurfacePanel`, `SessionGuard` on admin layout |
| F — Settings | `done` | — | `useSettingsData` + `getProfile` / `listProviderConnections` |
| G — Docs / runbook | `done` | — | `local_dev_runbook.md`; assessment + handoff updated 2026-05-19 |
| D — Env + smoke | `ready` | Now | Optional `scripts/smoke-vertical-slice.sh` |
| I — Channel surfaces | `ready` | Now | Fixture → API per surface; use `mappers.ts` |
| J — Write-back | `blocked` | After B in CI + stable decide in prod | MVP step 7 |

## Next agent pick-up (recommended)

1. Read [next_session_handoff.md](./next_session_handoff.md).
2. Claim **one** lane: set Status → `in_progress`, add Owner, note branch.
3. Prefer **Lane I** (one channel page) or **Lane D** (smoke script) for fastest visible progress.
4. Do **not** start **Lane J** until tracker unblocks it.
5. On completion: Status → `done`, session log entry, optional PR link.

## Session log (last 5 entries)

| Date | Agent | Lane | Action |
|---|---|---|---|
| 2026-05-19 | Planning sync | Docs | Updated `build_roadmap_assessment.md`, `next_session_handoff.md`, tracker, runbook for session handoff |
| 2026-05-19 | Parallel agent | C, B, F | Re-verified: admin stack + settings; pytest 22 passed; `pnpm exec tsc --noEmit` clean |
| 2026-05-19 | Parallel agent | B | Verified 22 pytest cases via `services/api/.venv` |
| 2026-05-19 | Parallel agent | C, F | Admin surface JSX fix; API list smoke; settings hook confirmed |
| 2026-05-19 | Parallel agent | C | Shipped admin-api, admin-surfaces, useAdminOverview, AdminSurfacePanel |

## Coordination checklist (every agent, every session)

1. Read **Slice lock** — post-slice: confirm lane paths do not conflict with another lane `in_progress` on the same files.
2. Prefer **Lane C** isolation: use `admin-api.ts`, not `api.ts`, for admin-only HTTP helpers.
3. Update your lane row **before** first commit and **after** merge or session end.
4. If you need a file another lane owns, set status to `blocked` and note in **Session log**.
5. Slice step checkboxes live only in `build_vertical_slice_tasks.md`.
6. Append planning doc updates to session log when you refresh handoff material.
