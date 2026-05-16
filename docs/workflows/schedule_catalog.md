# Schedule Catalog

## Purpose

This document normalizes old cron schedules into FlavorOS 1.5 workflow-aware schedules.

It is not a scheduler config. Actual runtime schedules should be promoted later to `configs/workflows.yaml` or a scheduler-specific config after workflow names and owners are approved.

## Schedule Rules

- A schedule creates or updates a `workflow_run`.
- Durable database rows are the source of truth.
- Schedules should not publish agent work without recording workflow state.
- Schedules must use the three-agent ownership model.
- Schedules must not depend on `FLAVOROS_CONTEXT.md`.
- Voice, live call, and transcript schedules are future-state unless explicitly promoted later.

## Agent Ownership Mapping

| Old owner | FlavorOS 1.5 owner |
|---|---|
| Khadijah | Khadijah |
| Sinclair | Sinclair |
| Maxine | Khadijah |
| Kyle | Regine |
| Scooter | Regine |

Finance/project/ops work from Maxine maps to Khadijah. Relationship, brand, travel, logistics, and research work from Kyle/Scooter maps to Regine unless it touches Sinclair's communications/private-provider boundary.

## Recommended MVP Schedules

| Schedule | Cadence | Workflow | Owner |
|---|---|---|---|
| Morning Standup | Daily morning | `briefing.morning_standup` | Khadijah |
| COB Work Day | Weekday late afternoon | `briefing.cob_workday` | Khadijah |
| Goodnight | Evening | `briefing.goodnight` | Sinclair |
| Communication Sweep | Frequent business-hours sweep plus light off-hours sweep | `provider.communication_sweep` | Sinclair |
| Calendar Lookahead | Morning and midday | `provider.calendar_lookahead` | Sinclair |
| Meeting Prep | Evening before upcoming meetings | `meeting.comms_calendar_prep` | Sinclair |
| Project Pulse | Weekday or Monday cadence | `meeting.projects_pulse` | Khadijah |
| Finance Pulse | Weekly and daily exception sweeps | `workflow.finance_pulse` | Khadijah |
| PAC/PTQ Review | Nightly plus event-driven | `workflow.pac_ptq_review` | Khadijah |
| Relationship/Network Pulse | Weekly or twice weekly | `meeting.relationship_context` | Regine |
| Travel Horizon Scan | Weekday morning | `meeting.travel_horizon_scan` | Regine |
| Travel Prep/Return/Debrief | Daily conditional | `workflow.travel_lifecycle` | Regine |
| Reports & Artifacts Refresh | Daily or on workflow completion | `meeting.reports_artifacts_refresh` | Khadijah |

## Deferred Or Future-State Schedules

- live voice call opening,
- transcript processing,
- persistent chat/right-rail monitors,
- always-on listening,
- live itinerary tick that assumes voice/call presence,
- vault-as-source-of-truth sync.

## Validation Before Runtime Config

Before creating scheduler config:

- confirm each schedule maps to a workflow id,
- confirm each workflow creates durable `workflow_runs`,
- confirm agent ownership uses Khadijah, Sinclair, or Regine,
- confirm HITL gates are declared,
- confirm tenant/client scoping is present,
- confirm provider/account scopes are explicit,
- confirm no old five-agent routes remain.

