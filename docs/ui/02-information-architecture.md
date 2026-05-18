# 02 · Information Architecture

The MVP information architecture is a visual-first command center with focused workflow surfaces.

It follows the current build plan priority:

1. visualization and surfaces,
2. database and storage,
3. integrations,
4. onboarding,
5. provider ingestion,
6. agent workflows.

## Layout Model

FlavorOS MVP uses a calm shell:

```text
Header / status strip
Left navigation
Main surface
Contextual command areas inside the active surface
```

The MVP does not require:

- persistent right rail,
- global chat composer,
- voice orb,
- live transcript,
- always-on call state,
- command palette as primary navigation.

Those concepts are preserved in `10-future-voice-and-chat-layer.md`.

## Primary Navigation

Client-facing surfaces:

| Surface | Purpose |
|---|---|
| Command Center | Default landing surface for ready work, approvals, briefings, meetings, artifacts, and quiet status |
| Briefings | Morning Standup, COB Work Day, Goodnight |
| Meetings | Launcher for topic-scoped client-to-agent sessions (Communications, Calendar, Travel / Logistics, Projects, Reports & Artifacts, General) |
| Communications | Standing channel surface for inbound messages, drafts, contacts, and approved outbound write-back |
| Calendar | Standing channel surface for events, conflicts, scheduling, and upcoming commitments |
| Projects | Standing channel surface for project/work status, decisions, artifacts, and follow-up |
| Reports & Artifacts | Standing channel surface for generated work product, reports, packets, drafts, and artifact review |
| Travel / Logistics | Standing channel surface and future-capable workflow lane |
| Settings / Profile | Client profile, preferences, contexts, and provider/account posture |

Channel surfaces (Communications, Calendar, Projects, Reports & Artifacts, Travel / Logistics) and Meetings are distinct:

- Channel surfaces are **standing** browse/manage views over a lane of work, reachable directly from the left nav at any time.
- Meetings are **transient, topic-scoped client-to-agent sessions** opened from the Meetings launcher. A Meeting reuses the same workflow, artifact, approval, and source-link data as the underlying channel surface but presents it as a focused workspace for decisions and next actions.

Briefings are scheduled/recurring sessions (Morning Standup, COB Work Day, Goodnight). Meetings are user-initiated. Both share the Structured Interaction Surface defined in `05-structured-interaction-surface.md`.

Admin/operator surfaces:

| Surface | Purpose |
|---|---|
| Tenant monitor | Tenant/client state and isolation posture |
| Provider sync | Provider connection and sync status |
| Workflow monitor | Workflow runs, status, failures, and queue posture |
| Agent monitor | Agent health and task/report diagnostics |
| GBrain ingestion | Memory/indexing status and retrieval diagnostics |
| Artifact queue | Client Artifacts and SIGMA Artifacts |
| Approval queue | HITL state and decisions |
| Logs | Audit and runtime events |
| Config editor | Runtime/configuration inspection and safe changes |

## Header / Status Strip

The header should be quiet and useful.

Recommended slots:

| Slot | Content |
|---|---|
| Product mark | FlavorOS / current mode |
| Context selector | Hidden for single-context clients |
| Next relevant event/status | Plain-English schedule or focus-state summary |
| Ready-for-you count | Pending approvals or blocking escalations, hidden when zero |
| Provider/system alert | Only when something affects current work |
| Profile/admin mode | Role-aware access |

Header content should not expose agent internals, raw workflow traces, SIGMA vocabulary, provider payloads, or backend protocol names.

## Context Model

Contexts are client-defined during onboarding and stored in the Client Universe/client envelope. They are metadata and routing hints, not separate apps.

Example context labels:

- Work
- Business
- Career
- Personal

Design principles:

- Configurable, not hardcoded.
- Filter, do not fragment.
- Hide context chrome for single-context clients.
- Default to all-context view unless the client chooses a scope.

Contexts may appear as:

- header selector,
- chips on artifacts, projects, messages, calendar items, and approvals,
- filters on Command Center, Meetings, Reports & Artifacts, and Settings,
- onboarding/profile configuration.

## Briefings As Workflow Surfaces

Briefings are UI surfaces and workflow/storage frameworks.

Each briefing should be backed by:

- workflow run state,
- prepared agenda items,
- Client Universe/GBrain context,
- source-linked artifacts,
- pending approvals,
- command/action definitions,
- completion summary.

The UI should display this durable state clearly. It should not behave like a static script or decorative meeting launcher.

## Meetings As Client-To-Agent Sessions

Meetings are user-initiated, topic-scoped client-to-agent workspaces. They are not third-party calendar meetings (those belong in Comms & Calendar).

The client picks a topic from the Meeting launcher:

- Communications
- Calendar
- Travel / Logistics
- Projects
- Reports & Artifacts
- General Command Center review

The Meeting screen then opens a focused workspace scoped to that topic, reusing the underlying channel surface's prepared state.

Each Meeting screen should show:

- prepared state for the chosen topic,
- open decisions,
- artifacts,
- approval cards,
- provider/source links,
- queued outbound actions,
- notes, questions, follow-up tasks,
- completion summary.

The MVP should prioritize Communications as the first proof lane for the underlying provider/normalization/write-back loop (Calendar follows immediately, since the two share normalized item plumbing), while retaining Travel / Logistics, Projects, and Reports & Artifacts as visible standing surfaces and as Meeting topics.

## App Launch And Role Routing

The app launches to a login surface, with sign-up/onboarding as a major adjacent flow.

After authentication, route by role:

| Role | Landing surface |
|---|---|
| Client | Command Center |
| Admin / Operator | Admin/operator console, with access to client-style surfaces where appropriate |

Onboarding is required before a client first reaches the Command Center. It produces or prepares the governed Client Universe and is detailed in `docs/workflows/client_onboarding_model.md`.

## Provider Scope In UI

MVP provider tiers should be visible in product/admin posture:

| Tier | Providers | UI treatment |
|---|---|---|
| 1 | Google Workspace: Gmail, Google Calendar, Docs, Sheets, Slides | First-class connection, sync, source-link, and artifact context |
| 2 | Project management, contacts, files, selected social DMs | Supporting targets after tier 1 foundations |
| 3 | Finance and Twilio | Future/adjacent unless promoted |

Finance and Twilio may appear in future-state catalogs or admin placeholders, but the MVP UI should not imply live connector-backed execution unless it exists.

## Mobile Model

Mobile should preserve the same information architecture:

- navigation collapses,
- primary surface remains central,
- approval and command components stay reachable,
- Briefings/Meetings remain readable and tappable,
- future voice/chat layers remain optional.

Mobile should not introduce a separate chat-first product model.

## Canonical Absences

The MVP client UI should not include:

- Team or agent-status surface,
- raw notification inbox,
- raw provider inbox replacement,
- full calendar replacement as the center of the product,
- backend trace views,
- direct agent management,
- persistent chat/right rail as a required operating surface.
