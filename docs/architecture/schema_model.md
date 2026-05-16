# Schema Model

## Purpose

This document normalizes the old MVP SQL intake into a FlavorOS 1.5 schema plan.

It is not a database migration. Actual migrations should be written later under `services/api/alembic/` after the schema is reviewed against the API, UI, workflow, and tenant model.

## Controlling Rules

- Database rows are the durable operational source of truth.
- Every meaningful object must be tenant/client scoped.
- GBrain owns memory, retrieval, context, and SIGMA state integration.
- Client Artifacts and SIGMA Artifacts are distinct.
- Provider data enters through provider events and normalization.
- Governed side effects require HITL.
- Obsidian or rendered markdown may be projection/export, not canonical state.

## Core Identity And Tenant Tables

Recommended records:

- `tenants`
- `users`
- `tenant_memberships`
- `client_profiles`
- `client_contexts`
- `context_accounts`
- `oauth_connections`

The old SQL used `client_accounts`, `client_profiles`, `client_contexts`, `context_accounts`, and `oauth_accounts`. FlavorOS 1.5 should preserve those concepts while aligning names with the multi-tenant SaaS foundation.

## Provider Ingestion Tables

Recommended records:

- `provider_accounts`
- `oauth_connections`
- `provider_events`
- `sync_checkpoints`
- `normalized_threads`
- `normalized_items`

Provider events should preserve source identity and payload provenance before normalization. Normalized records should preserve write-back references and routing hints.

## Workflow And Agent Tables

Recommended records:

- `workflows`
- `workflow_runs`
- `agent_tasks`
- `agent_task_events`
- `agent_reports`

Older `work_orders` map to `agent_tasks` in the new model. If the code keeps `work_orders` for a transitional period, it should be treated as a compatibility alias rather than the long-term canonical name.

## Artifact And Approval Tables

Recommended records:

- `client_artifacts`
- `sigma_artifacts`
- `approval_requests`
- `approval_decisions`
- `outbound_actions`
- `sync_receipts`

The old SQL used one broad `artifacts` table. FlavorOS 1.5 should either split artifact records by artifact class or include a strict discriminator that preserves the distinction between Client Artifacts and SIGMA Artifacts.

## PAC/PTQ Tables

Recommended records:

- `pending_action_candidates`
- `qualification_checks`
- `pac_events`

These records support latent work, scoring, incubation, promotion, disqualification, and purge review.

## Finance Tables

Finance tables should be included only as needed by MVP workflows.

Candidate records from the old SQL:

- `financial_accounts`
- `merchant_aliases`
- `financial_transactions`
- `receipts`
- `receipt_transaction_matches`
- `chart_of_accounts`
- `ledger_entries`
- `ledger_postings`
- `budget_periods`
- `budget_lines`
- `budget_alerts`
- `invoices`
- `payables`
- `reimbursements`
- `reconciliation_runs`
- `reconciliation_items`
- `accounting_period_locks`

Finance truth must live in durable rows. Reports, packets, dashboards, and markdown ledgers are projections.

## Migration Mapping From Old SQL

| Old SQL concept | FlavorOS 1.5 target |
|---|---|
| `client_accounts` | `tenants` / client account profile record |
| `client_profiles` | `client_profiles` |
| `client_contexts` | `client_contexts` |
| `context_accounts` | `provider_accounts` or `context_accounts` |
| `oauth_accounts` | `oauth_connections` |
| `provider_events` | `provider_events` |
| `sync_checkpoints` | `sync_checkpoints` |
| `normalized_threads` | `normalized_threads` |
| `normalized_items` | `normalized_items` |
| `pending_action_candidates` | `pending_action_candidates` |
| `qualification_checks` | `qualification_checks` |
| `work_orders` | `agent_tasks` |
| `agent_reports` | `agent_reports` / `agent_task_events` |
| `artifacts` | `client_artifacts` and `sigma_artifacts` |
| `approval_decisions` | `approval_requests` and `approval_decisions` |
| `outbound_actions` | `outbound_actions` |
| `sync_receipts` | `sync_receipts` |

## Validation Before Alembic

Before writing a migration:

- confirm tenant and user auth requirements,
- confirm app UI data needs,
- confirm provider event and normalization fields,
- confirm workflow/agent task state vocabulary,
- confirm Client Artifact and SIGMA Artifact lifecycle fields,
- confirm HITL approval request/decision shape,
- confirm outbound action idempotency rules,
- split finance tables into MVP-now and later groups.

