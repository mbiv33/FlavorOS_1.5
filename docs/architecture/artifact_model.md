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

## `draft_email` Client Artifact + Approval projection

Email reply drafts are the canonical Communications HITL artifact. The API stores them as `artifacts` rows with `kind=client` and `meta.artifact_type=draft_email`. When outbound send requires approval, a linked `approvals` row uses `governed_action=send_communication_draft`.

### Meta shape (authoritative)

```yaml
artifact_type: draft_email
channel: email                    # drives Communications pile → emails
to: string
subject: string
body: string                      # optional; may also live on artifact.body
status: draft | ready             # API artifact.status; see mapping below
preview:                          # optional; projected to Approval Card
  inbound_summary: string | null  # plain-English inbound context (1–2 sentences)
  body: string | null             # full draft body for expanded preview
  body_excerpt: string | null     # compact excerpt when body omitted
  to: string | null               # override display to (defaults to meta.to)
  subject: string | null          # override display subject (defaults to meta.subject)
  rows:                           # compact label/value rows (To, Subject, …)
    - label: string
      value: string
source_links:                     # Link Card below decision row (docs/ui/06-command-components.md)
  - label: string                 # e.g. "Gmail thread"
    url: string | null            # provider deep link when available
thread_id: string | null          # fallback source link label → "Gmail thread"
message_id: string | null
stakes:                           # optional map → Approval stakes chips
  public_facing: boolean | string
  irreversible: boolean | string
  time_sensitive: string | null
```

Runtime references: `services/api/app/workflows/communications_outbound.py`, `services/api/app/seed.py`, legacy mock ` _migration/intake/old_ui/app_web/lib/mock/approvals.ts`.

### Status mapping (canon vs API)

| Product canon | API `artifacts.status` | Approval Card chip |
|---|---|---|
| Draft ready for review | `ready` | Ready to approve |
| Work in progress | `draft` | Draft ready |
| Approved / sent path | `approved` | Completed / Sent (via outbound) |

Seed and sync processors may create `ready` drafts immediately after Sinclair prepares the reply.

### Approval projection fields

`GET /approvals` (and decide responses) enrich pending rows when `artifact_id` points at a `draft_email`:

| API field | Source |
|---|---|
| `preview` | `meta.preview` merged with `meta.to` / `meta.subject` / `artifact.body` |
| `stakes` | `meta.stakes` or default communication chips |
| `source_link_label` | first `source_links[].label` or thread/message fallback |

UI maps these to Approval Card / pile list: preview block (inbound summary, rows, body excerpt), stakes chips, source link, and decision row (`Approve`, `Modify`, `I'll do myself`, optional `Defer`). See `docs/ui/06-command-components.md` and `apps/flavoros/src/components/ApprovalCard.tsx`.

Communications pile routing uses `meta.channel` (`email` → Emails pile). Inbound-only rows come from `GET /providers/normalized-items?item_type=email` (see `docs/ui/14-channel-surfaces.md`).

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
approval_batch_id: string | null   # groups N similar approvals produced by one workflow run / agent task
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

### Batch grouping

`approval_batch_id` is optional and groups multiple Approval Requests that the UI can render as one batch Approval Card (per `docs/ui/03-approval-card.md` §Bulk). When omitted, the request stands alone. Batches are created by the producing workflow run; clients still decide per-item unless the surface explicitly offers an "Approve all" affordance.

## Approval Decisions

Each terminal decision on an Approval Request produces an `approval_decisions` row. This preserves the audit trail and captures any structured revision request from the Modify flow.

Recommended decision fields:

```yaml
approval_decision_id: string
approval_request_id: string
client_id: string
tenant_id: string
decision: approve | revise | defer | handle_self
decided_at: datetime
decided_by_user_id: string
revision_request:                  # populated only when decision = revise
  tone: [warmer | more_professional | ...]      # multi-select, may be empty
  format: [narrative | outline | ...]            # multi-select, may be empty
  sender_request: [clarity | additional_details | ...]  # multi-select, may be empty
  notes: string | null                           # optional, currently unused — structured-only per UI spec
post_decision_status: string       # mirrors the resulting approval_requests.status
notes: string | null
```

### Revision Request

The `revision_request` payload mirrors the three-axis structured subform in `docs/ui/03-approval-card.md` §Modify subform. Axes are open vocabularies (config-driven per workflow), but the schema fixes the three-axis shape so revision intent survives the round trip from UI to the rework `agent_task`.

A `revise` decision implies:

- the linked `client_artifacts.status` transitions to `revised` (in flight),
- a new `agent_task` is enqueued with `revision_request` as input,
- the resulting follow-up Client Artifact is linked back via `related_artifact_ids` and produces a fresh Approval Request marked as the next version.

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
