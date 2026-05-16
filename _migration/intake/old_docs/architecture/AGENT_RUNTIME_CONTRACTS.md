# Agent Runtime Contracts

## Purpose

This document defines the canonical NATS payloads for specialist delegation in the FlavorOS MVP runtime.

Use these contracts for:

- `work_order.<agent>`
- `report.<agent>`

These contracts sit between normalized storage and specialist execution. They are transport envelopes, not replacements for Postgres rows.

## Design Rules

- Every work order must have one durable `work_order_id`.
- Every specialist report must point back to that `work_order_id`.
- Source provenance travels in `source_refs`.
- Delivery intent travels in `deliverable`.
- Agent-specific execution detail lives in `inputs`.
- Human-facing copy belongs in `summary`, `user_facing_response`, and `content`, not in ad hoc top-level fields.

## Canonical Work Order

Subject:

```text
work_order.<agent>
```

Payload:

```json
{
  "schema_version": "flavoros.work_order.v1",
  "work_order_id": "wo-1234567890ab",
  "client_id": "marcus",
  "source": {
    "kind": "app-api",
    "channel": "gmail_sync"
  },
  "source_agent": "khadijah",
  "target_agent": "sinclair",
  "skill": "inbound-communications-draft-response",
  "task_type": "inbound_communications_triage",
  "priority": "P0",
  "requires_approval": true,
  "deliverable": {
    "type": "readiness_artifact",
    "artifact_target_path": "vault/15-Readiness/inbox-wo-1234567890ab.md",
    "requested_output": "Inbox triage brief and draft response packet"
  },
  "source_refs": {
    "normalized_item_id": "nit-1234567890ab",
    "provider_event_id": "pev-1234567890ab"
  },
  "context": {
    "summary": "Inbound Gmail thread asking for scheduling follow-up."
  },
  "inputs": {
    "subject": "Investor intro thread needs a scheduling answer",
    "body": "Hi marcus, I would love to find a time next week...",
    "route": "sinclair.comms",
    "source": "gmail"
  },
  "requested_at": "2026-05-08T04:00:00Z"
}
```

## Canonical Specialist Report

Subject:

```text
report.<agent>
```

Payload:

```json
{
  "schema_version": "flavoros.specialist_report.v1",
  "work_order_id": "wo-1234567890ab",
  "agent": "sinclair",
  "skill": "inbound-communications-draft-response",
  "status": "completed",
  "summary": "Prepared an inbox triage brief and a draft scheduling reply.",
  "vault_file": "15-Readiness/inbox-wo-1234567890ab.md",
  "user_facing_response": "I prepared the inbox brief and staged the reply for review.",
  "requires_approval": true,
  "source_refs": {
    "normalized_item_id": "nit-1234567890ab",
    "provider_event_id": "pev-1234567890ab"
  },
  "result": {
    "artifact_type": "readiness_artifact"
  },
  "completed_at": "2026-05-08T04:05:00Z",
  "content": "# Inbox Triage Brief\n..."
}
```

## Backward Compatibility

During the MVP transition, the runtime should accept older aliases when reading work orders:

- `id` -> `work_order_id`
- `args` -> `inputs`
- string `deliverable` -> `deliverable.requested_output`
- `deliverable_type` -> `deliverable.type`
- `artifact_target_path` or `vault_path` -> `deliverable.artifact_target_path`
- top-level `normalized_item_id` or `provider_event_id` -> `source_refs.*`
- `fired_at` or `created_at` -> `requested_at`

Reports may continue to include `order_id` as a compatibility alias, but `work_order_id` is canonical.

## Storage Alignment

- `work_order_id` maps to `work_orders.work_order_id`
- `target_agent` maps to `work_orders.target_agent`
- `task_type` maps to `work_orders.task_type`
- `deliverable.type` maps to `work_orders.deliverable_type`
- `requires_approval` maps to `work_orders.requires_approval`
- `deliverable.artifact_target_path` maps to `work_orders.artifact_target_path`
- `inputs`, `context`, and `source_refs` should be preserved inside `work_orders.input_json`
- report payloads are stored in `agent_reports.report_json`

## Finance Addendum

Finance work orders may include additional `source_refs` when the task comes from the finance layer rather than the universal inbox.

Allowed finance source refs:

- `financial_transaction_id`
- `receipt_id`
- `invoice_id`
- `payable_id`
- `reimbursement_id`
- `reconciliation_run_id`
- `budget_line_id`

Finance work-order rules:

- create or update the source finance row in `Postgres` before dispatching specialist work
- treat vault packets as deliverables, not as system-of-record state
- never execute a payment or invoice send directly from the work order alone

Finance outbound rules:

- every staged money movement or invoice dispatch must create an `outbound_actions` row
- approval-gated finance actions must not execute until `approval_decision_id` is present
- finance outbound actions must carry a provider `idempotency_key`
- execution results append through `sync_receipts`; they do not replace the staged record

## Status Vocabulary

Work orders:

- `queued`
- `in_progress`
- `completed`
- `needs_input`
- `failed`
- `canceled`

Specialist reports:

- `completed`
- `needs_input`
- `failed`

Map legacy values like `complete` and `done` to `completed`.
