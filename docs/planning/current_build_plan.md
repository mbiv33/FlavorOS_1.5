# Current Build Plan

**Last updated:** 2026-05-22 EDT

## Purpose

This is the single canonical development plan for FlavorOS 1.5.

Supporting docs may define architecture, workflows, UI, agents, schemas, runtime, governance, and retained future features, but this file controls current build direction and priority order.

## Product Direction

FlavorOS is a calm, unified client command center powered by a small multi-agent operating system.

The MVP should prove that FlavorOS can show the client's operating picture clearly, store and normalize the right data, connect the first providers safely, onboard a client into a governed Client Universe, route work through agents, create artifacts and approvals, and execute approved write-back without losing source context.

The MVP is not trying to build every future capability. It should establish the substrate that future capabilities can plug into without becoming a tangle.

## Canonical Priority Order

Build in this order:

1. Visualization and surfaces
2. Database and storage
3. Integrations
4. Onboarding
5. Provider ingestion
6. Agent workflows

Everything else comes later unless explicitly promoted.

## MVP Proof Loop

The MVP must prove this loop:

1. The app renders useful client and admin surfaces.
2. Client, provider, workflow, artifact, approval, and audit state can be stored durably.
3. Google Workspace and supporting integrations can connect through approved boundaries.
4. A client can be onboarded into a governed Client Universe.
5. Provider events can be captured, normalized, and routed.
6. Agents can turn normalized items into workflow runs, artifacts, approvals, and completion summaries.
7. Approved actions can be written back to the correct origin system in a channel-correct, audit-safe way.

Outbound sync/write-back is part of the MVP proof loop, but it must always be approval-gated and channel-correct.

## MVP Agents

The three-agent model is MVP canon.

| Agent | MVP role | Primary scope |
|---|---|---|
| Khadijah | Conductor Agent | Orchestration, approval control, projects, operations, finance oversight |
| Sinclair | Communications Agent | Email, calendar, provider-private boundaries, executive assistant behavior, wellness/goodnight support |
| Regine | Research & Logistics Agent | Research, travel/logistics, relationships, contacts, lifestyle, social context |

Retired names such as Maxine, Scooter, Kyle, and Overton may remain as persona or skill lineage. They are not standalone MVP agent owners.

## Provider Scope

MVP provider tiers:

| Tier | Providers | Build treatment |
|---|---|---|
| 1 | Google Workspace: Gmail, Google Calendar, Docs, Sheets, Slides | First-class MVP provider target |
| 2 | Project management, contacts, files, selected social DMs | Supporting MVP targets after tier 1 foundations are stable |
| 3 | Finance and Twilio | Future or adjacent unless explicitly promoted |

Composio is the preferred provider access layer where it fits. Provider access is not canonical data truth; normalized FlavorOS records, Client Universe, artifacts, approvals, and audit records are the system's durable operating truth.

## MVP Surfaces

Visualization and surfaces come first because FlavorOS needs to be legible as software.

Client-facing MVP surfaces:

- Command Center
- Briefings
- Meetings
- Comms & Calendar
- Projects
- Reports & Artifacts
- Travel / Logistics
- Settings / Profile

Admin/operator MVP surfaces:

- Tenant monitor
- Provider sync status
- Workflow monitor
- Agent monitor
- GBrain ingestion status
- Artifact queue
- Approval queue
- Logs
- Config editor

Briefings are both UI surfaces and workflow/storage frameworks. For build purposes, Morning Standup, COB Work Day, and Goodnight should be treated as workflows backed by durable state, artifacts, approvals, and Client Universe/GBrain context. The UI should display that state clearly rather than acting as a decorative launcher.

## Build Phases

### Phase 1: Visualization And Surfaces

Goal: make FlavorOS visible and navigable as a client command center and operator console.

Required outcomes:

- client app surfaces exist and match the MVP IA,
- admin app surfaces expose provider/workflow/artifact/approval status,
- briefing and meeting surfaces show stateful workflow data,
- UI does not expose agent internals, PAC/PTQ jargon, raw SIGMA vocabulary, or provider traces to the client.

Current status: partial.

### Phase 2: Database And Storage

Goal: make the core operating state durable before deeper automation.

Required outcomes:

- tenant/client/user foundation,
- Client Universe records,
- provider connection records,
- provider event and normalized item model,
- workflow runs and agent task records,
- Client Artifact and SIGMA Artifact records,
- approval and outbound action records,
- audit events,
- clear update rules and retention boundaries.

Current status: partial.

Canonical supporting docs:

- `docs/architecture/storage_data_flow_model.md`
- `docs/architecture/schema_model.md`
- `docs/architecture/client_universe_model.md`
- `docs/architecture/artifact_model.md`
- `docs/agents/agent_runtime_contracts.md`

### Phase 3: Integrations

Goal: establish safe adapter boundaries before connecting live providers.

Required outcomes:

- Composio/provider adapter boundary,
- GBrain adapter boundary,
- orchestrator adapter boundary,
- secrets and OAuth handling rules,
- provider readiness and sync health surfaced to admin/client where appropriate.

Current status: partial.

Canonical supporting docs:

- `docs/architecture/integration_boundaries.md`
- `docs/architecture/composio_integration.md`
- `docs/architecture/gbrain_integration.md`
- `docs/governance/secrets_protocol.md`

### Phase 4: Onboarding

Goal: create a governed Client Universe for one client without confusing client identity, operator/admin authority, provider accounts, or OAuth connections.

Required outcomes:

- client profile and envelope creation,
- client contexts,
- context accounts and account aliases,
- OAuth connection metadata references,
- authority/HITL defaults,
- provider expectations,
- onboarding status and sync readiness,
- initial workflow lanes.

Current status: deployed. Sequential 4-step wizard (identity → contexts → connect accounts → ready) with progress bar. Server-side state hydration. Known connect-advance bug in step 3.

### Phase 5: Provider Ingestion

Goal: capture real provider events and normalize them into FlavorOS-native records.

Required outcomes:

- Google Workspace ingestion path first,
- raw provider events preserved,
- normalized items created with source identifiers,
- dedupe and idempotency behavior,
- Communication Sweep routing,
- source-linked artifacts, approvals, and workflow runs.

Current status: provider models/adapters exist; end-to-end ingestion is not complete.

### Phase 6: Agent Workflows

Goal: route normalized work through Khadijah, Sinclair, and Regine using durable workflow runs and reusable skills.

Required outcomes:

- basic orchestrator beyond stub behavior,
- workflow run lifecycle,
- agent task/report envelopes,
- artifact generation,
- approval packet generation,
- completion summaries,
- outbound action staging.

Current status: skills/protocols are strong; runtime execution remains partial.

### Phase 8: Client DNA Adoption (post-MVP enrichment)

Goal: after governed onboarding, backfill historical provider context and promote verified relationship DNA into Client Universe and GBrain.

Required outcomes:

- account sweeps by time window (60/180/360/prior years), starting with 180d Gmail + Calendar,
- four-domain client DNA parsing (contacts, locations, entities, projects),
- GBrain synthesis and SIGMA `client_dna` drafts,
- DNA-specific HITL verify and 3× unverified purge/cross-reference,
- `client_dna_adoption` promotion only after acceptance.

Current status: **Phase 8 docs complete** (workflow model + build plan + open storage decision table). Implementation tracked in lanes W–Z ([`client_dna_adoption_build_plan.md`](./client_dna_adoption_build_plan.md)); **human must pick** relational vs GBrain-only vs hybrid before Lane X code.

**Does not block:** merge/hardening lanes R, S, T, V. Onboarding (Phase 4) completes before sweeps per product rule.

## Retained But Not First Proof Loop

These areas remain canonical and should be preserved in repo docs, skills, schemas, or feature catalog rows, but they are not the first proof loop unless explicitly promoted:

- Travel / Logistics as an MVP surface and future-capable workflow lane
- Finance as schema/skill-ready foundation
- finance connector execution
- synthetic finance fixtures and ledger simulations
- Twilio
- voice front door
- persistent chat/right rail
- automated PM/ClickUp sync
- live transcript workflows

Travel / Logistics should stay visible in the app and planned workflow catalog, but the first proof loop should not depend on it unless needed for a demo.

Finance foundation means model, boundaries, skills, schemas, and approval posture. Connector-backed execution and simulations are post-MVP unless promoted.

## Canon Order

| Rank | Document set | Role |
|---|---|---|
| 1 | `docs/planning/current_build_plan.md` | Single canonical development plan and priority order |
| 2 | `docs/architecture/`, `docs/workflows/`, `docs/agents/`, `docs/ui/`, `docs/governance/`, `docs/runtime/` | Canonical system specs |
| 3 | `docs/workflows/planned_feature_catalog.md` | Retained MVP and future feature catalog |
| 4 | `docs/planning/feature_migration_inventory.md` | Migration/status tracker |
| 5 | `docs/planning/mvp_build_notes.md` | Supporting context only |

## Non-Negotiables

- Tenant isolation from the start.
- Every meaningful object is scoped to `client_id`.
- Client context lives in Client Universe.
- Agents do not own memory.
- Composio provides access, not canonical data truth.
- GBrain maintains memory/context.
- Agent work product is an Artifact.
- Client Artifacts and SIGMA Artifacts are distinct.
- HITL gates governed external side effects.
- Outbound write-back is approval-gated and channel-correct.
- Client UI remains calm, unified, and artifact-first.
