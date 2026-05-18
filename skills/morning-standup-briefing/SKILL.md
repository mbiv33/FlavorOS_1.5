---
name: morning-standup-briefing
description: >-
  Khadijah - Morning Standup briefing workflow. Prepares the daily client
  operating picture, staged approvals, artifacts, risks, and next actions for
  the `briefing.morning_standup` run.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Khadijah | Morning Standup Briefing

## FlavorOS 1.5 Storage Contract

Follow [`../_shared/storage-contract.md`](../_shared/storage-contract.md). In short: scope state to `client_id`, treat Client Universe records and artifacts as durable truth, use provider data only as source material through approved adapters, and stage external side effects through approval-gated outbound actions.


Use this skill when preparing, rendering, or completing the Morning Standup briefing.

## Workflow Contract

- Workflow id: `briefing.morning_standup`
- Owning agent: Khadijah
- Contributing agents: Sinclair for communications and calendar; Regine for research, relationships, and logistics.
- Surface: Command Center and Briefings.
- Direction of flow: Agent to client download.

## Sections

Prepare agenda sections in the order defined by `docs/ui/12-briefing-templates.md`:

1. Greeting / opening
2. Wellness check-in
3. Today's priorities
4. Calendar and schedule risks
5. Communications needing review
6. Client approvals
7. Projects and dependencies
8. Reports / artifacts ready
9. Announcements and reminders
10. Action items and next steps

## Data Binding

Read from the active `client_id` scope only:

- `briefing_runs.morning_standup.today`
- `client_universe`
- `wellness_checkins`
- `priorities`, `goals`, `projects`, `project_tasks`
- `calendar_items`
- `artifacts` ready for approval or review
- `approvals` where `state = needs_approval`
- `announcements`, `reminders`

## Output

Create or update the briefing run, linked agenda items, and a completion summary preview. Every decision-ready item must link to its source artifact, approval, provider source, or Client Universe record.

On finish, create a Completion Summary that lists decisions, approvals, deferrals, artifacts opened, queued outbound actions, and the next expected prepared work, usually COB Work Day.

## Guardrails

- Keep the client view calm, unified, and artifact-first.
- Do not expose agent internals, PAC/PTQ vocabulary, raw SIGMA vocabulary, provider payloads, or routing traces.
- Do not execute outbound side effects directly; queue them through approval-gated outbound action records.
