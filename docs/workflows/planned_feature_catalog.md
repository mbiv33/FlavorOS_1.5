# Planned Feature Catalog

## Purpose

This catalog preserves planned FlavorOS functionality inside the new repo, including features that are future-state or not in the MVP slice.

It is not a promise that every item is implemented now. It is the canonical feature ledger that keeps retained functionality visible in this repo.

## Canonical Priority

Current build priority is defined in `docs/planning/current_build_plan.md`.

This catalog answers a different question: what functionality must remain represented in the repo so it can be implemented, deferred, merged, or replaced deliberately?

Build priorities are:

1. visualization and surfaces,
2. database and storage,
3. integrations,
4. onboarding,
5. provider ingestion,
6. agent workflows.

## Status Vocabulary

| Status | Meaning |
|---|---|
| `implemented` | Real code or UI exists and is wired enough to count as product/runtime behavior |
| `partial` | Some code, docs, UI, skill, or protocol coverage exists, but the feature is not end-to-end |
| `canonical_doc` | Repo docs/specs define the feature, but implementation is deferred |
| `skill_protocol_only` | Agent skill/protocol coverage exists, but there is no first-class runtime implementation |
| `missing_implementation` | The repo now captures the feature intent, but runtime/app implementation is missing |
| `replaced` | Older concept has been intentionally absorbed into a newer canonical model |

## MVP Operating Loop

| Capability | Status | Canonical direction |
|---|---|---|
| Provider event ingestion | `partial` | Capture raw provider events, starting with Google Workspace, before agent processing |
| Durable raw storage | `canonical_doc` | Store raw provider payload references and normalized records before workflow routing |
| Normalization layer | `canonical_doc` | Convert provider-native records into FlavorOS-native normalized items with source identifiers |
| Agent work routing | `partial` | Create durable workflow runs and agent tasks from normalized items |
| Artifact creation | `partial` | Create Client Artifacts and SIGMA Artifacts linked to workflow runs and source refs |
| Approval packet flow | `partial` | Require Approval Requests before governed external side effects |
| Outbound write-back | `missing_implementation` | Stage or execute approved replies, drafts, proposals, and updates back to origin systems |
| Client app visibility | `implemented` | Client shell exposes Command Center, Briefings, Meetings, Comms, Projects, Reports, Travel, and Settings |
| Admin/operator visibility | `implemented` | Admin shell exposes tenant, agent, provider, workflow, artifact, approval, logs, and config surfaces |

## Provider Tiers

| Tier | Providers | Catalog treatment |
|---|---|---|
| 1 | Google Workspace: Gmail, Google Calendar, Docs, Sheets, Slides | First-class MVP target |
| 2 | Project management, contacts, files, selected social DMs | Supporting MVP targets after tier 1 foundations are stable |
| 3 | Finance and Twilio | Future or adjacent unless explicitly promoted |

## Onboarding And Client Universe

| Feature | Status | Canonical direction |
|---|---|---|
| Client onboarding | `canonical_doc` | Guided app flow creates a governed Client Universe for one tenant/client |
| Client envelope files | `partial` | Human-readable repo fixtures live under `client_universe/clients/<client_id>/` |
| Context accounts | `partial` | Provider account aliases attach to client contexts without storing secrets |
| OAuth connection metadata | `partial` | Consent/grant metadata is tracked separately from secret material |
| Relationship discovery onboarding | `missing_implementation` | Future onboarding step extracts contacts and recent participants, validates them, and initializes relationship memory in Client Universe/GBrain |
| Client DNA Adoption Flow | `canonical_doc` | Post-onboarding historical sweeps (60/180/360/prior years), four-domain parse (contacts/locations/entities/projects), GBrain synthesis, SIGMA `client_dna`, HITL verify, 3× unverified purge, adoption into Client Universe/GBrain. See [`client_dna_adoption_model.md`](./client_dna_adoption_model.md) and [`../planning/client_dna_adoption_build_plan.md`](../planning/client_dna_adoption_build_plan.md). Parallel lanes W–Z; does not block R/S/T/V. |

## Communication And Scheduling

| Feature | Status | Canonical direction |
|---|---|---|
| Communication Sweep | `canonical_doc` | Generalizes old inbox/Gmail sync into provider sweep, normalization, classification, Client Universe update, workflow runs, artifacts, and approvals |
| Inbound Communications and Draft Response | `skill_protocol_only` | Read inbound communications, triage urgency/actionability, summarize threads, generate draft responses, and stage approval-safe actions |
| Meeting Lifecycle and Time Guarding | `skill_protocol_only` | Detect scheduling intent, protect focus blocks, coordinate availability, create booking artifacts, and trigger meeting prep |
| Information Diet and Boundary Defense | `skill_protocol_only` | Detect protected windows, hold incoming items, manage interruption queues, and release synthesized briefs with escalation policy |
| Calendar Lookahead | `canonical_doc` | Scheduled provider workflow scans upcoming calendar context for prep, conflict, and decision needs |

## Briefings

| Feature | Status | Canonical direction |
|---|---|---|
| Morning Standup | `canonical_doc` | Briefing workflow and UI surface that displays priorities, schedule, communications, approvals, dependencies, and agent work state |
| COB Work Day | `canonical_doc` | Briefing workflow and UI surface that closes the workday, reviews completion, surfaces unfinished items, and prepares evening awareness |
| Goodnight | `canonical_doc` | Briefing workflow and UI surface for reflection, wellness/calm, preference/context updates, and next-morning awareness |

## Preparation, Relationships, And Memory

| Feature | Status | Canonical direction |
|---|---|---|
| Logistics Pre-Event Protocol | `partial` | Use calendar, relationship, travel, and resource context to prepare people, materials, locations, and event requirements |
| Pre-Event Prep | `partial` | Turn upcoming meetings and travel into readiness plans, checklists, communication triggers, and follow-up reminders |
| Executive Prep and Networking Brief | `skill_protocol_only` | Scan upcoming meetings, enrich participants with relationship/current context, and produce reviewable meeting dossiers |
| Post-Event Synthesis and CRM Update | `skill_protocol_only` | Ingest notes/transcripts, extract commitments, update relationship memory, and route follow-up work into execution |
| Relationship / Network Pulse | `canonical_doc` | Scheduled workflow surfaces relationship context, follow-ups, and network opportunities through Regine-owned lanes |

## Finance And Operations

| Feature | Status | Canonical direction |
|---|---|---|
| Finance Pulse | `canonical_doc` | Scheduled finance exception and summary sweep owned by Khadijah |
| Financial Ingestion and Normalization | `skill_protocol_only` | Capture provider/import rows, normalize canonical transactions, preserve idempotency keys, and route low-confidence exceptions |
| Accounts Receivable and Invoicing Lifecycle | `skill_protocol_only` | Detect billable milestones, create invoice packets, route approval, dispatch safely, and track payment/reconciliation |
| Accounts Payable and Expense Routing | `skill_protocol_only` | Ingest bills/receipts, write ledger-ready entries, prepare payment or reimbursement packets, and require approval before execution |
| Receipt Capture and Matching | `skill_protocol_only` | Capture receipt files, store OCR extraction, propose transaction matches, and route ambiguous cases to review |
| Monthly Financial Reporting Synthesis | `skill_protocol_only` | Aggregate financial data, validate categories, detect anomalies, and produce management reports |
| Budget Dashboard Generation | `skill_protocol_only` | Read canonical finance state, compute run rate/variance, segment alerts, and render dashboard projections |
| Ledger Reconciliation and Close | `skill_protocol_only` | Compare source/provider balances to ledger state, create exceptions, project cash, and stage period-lock approval |

## Work Product

| Feature | Status | Canonical direction |
|---|---|---|
| PAC/PTQ Evaluation Engine | `canonical_doc` | Buffer possible work, score qualification signals, and convert/incubate/redirect/disqualify/purge with durable records |
| Project Initiation and Milestone Mapping | `skill_protocol_only` | Turn intake into a structured project shell with templates, milestones, assumptions, and first tasks |
| Task Execution and Status Monitoring | `skill_protocol_only` | Build daily task queues, check dependencies, detect drift, and surface red/yellow/green status |
| Reports & Artifacts Refresh | `canonical_doc` | Refresh client-visible artifacts and completion summaries from workflow and artifact state |

## Travel And Logistics

| Feature | Status | Canonical direction |
|---|---|---|
| Travel Horizon Scan | `canonical_doc` | Scheduled Regine workflow scans upcoming travel opportunities, risks, and planning needs |
| Travel Lifecycle | `partial` | Regine skills cover planning, booking, prep, itinerary, return, debrief, receipts, and Client Universe updates |
| Logistics research | `partial` | Support research, vendor, location, and event logistics through Regine-owned workflows and skills |

## Future Interaction Modes

| Feature | Status | Canonical direction |
|---|---|---|
| Voice front door | `canonical_doc` | Future alternate interaction mode over the same workflow and artifact data |
| Persistent chat/right rail | `canonical_doc` | Future interface layer, not required for MVP workflow discovery or operation |
| Live transcript workflows | `canonical_doc` | Future event source for meeting/post-event synthesis, not MVP substrate |
| Automated PM/ClickUp sync | `canonical_doc` | Future projection/sync after repo-native workflow state is stable |

## Replacement Map

| Older concept | Current canonical direction |
|---|---|
| Narrow Gmail sync or inbox sweep | Communication Sweep |
| Vault as source of truth | Client Universe + database/GBrain + artifacts |
| Old five-agent routing | Khadijah / Sinclair / Regine ownership |
| Maxine as standalone owner | Khadijah finance/project/ops persona or skills |
| Kyle or Scooter as standalone owners | Regine relationship/research/logistics/travel persona or skills unless the boundary belongs to Sinclair |
| Static app UI prototype | Next.js client/admin apps |

## Maintenance Rule

When functionality is implemented, deferred, renamed, or retired, update this catalog and `docs/planning/feature_migration_inventory.md` in the same change.
