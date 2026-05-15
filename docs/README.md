# FlavorOS Framework

FlavorOS is a multi-tenant, multi-agent client operating system that gives each client a calm, unified command center while allowing the developer/admin role to monitor, configure, test, and improve the underlying system.

This framework memorializes the current architecture decisions for FlavorOS, including the multi-tenant model, Client Universe, agent/persona structure, GBrain memory layer, Composio integration layer, artifact model, services, configurations, and recommended repository structure.

## Core Thesis

FlavorOS is not organized around individual apps or disconnected accounts. It is organized around the client.

Each client has a **Client Universe**: a scoped, isolated operating context containing their profile, preferences, accounts, dimensions, relationships, projects, communications, calendar data, memory, context, artifacts, approvals, and agent-generated internal state.

The system uses:

- **Composio** for authorized access to external context providers.
- **GBrain** for ingestion, indexing, memory maintenance, retrieval, and context preparation.
- **Agents** for role-based execution.
- **Personas** for purpose, tone, and interaction mode.
- **Skills** for reusable capabilities.
- **Workflows** for repeatable procedures.
- **Artifacts** for agent work product.
- **Governance** for permissions, approvals, auditability, and tenant isolation.

## Documents in This Package

| File | Purpose |
|---|---|
| `architecture_overview.md` | High-level system architecture and operating model |
| `multi_tenant_model.md` | Tenant/client structure, roles, and isolation model |
| `client_universe_model.md` | Definition of the Client Universe and client-scoped context |
| `agent_persona_model.md` | MVP agents, personas, and responsibilities |
| `artifact_model.md` | Client Arts and SIGMA Arts definitions |
| `gbrain_integration.md` | How GBrain fits into ingestion, memory, retrieval, and state maintenance |
| `composio_integration.md` | How Composio functions as the external provider access layer |
| `repo_structure.md` | Recommended root folder structure |
| `services_and_configs.md` | Meaning of services and configurations under this framework |
| `governance_and_permissions.md` | Approval, permissions, tenant isolation, and audit rules |
| `mvp_build_notes.md` | MVP build priorities and implementation notes |
