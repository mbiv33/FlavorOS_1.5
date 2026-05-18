---
name: goodnight-briefing
description: >-
  Sinclair - Goodnight briefing workflow. Captures evening reflection,
  wellness, goals, journal context, worries, and next-morning preparation for
  `briefing.goodnight`.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Sinclair | Goodnight Briefing

## FlavorOS 1.5 Storage Contract

Follow [`../_shared/storage-contract.md`](../_shared/storage-contract.md). In short: scope state to `client_id`, treat Client Universe records and artifacts as durable truth, use provider data only as source material through approved adapters, and stage external side effects through approval-gated outbound actions.


Use this skill when preparing, rendering, or completing the Goodnight briefing.

## Workflow Contract

- Workflow id: `briefing.goodnight`
- Owning agent: Sinclair
- Conductor: Khadijah remains responsible for cross-workflow continuity.
- Surface: Command Center and Briefings.
- Direction of flow: Client to agent download.

## Sections

Prepare agenda sections in the order defined by `docs/ui/12-briefing-templates.md`:

1. Day review
2. Wellness meter
3. Goals / milestones / priorities update
4. Client journal protocol
5. Worries / concerns
6. Announcements and reminders
7. Early-morning schedule and tasks

## Data Binding

Read and write inside the active `client_id` scope only:

- Read `wellness_checkins`, `goals`, `priorities`, `reminders`, and tomorrow's `calendar_items`.
- Write `journal_entries`, `wellness_checkins`, and updates to `goals` or `priorities`.
- Create `agent_tasks` for next-day handling when worries or concerns need follow-up.
- Update Client Universe and GBrain context only through approved memory boundaries.

## Output

Create or update the briefing run, linked agenda items, and a soft Completion Summary. The summary should capture context, preferences, and next-morning preparation without turning reflection into an operations dashboard.

## Guardrails

- Keep the tone private, calm, and low-pressure.
- Make every prompt skippable unless the briefing definition marks it required.
- Do not expose provider traces, raw agent internals, or backend protocol names.
- Do not commit external side effects; create agent tasks or approvals when follow-up is needed.
