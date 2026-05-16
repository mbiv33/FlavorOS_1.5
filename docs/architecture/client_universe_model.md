# Client Universe Model

## Definition

The **Client Universe** is the client-scoped operating context that contains everything FlavorOS knows, prepares, retrieves, and acts upon for one client.

It is the center of the FlavorOS system.

Agents do not own client context. Agents request, update, and act against the Client Universe through approved services, GBrain, workflows, and governance rules.

## Contents

A Client Universe may include:

- client profile,
- preferences,
- connected accounts,
- life/work dimensions,
- relationships,
- projects,
- tasks,
- calendar context,
- communication history,
- documents,
- artifacts,
- memory,
- knowledge base,
- current context,
- SIGMA states,
- approvals,
- agent activity,
- workflow history,
- provider sync status,
- audit records.

## Dimensions

Dimensions are labels or partitions inside a client’s universe.

MVP dimensions may include:

```text
W2 Work
LLC Work
Career
Personal
```

These should be treated as metadata, not separate app modules.

Example object:

```json
{
  "client_id": "client_123",
  "object_type": "calendar_event",
  "title": "Call with accountant",
  "dimension": "llc_work",
  "source_provider": "google_calendar",
  "related_project": "tax_planning",
  "agent_visibility": ["khadijah", "kyle"],
  "approval_required": false
}
```

## Universe Components

### Profile

Stable information about the client:

- name,
- role,
- communication preferences,
- work style,
- household preferences,
- recurring obligations,
- important relationships,
- goals,
- constraints.

### Context

Current, near-term, and situational information:

- today’s schedule,
- active projects,
- pending approvals,
- recent communications,
- open dependencies,
- deadlines,
- travel plans,
- bottlenecks.

### Memory

Longer-term retained information:

- preferences,
- decisions,
- recurring patterns,
- relationship notes,
- historical project context,
- prior approvals,
- client-specific operating rules.

### Knowledge Base / Wiki

Structured reference information:

- client documents,
- SOPs,
- resources,
- templates,
- FAQs,
- project notes,
- research notes.

### SIGMA

Internal state/work product created or updated for agent use.

Examples:

- workflow prep state,
- task dependencies,
- YAML configuration docs,
- project state summaries,
- context packets,
- retrieval plans,
- agent handoff notes.

### Artifacts

Work product produced by agents.

Artifacts are divided into:

1. Client Artifacts
2. SIGMA Artifacts

See `artifact_model.md`.

## System Rule

```text
Agents query the Client Universe.
Agents do not become the Client Universe.
```

This prevents fragmented memory across Khadijah, Sinclair, and Regine. Earlier names such as Maxine, Kyle, Scooter, and Overton may remain as persona or skill lineage, but they are not separate MVP memory owners.
