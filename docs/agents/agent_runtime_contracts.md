# Agent Runtime Contracts

## Purpose

Agent runtime contracts define how workflow work is assigned, reported, audited, and converted into artifacts.

FlavorOS 1.5 should treat transport payloads as envelopes around durable workflow and agent-task records, not as the source of truth.

## Core Rules

- Every assigned unit of work needs one durable id.
- Every agent report points back to that durable id.
- Source provenance travels with the task.
- Delivery intent is explicit.
- Agent-specific inputs live in a structured payload.
- Human-facing copy belongs in artifact summaries, approval cards, completion summaries, and user-facing response fields.
- HITL requirements travel with the task and are enforced before governed side effects.

## Canonical Work Assignment

Conceptual payload:

```json
{
  "schema_version": "flavoros.agent_task.v1",
  "agent_task_id": "task_123",
  "workflow_run_id": "run_123",
  "client_id": "client_123",
  "source": {
    "kind": "provider_sweep",
    "channel": "gmail"
  },
  "source_agent": "khadijah",
  "target_agent": "sinclair",
  "skill": "communications_triage",
  "task_type": "inbound_communications_triage",
  "priority": "P1",
  "requires_approval": true,
  "deliverable": {
    "type": "client_artifact",
    "requested_output": "Inbox triage brief and draft response packet"
  },
  "source_refs": {
    "normalized_item_id": "item_123",
    "provider_event_id": "event_123"
  },
  "context": {
    "summary": "Inbound thread needs a scheduling answer."
  },
  "inputs": {},
  "requested_at": "2026-05-15T00:00:00Z"
}
```

## Canonical Agent Report

Conceptual payload:

```json
{
  "schema_version": "flavoros.agent_report.v1",
  "agent_task_id": "task_123",
  "workflow_run_id": "run_123",
  "client_id": "client_123",
  "agent": "sinclair",
  "skill": "communications_triage",
  "status": "completed",
  "summary": "Prepared an inbox triage brief and draft reply.",
  "user_facing_response": "I staged a reply for review.",
  "requires_approval": true,
  "source_refs": {
    "normalized_item_id": "item_123",
    "provider_event_id": "event_123"
  },
  "result": {
    "artifact_type": "client_artifact"
  },
  "completed_at": "2026-05-15T00:05:00Z"
}
```

## Agent Ownership

| Agent | Runtime contract role |
|---|---|
| Khadijah | Creates/routs work, resolves dependencies, manages approval surfaces |
| Sinclair | Handles communications, calendar, sensitive provider/private boundary tasks |
| Regine | Handles research, logistics, travel, relationships, vendor/social context |

Older work-order labels should be converted into these three owners before promotion to canonical runtime docs.

## Storage Alignment

Runtime envelopes should map to durable records:

- `workflow_runs`,
- `agent_tasks`,
- `agent_task_events`,
- `client_artifacts`,
- `sigma_artifacts`,
- `approval_requests`,
- `approval_decisions`,
- `outbound_actions`,
- `sync_receipts`.

## Status Vocabulary

Recommended task states:

- `queued`,
- `in_progress`,
- `blocked`,
- `needs_input`,
- `completed`,
- `failed`,
- `canceled`.

Legacy values such as `done` or `complete` should normalize to `completed`.

