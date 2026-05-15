# GBrain Integration

## Definition

GBrain is the ingestion, indexing, memory maintenance, retrieval, and context preparation subsystem for FlavorOS.

GBrain should be treated as a core subsystem repo, not as an individual agent.

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
GBrain = memory and context infrastructure
```

GBrain ingests data, indexes it, retrieves it, summarizes it, deduplicates it, classifies it, and helps maintain durable client memory.

## What GBrain Is Not

GBrain is not the conductor.

Khadijah remains the conductor/orchestration agent.

```text
Khadijah decides what needs to happen.
GBrain supplies the memory/context that makes that decision intelligent.
```

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
    ├── adapters/
    ├── schemas/
    └── api/
```

## Data Flow

```text
Composio retrieves/streams authorized provider data
        ↓
GBrain ingests and normalizes the data
        ↓
GBrain classifies, indexes, summarizes, and deduplicates
        ↓
GBrain updates memory/context/knowledge candidates
        ↓
Client Universe records are written/updated
        ↓
Agents retrieve relevant state through GBrain/API
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
- support SIGMA Art generation,
- expose retrieval APIs,
- maintain client-specific isolation.

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

  approval_required_for:
    - deleting_memory
    - overwriting_core_user_facts
    - sharing_private_context
```
