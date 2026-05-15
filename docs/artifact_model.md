# Artifact Model

## Definition

Agent work product is called an **Artifact**.

Artifacts are outputs created by agents, workflows, or skills.

FlavorOS has two main artifact classes at MVP:

1. **Client Arts**
2. **SIGMA Arts**

## 1. Client Arts

**Client Arts** are artifacts created for approval, review, delivery, or direct use by the client.

These are user-facing or client-facing outputs.

Examples:

- communication drafts,
- email replies,
- text message drafts,
- reports,
- recommendations,
- responses,
- research summaries,
- meeting briefs,
- travel options,
- itinerary drafts,
- finance summaries,
- approval packets,
- project reports,
- work product documents,
- decision memos,
- social media drafts,
- household/lifestyle recommendations.

## Client Art Lifecycle

```text
Agent prepares Client Art
        ↓
System attaches source context and rationale
        ↓
Client reviews
        ↓
Client approves, edits, rejects, or requests revision
        ↓
Approved artifact is used, sent, stored, or linked to project/context
```

## 2. SIGMA Arts

**SIGMA Arts** are artifacts created or updated for agent/system use.

These are internal work products that help agents maintain state, coordinate workflows, prepare future actions, and improve future artifacts.

SIGMA Arts are not primarily user-facing.

Examples:

- state objects,
- YAML documents,
- workflow prep packets,
- task dependencies,
- context summaries,
- agent handoff notes,
- memory update candidates,
- project state records,
- retrieval plans,
- schedule constraint maps,
- approval dependency maps,
- persona operating notes,
- internal research notes,
- briefing prep state,
- client preference deltas.

## SIGMA Art Lifecycle

```text
Agent/workflow detects need for internal state
        ↓
SIGMA Art is created or updated
        ↓
GBrain may index or reference it
        ↓
Future agents/workflows use it as context
        ↓
It may be promoted, archived, revised, or superseded
```

## Artifact Fields

Recommended common fields:

```yaml
artifact_id: string
client_id: string
artifact_type: client_art | sigma_art
title: string
status: draft | pending_review | approved | rejected | archived | superseded
created_by_agent: string
persona_used: string
workflow_id: string
dimension: w2_work | llc_work | career | personal | other
source_context_ids: []
related_project_ids: []
approval_required: boolean
visibility: client | admin | agent_internal
created_at: datetime
updated_at: datetime
```

## Key Rule

```text
All agent work product is an Artifact.
Client-facing work product is a Client Art.
Internal state/work product is a SIGMA Art.
```

## Client Arts vs SIGMA Arts

| Category | Audience | Purpose | Examples |
|---|---|---|---|
| Client Art | Client | Approval/use | Drafts, reports, recommendations |
| SIGMA Art | Agents/system | Internal state and coordination | YAML, dependencies, state packets, context records |
