# MVP Build Notes

## Status

This file is supporting context. The canonical development plan and build priority order live in `current_build_plan.md`.

Use this file for background on MVP purpose, agents, surfaces, and non-negotiables. If this file conflicts with `current_build_plan.md`, the current build plan wins.

**Execution state (2026-05-19):** Demo vertical slice (steps 1–5) and parallel lanes C/G/H/E plus post-slice B/D/F are complete. Lane I (channel surfaces) is in progress. For next work, see [`next_session_handoff.md`](./next_session_handoff.md), [`parallel_lanes_tracker.md`](./parallel_lanes_tracker.md), and [`build_roadmap_assessment.md`](./build_roadmap_assessment.md).

## MVP Positioning

The MVP should prove that FlavorOS can operate as a calm, unified client command center powered by a small but useful multi-agent system.

It should not attempt to build every possible future capability.

## MVP Roles

1. Client/User
2. Developer/Admin

## MVP Agents

The MVP agent model has exactly three canonical agent owners: Khadijah, Sinclair, and Regine.

Retired names may appear as persona, skill, or design lineage only. They are not standalone MVP agent owners.

### Khadijah — Conductor Agent

Runtime: Cloud-based

Responsibilities:

- orchestration
- project/workflow qualification
- approval routing
- artifact coordination
- finance boundary/model oversight

### Sinclair — Communications Agent

Runtime: Local

Responsibilities:

- communications triage
- calendar/schedule posture
- preference guarding
- wellness-sensitive communication handling
- client-facing draft preparation

### Regine — Research & Logistics Agent

Runtime: Cloud-based

Responsibilities:

- research
- travel/logistics
- relationship and contact context
- lifestyle coordination
- selected social DM context where connected

## MVP App Surfaces

Recommended client-facing surfaces:

- Home / Command Center
- Briefings
- Meetings
- Comms & Calendar
- Projects
- Reports & Artifacts
- Travel / Logistics
- Settings / Profile

Recommended admin-facing additions:

- Tenant monitor
- Agent monitor
- Workflow monitor
- Provider sync status
- GBrain ingestion status
- Artifact queue
- Approval queue
- Logs
- Config editor

## MVP Briefings

Start with:

1. Morning Standup
2. COB Work Day
3. Goodnight

### Morning Standup

Purpose:

- set the day,
- review priorities,
- identify approvals,
- surface schedule,
- surface communications,
- review dependencies,
- confirm agent work.

### COB Work Day

Purpose:

- close the workday,
- review wins,
- surface pending approvals,
- identify unfinished items,
- prepare evening schedule,
- reduce uncertainty.

### Goodnight

Purpose:

- wellness and calm,
- gather client reflections,
- update preferences/context,
- prepare early morning awareness,
- feed GBrain and Client Universe with soft personal context.

## MVP Artifact Types

### Client Artifacts

Created for client approval and use.

Examples:

- communication drafts,
- reports,
- recommendations,
- responses,
- summaries,
- travel options,
- meeting briefs.

### SIGMA Artifacts

Created or updated for agent use.

Examples:

- states,
- YAML docs,
- task dependencies,
- workflow prep packets,
- context packets,
- memory candidates,
- agent handoff notes.

## MVP Integration Strategy

Use Composio for provider access.

Provider priority tiers:

| Tier | Provider target | MVP posture |
|---|---|---|
| 1 | Google Workspace: Gmail, Google Calendar, Docs, Sheets, Slides | First-class MVP provider target |
| 2 | Project management, contacts, files, selected social DMs | Supporting MVP providers where needed |
| 3 | Finance and Twilio | Future/adjacent unless explicitly promoted |

Use GBrain for:

- ingestion,
- indexing,
- retrieval,
- memory maintenance,
- context preparation,
- SIGMA support.

## MVP Technical Priorities

These notes support the canonical priority order in `current_build_plan.md`:

1. Visualization and surfaces
2. DB and storage
3. Integrations
4. Onboarding
5. Provider ingestion
6. Agent workflows

Technical foundations required under that order:

- multi-tenant foundation
- auth and role model
- Client Universe schema
- provider connection framework
- GBrain ingestion/retrieval integration
- basic orchestrator
- three MVP agents
- briefing workflow/storage framework
- artifact engine
- approval queue
- admin monitoring widgets

## MVP Non-Negotiables

- Tenant isolation from the start
- Every meaningful object scoped to client_id
- Client context stored in Client Universe
- Agents do not own memory
- Composio provides access, not the canonical data model
- GBrain maintains memory/context
- Agent work product is an Artifact
- Client Artifacts and SIGMA Artifacts are distinct
- Client UI must remain calm and unified
