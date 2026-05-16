# Artifact Model

## Definition

Agent work product is called an **Artifact**.

Artifacts are outputs created by agents, workflows, or skills. FlavorOS has two primary artifact classes at MVP:

1. **Client Artifacts**
2. **SIGMA Artifacts**

Use the clear product terms **Client Artifact** and **SIGMA Artifact** in docs and UI-facing copy.

## Core Rule

```text
If the client reads it directly, it is a Client Artifact.
If agents use it as structured memory/state, it is a SIGMA Artifact.
```

## 1. Client Artifacts

Client Artifacts are prepared work products made for approval, review, delivery, briefing, or direct use by the client.

Examples:

- communication drafts
- email replies
- text message drafts
- calendar proposals
- reports
- recommendations
- research summaries
- meeting briefs
- travel options
- itinerary drafts
- finance summaries
- approval packets
- project reports
- decision memos
- completion summaries

Client Artifacts can appear in:

- Command Center Dashboard
- Briefings
- Meetings
- Approval Cards
- Artifact Cards
- Completion Summaries

## Client Artifact Lifecycle

```text
Workflow prepares work
-> system attaches source context and rationale
-> Client Artifact is created
-> Approval Request is created if HITL is required
-> client approves, edits, defers, handles directly, or requests revision
-> approved artifact is used, sent, stored, or linked to project/context
-> Completion Summary records what happened
```

## 2. SIGMA Artifacts

SIGMA Artifacts are internal knowledge/state artifacts used by agents, workflows, GBrain, and future retrieval.

SIGMA Artifacts are not user-facing outputs. They help agents maintain state, coordinate workflows, prepare future actions, and improve future Client Artifacts.

Examples:

- validated preference/state object
- trip-instance state
- project-state object
- relationship state
- readiness context packet
- ripple/impact state
- workflow prep state
- memory update candidate
- schedule constraint map
- approval dependency map
- client preference delta

## SIGMA Artifact Lifecycle

```text
Provider/context event enters the system
-> workflow or agent detects durable internal state
-> SIGMA Artifact candidate is created
-> GBrain validates, indexes, or references it
-> future workflows retrieve it as context
-> it may be activated, superseded, archived, or exported as a projection
```

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
persona_used: string
workflow_id: string
workflow_run_id: string
source_context_ids: []
related_provider_event_ids: []
related_project_ids: []
related_artifact_ids: []
approval_required: boolean
created_at: datetime
updated_at: datetime
```

## Client Artifact Fields

```yaml
artifact_id: string
client_id: string
tenant_id: string
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
tenant_id: string
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

## Approval Requests

An Approval Request presents a Client Artifact or external action for HITL decision.

Approval is required for:

- money movement
- invoices and payments
- calendar commitments
- public-facing communications
- sensitive relationships
- external sends
- irreversible bookings/actions

Recommended approval fields:

```yaml
approval_request_id: string
client_id: string
tenant_id: string
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

Preserve the old UI doctrine that one canonical decision component handles client decisions.

Approval Cards should include:

- artifact preview
- stakes chips
- optional impact/ripple note
- plain-English reasoning
- clear post-approve state

Approval Cards should not include:

- chat/ask affordance
- voice-only command assumption
- right-rail dependency
- agent-internal metadata
- PAC/PTQ/SIGMA vocabulary in client-facing copy

## Client Artifacts vs SIGMA Artifacts

| Category | Audience | Purpose | Examples |
|---|---|---|---|
| Client Artifact | Client | Approval/use | Drafts, reports, recommendations, completion summaries |
| SIGMA Artifact | Agents/system | Internal state and coordination | State objects, dependencies, context records, preference deltas |
