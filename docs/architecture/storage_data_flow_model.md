# Storage And Data Flow Model

## Purpose

This model defines how FlavorOS moves from external provider data to normalized records, workflows, artifacts, approvals, and provider write-back.

## Core Rule

Do not collapse FlavorOS into one storage layer.

The MVP needs distinct roles:

| Layer | Role |
|---|---|
| Database | Durable operational source of truth |
| GBrain | Memory, retrieval, context, and SIGMA state layer |
| Redis | Ephemeral locks, cache, rate limits, debounce |
| NATS or queue | Transport and event movement |
| Provider vault/Composio | External provider authorization and OAuth custody |
| Rendered docs | Human-readable projections and review outputs |

Transport is not storage. Rendered markdown is not operational truth.

## Canonical Flow

```text
provider webhook / poll / manual fetch
-> provider_events
-> normalization rules
-> normalized_threads / normalized_items
-> workflow_runs / agent_tasks
-> agent_task_events / reports
-> Client Artifacts / SIGMA Artifacts
-> approval_requests / approval_decisions
-> outbound_actions
-> sync_receipts
-> provider write-back
```

## Durable Records

The database should own:

- tenants,
- users,
- client profiles,
- client contexts,
- provider accounts,
- OAuth connection metadata,
- provider events,
- normalized threads,
- normalized items,
- workflow runs,
- agent tasks,
- agent task events,
- Client Artifacts,
- SIGMA Artifacts,
- approval requests,
- approval decisions,
- outbound actions,
- sync receipts,
- PAC/PTQ records,
- finance workflow records where needed.

## Provider Events

Every inbound provider item should first become a durable provider event.

Provider events preserve:

- source provider,
- external object id,
- external thread id,
- event type,
- raw payload reference or safe payload copy,
- ingestion timestamp,
- dedupe key,
- processing status.

## Normalized Records

Normalized records create a shared FlavorOS operating layer while preserving source references.

Normalized items should keep:

- provider event reference,
- thread reference,
- participant references,
- body/content summary,
- suggested route,
- approval hints,
- origin write target,
- normalization version.

## Artifact Storage

Client Artifacts and SIGMA Artifacts should be indexed as first-class records.

Rendered files can exist as projections, but canonical status, ownership, source links, approval state, and lifecycle live in durable records.

## Outbound Actions

Provider write-back must pass through explicit outbound action records.

Outbound actions preserve:

- target provider,
- action type,
- target reference,
- payload,
- approval decision link,
- idempotency key where applicable,
- execution status,
- provider receipt.

## Finance Rule

Finance truth must live in durable records.

Reports, packets, dashboards, and markdown ledgers are projections. Payments, invoices, reimbursements, reconciliation, and accounting-period decisions must not depend on rendered documents as the source of truth.

