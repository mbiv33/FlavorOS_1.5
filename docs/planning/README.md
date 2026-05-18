# Planning

This folder is for the canonical build plan, migration inventories, and supporting planning notes.

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

## Canon Order

| Rank | Document | Role |
|---|---|---|
| 1 | `current_build_plan.md` | Single canonical development plan and priority order |
| 2 | `../architecture/`, `../workflows/`, `../agents/`, `../ui/`, `../governance/`, `../runtime/` | Canonical system specs |
| 3 | `../workflows/planned_feature_catalog.md` | Retained MVP and future feature catalog |
| 4 | `feature_migration_inventory.md` | Migration/status tracker |
| 5 | `mvp_build_notes.md` | Supporting context only |

## Current Planning Notes

| File | Purpose |
|---|---|
| `current_build_plan.md` | Canonical development plan and current priority order |
| `mvp_build_notes.md` | Supporting MVP context and implementation notes |
| `feature_migration_inventory.md` | Canonical inventory of MVP and future feature coverage in this repo |
