# 14 · Channel Surfaces

Channel surfaces are standing left-nav views over a lane of work. Each is:

- always reachable from the left nav,
- browsable without starting a Meeting,
- the authoritative view of the lane's prepared state,
- the data source that a Meeting (or Briefing section) reads from.

This document specifies the five MVP channel surfaces plus Settings/Profile.

Controlling docs: `02-information-architecture.md`, `04-app-surfaces.md`, `06-command-components.md`, `11-command-center-wireframe.md`, `13-meetings.md`.

## Shared Channel Surface Anatomy

```text
Header
  Surface name · Filter chips (context, status, type) · Search · "Open meeting" command
Summary Strip
  3–5 quiet numbers/states for the lane (e.g. open approvals, pending review, recent updates)
Primary List / Grid
  Cards relevant to this lane (Approval, Artifact, Project, Calendar, etc.)
Detail Drawer / Pane
  Focused view of the selected card without leaving the surface
Footer
  Empty/loading/error notes if applicable
```

Rules:

- Filter chips are configurable but never hardcoded to specific client contexts.
- Search is scoped to the surface and uses plain-English terms.
- "Open meeting" routes to a Meeting opened on this topic.
- Cards on a channel surface match the canonical component definitions in `06-command-components.md` (Approval Card, Artifact Card, Link Card, Status Chip, etc.).

## 1. Communications

A standing light inbox over normalized communication items. First proof lane for provider ingestion → normalization → artifact → approval → outbound write-back.

Not a full inbox replacement.

### Surface frame

| Tier | Contents |
|---|---|
| Banner | "Communications" |
| Stat strip | Drafts pending · Sent today · Awaiting reply · Unread urgent |
| Pile row (by channel) | Emails · SMS & Voice · Social |
| Detail section | Contacts rail (grouped by context) + composer + outbox status |

### Pile mapping (data-grounded)

| Pile | Reads |
|---|---|
| Emails | `normalized_items` where `item_type = email` (provider = gmail at MVP) |
| SMS & Voice | `normalized_items` where `item_type in (sms, voice)` (future provider tier) |
| Social | `normalized_items` where `item_type = social_dm` |

Each pile opens an Overlay with full scrollable list. Item kind drives the available actions (approval items get Approve/Modify/I'll do myself; outbound completions get Open / Pull back during the retraction window).

### Filters

- context chips (when client has more than one context)
- direction (inbound · outbound · all)
- status (needs approval · sent · queued · failed · awaiting reply)

### Commands

Approve · Modify · I'll do myself · Defer (workflow-allowed) · Open source · Pull back (within retraction window) · Open meeting

### Composer

A light rich-text composer beside the contacts rail. Submitting creates a `client_artifacts` row with `artifact_type = draft_email`, links the recipient(s) by context, and opens an Approval Request. No direct outbound bypass.

### Empty / degraded

- If Gmail/SMS provider is degraded, show an inline header notice; piles continue to render with the items they have.
- If no items in a pile, the stack card still renders with count 0 ("Quiet here right now").

## 2. Calendar

A standing channel surface for events, conflicts, scheduling, and upcoming commitments.

### Surface frame

| Tier | Contents |
|---|---|
| Banner | "Calendar" |
| Stat strip | Today's events · Conflicts · This week · Travel days |
| Pile row (by time window) | Today · Conflicts · Upcoming |
| Detail section | Mini month calendar + linked travel / meetings / milestones |

### Pile mapping (data-grounded)

| Pile | Reads |
|---|---|
| Today | `calendar_items` where `start_at` within local today window |
| Conflicts | `calendar_items` flagged by the conflict detector |
| Upcoming | `calendar_items` next 7 days, excluding today |

### Filters

- context chips
- provider (Google Calendar at MVP)
- type (event · hold · proposed)

### Commands

Approve hold · Modify · I'll do myself · Defer · Open source · Open meeting

### Empty / degraded

- If the provider is degraded, the Today and Upcoming piles render the last known state with a stale notice.
- The Conflicts pile hides entirely when zero.

## 3. Projects

A light project-management command center for client + agent work.

### Surface frame

| Tier | Contents |
|---|---|
| Banner | "Projects" |
| Stat strip | Active · Blocked · Completed this quarter · Due this week |
| Pile row (by status) | Active · Blocked · Completed |
| Detail section | Tasks list (per-project rows) + project artifacts strip |

### Pile mapping (data-grounded)

| Pile | Reads |
|---|---|
| Active | `projects` where `status in (in_progress, waiting_on_client, ready_for_review)` |
| Blocked | `projects` where `status = blocked` |
| Completed | `projects` where `status = completed` and `completed_at` in current quarter |

### Filters

- context chips
- agent owner (Khadijah, Sinclair, Regine)
- due window (this week · this month · all)

### Data expected

- `projects`, `project_tasks`, `milestones`
- `approvals` linked by `project_id`
- `client_artifacts` linked by `project_id`
- `completion_summaries` linked by `project_id`
- `agent_tasks` for status/blocker derivation

### Commands

Approve · Modify · I'll do myself · Defer · Open source · Open meeting

### Excluded

- arbitrary user-created projects with no agent involvement (post-MVP)
- raw agent task logs
- agent status dashboard

## 4. Reports & Artifacts

Review surface for generated work product.

### Surface frame

| Tier | Contents |
|---|---|
| Banner | "Reports & Artifacts" |
| Stat strip | Pending review · Filed this month · Drafts in flight · Avg approval time |
| Pile row (by `artifact_type`) | Reports · Briefs · Drafts |
| Detail section | Document Product Library (data table over all client-visible artifacts) |

### Pile mapping (data-grounded)

| Pile | Reads |
|---|---|
| Reports | `client_artifacts` where `artifact_type = report` |
| Briefs | `client_artifacts` where `artifact_type = brief` |
| Drafts | `client_artifacts` where `artifact_type in (draft_email, *_draft)` |

Completion summaries (`artifact_type = completion_summary`) appear in the Document Product Library table but not as a top-tier pile (they're operational, not primary work product).

### Filters

- artifact type
- context chips
- project
- status
- created-by agent (display only when useful)

### Data expected

- `client_artifacts` where `visibility = client`
- `client_artifacts.related_artifact_ids` for version chains
- `approval_requests` linked to artifacts
- `link_cards` for provider/source

### Focused artifact viewer

The detail pane is a focused artifact viewer:

- title, type, context, status (per `03-approval-card.md` Status Mapping)
- preview body
- version selector
- approval status
- source/provider Link Cards
- commands: Approve · Modify · I'll do myself · Open source · File

### Excluded

- backend SIGMA visibility (admin only)
- raw file browser
- agent memory browser

## 5. Travel / Logistics

Retained as an MVP surface and a future-capable workflow lane. Not the first proof loop unless explicitly promoted.

### Surface frame

| Tier | Contents |
|---|---|
| Banner | "Travel & Logistics" |
| Stat strip | Upcoming trips · Decisions to make · Research items · Itineraries built |
| Pile row (by artifact subtype) | Decisions · Research · Itineraries |
| Detail section | Trip tabs (Trip details card) + Logistics grid (Hospitality / Transportation / Dining / Locations) |

### Pile mapping (data-grounded)

| Pile | Reads |
|---|---|
| Decisions | `client_artifacts` where `artifact_type = travel_option` and `status in (prepared, pending_review)` |
| Research | `client_artifacts` where `artifact_type` matches travel research subtype |
| Itineraries | `client_artifacts` where `artifact_type` matches itinerary subtype |

### Filters

- trip
- context chips
- phase (planning · booked · in trip · wrap-up)

### Data expected

- `trips`, `trip_phases`
- `client_artifacts` where related to a trip
- `approval_requests` scoped to travel
- `link_cards` for airline/hotel/booking providers
- `documents` filed in the travel library

### Commands

Approve · Modify · I'll do myself · Defer · Open source · Open meeting

### Excluded from MVP

- geolocation-aware in-trip mode
- always-on voice reminders
- full travel operations replacement

## 6. Settings / Profile

Operational surface, not a core work surface.

### Sections

| Section | Contents |
|---|---|
| Profile | Display name, timezone, photo, persona signature preferences |
| Contexts | Configurable context labels (Work, Business, Career, Personal, custom) |
| Connected accounts | Provider connection status with reconnect / disconnect commands |
| Authority defaults | HITL defaults per category (comms, calendar, finance, travel, relationships) |
| Notification posture | What surfaces produce header alerts |
| Briefing preferences | Time-of-day, opt-in sections, narration on/off (future) |
| Account aliases | Per-context account mappings (no secrets shown) |

### Data expected

- `clients`, `client_universe`
- `client_contexts`
- `provider_connections` (status only; secrets via secrets protocol)
- `authority_defaults`
- `notification_preferences`
- `briefing_preferences`
- `account_aliases`

### Rules

- Never display provider secrets in plain text.
- Edits to authority defaults require a confirmation step (governed write).
- Context renames update everywhere via the Client Universe; the UI does not maintain its own copy.

## Cross-Surface Rules

- Every channel surface offers an "Open meeting" command in its header to start a topic-scoped Meeting over the same data.
- Every channel surface participates in Command Center previews (Zones 4–7 in `11-command-center-wireframe.md`).
- Every channel surface participates in Briefing sections that bind to it (e.g. Comms & Calendar → Morning Standup §4/§5).
- Empty states per surface follow the calm rule: hide collapsible sections; render the surface shell with a one-line explanation if everything is empty.
- Degraded provider state surfaces as an inline notice on the affected surface and a header alert globally if it blocks current work.
