# FlavorOS Docs

FlavorOS is a multi-tenant, multi-agent client operating system built around a visual-first Command Center, structured Briefings and Meetings, Client Artifacts, SIGMA/GBrain-backed internal state, and approval-led workflows.

## Canonical Doc Folders

| Folder | Purpose |
|---|---|
| `architecture/` | Core system architecture, Client Universe, data flow, artifacts, GBrain, SIGMA, Composio, repo structure |
| `agents/` | Three-agent MVP model, runtime contracts, persona pack rules |
| `workflows/` | Onboarding, workflow runtime, PAC/PTQ qualification |
| `runtime/` | Hostinger/VPS runtime direction and services/config model |
| `governance/` | HITL, permissions, tenant isolation, audit, secrets protocol |
| `ui/` | MVP UI architecture and future-state voice/chat layer |
| `planning/` | Non-canonical planning notes and MVP build notes |

## Architecture

| File | Purpose |
|---|---|
| `architecture/architecture_overview.md` | High-level system architecture and operating model |
| `architecture/multi_tenant_model.md` | Tenant/client structure, roles, and isolation model |
| `architecture/client_universe_model.md` | Definition of the Client Universe and client-scoped context |
| `architecture/client_profile_and_envelope_model.md` | Client profile, envelope, contexts, account aliases, and role separation |
| `architecture/artifact_model.md` | Client Artifact and SIGMA Artifact definitions |
| `architecture/readiness_artifact_contract.md` | Readiness artifacts as Client Artifact subtype |
| `architecture/gbrain_integration.md` | GBrain ingestion, memory, retrieval, and state maintenance |
| `architecture/sigma_model.md` | SIGMA records as internal GBrain-backed memory/state artifacts |
| `architecture/composio_integration.md` | Composio as the external provider access layer |
| `architecture/storage_data_flow_model.md` | Storage layers and provider-to-artifact data flow |
| `architecture/schema_model.md` | Schema plan extracted from old SQL intake |
| `architecture/normalization_model.md` | Provider normalization mapping model and shared target objects |
| `architecture/provider_ingest_api_model.md` | Provider ingest/API behavior model |
| `architecture/repo_structure.md` | Recommended root folder structure |

## Agents

| File | Purpose |
|---|---|
| `agents/agent_persona_model.md` | MVP agents, personas, and consolidation rules |
| `agents/agent_runtime_contracts.md` | Durable agent task/report envelopes and runtime status vocabulary |
| `agents/persona_packs_model.md` | Persona packs as non-agent tone/specialty layers |

## Workflows

| File | Purpose |
|---|---|
| `workflows/client_onboarding_model.md` | Client onboarding sequence, readiness, provider setup, and HITL defaults |
| `workflows/workflow_runtime_model.md` | Workflow, provider sweep, scheduler, runtime, and deployment model |
| `workflows/pac_ptq_model.md` | Pending Action Candidate and qualification model |
| `workflows/schedule_catalog.md` | Normalized schedule catalog mapped to three-agent ownership |

## Runtime

| File | Purpose |
|---|---|
| `runtime/hostinger_runtime_model.md` | Hostinger/VPS runtime direction with old voice/container assumptions marked future-state |
| `runtime/services_and_configs.md` | Meaning of services and configurations under this framework |

## Governance

| File | Purpose |
|---|---|
| `governance/governance_and_permissions.md` | Approval, permissions, tenant isolation, and audit rules |
| `governance/secrets_protocol.md` | Secrets and provider credential handling rules |

## UI

| File | Purpose |
|---|---|
| `ui/04-app-surfaces.md` | Command Center, Briefings, Meetings, and channel-specific surfaces |
| `ui/05-structured-interaction-surface.md` | Structured Briefing/Meeting interaction model |
| `ui/06-command-components.md` | Reusable command, approval, artifact, link, launch, summary, and status components |
| `ui/10-future-voice-and-chat-layer.md` | Future-state voice/chat/right-rail layer, explicitly not MVP canon |
