# FlavorOS Architecture Overview

## Definition

FlavorOS is a **multi-tenant client operating system** powered by a coordinated multi-agent architecture.

The system is designed to help clients manage communication, scheduling, research, logistics, project management, finances, relationships, household/lifestyle needs, and work product through a calm unified interface.

The app has two primary roles:

1. **Client/User** — the person using FlavorOS to benefit from the operating system.
2. **Developer/Admin** — the operator role used to configure, test, monitor, and improve the system.

The client and admin UI should share the same general design language, but admin will have additional diagnostic, configuration, monitoring, and developer widgets.

## Core System Flow

```text
Client connects external accounts/providers
        ↓
Composio provides authorized access to external systems
        ↓
GBrain ingests, classifies, indexes, retrieves, and maintains memory/context
        ↓
Client Universe is updated in FlavorOS database
        ↓
Agents query Client Universe/GBrain for state and context
        ↓
Agents execute workflows through shared skills
        ↓
Artifacts are created for client approval/use or internal agent use
        ↓
Client receives briefings, meetings, reports, recommendations, drafts, and approvals
```

## Primary Layers

```text
Apps/UI Layer
Services Layer
Orchestration Layer
Agent Layer
Persona Layer
Workflow Layer
Skill Layer
Client Universe / State Layer
GBrain Memory Layer
Composio Integration Layer
Governance Layer
Runtime / Deployment Layer
```

## Design Principle

The functional model is a product vision diagram, not a literal app architecture.

It communicates what FlavorOS is trying to unify, but the technical system should separate:

- external providers,
- client-scoped data,
- memory/context,
- agents,
- personas,
- workflows,
- skills,
- services,
- UI surfaces,
- and governance.

## Conceptual Map

```text
External Accounts / Context Providers
        ↓
Composio Access Layer
        ↓
GBrain Ingestion + Memory Maintenance
        ↓
Client Universe
        ↓
Orchestrator
        ↓
Agents + Personas + Skills + Workflows
        ↓
Client/Admin App Surfaces
        ↓
Artifacts, Approvals, Actions, Updates
```

## System Objects

| Object | Meaning |
|---|---|
| Client | A tenant/customer using FlavorOS |
| Client Universe | The client-scoped operating context |
| Agent | A role-based actor that performs work |
| Persona | A purpose, tone, or modality used by an agent |
| Skill | A reusable capability available to agents |
| Workflow | A repeatable procedure or sequence |
| Artifact | Agent work product |
| Client Art | Client-facing artifact for approval or use |
| SIGMA Art | Internal artifact/state for agent use |
| GBrain | Ingestion, memory, retrieval, and context engine |
| Composio | External provider access and action layer |
| Services | Running software components |
| Configurations | Declarative settings and behavior rules |
| Governance | Permissions, approvals, isolation, and auditability |
