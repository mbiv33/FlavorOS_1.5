---
name: cob-workday-briefing
description: >-
  Khadijah - COB Work Day briefing workflow. Closes the workday with outcomes,
  pending approvals, communications wrap, open requests, blockers, and seeded
  Goodnight context for `briefing.cob_workday`.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Khadijah | COB Work Day Briefing

## FlavorOS 1.5 Storage Contract

Follow [`../_shared/storage-contract.md`](../_shared/storage-contract.md). In short: scope state to `client_id`, treat Client Universe records and artifacts as durable truth, use provider data only as source material through approved adapters, and stage external side effects through approval-gated outbound actions.


Use this skill when preparing, rendering, or completing the COB Work Day briefing.

## Workflow Contract

- Workflow id: `briefing.cob_workday`
- Owning agent: Khadijah
- Contributing agents: Sinclair for communications and calendar wrap; Regine for research and relationship wrap.
- Surface: Command Center and Briefings.
- Direction of flow: Agent to client download.

## Sections

Prepare agenda sections in the order defined by `docs/ui/12-briefing-templates.md`:

1. Quick check-in / wins
2. Key outcomes from today
3. Pending approvals
4. Updates and responses
5. Open requests / research
6. Evening schedule and reminders
7. Obstacles and support needed
8. Wellness / recreation note
9. Query action items and next steps

## Data Binding

Read from the active `client_id` scope only:

- today's `completion_summaries`
- `workflow_runs` completed or blocked today
- `approvals` still needing approval
- communication draft artifacts and recent `outbound_actions`
- research and recommendation artifacts
- next 12 hours of `calendar_items`
- wellness preferences

## Output

Create or update the briefing run, linked agenda items, and a completion summary preview. Every open approval, blocked workflow, and queued communication must link to its artifact or source record.

On finish, create a Completion Summary and seed Goodnight's prepared context so Sinclair can run the evening reflection without rehydrating unrelated operational detail.

## Guardrails

- Keep the client view calm, unified, and artifact-first.
- Collapse empty optional sections; required sections should render a calm empty state.
- Do not execute outbound side effects directly; queue them through approval-gated outbound action records.
