# Workflow And Runtime Model

This document defines the FlavorOS 1.5 workflow and runtime model. It preserves useful cron, provider, storage, and deployment concepts from earlier architecture work while applying the current decisions for the Next.js WebApp MVP, Communication Sweep, GBrain/SIGMA state, HITL, and Hostinger deployment.

## Core Decisions

- Communication Sweep replaces narrow Gmail sync.
- Composio/provider access remains needed.
- Hostinger remains the VPS target.
- GBrain owns memory/persistent state/SIGMA layer.
- HITL remains required.
- Obsidian is not permanent source of truth.
- Voice gateway and live call runtime are future-state for the MVP.

## Runtime Layers

Recommended MVP layers:

```text
Next.js WebApp
API service
Auth/session/tenant layer
Provider access layer
Normalization layer
Workflow engine
Scheduler
Worker/executor
Artifact engine
Approval engine
GBrain/SIGMA layer
Database
Redis/cache/locks
Runtime/deployment target
```

## Durable Source Of Truth

Database/GBrain state should be the durable source of truth for:

- tenants/clients/users
- provider accounts
- provider events
- normalized items
- workflow runs
- agent tasks
- artifacts
- approvals
- outbound actions
- SIGMA state
- audit events

NATS or a message bus may move events, but must not be the only state.

Redis may support:

- locks
- debounce
- rate limiting
- transient workflow state
- hot cache

## Communication Sweep

Communication Sweep generalizes old `inbox_sweep` and Gmail-specific sync.

Pipeline:

```text
provider webhook / poll / manual sync
-> provider_events
-> normalization rules
-> normalized_threads / normalized_items
-> Communication Sweep classification
-> Client Universe / GBrain update
-> workflow runs / agent tasks
-> Client Artifacts / Approval Requests
-> Command Center and Meeting surfaces
```

Provider categories:

- email
- calendar
- contacts
- files
- project management
- social/DM where approved
- finance where approved

## Workflow Run Model

Recommended fields:

```yaml
workflow_run_id: string
client_id: string
tenant_id: string
workflow_type: briefing | meeting | provider_sweep | artifact_generation | approval_review | runtime_check
workflow_name: string
status: queued | running | waiting_for_approval | completed | failed | cancelled
trigger_type: schedule | user_command | provider_event | admin_action | system
trigger_ref: string
owner_agent: khadijah | sinclair | regine | system
started_at: datetime
completed_at: datetime | null
```

## Schedule Treatment

Old schedules should be rewritten into workflow-aware schedules, not direct agent commands.

Examples:

| Old schedule family | New workflow family | Owner |
|---|---|---|
| morning/eod/weekly brief | briefing workflow | Khadijah |
| inbox/calendar sweep | Communication Sweep | Sinclair |
| meeting prep | Comms & Calendar Meeting prep | Sinclair |
| project/task/finance pulse | Projects Meeting prep | Khadijah |
| relationship/social followups | Projects or Reports/Artifacts prep | Regine |
| travel planning/debrief | Travel Meeting prep | Regine |
| ripple synthesis | SIGMA/GBrain synthesis | Khadijah |
| wellness checks | Goodnight/Briefing support | Sinclair |

Old Maxine work should map into Khadijah skills/workflows.

Old Kyle and Scooter work should map into Regine skills/workflows unless communications/private-boundary ownership belongs with Sinclair.

## MVP Briefing Workflows

- Morning Standup
- COB Work Day
- Goodnight

Each should:

- create or update workflow run
- retrieve GBrain/SIGMA context
- gather prepared artifacts and approvals
- render structured interaction steps
- capture decisions
- trigger approved downstream workflows
- create Completion Summary

## MVP Meeting Workflows

- Comms & Calendar
- Travel
- Projects
- Reports & Artifacts

Each should:

- start from a user command or dashboard launch
- show prepared state
- expose approved command buttons
- use approval cards for governed decisions
- produce completion summary

## Provider Normalization

Old normalization configs remain useful as schema references.

Normalize provider-native inputs into FlavorOS-native records before workflow routing.

Required normalized metadata:

- client_id / tenant_id
- provider
- source account
- external object id
- source uri
- occurred_at
- normalized type
- subject/title
- summary
- participants/entities
- risk/urgency signals
- provider payload reference

## Runtime Treatment

Preserve as reference:

- Postgres durable state
- Redis hot state/locks
- NATS or bus as transport candidate
- scheduler
- app API
- Composio/provider init
- secrets protocol shape
- Hostinger deployment target

Rewrite:

- old app-ui static nginx surface
- voice-gateway as MVP requirement
- vault-sync as source-of-truth
- FLAVOROS_CONTEXT runtime dependency
- old five-agent container assumptions

## Hostinger Deployment Candidate

Hostinger remains the VPS target, but FlavorOS 1.5 should deploy as a clean WebApp and support services.

Candidate deployment needs:

- Next.js app
- API/backend service
- database
- Redis
- scheduler/worker
- provider access/config
- secrets protocol
- reverse proxy/TLS
- health check
- post-deploy smoke test

## HITL Runtime Rule

Any workflow that touches money, calendar commitments, outbound communications, sensitive relationships, external sends, or irreversible provider actions must create an Approval Request before execution.
