# 14 · Channel Surfaces

Channel surfaces are standing left-nav views over a lane of work. Each is:

- always reachable from the left nav,
- browsable without starting a Meeting,
- the authoritative view of the lane's prepared state,
- the data source that a Meeting (or Briefing section) reads from.

This document specifies the four MVP channel surfaces plus Settings/Profile.

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

## 1. Comms & Calendar

The first proof lane for provider ingestion → normalization → artifact → approval → outbound write-back.

Not a full inbox replacement and not a full calendar replacement.

### Sections / lists

| Section | Contents |
|---|---|
| Priority messages | Normalized communication items flagged priority by Sinclair |
| Drafts to approve | Artifact Cards of type `communication_draft` in `ready_for_approval` |
| Calendar conflicts | Conflict cards with referenced calendar items |
| Upcoming events | Calendar Cards for next 24–72h with source links |
| Outbox status | `outbound_actions` (queued / executed / failed / pulled back) |

### Filters

- context chips (when client has more than one context)
- type (message / event / draft / conflict)
- status (needs approval / sent / queued / failed)
- provider (Gmail, Calendar)

### Data expected

- normalized communication items (read-only here; writes go through approval)
- `calendar_items`
- `artifacts` of type `communication_draft`, `meeting_brief`
- `approvals` linked to those artifacts
- `outbound_actions`
- `provider_connections` (for inline degraded-state notice)

### Commands

Approve · Send for revision · I'll handle it · Defer · Pull back · Open source link · Open meeting

### Empty / degraded

- If the Gmail/Calendar provider is degraded, show an inline notice at the top of the surface (no fake content below it).
- If no priority messages and no drafts, the section header collapses; the surface still renders Upcoming events.

## 2. Projects

A light project-management command center for client + agent work.

### Sections / lists

| Section | Contents |
|---|---|
| Active projects | Project cards with status, owner, next step, blocker, due date |
| Milestones | Milestone strip per project (in detail pane) |
| Open decisions | Approval Cards scoped to projects |
| Project artifacts | Artifact Cards filtered by project |
| Completion history | Completion Summaries per project (read-only) |

### Filters

- context chips
- agent owner (Khadijah, Sinclair, Regine)
- status (in progress, blocked, needs review, completed)

### Data expected

- `projects`, `project_tasks`, `milestones`
- `approvals` linked by `project_id`
- `artifacts` linked by `project_id`
- `completion_summaries` linked by `project_id`
- `agent_tasks` for status/blocker derivation

### Commands

Approve · Defer · Revise · Escalate · Open source · Open meeting

### Excluded

- arbitrary user-created projects with no agent involvement (post-MVP)
- raw agent task logs
- agent status dashboard

## 3. Reports & Artifacts

Review surface for generated work product.

### Sections / lists

| Section | Contents |
|---|---|
| Pending review | Artifact Cards in `ready_for_review` / `needs_revision` |
| Ready to file | Approved artifacts not yet filed |
| Recent | Newest client-facing artifacts |
| Reports | Subset filter for `report_*` artifact types |
| Drafts | Subset for `*_draft` artifact types |

### Filters

- artifact type
- context chips
- project
- status
- created-by agent (display only when useful)

### Data expected

- `artifacts` where `visibility = client`
- `artifacts.versions` (for show-decisions-and-versions behavior)
- `approvals` linked to artifacts
- `link_cards` for provider/source

### Focused artifact viewer

The detail pane is a focused artifact viewer:

- title, type, context, status
- preview body
- version selector
- approval status
- source/provider Link Cards
- commands: Approve · Revise · Open source · File

### Excluded

- backend SIGMA visibility (admin only)
- raw file browser
- agent memory browser

## 4. Travel / Logistics

Retained as an MVP surface and a future-capable workflow lane. Not the first proof loop unless explicitly promoted.

### Sections / lists

| Section | Contents |
|---|---|
| Upcoming trips | Trip cards (next 90 days) with phase chip |
| Options to compare | Travel option Artifact Cards per trip |
| Approvals | Travel-related Approval Cards (holds, bookings) |
| Itinerary status | Status per trip with milestone chips |
| Client travel library | Filed travel documents and packing/prep references |
| Research items | Research artifacts in progress |

### Filters

- trip
- context chips
- phase (planning / booked / in trip / wrap-up)

### Data expected

- `trips`, `trip_phases`
- `artifacts` of type `travel_*`
- `approvals` scoped to travel
- `link_cards` for airline/hotel/booking providers
- `documents` filed in the travel library

### Commands

Approve · Defer · Revise · Compare · Open source · Open meeting

### Excluded from MVP

- geolocation-aware in-trip mode
- always-on voice reminders
- full travel operations replacement

## 5. Settings / Profile

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
