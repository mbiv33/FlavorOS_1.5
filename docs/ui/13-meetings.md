# 13 · Meetings (Launcher + Screen)

Meetings are user-initiated, topic-scoped client-to-agent workspaces. They reuse the data from standing channel surfaces and the Structured Interaction Surface from `05-structured-interaction-surface.md`.

Meetings are not third-party calendar meetings. Those belong in Comms & Calendar.

Controlling docs: `02-information-architecture.md`, `04-app-surfaces.md`, `05-structured-interaction-surface.md`, `06-command-components.md`.

## Meeting Topics (MVP)

| Topic | Underlying channel surface |
|---|---|
| Comms & Calendar | Comms & Calendar |
| Travel / Logistics | Travel / Logistics |
| Projects | Projects |
| Reports & Artifacts | Reports & Artifacts |
| General Command Center review | Command Center |

## Meeting Launcher

The Meetings entry in the left nav opens the launcher screen. The launcher also appears as a zone on the Command Center.

### Launcher layout

```text
Header: Meetings · Pick a topic to start a focused session

Meeting Launch Cards (one per topic):
  [ Topic name ]
  [ Status chip: what's prepared ]
  [ open approvals · artifacts · last update ]
  [ Primary: Open meeting ]    [ Secondary: Open channel surface ]
```

### Card fields

Per `06-command-components.md` Meeting Launch Card:

- topic name
- prepared status summary (plain English)
- open approvals count (hidden when zero)
- artifact count (hidden when zero)
- last relevant update
- primary command: `Open meeting`
- secondary command: `Open <channel surface>` (routes to standing surface instead of opening a session)

### Empty/loading/error

| State | Behavior |
|---|---|
| Loading | Card shells with skeleton chips |
| Empty (nothing prepared) | Card still renders with status "Nothing prepared yet — you can still open a session" |
| Degraded provider for the topic | Inline notice on the card explaining the lane is partial |
| Failed | Card shows "Open meeting (recovery)" with a calm note |

## Meeting Screen

Opening a Meeting creates or resumes a `meeting_run` and opens the Structured Interaction Surface scoped to the chosen topic.

### Screen layout

```text
Header
  Topic · Status chip · Started at · Owning agent (persona signature)
Selected Context Strip
  Plain-English summary of what this session is about and which channel data is in scope
Agenda Rail
  Step list (state per step) · "Add step" only if topic definition allows
Active Section
  Section title
  Prepared cards from the channel surface (artifact, approval, link, calendar, etc.)
  Notes & questions block (text capture — NOT a live chat thread)
  Command Button row (approve · defer · revise · open source · skip · finish)
Decisions & Follow-ups Tray
  Running list of decisions captured this session and follow-up tasks
Footer
  Save & resume later · Open completion summary (after finish)
```

### Section behavior per topic

Each topic definition declares its default agenda sections. These are starting points; the run's agenda is durable per `meeting_runs.agenda_items`.

| Topic | Default sections |
|---|---|
| Comms & Calendar | Triage summary · Drafts to approve · Calendar conflicts · Outbox status |
| Travel / Logistics | Trip status · Options to compare · Approvals (holds/bookings) · Travel brief · External links |
| Projects | Status by project · Open decisions · Artifacts · Approvals · Blockers |
| Reports & Artifacts | Recent artifacts · Pending review · Filed reports · Source links |
| General | Today's operating picture · Open approvals · Recent completions · Open notes |

### Notes & questions block

A simple text capture tied to a section. Stored as `meeting_notes` rows. Not a live chat — there is no agent response in real time during MVP. Notes may seed follow-up `agent_tasks` on session finish.

### Decisions & follow-ups tray

A running list updated as the client uses command buttons. On finish, this becomes the basis for the Completion Summary.

## Meeting Run State Machine

| State | Meaning |
|---|---|
| `draft` | Run created but no client action yet (rare — usually transient) |
| `in_progress` | Client is working through the agenda |
| `paused` | Client used "Save & resume later" |
| `completed` | Final command issued, Completion Summary created |
| `abandoned` | Run timed out or was explicitly discarded |

The Meeting Launcher reads run state on the channel preview to set the primary command label (`Open meeting`, `Resume meeting`, `Open summary`).

## Backend Dependencies

- `meeting_definitions` (per topic: default sections, allowed commands, narration scripts for future voice)
- `meeting_runs` (state, started_at, completed_at, paused_at, client_id, topic)
- `agenda_items` (per section, with linked artifact/approval IDs and per-step state)
- `meeting_notes` (free-text capture per section)
- `approvals`, `artifacts`, `link_cards` referenced by sections — read-through from the channel surface
- `agent_tasks` created from notes/follow-ups
- `completion_summaries` on finish
- `outbound_actions` queued from approval commands

A Meeting never creates a parallel data model from the channel surface; it reads and decorates the same records.

## Channel Surface ↔ Meeting Relationship

| Concern | Channel surface | Meeting |
|---|---|---|
| Reachable from | Left nav at any time | Meetings launcher / Command Center launcher zone |
| Mental model | Browse & manage this lane | Focus session for decisions on this lane right now |
| Data | Authoritative for the lane | Reads from the same records; can write decisions/notes/approvals |
| Persistence | Always-available view | Run-scoped, with durable run + agenda + notes |
| Voice (future) | No | Optional narration layer over agenda sections |

A client can move between the two freely. Opening a Meeting does not lock the channel surface; the channel surface keeps reflecting durable state.

## What Meetings Are Not

- not a live agent voice call (future-state per `10-future-voice-and-chat-layer.md`)
- not a persistent chat thread
- not a transcript surface
- not the only way to act on a channel (approvals and artifacts can be handled directly on the channel surface or in a Briefing)
- not a calendar meeting

## Future Voice / Narration Hook

Each section in a `meeting_definition` carries an optional `narration_script` field. The MVP does not render audio; a future voice layer can read these scripts as presenter notes. The visible UI must remain fully functional without narration.
