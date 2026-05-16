# SIGMA Model

This document defines the FlavorOS 1.5 SIGMA model. It preserves useful SIGMA concepts from earlier architecture work while applying the current decision that GBrain is the memory, persistent state, and SIGMA layer. Obsidian is not the permanent source of truth.

## Core Decision

GBrain owns persistent memory, retrieval, indexing, and SIGMA state.

SIGMA artifacts remain valuable, but FlavorOS 1.5 should not rely on Obsidian/vault markdown as the permanent source of truth.

## Definitions

### GBrain

GBrain is the memory and retrieval subsystem.

Responsibilities:

- ingest provider/context data
- index client-scoped information
- retrieve relevant context for workflows
- maintain memory/state
- support SIGMA artifact creation/update
- provide context packets for agents and UI workflows

### SIGMA Artifact

SIGMA means Structured Intelligence Graph Memory Artifact.

A SIGMA Artifact is internal structured state used by agents and workflows.

SIGMAs are:

- client-scoped
- typed
- validated
- versioned or superseded
- usable by allowed agents/workflows
- hidden from normal client UI

SIGMAs are not:

- user-facing reports
- free-form notes
- raw logs
- chat transcripts
- Obsidian-only files

## MVP Storage Direction

Preferred source of truth:

- database/GBrain-managed state for canonical SIGMA records
- derived markdown/JSON projections only where useful for review or tooling

Old vault-style markdown remains useful as:

- schema example
- template inspiration
- readable export format
- migration reference

It should not remain the canonical persistence layer.

## Recommended SIGMA Record Shape

```yaml
sigma_id: string
client_id: string
tenant_id: string
type: string
status: draft | active | superseded | archived
confidence: low | medium | high
created_by: khadijah | sinclair | regine | system
usable_by: []
source_items: []
related_sigmas: []
related_client_artifacts: []
observations: []
relationships: []
state: object
created_at: datetime
updated_at: datetime
superseded_by: string | null
```

## SIGMA Type Candidates

Candidate types from old intake, updated for three-agent MVP:

| Type | Scope | Primary owner | Purpose |
|---|---|---|---|
| `trip-instance` | instance | Regine | State for one trip or logistics workflow |
| `travel-preferences` | long-term | Regine | Travel preferences and learned constraints |
| `destination-intelligence` | long-term | Regine | Accumulated destination context |
| `vendor-intelligence` | long-term | Regine | Provider/vendor preferences and history |
| `ripple` | instance | Khadijah | Downstream impact synthesis |
| `meeting-instance` | instance | Sinclair | State for a meeting/prep workflow |
| `relationship` | long-term | Regine | Relationship/contact context |
| `project-state` | long-term | Khadijah | Current project/workstream state |
| `wellness-baseline` | long-term | Sinclair | Wellness/rhythm preferences and signals |

## Lifecycle

```text
provider/context event
-> normalized item
-> workflow run
-> agent analysis
-> SIGMA candidate
-> validation
-> active SIGMA state in GBrain/database
-> retrieval/context packet
-> Client Artifact or workflow command
```

## Validation Rules

A SIGMA candidate should validate:

- required fields present
- client/tenant scoped
- known type
- known owner/creator
- permitted status
- confidence set
- usable_by references known agents/workflows
- source items link to provider events, normalized items, artifacts, or other SIGMAs
- append-only sections are not silently rewritten
- superseded records link to replacement records

## Mutation Rules

Identity fields should be immutable after activation:

- `sigma_id`
- `client_id`
- `tenant_id`
- `created_at`
- `created_by`

State fields may update through governed workflow writes.

Observation and decision sections should be append-only.

Long-term SIGMAs may be superseded when a consolidated version replaces them.

## GBrain Integration Points

GBrain should provide:

- SIGMA create/update API
- retrieval API for workflows
- context packet builder
- index/search over client-scoped records
- validation hooks
- provenance tracking
- export/projection support

## Relationship To Client Artifacts

SIGMAs feed Client Artifacts, but are not shown directly to clients.

Example:

```text
travel provider data + prior decisions
-> Regine updates trip-instance SIGMA
-> GBrain retrieves travel preferences
-> workflow creates Travel Option Artifact
-> client approves/defer/revises through UI
```

## Migration Treatment

Preserve:

- type catalog
- lifecycle states
- immutable/state/append-only distinction
- validation rules
- readiness artifact distinction
- ripple synthesis idea

Rewrite:

- vault-first storage
- Obsidian plugin assumptions
- old five-agent ownership
- scripts as required runtime path

Archive/reference:

- old markdown templates as examples
- old Python SIGMA CLI as design reference
