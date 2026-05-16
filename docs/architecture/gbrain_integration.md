# GBrain Integration

## Definition

GBrain is the ingestion, indexing, memory maintenance, retrieval, context preparation, and SIGMA state subsystem for FlavorOS.

GBrain should be treated as core memory/context infrastructure, not as an individual agent.

## Role in FlavorOS

GBrain supports the Client Universe by maintaining:

- memory,
- context,
- knowledge base/wiki,
- retrieval records,
- source indexes,
- relationship context,
- project context,
- SIGMA-related internal state,
- client-specific operating knowledge.

## What GBrain Is

```text
GBrain = memory, retrieval, and internal state infrastructure
```

GBrain ingests data, indexes it, retrieves it, summarizes it, deduplicates it, classifies it, and helps maintain durable client memory.

GBrain also owns the durable SIGMA layer. Obsidian/vault projections may remain useful for review or export, but they are not the permanent source of truth.

## What GBrain Is Not

GBrain is not the conductor.

Khadijah remains the conductor/orchestration agent.

```text
Khadijah decides what needs to happen.
GBrain supplies the memory/context that makes that decision intelligent.
```

GBrain is also not a client-facing artifact browser. Client UI should surface Client Artifacts and plain-English summaries, not raw SIGMA internals.

## Relationship to Client Universe

```text
Client Universe = conceptual and database model of client state
GBrain = engine that ingests, indexes, retrieves, and maintains that state
```

## Relationship to Composio

```text
Composio = authorized access to provider data
GBrain = ingestion and memory intelligence
Client Universe = normalized client state
Agents = reasoning and execution layer
```

## Relationship to SIGMA

```text
SIGMA = structured internal memory/state artifact
GBrain = system that validates, stores, indexes, retrieves, and updates SIGMA state
```

SIGMA Artifacts are internal agent-used artifacts. They should not be exposed directly to normal client UI.

See `sigma_model.md` for the SIGMA record model.

## Recommended Folder Placement

```text
subsystems/
└── gbrain/
    ├── ingest/
    ├── classify/
    ├── index/
    ├── retrieve/
    ├── summarize/
    ├── deduplicate/
    ├── memory_update/
    ├── context_builder/
    ├── sigma/
    ├── adapters/
    ├── schemas/
    └── api/
```

## Data Flow

```text
Composio retrieves/streams authorized provider data
-> GBrain ingests and normalizes the data
-> GBrain classifies, indexes, summarizes, and deduplicates
-> GBrain updates memory/context/knowledge candidates
-> Client Universe records are written/updated
-> SIGMA candidates are created or updated where needed
-> Agents retrieve relevant state through GBrain/API
-> workflows create Client Artifacts, approvals, and completion summaries
```

## GBrain Responsibilities

- ingest external context,
- classify records,
- index records,
- maintain memory,
- retrieve relevant context,
- summarize long records,
- deduplicate information,
- create memory update candidates,
- support SIGMA Artifact generation,
- validate SIGMA candidates,
- expose retrieval APIs,
- build context packets for workflows,
- maintain client-specific isolation.

## GBrain Integration Points

GBrain should provide:

- ingest API
- retrieval API for workflows
- context packet builder
- SIGMA create/update API
- validation hooks
- provenance tracking
- export/projection support

## Example Config

```yaml
gbrain:
  enabled: true
  responsibilities:
    - ingest
    - classify
    - index
    - retrieve
    - summarize
    - deduplicate
    - maintain_memory
    - update_context
    - generate_sigma_inputs
    - validate_sigma

  tenant_scoping:
    required: true
    key: client_id

  sources:
    - composio
    - artifacts
    - agent_outputs
    - user_notes
    - uploaded_files

  outputs:
    - memory_records
    - context_records
    - knowledge_entries
    - sigma_candidates
    - retrieval_results
    - context_packets

  approval_required_for:
    - deleting_memory
    - overwriting_core_user_facts
    - sharing_private_context
```
