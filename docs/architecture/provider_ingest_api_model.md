# Provider Ingest API Model

## Purpose

This document extracts the useful behavior from the old app API intake without promoting the old source code.

The old API demonstrated a valuable path:

```text
provider fetch
-> provider_events
-> normalized records
-> agent work assignment
-> agent report
-> artifact
-> dashboard state
```

FlavorOS 1.5 should keep that flow, but generalize it beyond Gmail and align it with Communication Sweep, workflow runs, Client Artifacts, SIGMA Artifacts, and the three-agent model.

## Core API Responsibilities

The API layer should provide:

- health checks,
- authenticated tenant/client context,
- provider connection status,
- provider sync triggers,
- provider webhook intake,
- normalized item access,
- workflow run creation,
- agent task creation,
- artifact retrieval,
- approval request/decision endpoints,
- outbound action staging and execution status,
- Command Center dashboard state.

## Communication Sweep

Communication Sweep replaces narrow Gmail sync.

MVP provider lanes may include:

- email,
- calendar,
- contacts,
- files,
- social/direct messages,
- finance provider events where approved.

Each lane should produce provider events first, then normalized records.

## Ingest Flow

```text
provider webhook / poll / manual trigger
-> provider_events
-> normalization config
-> normalized_threads / normalized_items
-> workflow_runs
-> agent_tasks
-> Client Artifacts / SIGMA Artifacts
-> approval_requests
-> outbound_actions
-> sync_receipts
```

## Endpoint Families

Recommended endpoint families:

- `GET /health`
- `GET /api/command-center`
- `GET /api/providers`
- `POST /api/providers/{provider}/sync`
- `POST /api/providers/{provider}/webhook`
- `GET /api/normalized-items`
- `POST /api/workflows/{workflow_id}/runs`
- `GET /api/workflow-runs`
- `GET /api/artifacts`
- `GET /api/approvals`
- `POST /api/approvals/{approval_request_id}/decision`
- `GET /api/outbound-actions`

## Durable State Rule

The API should write durable rows before publishing events or invoking worker tasks.

Transport failures should not erase:

- provider event,
- normalized item,
- workflow run,
- agent task,
- approval request,
- outbound action.

## Provider Secret Rule

API services should reference provider credentials through scoped provider connection records and approved secret/provider vaults.

The API must not rely on hardcoded development client ids, plaintext env values in repo files, or `FLAVOROS_CONTEXT.md` as runtime canon.

## Dashboard State

Command Center state should be composed from:

- provider connection health,
- briefing readiness,
- meeting launch readiness,
- pending approvals,
- prepared artifacts,
- active workflow runs,
- recent completion summaries,
- provider/action errors.

It should not expose raw agent internals, raw SIGMA state, or provider implementation details to normal client users.

