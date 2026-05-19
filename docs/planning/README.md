# Planning

This folder is for the canonical build plan, migration inventories, and supporting planning notes.

**Last updated:** 2026-05-19 14:22 EDT

Domain specs live in the architecture, agent, workflow, runtime, governance, and UI folders. External planning folders and historical package plans are non-canonical. They may inform migration or backlog decisions, but they should not be treated as authoritative once the repo contains a promoted architecture, workflow model, or build plan.

The promoted FlavorOS 1.5 migration docs now live in domain folders:

- `../architecture/`
- `../agents/`
- `../workflows/`
- `../runtime/`
- `../governance/`
- `../ui/`

Use `../README.md` as the main docs index.

## Planning Source Policy

- This repo should contain the canonical record of all meaningful FlavorOS functionality, including future-state features that are not part of the MVP implementation yet.
- External planning material should be imported, summarized, or inventoried here rather than remaining the only place a feature is described.
- The current priority guide is `current_build_plan.md`.
- External planning material is historical input only; repo docs are the source of truth.

## Execution doc model

FlavorOS planning uses **one live execution doc by default**.

Live planning surface:

- `next_session_handoff.md` = current execution, priorities, prompts
- `parallel_lanes_tracker.md` = claimable lanes, ownership, session log
- `build_roadmap_assessment.md` = current bottleneck and recommended order

Rules:

1. Do **not** create a new planning `.md` for every lane by default.
2. Put active build content into `next_session_handoff.md`.
3. Keep `parallel_lanes_tracker.md` limited to active/ready/claimable work plus timestamped history.
4. Archive completed one-off execution docs instead of leaving them in the live planning surface.

Lane docs by exception:

Create a dedicated lane doc only when all of the following are true:

- the lane is large enough to need its own checklist or spec
- it spans multiple sessions or multiple agents
- keeping it inside `next_session_handoff.md` would make the handoff materially harder to scan

When a lane doc is created:

- place it under `docs/planning/lanes/`
- link it from `next_session_handoff.md`
- archive it under `docs/planning/archive/` when complete

## Timestamp convention

- Planning docs should use **timestamps, not dates only**, whenever they track recency, handoffs, session logs, or operational state.
- Preferred format: `YYYY-MM-DD HH:MM TZ`
- Examples:
  - `2026-05-19 14:13 EDT`
  - `2026-05-19 18:13 UTC`
- Minimum requirement:
  - `Last updated` lines use timestamps
  - session logs use timestamps
  - status snapshots that can drift during a workday should use timestamps

## Planning update procedure

When a session materially changes project state, update the planning docs in the same pass.

Minimum procedure:

1. Update `Last updated` timestamps on every planning doc you materially changed.
2. Revise active-vs-complete status so the docs match the current session outcome.
3. Move newly completed lanes/tasks to archive or completed sections instead of leaving them in active sections.
4. Update timelines, “next work,” and prompts so they point at the new bottleneck rather than the prior one.
5. Keep `next_session_handoff.md`, `parallel_lanes_tracker.md`, and `build_roadmap_assessment.md` mutually consistent before ending the session.
6. If a session changes vocabulary, status enums, or workflow names, update `../FLAVOROS_TAXONOMY.md` or note it as the next documentation task.

Downshift/remove procedure for completed work:

1. Search planning docs for the completed lane/task/workflow by name and aliases.
2. For each reference, decide whether it should be:
   - **removed** if it is an outdated instruction or stale “next step”
   - **downshifted** into an archive/history/completed section if it is useful context
   - **rewritten** if the reference should remain but no longer as an active constraint
3. Remove completed work from:
   - active lanes
   - ready queues
   - “next session” prompts
   - current bottleneck summaries
4. Keep completed work only in:
   - archives
   - historical implementation notes
   - proof/completion summaries where it explains current state
5. When a completed lane previously owned paths, replace lane-ownership wording with one of:
   - no mention, if the restriction no longer matters
   - “high-collision shared files,” if extra care is still warranted
6. Re-read the top 80-120 lines of `next_session_handoff.md`, `parallel_lanes_tracker.md`, and `build_roadmap_assessment.md` after edits to confirm they no longer foreground completed work.

Consistency rules:

- `next_session_handoff.md` should show only active or next-up work near the top; completed work belongs in archive sections near the end.
- `parallel_lanes_tracker.md` should list only currently claimable work in active/ready sections; completed lanes belong in completed archives.
- `build_roadmap_assessment.md` should describe the current bottleneck and current recommended order, not historical sequencing.

## Canon Order

| Rank | Document | Role |
|---|---|---|
| 1 | `current_build_plan.md` | Single canonical development plan and priority order |
| 1.5 | `../FLAVOROS_TAXONOMY.md` | Canonical shared vocabulary for terms, workflows, surfaces, status enums, and repo map |
| 2 | `../architecture/`, `../workflows/`, `../agents/`, `../ui/`, `../governance/`, `../runtime/` | Canonical system specs |
| 3 | `../workflows/planned_feature_catalog.md` | Retained MVP and future feature catalog |
| 4 | `feature_migration_inventory.md` | Migration/status tracker |
| 5 | `mvp_build_notes.md` | Supporting context only |
| — | `build_roadmap_assessment.md` | Point-in-time execution snapshot; defers to rank 1 if conflict |
| — | `next_session_handoff.md` | **Agent session entry point** for current active lanes and follow-on work |
| — | `archive/` | Archived execution docs and historical one-off planning artifacts |

## Current Planning Notes

| File | Purpose |
|---|---|
| `current_build_plan.md` | Canonical development plan and current priority order |
| **`next_session_handoff.md`** | **Start here in a new chat** — active lanes, constraints, verification, and next-session prompt |
| `parallel_lanes_tracker.md` | Lane ownership, status, session log |
| `local_dev_runbook.md` | Local API + Next + Postgres setup and smoke paths |
| `build_roadmap_assessment.md` | Where-we-are assessment, gaps, recommended order |
| `archive/build_vertical_slice_tasks.md` | Archived file-level checklist for demo vertical slice (steps 1–5) |
| `mvp_build_notes.md` | Supporting MVP context and implementation notes |
| `feature_migration_inventory.md` | Canonical inventory of MVP and future feature coverage in this repo |
