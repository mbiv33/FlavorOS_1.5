# Readiness Artifact Contract

## Purpose

FlavorOS workflows often produce two kinds of output:

1. **SIGMA Artifacts** for internal memory, state, and future reasoning.
2. **Client Artifacts** for review, approval, execution, briefing, or delivery.

Earlier docs called the second category "readiness artifacts." In FlavorOS 1.5, readiness artifacts are treated as a subtype of Client Artifact.

## Definitions

### SIGMA Artifact

A SIGMA Artifact is internal structured intelligence.

It captures:

- validated context,
- state,
- relationships,
- observations,
- preferences,
- workflow memory,
- decision-relevant patterns.

SIGMA Artifacts are not direct client-facing outputs.

### Readiness Artifact

A readiness artifact is a Client Artifact that makes the next action reviewable, executable, or presentable.

Examples:

- draft email response,
- calendar proposal,
- conflict flag,
- task plan,
- meeting prep packet,
- receipt packet,
- travel research report,
- briefing packet,
- gap check,
- suggested next moves.

## Workflow Output Rule

Meaningful workflows should usually produce:

```text
internal state update + client-facing prepared output
```

In FlavorOS terms:

```text
SIGMA Artifact or memory update
+ Client Artifact / readiness artifact
```

Not every workflow needs a new SIGMA Artifact. Some workflows may only update existing state. But the system should decide this explicitly rather than hiding durable reasoning inside a client-facing artifact.

## Minimal Readiness Artifact Fields

Recommended fields:

- `artifact_id`
- `tenant_id`
- `client_id`
- `artifact_class: client_artifact`
- `artifact_subtype: readiness`
- `title`
- `summary`
- `status`
- `created_by_agent`
- `created_at`
- `source_workflow_run_id`
- `source_agent_task_id`
- `related_provider_event_ids`
- `related_normalized_item_ids`
- `related_sigma_artifact_ids`
- `requires_approval`
- `approval_request_id`
- `next_action`
- `available_commands`

## Status Vocabulary

Recommended readiness statuses:

- `draft`
- `prepared_for_review`
- `approved`
- `deferred`
- `revision_requested`
- `executed`
- `superseded`
- `archived`

## UI Rules

Readiness artifacts should appear through:

- Artifact Cards,
- Approval Cards,
- Briefing steps,
- Meeting surfaces,
- Completion Summaries,
- Reports & Artifacts Meeting.

They should not require:

- voice-first interaction,
- live transcript,
- persistent right rail,
- agent DM.

## Storage Rule

Rendered markdown or document files may exist as projections, exports, or human-readable snapshots. Durable lifecycle state belongs in database records.

