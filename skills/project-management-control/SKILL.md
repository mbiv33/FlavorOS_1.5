---
name: project-management-control
description: >-
  FlavorOS project delivery control. Use when planning MVP work, updating the
  task map, preparing ClickUp or Obsidian project views, assigning agent
  workstreams, or preventing isolated prompt execution.
version: 1.0.0
author: FlavorOS
license: MIT
---

# FlavorOS Project Management Control

## FlavorOS 1.5 Storage Contract

Follow [`../_shared/storage-contract.md`](../_shared/storage-contract.md). In short: scope state to `client_id`, treat Client Universe records and artifacts as durable truth, use provider data only as source material through approved adapters, and stage external side effects through approval-gated outbound actions.


## Before Starting

1. Read `planning/00-flavoros-mvp-delivery-system/FLAVOROS_MVP_PROJECT_PLAN.md`.
2. Read `planning/00-flavoros-mvp-delivery-system/task_map.yaml`.
3. Read `docs/dev_context/PROJECT_MANAGEMENT_CLICKUP_OBSIDIAN_EXPERTISE.md` if the task touches ClickUp, Obsidian, or delivery structure.
4. Name the workstream and owner before implementing.

## Operating Rules

- Keep the repo-native task map canonical.
- Treat ClickUp and Obsidian as projections until sync is automated.
- Never let testing replace shipping progress.
- Always model UI/UX, deployment, agent runtime, and artifact impacts when relevant.
- Assign agents only bounded work with a report path.
- Record quick side questions in `planning/QQ_AUDIT_LOG.md` when the user marks them with `/qq`.

## Output Shapes

For planning updates, include:

- objective
- phase
- workstream
- owner
- task IDs changed
- dependencies
- acceptance criteria
- verification

For agent work orders, include:

- target agent
- task type
- context summary
- deliverable
- artifact path
- priority
- approval risk

