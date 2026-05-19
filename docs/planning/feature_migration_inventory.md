# Feature Migration Inventory

## Purpose

This file is the canonical inventory for whether planned FlavorOS functionality has been captured in the FlavorOS 1.5 repo.

It exists to enforce two rules:

- all meaningful functionality should be represented in this repo, even if future-state or deferred beyond MVP
- external material is historical input only, not canonical product truth

## Source Hierarchy

Current priority guide:

- `docs/planning/current_build_plan.md`

Canonical repo homes:

- `docs/architecture/`
- `docs/agents/`
- `docs/workflows/`
- `docs/runtime/`
- `docs/governance/`
- `docs/ui/`
- `skills/`
- `agents/*/protocols/`
- `services/api/`
- `apps/`
- `client_universe/`
- `docs/workflows/planned_feature_catalog.md`

## Status Vocabulary

| Status | Meaning |
|---|---|
| `implemented` | Real repo code exists and is wired enough to count as product/runtime functionality |
| `canonical_doc` | Canonical repo docs/specs exist, but implementation is still incomplete or deferred |
| `skill_protocol_only` | Agent skill/protocol coverage exists, but no first-class product/runtime implementation exists yet |
| `partial` | Some combination of code, docs, or UI exists, but the capability is not yet end-to-end |
| `missing` | The feature is not yet adequately captured in the repo |
| `missing_implementation` | The feature intent is captured in the repo, but the app/runtime implementation is missing |
| `replaced` | The retired concept has been intentionally absorbed or renamed in the new canon |

## MVP Priority Features

| Feature | Source | Repo status | Notes |
|---|---|---|---|
| Delivery control plane | MVP plan | `partial` | Repo-native planning docs and project-management skills exist; implementation support remains partial |
| Visualization and surfaces | MVP plan | `partial` | Command Center, admin, settings on API; channel/briefing pages still largely fixture-driven (Lane I) |
| Storage and data-flow architecture | MVP plan | `canonical_doc` | Covered in `docs/architecture/storage_data_flow_model.md` and related docs |
| Normalization configuration/model | MVP plan | `canonical_doc` | Strong doc coverage, but not yet a full working normalization subsystem |
| Google Workspace ingestion | MVP plan | `partial` | Tier 1 provider target covering Gmail, Calendar, Docs, Sheets, and Slides; no complete ingestion path yet |
| Project management / contacts / files ingestion | MVP plan | `missing_implementation` | Tier 2 provider target; retained but not complete |
| Selected social DM ingestion | MVP plan | `missing_implementation` | Tier 2 provider target; retained but not complete |
| Finance / Twilio integrations | MVP plan | `canonical_doc` | Tier 3 future/adjacent unless promoted |
| Onboarding | MVP plan | `partial` | App wired: login gate, onboarding UI, first sync; docs/envelope fixtures still canonical for some flows |
| Agent runtime and artifact flow | MVP plan | `partial` | Demo loop via inline `provider_first_sync`; orchestrator remains stubbed |
| Approval packet flow | MVP plan | `partial` | Decide UI + audit on demo path; write-back (step 7) not implemented |
| Outbound sync to source systems | MVP plan | `missing_implementation` | Captured in `current_build_plan.md` and planned feature catalog; not implemented end-to-end |
| Visible client app surface | MVP plan | `implemented` | `apps/flavoros` contains the active client route tree |
| Visible admin/operator surface | MVP plan | `implemented` | `apps/flavoros` contains the active `/admin` diagnostics route tree |
| Finance foundation | MVP plan | `skill_protocol_only` | Strong skills/protocols, but not end-to-end connector-backed finance execution |
| Multi-client OAuth maturity | MVP plan | `missing_implementation` | Retained as beyond-MVP scope; only partially represented through models and client envelope docs |
| Future voice front door | MVP plan | `canonical_doc` | Explicitly deferred but retained in docs/UI future-state material |

## Workflow And Feature Packages

| Feature package | Source | Repo status | Canonical repo direction |
|---|---|---|---|
| Relationship Discovery Onboarding | retained feature | `missing_implementation` | Canonical intent now captured in `docs/workflows/planned_feature_catalog.md`; implementation still missing |
| Logistics Pre-Event Protocol | retained feature | `partial` | Canonical intent captured in planned feature catalog; travel/logistics skills exist, but not as one canonical runtime workflow package |
| Pre-Event Prep | retained feature | `partial` | Travel prep and meeting-prep concepts exist across skills/docs |
| Inbound Communications and Draft Response | retained feature | `skill_protocol_only` | Covered by Sinclair skills/protocols and broader workflow canon |
| Meeting Lifecycle and Time Guarding | retained feature | `skill_protocol_only` | Covered by Sinclair skills/protocols and `Comms & Calendar` workflow family |
| Information Diet and Boundary Defense | retained feature | `skill_protocol_only` | Covered by Sinclair skills/protocols |
| Executive Prep and Networking Brief | retained feature | `skill_protocol_only` | Covered by Regine skills/protocols |
| Post-Event Synthesis and CRM Update | retained feature | `skill_protocol_only` | Covered by Regine skills/protocols |
| Accounts Receivable and Invoicing Lifecycle | retained feature | `skill_protocol_only` | Covered by Khadijah skills/protocols |
| Accounts Payable and Expense Routing | retained feature | `skill_protocol_only` | Covered by Khadijah skills/protocols |
| Monthly Financial Reporting Synthesis | retained feature | `skill_protocol_only` | Covered by Khadijah skills/protocols |
| Project Initiation and Milestone Mapping | retained feature | `skill_protocol_only` | Covered by Khadijah skills/protocols |
| Task Execution and Status Monitoring | retained feature | `skill_protocol_only` | Covered by Khadijah skills/protocols |
| PAC/PTQ Evaluation Engine | retained feature | `canonical_doc` | Promoted into canonical workflow docs |
| Financial Ingestion and Normalization | retained feature | `skill_protocol_only` | Skill/protocol exists; system implementation is incomplete |
| Receipt Capture and Matching | retained feature | `skill_protocol_only` | Skill/protocol exists; system implementation is incomplete |
| Budget Dashboard Generation | retained feature | `skill_protocol_only` | Skill/protocol exists; system implementation is incomplete |
| Ledger Reconciliation and Close | retained feature | `skill_protocol_only` | Skill/protocol exists; system implementation is incomplete |

## Canonical Feature Capture

The feature intent for all rows above is now represented in this repo through:

- `docs/planning/current_build_plan.md`,
- `docs/workflows/planned_feature_catalog.md`,
- workflow docs in `docs/workflows/`,
- canonical skill files under `skills/`,
- agent protocol files under `agents/*/protocols/`,
- API/UI scaffolding under `services/api/` and `apps/`.

The repo is now the canonical place these features are described.

## Replacement Map

These retired concepts should be treated as replaced by current repo canon rather than preserved as primary names:

| Retired concept | Current canonical direction |
|---|---|
| narrow Gmail sync / inbox sweep | `Communication Sweep` |
| package-specific file truth | Client Universe + DB/GBrain + artifact model |
| five-agent routing | Khadijah / Sinclair / Regine ownership |
| local-folder source-of-truth operating model | durable runtime records plus client envelope/config docs |
| static app-ui assumptions | visual-first WebApp client/admin surfaces |

## Current Gap Summary

The repo now contains the canonical architecture, runtime language, UI surface model, agent skill/protocol coverage, and partial API/UI implementation. It does not yet contain complete end-to-end implementation for every planned feature.

The biggest remaining gaps are:

- onboarding implementation
- provider ingestion breadth
- outbound sync/write-back
- end-to-end workflow execution beyond stub orchestrator behavior
- implementation of future-state packages that are now captured canonically but not yet executable

## Maintenance Rule

When a planned feature is reviewed, migrated, deferred, renamed, or replaced:

1. update the relevant canonical docs or implementation
2. update this inventory row
3. keep the repo as the detailed record of the feature
