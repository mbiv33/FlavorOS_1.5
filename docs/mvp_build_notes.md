# MVP Build Notes

## MVP Positioning

The MVP should prove that FlavorOS can operate as a calm, unified client command center powered by a small but useful multi-agent system.

It should not attempt to build every possible future capability.

## MVP Roles

1. Client/User
2. Developer/Admin

## MVP Agents

### Khadijah — Conductor Agent

Runtime: Cloud-based

Personas/purposes:

- Khadijah — orchestration
- Maxine — project management
- Kyle — finances

### Sinclair — Communications Agent

Runtime: Local

Personas/purposes:

- Sinclair — executive assistant
- Sinclair — preference guardian
- Sinclair — wellness guru
- Overton — secrets butler
- Overton — household management

### Regine — Research & Logistics Agent

Runtime: Cloud-based

Personas/purposes:

- Scooter — travel + logistics
- Scooter — researcher
- Regine — relationships/contacts management
- Regine — lifestyle coordinator
- Regine — social media coordinator

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

### Client Arts

Created for client approval and use.

Examples:

- communication drafts,
- reports,
- recommendations,
- responses,
- summaries,
- travel options,
- meeting briefs.

### SIGMA Arts

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

Initial provider categories:

- email,
- calendar,
- contacts,
- files,
- project management.

Use GBrain for:

- ingestion,
- indexing,
- retrieval,
- memory maintenance,
- context preparation,
- SIGMA support.

## MVP Technical Priorities

1. Multi-tenant foundation
2. Auth and role model
3. Client Universe schema
4. Composio provider connection
5. GBrain ingestion/retrieval integration
6. Basic orchestrator
7. Three MVP agents
8. Briefing engine
9. Artifact engine
10. Approval queue
11. Admin monitoring widgets

## MVP Non-Negotiables

- Tenant isolation from the start
- Every meaningful object scoped to client_id
- Client context stored in Client Universe
- Agents do not own memory
- Composio provides access, not the canonical data model
- GBrain maintains memory/context
- Agent work product is an Artifact
- Client Arts and SIGMA Arts are distinct
- Client UI must remain calm and unified
