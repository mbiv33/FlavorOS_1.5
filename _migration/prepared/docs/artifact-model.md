# Artifact Model

Status: prepared migration candidate.

This document normalizes old UI approval-card and SIGMA/readiness-artifact intake into the FlavorOS 1.5 artifact model.

## Source Material

- `_migration/decisions.md`
- `_migration/intake/old_ui/docs/prd/ui/03-approval-card.md`
- `_migration/intake/old_docs/architecture/SIGMA_READINESS_CONTRACT.md`
- `_migration/intake/old_docs/architecture/SIGMA_SPEC.md`

## Core Decision

FlavorOS has two primary artifact classes:

1. Client Artifacts
2. SIGMA Artifacts

Client Artifacts are user-facing outputs.

SIGMA Artifacts are internal agent-used artifacts.

## Client Artifact

A Client Artifact is prepared work product made for review, approval, use, delivery, or briefing.

Examples:

- drafted email response
- calendar proposal
- travel option packet
- meeting brief
- project report
- recommendation
- decision memo
- finance summary
- completion summary

Client Artifacts can appear in:

- Command Center Dashboard
- Briefings
- Meetings
- Approval Cards
- Artifact Cards
- Completion Summaries

## SIGMA Artifact

A SIGMA Artifact is an internal knowledge/state artifact used by agents, workflows, GBrain, and future retrieval.

SIGMA Artifacts should not be exposed directly to the client.

Examples:

- validated preference/state object
- trip-instance state
- project-state object
- relationship state
- readiness context packet
- ripple/impact state
- workflow prep state

## Common Artifact Fields

Recommended shared shape:

```yaml
artifact_id: string
client_id: string
tenant_id: string
artifact_class: client_artifact | sigma_artifact
artifact_type: string
title: string
status: draft | prepared | pending_review | approved | queued | completed | archived | superseded
visibility: client | admin | agent_internal
created_by_agent: khadijah | sinclair | regine | system
workflow_id: string
workflow_run_id: string
source_context_ids: []
related_provider_event_ids: []
related_artifact_ids: []
approval_required: boolean
created_at: datetime
updated_at: datetime
```

## Client Artifact Fields

```yaml
artifact_id: string
client_id: string
title: string
artifact_type: draft_email | calendar_hold | report | brief | travel_option | project_status | completion_summary | other
status: prepared | pending_review | approved | revised | deferred | sent | filed | completed
summary: string
body: string
preview: object
source_links: []
approval_request_id: string | null
decision_history: []
external_action_status: queued | executed | cancelled | not_applicable
```

## SIGMA Artifact Fields

```yaml
sigma_id: string
client_id: string
type: string
status: draft | active | superseded | archived
confidence: low | medium | high
usable_by: []
source_items: []
related_sigmas: []
related_client_artifacts: []
observations: []
relationships: []
preferences_or_state: []
created_at: datetime
updated_at: datetime
```

## Approval Request

An Approval Request presents a Client Artifact or external action for HITL decision.

Required for:

- money movement
- invoices/payments
- calendar commitments
- public-facing communications
- sensitive relationships
- external sends
- irreversible bookings/actions

Recommended approval fields:

```yaml
approval_request_id: string
client_id: string
artifact_id: string
workflow_run_id: string
decision_required: approve | revise | defer | handle_self
stakes:
  money: string | null
  time_sensitive: string | null
  public_facing: boolean
  irreversible: boolean
  high_stakes_relationship: boolean
status: pending | approved | revision_requested | deferred | handled_by_client | expired | cancelled
created_at: datetime
decided_at: datetime | null
```

## Approval Card Rules

Preserve from old UI intake:

- one canonical decision component
- artifact preview
- stakes chips
- optional impact/ripple note
- clear post-approve state
- plain-English reasoning

Change for FlavorOS 1.5 MVP:

- no chat/ask affordance on the card
- no voice-only command assumption
- no right-rail dependency
- no agent-internal metadata
- no PAC/PTQ/SIGMA vocabulary on client-facing cards

## Lifecycle

```text
workflow prepares work
-> creates SIGMA Artifacts as internal state where needed
-> creates Client Artifact for review/use
-> creates Approval Request if HITL is required
-> client approves, revises, defers, or handles directly
-> outbound action or filing occurs
-> Completion Summary records what happened
```

## Key Rule

If the client reads it directly, it is a Client Artifact.

If agents use it as structured memory/state, it is a SIGMA Artifact.
