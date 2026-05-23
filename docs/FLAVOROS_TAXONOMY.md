# FlavorOS Taxonomy

**Last updated:** 2026-05-23 EDT

Canonical shared vocabulary for FlavorOS 1.5. Use these terms consistently in PRs, tests, UI copy, admin surfaces, and planning docs.

When this file conflicts with a domain spec, defer to the spec for that domain. When planning docs conflict on **priority or sequencing**, [`planning/current_build_plan.md`](planning/current_build_plan.md) wins.

---

## 1. Purpose and canon order

FlavorOS is a calm, unified client command center powered by a small multi-agent operating system. The MVP proves durable state, governed provider access, onboarding into a Client Universe, agent-prepared artifacts and approvals, and **approval-gated outbound write-back** without losing source context.

**Read order for agents and contributors:**

| Rank | Document | Role |
|---|---|---|
| 1 | [`planning/current_build_plan.md`](planning/current_build_plan.md) | Single canonical development plan and priority order |
| 1.5 | **This file** (`FLAVOROS_TAXONOMY.md`) | Shared terms, status enums, surfaces map, repo pointers |
| 2 | `architecture/`, `workflows/`, `agents/`, `ui/`, `governance/`, `runtime/` | Canonical system specs |
| 3 | [`workflows/planned_feature_catalog.md`](workflows/planned_feature_catalog.md) | Retained MVP and future feature catalog |
| 4 | [`planning/feature_migration_inventory.md`](planning/feature_migration_inventory.md) | Migration and coverage tracker |
| 5 | [`planning/mvp_build_notes.md`](planning/mvp_build_notes.md) | Supporting context only |

**Session entry point:** [`planning/next_session_handoff.md`](planning/next_session_handoff.md) for active lanes, verification, and constraints.

**Execution tracking:** [`planning/parallel_lanes_tracker.md`](planning/parallel_lanes_tracker.md) for lane ownership and session log.

---

## 2. Build phases 1–6

Build priority order (from the current build plan). Phases are **sequencing**, not user-facing product phases.

| Phase | Name | One-line goal |
|---|---|---|
| 1 | Visualization and surfaces | Make FlavorOS visible and navigable as a client command center and operator console |
| 2 | Database and storage | Persist core operating state before deeper automation |
| 3 | Integrations | Establish safe adapter boundaries before live providers |
| 4 | Onboarding | Create a governed Client Universe per client without identity/OAuth confusion |
| 5 | Provider ingestion | Capture provider events and normalize them into FlavorOS-native records |
| 6 | Agent workflows | Route normalized work through Khadijah, Sinclair, and Regine with durable runs and artifacts |

Everything else is retained or future unless explicitly promoted in the current build plan.

---

## 3. MVP proof loop steps 1–7

The **MVP proof loop** is the end-to-end demo bar. It is **not** the same as build phases 1–6 above.

| Step | Proof | Notes |
|---|---|---|
| 1 | App renders useful client and admin surfaces | Visualization-first; calm, artifact-led client UI |
| 2 | Core state is stored durably | Tenant, client, artifacts, approvals, workflow runs, audit |
| 3 | Integrations connect through approved boundaries | Composio/provider adapters; not canonical data truth |
| 4 | Client onboarded into a governed Client Universe | Contexts, aliases, authority defaults, sync readiness |
| 5 | Provider events captured and normalized | Google Workspace first; dedupe and source identifiers |
| 6 | Agents produce runs, artifacts, approvals, summaries | Three MVP agents; HITL on governed side effects |
| 7 | Approved actions write back to origin systems | **Approval-gated**, channel-correct, audit-safe |

**Current proof status (2026-05-19):** Step 7 is proven on a **communications-first** path (`send_communication_draft` → Gmail). Calendar and other channels are extension work (see §10).

Do not call proof-loop step 7 “phase 7” in code or docs.

---

## 4. Core entities

| Term | Meaning |
|---|---|
| **Tenant** | Top-level isolation boundary; all meaningful objects are tenant-scoped |
| **Client** | The operating unit FlavorOS serves; most records carry `client_id` |
| **User** | Human actor (client user or operator); auth and role model |
| **Client Universe** | Governed client-scoped context store (profiles, contexts, aliases, preferences) — not agent-owned memory |
| **Artifact** | Durable work product; see Client Artifact vs SIGMA Artifact |
| **Client Artifact** | Prepared for client approval or use (drafts, briefs, recommendations, etc.) |
| **SIGMA Artifact** | Internal/agent-facing state (packets, handoffs, prep YAML, etc.) |
| **Approval** | Explicit client decision on an artifact or **governed action** before external side effects |
| **Workflow run** | Durable execution unit for a workflow definition (briefing, sync, agent task tree) |
| **Outbound action** | Approval-gated write-back row staging execution to a provider (see §5) |
| **Audit event** | Append-only record of meaningful actions (`approval.*`, `outbound.*`, etc.) |
| **Provider connection** | Linked provider account for a client (e.g. Gmail); sync health, not canonical truth |
| **Provider event / normalized item** | Ingested provider payload and FlavorOS-native routing input |

**Non-negotiables (vocabulary):** Composio provides access, not canonical truth; GBrain holds memory/context; agents do not own memory; outbound write-back is always approval-gated.

---

## 5. Outbound vocabulary

Outbound is the **write-back layer** for MVP step 7. Status language is locked across API, client, admin, and tests.

### Status enum (canonical)

| Status | Meaning |
|---|---|
| `queued` | Approved and staged; execution pending or deferred |
| `executed` | Provider send (or stub) completed successfully |
| `failed` | Execution attempted and failed; see `error_summary` / `execution_result_json` |
| `pulled_back` | Client or operator cancelled a queued action before execution |

Do not add statuses without updating this file, API schemas, mappers, admin spec, and tests together.

### Governed actions vs action types

| Term | Example | Where used |
|---|---|---|
| **Governed action** | `send_communication_draft` | `Approval.governed_action` — what the client approved |
| **Action type** | `gmail_send_draft` | `OutboundAction.action_type` — how the row is executed |
| **Provider** | `gmail` | `OutboundAction.provider` — connection family |

**Communications (shipped):**

- Governed action: `send_communication_draft`
- Action type: `gmail_send_draft`
- Provider: `gmail`
- Typical artifact: draft email (`artifact_type` / `channel` email)

### Audit action names (outbound)

| Audit `action` | When |
|---|---|
| `outbound.queued` | Row created after approve (or enqueue-only path) |
| `outbound.executed` | Successful execution |
| `outbound.failed` | Execution failure |
| `outbound.pulled_back` | Pull-back on a queued row |

### API and workflow modules (communications)

| Concern | Path |
|---|---|
| Enqueue / execute workflow | `services/api/app/workflows/communications_outbound.py` |
| Decide hook | `services/api/app/routers/approvals.py` |
| Outbound CRUD / pull-back | `services/api/app/routers/outbound_actions.py` |
| Migration | `services/api/alembic/versions/20260520_0005_outbound_actions.py` |
| Tests | `services/api/tests/test_outbound_actions.py` |

**Operator rule:** Admin outbound HTTP uses `admin-api.ts` only — not `api.ts`.

---

## 6. Surfaces map

### Client-facing MVP surfaces (left nav / primary)

| Surface | Route area | Primary interaction types |
|---|---|---|
| Command Center | `(client)/command-center` | Updates, escalations, approval previews, launchers |
| Briefings | `(client)/briefings` | Briefing, approval, update |
| Meetings | `(client)/meetings` | Meeting (topic-scoped session over a channel) |
| Comms & Calendar | `(client)/communications`, `(client)/calendar` | Standing channels; approvals, updates, outbound queue |
| Projects | `(client)/projects` | Artifacts, approvals, updates |
| Reports & Artifacts | `(client)/reports` | Artifacts, approvals |
| Travel / Logistics | `(client)/travel` | Retained surface; not first proof-loop dependency |
| Settings / Profile | `(client)/settings` | Profile, provider connections |

Channel pages are **standing surfaces**. A **Meeting** is a focused session opened from the Meetings launcher over one channel’s data — not a duplicate nav item.

### Admin / operator surfaces

Configured in [`apps/flavoros/src/lib/admin-surfaces.ts`](../apps/flavoros/src/lib/admin-surfaces.ts). Tiles include:

| Slug | Title | Live data (MVP) |
|---|---|---|
| `tenants` | Tenant monitor | Spec / partial |
| `providers` | Provider sync status | Yes |
| `workflows` | Workflow monitor | Yes |
| `agents` | Agent monitor | Spec |
| `gbrain` | GBrain ingestion | Spec |
| `artifacts` | Artifact queue | Yes |
| `approvals` | Approval queue | Yes |
| `outbound` | Outbound actions | Yes — communications write-back diagnostics |
| `logs` | Logs | Yes |
| `config` | Config editor | Spec |

Admin UI: `apps/flavoros/src/app/admin/**`, panel `components/admin/AdminSurfacePanel.tsx`, client `admin-api.ts`.

---

## 7. Agents (MVP)

Three canonical agent **owners**. Retired names (Maxine, Scooter, Kyle, Overton) may appear as persona or skill lineage only — not as MVP owners.

| Agent | Role | Primary scope | Runtime posture (notes) |
|---|---|---|---|
| **Khadijah** | Conductor | Orchestration, approvals routing, projects, operations, finance oversight | Cloud |
| **Sinclair** | Communications | Email, calendar posture, drafts, wellness-sensitive comms | Local (design) |
| **Regine** | Research & logistics | Research, travel/logistics, relationships, contacts | Cloud |

### What clients must never see

- Raw agent task trees, internal agent “conversation,” or multi-agent routing jargon
- PAC/PTQ qualification vocabulary in client UI
- Raw SIGMA vocabulary or internal artifact types as primary labels
- Provider traces, OAuth tokens, or operator-only diagnostics
- Unapproved outbound execution presented as “sent”

Client UI stays **calm, unified, artifact-first**. Agents prepare; the client decides via **Approval** and sees **Updates** when work completes.

---

## 8. UI interaction types

FlavorOS uses five MVP interaction types (visual-first). Full spec: [`ui/01-interaction-taxonomy.md`](ui/01-interaction-taxonomy.md).

| # | Type | Client-facing role |
|---|---|---|
| 1 | **Briefing** | Recurring guided workflow (Morning Standup, COB, Goodnight) |
| 2 | **Meeting** | User-launched, topic-scoped workspace over a channel |
| 3 | **Approval** | Explicit decision before governed external effects |
| 4 | **Update** | Quiet completion or status (not a notification feed) |
| 5 | **Escalation** | Rare blocking item needing attention |

Not MVP interaction primitives: persistent chat, right rail, voice-first, live transcript, command palette, raw notification feed.

**Outbound in UI:** Queued send appears as **Update** or queue rows on Comms; approve moment is **Approval**. Map `completion_state` / pile kinds to the four outbound statuses in mappers — do not invent parallel status words in UI copy.

---

## 9. Repo map

Quick pointers for post-slice work (aligned with [`planning/next_session_handoff.md`](planning/next_session_handoff.md)).

> **Two-layer rule:** For the full authored-spec vs runtime-code mapping see `CLAUDE.md` § "Repo Layer Map". This section is path pointers only.

| Area | Path | Notes |
|---|---|---|
| Next.js app | `apps/flavoros/` | Only deployable frontend |
| Client API + session | `apps/flavoros/src/lib/api.ts` | |
| Admin API (operator only) | `apps/flavoros/src/lib/admin-api.ts` | |
| Admin surfaces config | `apps/flavoros/src/lib/admin-surfaces.ts` | |
| Mappers | `apps/flavoros/src/lib/mappers.ts` | |
| Shared channel loader | `apps/flavoros/src/lib/hooks/useChannelData.ts` | |
| Communications page | `apps/flavoros/src/app/(client)/communications/` | |
| Calendar page | `apps/flavoros/src/app/(client)/calendar/` | |
| Command Center | `apps/flavoros/src/app/(client)/command-center/` | |
| FastAPI service | `services/api/` | Only item in `services/` — all other services are planned, not running |
| Planned future services | `docs/architecture/planned_services.md` | Extraction targets with trigger criteria |
| Provider-first sync | `services/api/app/workflows/provider_first_sync.py` | |
| Approvals | `services/api/app/routers/approvals.py` | |
| Communications outbound | `services/api/app/workflows/communications_outbound.py` | |
| FlavorOS scripts | `scripts/` | Operational helpers, smoke tests, agent deploy |
| GBrain CI scripts | `scripts/gbrain/` | GBrain-internal tooling (moved from `services/`) |
| API integration CI | `.github/workflows/api-integration-tests.yml` | |
| Local dev | `docs/planning/local_dev_runbook.md` | |
| GBrain subsystem | `subsystems/gbrain/` | Git submodule |
| Production app | `https://flavoros.vercel.app` | |

**High-collision shared files** (coordinate in tracker before parallel edits): `providers.py`, `approvals.py`, `orchestrator.py`, `provider_first_sync.py`, `schemas.py`, `api.ts` (auth/session), `command-center/page.tsx`, `ApprovalCard.tsx`, `SessionGuard.tsx`.

---

## 10. Lane and extension hooks

Post-slice work is tracked in [`planning/parallel_lanes_tracker.md`](planning/parallel_lanes_tracker.md). Naming only — no implementation commitment in this section.

| Lane | Status (typical) | Scope |
|---|---|---|
| **K** | Harden communications write-back | Extract enqueue vs execute, receipts, pull-back polish, smoke/runbook |
| **L** | Taxonomy (this document) | Docs-only shared vocabulary |
| **M** | Calendar write-back (queued) | Second channel on outbound framework **after K calm** |

### Lane M placeholder terms (not implemented)

When calendar write-back ships, expect the same pattern as communications:

- New **governed action** (name TBD in taxonomy update — e.g. calendar hold/commit)
- New **action type** and **provider** (`google_calendar` or equivalent)
- Reuse `outbound_actions` table and the same four **statuses**
- Calendar channel queue UI + approval enrichment via `useChannelData`
- Admin **outbound** tile remains provider-agnostic

**Explicit deferrals:** full Google Calendar OAuth matrix, orchestrator rewrite, InstantDB as backend, Twilio/finance connectors, multi-channel outbound in one PR.

---

## Change control

Update this file when you:

- Add or rename outbound statuses, governed actions, or action types
- Promote a new MVP surface or admin tile slug
- Change proof-loop step definitions or agent ownership
- Introduce a new lane that locks vocabulary (e.g. calendar governed action name)

Also update `Last updated` with a timestamp (`YYYY-MM-DD HH:MM TZ`) and touch [`planning/README.md`](planning/README.md) if canon order or pointers change.
