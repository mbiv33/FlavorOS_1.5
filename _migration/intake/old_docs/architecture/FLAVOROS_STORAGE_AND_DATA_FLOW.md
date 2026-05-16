# FlavorOS Storage and Data Flow Architecture

## Purpose

This document explains where FlavorOS ingests raw data, where each class of data is stored, how records are updated over time, and how data becomes user-facing app state.

Use this doc as the source of truth for MVP storage decisions.

Runtime transport payloads are defined separately in `docs/architecture/AGENT_RUNTIME_CONTRACTS.md`.

## Core Principle

Do not collapse the system into one storage layer.

FlavorOS has four distinct storage roles:

1. `Postgres` is the durable operational system of record.
2. `Redis` is the ephemeral state and locking layer.
3. `Vault` is the human-readable artifact and memory layer.
4. `NATS` is transport, not storage.

Normalization is not storage. Normalization is the transformation layer between provider-native data and FlavorOS-native data.

Finance rule:

- markdown ledgers, dashboards, and packets are readable projections
- finance truth lives in `Postgres`
- approval state, reconciliation state, and outbound execution state must never rely on vault markdown as the source of truth

## End-to-End Data Flow

```text
provider webhook / poll / manual fetch
  -> provider_events
  -> normalization rules
  -> normalized threads + normalized items
  -> work_orders
  -> agent_reports
  -> artifacts / approvals / sigmas
  -> outbound_actions
  -> sync_receipts
  -> provider write-back
```

Finance extension:

```text
financial provider webhook / poll / csv / receipt upload
  -> provider_events
  -> finance normalization rules
  -> financial_accounts + financial_transactions + receipts
  -> receipt_transaction_matches
  -> ledger_entries + ledger_postings
  -> budgets / invoices / payables / reimbursements
  -> approval_decisions + outbound_actions + sync_receipts
  -> reconciliation_runs + accounting_period_locks
  -> vault reports / dashboards / staged packets
```

## Storage Layers

### 1. Provider ingress

Purpose:

- receive data from Gmail, Calendar, WhatsApp, and social DMs
- preserve provider-native identifiers immediately
- guarantee we can reconstruct source context later

Rule:

- every inbound item first becomes a `provider_events` row before agent routing

### 2. Durable operational storage

Purpose:

- preserve raw ingest facts
- preserve normalized FlavorOS objects
- preserve workflow state, approvals, and outbound state

System:

- `Postgres`

### 3. Ephemeral control storage

Purpose:

- dedupe
- locks
- rate-limit counters
- transient worker state

System:

- `Redis`

### 4. Human-readable product storage

Purpose:

- render durable artifacts for people and for agent memory
- hold SIGMAs, readiness artifacts, briefs, reports, and other markdown outputs

System:

- `vault/`

## MVP Durable Tables

### `client_accounts`

Purpose:

- identify which client a record belongs to
- keep client-aware routing explicit

Key fields:

- `client_id`
- `display_name`
- `status`
- `default_authority_mode`
- `created_at`
- `updated_at`

Update rule:

- upsert when client metadata changes

### `provider_connections`

Purpose:

- track which provider accounts are connected for each client
- expose health and sync status to the app UI

Key fields:

- `provider_connection_id`
- `client_id`
- `provider`
- `account_alias`
- `connection_status`
- `last_sync_at`
- `last_error_at`
- `last_error_summary`
- `capabilities_json`

Update rule:

- upsert by `client_id + provider + account_alias`

### `oauth_accounts`

Purpose:

- track consented OAuth accounts and token metadata without putting secrets in repo docs

Key fields:

- `oauth_account_id`
- `provider_connection_id`
- `scopes_json`
- `token_expires_at`
- `refresh_status`
- `created_at`
- `updated_at`

Update rule:

- update token metadata when refreshed
- never use this table as a user-facing projection

### `provider_events`

Purpose:

- immutable durable record of raw inbound provider data
- first landing zone for external data

Key fields:

- `provider_event_id`
- `client_id`
- `provider_connection_id`
- `provider`
- `external_object_id`
- `external_thread_id`
- `event_type`
- `occurred_at`
- `ingested_at`
- `payload_json`
- `payload_text_preview`
- `dedupe_key`
- `processing_status`

Update rule:

- insert-only for event facts
- status fields may be updated as processing advances
- raw payload should not be overwritten

### `sync_checkpoints`

Purpose:

- store provider-specific cursors and history markers
- support polling and replay recovery

Key fields:

- `sync_checkpoint_id`
- `provider_connection_id`
- `checkpoint_type`
- `checkpoint_value`
- `checkpoint_at`

Update rule:

- upsert latest checkpoint per provider/account/checkpoint type

### `normalized_threads`

Purpose:

- represent conversation or coordination containers across channels
- preserve one FlavorOS thread view while keeping source references

Key fields:

- `normalized_thread_id`
- `client_id`
- `thread_kind`
- `provider`
- `external_thread_id`
- `title`
- `primary_counterparty`
- `thread_status`
- `latest_provider_event_id`
- `last_activity_at`

Update rule:

- upsert by source thread identity
- latest-write-wins for current thread state

### `normalized_items`

Purpose:

- create the shared FlavorOS inbox object for messages, events, tasks, notices, and requests

Key fields:

- `normalized_item_id`
- `client_id`
- `normalized_thread_id`
- `provider_event_id`
- `provider`
- `item_type`
- `direction`
- `received_at`
- `from_entities_json`
- `to_entities_json`
- `subject`
- `body_markdown`
- `requires_response`
- `requires_approval`
- `suggested_route`
- `origin_action_type`
- `origin_write_target_json`
- `normalization_version`

Update rule:

- insert derived items from provider events
- allow controlled updates for classification and route enrichment
- never lose the pointer back to the source event

### `pending_action_candidates`

Purpose:

- store potential work that may become a task or project, but is not yet committed

Key fields:

- `pac_id`
- `client_id`
- `source_normalized_item_id`
- `source_provider_event_id`
- `source_agent`
- `source_trigger_type`
- `candidate_summary`
- `candidate_scope`
- `state`
- `time_score`
- `crm_score`
- `milestone_score`
- `touch_score`
- `cumulative_score`
- `last_touched_at`
- `hard_date`
- `current_ptq_id`
- `metadata_json`
- `created_at`
- `updated_at`

Update rule:

- insert once when a PAC is logged
- update score and state as qualification progresses, incubates, decays, purges, or resolves

### `qualification_checks`

Purpose:

- store the PTQs that determine whether a PAC becomes real work

Key fields:

- `ptq_id`
- `pac_id`
- `client_id`
- `qualification_type`
- `condition_summary`
- `resolution_mode`
- `assigned_agent`
- `status`
- `tripwire_type`
- `threshold_value`
- `resolved_at`
- `resolution_notes`
- `approval_decision_id`
- `metadata_json`

Update rule:

- insert a row for each PTQ
- update lifecycle state without deleting historical qualification context

### `work_orders`

Purpose:

- represent agent-assigned work created from normalized items or manual requests

Key fields:

- `work_order_id`
- `client_id`
- `normalized_item_id`
- `source_agent`
- `target_agent`
- `task_type`
- `priority`
- `status`
- `deliverable_type`
- `requires_approval`
- `artifact_target_path`
- `created_at`
- `updated_at`

Update rule:

- insert once
- update lifecycle state over time

### `agent_reports`

Purpose:

- durable outputs from specialist execution

Key fields:

- `agent_report_id`
- `work_order_id`
- `agent`
- `status`
- `summary`
- `user_facing_response`
- `vault_file`
- `requires_approval`
- `report_json`
- `created_at`

Update rule:

- append one or more reports per work order
- do not overwrite previous report states silently

### `artifacts`

Purpose:

- index every human-readable output rendered to vault or app-visible storage

Key fields:

- `artifact_id`
- `client_id`
- `artifact_type`
- `source_work_order_id`
- `source_report_id`
- `vault_path`
- `title`
- `status`
- `rendered_at`
- `related_provider_event_id`
- `related_normalized_item_id`

Update rule:

- insert when artifact is created
- update status if revised, approved, superseded, or executed

### `approval_decisions`

Purpose:

- preserve approval history and exact side effects

Key fields:

- `approval_decision_id`
- `client_id`
- `artifact_id`
- `work_order_id`
- `decision_owner`
- `decision_state`
- `risk_level`
- `exact_side_effect`
- `decision_notes`
- `decided_at`

Update rule:

- append each approval event
- never replace prior decisions without an audit trail

### `outbound_actions`

Purpose:

- track proposed, staged, approved, executed, failed, or canceled writes back to source systems

Key fields:

- `outbound_action_id`
- `client_id`
- `normalized_item_id`
- `artifact_id`
- `provider`
- `action_type`
- `target_reference_json`
- `payload_json`
- `approval_decision_id`
- `status`
- `attempt_count`
- `last_attempt_at`
- `last_error_summary`

Update rule:

- insert when outbound action is staged
- update on retries, success, cancellation, or failure

### `sync_receipts`

Purpose:

- preserve what happened after an outbound write or sync operation

Key fields:

- `sync_receipt_id`
- `outbound_action_id`
- `provider`
- `external_result_id`
- `receipt_status`
- `response_code`
- `response_summary`
- `recorded_at`

Update rule:

- append each provider result receipt

## Finance Durable Tables

These tables extend the MVP operational model for finance workflows. They are the canonical layer for the finance FRD.

### `financial_accounts`

Purpose:

- represent real bank, card, processor, cash, books, and clearing accounts
- keep account ownership and context separation explicit

Update rule:

- upsert by client/provider/account alias
- archive instead of reusing an old account identity

### `financial_transactions`

Purpose:

- store immutable, normalized financial transaction facts
- preserve both provider-native ids and FlavorOS idempotency keys

Update rule:

- insert normalized facts once per idempotency key
- update only review/categorization/receipt state fields
- never rewrite the raw fact payload or immutable hash

### `receipts` and `receipt_transaction_matches`

Purpose:

- store OCR-extracted receipt facts separately from transaction facts
- preserve proposed and confirmed matching state

Update rule:

- receipt uploads dedupe by file hash
- matching is append/revise state, not destructive merge

### `chart_of_accounts`

Purpose:

- define the client ledger vocabulary for assets, liabilities, equity, income, expense, and contra accounts

Update rule:

- account codes are durable identifiers
- archive rather than repurpose a code

### `ledger_entries` and `ledger_postings`

Purpose:

- store the canonical double-entry ledger
- make balancing checks and accounting-period locks possible

Update rule:

- each entry is created from a source object such as a transaction, invoice, payable, reimbursement, or reconciliation adjustment
- postings are immutable once the period is locked
- balancing validation happens before posting and again during close

### `budget_periods`, `budget_lines`, and `budget_alerts`

Purpose:

- store planned category limits, run-rate thresholds, and generated overrun signals

Update rule:

- budget lines are versioned by period
- alerts are durable exceptions until acknowledged or resolved

### `invoices`, `payables`, and `reimbursements`

Purpose:

- store staged and executed AR/AP workflow state with durable links to approvals and outbound actions

Update rule:

- status changes must preserve approval and execution audit history
- external dispatch never becomes truth without a sync receipt or source evidence

### `reconciliation_runs`, `reconciliation_items`, and `accounting_period_locks`

Purpose:

- support weekly/monthly close, exception routing, and period lock state

Update rule:

- each close run is durable
- exceptions are resolved, not deleted
- a locked period is append-only from that point forward unless explicitly reopened

## Redis Role

Use `Redis` only for:

- `lock:work_order:<id>`
- `dedupe:<provider>:<external_id>`
- `rl:<provider>:<scope>`
- short-lived provider cursor caches
- transient UI refresh hints

Do not treat Redis as the durable source of truth for provider data, approvals, or artifacts.

## Vault Role

Use the vault for rendered product outputs:

- `vault/05-SIGMA/`
- `vault/10-Briefs/`
- `vault/15-Readiness/`
- `vault/20-Meetings/`
- `vault/35-Reports/`
- `vault/40-People/`
- `vault/70-Ops/`

Rules:

- vault files are projections of system state, not substitutes for durable operational rows
- every durable artifact should be indexed in `artifacts`
- every user-facing item should preserve links back to source records
- finance dashboards, staged payment packets, invoice packets, and audit exception reports must render from canonical Postgres records

## Update Rules and Best Practices

### Insert early

- write `provider_events` before routing or summarization

### Preserve provenance

- every normalized item must point back to its source `provider_event`
- every outbound action must point back to its source item or artifact

### Separate facts from projections

- raw source events are facts
- normalized items are derived operational objects
- vault artifacts are human-facing projections

### Keep write-back safe

- outbound writes should use staged `outbound_actions`
- approval-gated actions should not execute directly from UI clicks without an auditable record

### Make app UI queryable

The MVP app should primarily read from:

- `provider_connections`
- `normalized_threads`
- `normalized_items`
- `financial_accounts`
- `financial_transactions`
- `receipts`
- `ledger_entries`
- `ledger_postings`
- `budget_alerts`
- `invoices`
- `payables`
- `reimbursements`
- `reconciliation_runs`
- `reconciliation_items`
- `work_orders`
- `agent_reports`
- `artifacts`
- `approval_decisions`
- `outbound_actions`

That gives the app one coherent operational view instead of scraping markdown files.
