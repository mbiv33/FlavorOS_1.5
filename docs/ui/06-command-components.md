# 06 · Command Components

This document defines reusable command-and-control components for the MVP.

Command components are the primary way users act on workflow state in the visual MVP.

## Core Decision

The MVP needs reusable command components more than conversational surfaces.

No MVP screen should require:

- persistent right rail
- agent DM room
- chat composer
- voice orb
- live transcript
- command palette

## Component Priority

### Command Button

Triggers workflow, navigation, approval, artifact, provider action, deferment, revision, escalation, or completion.

Required fields:

- label
- command type
- target object id
- client id / tenant id
- required permission
- HITL requirement
- disabled/loading/completed state

Command types:

- launch briefing
- launch meeting
- approve
- defer
- revise
- escalate
- open artifact
- open provider link
- queue outbound action
- pull back queued outbound action
- complete step

### Approval Card

Presents prepared work requiring user decision.

Preserve in the canonical component:

- one canonical component per decision
- compact and expanded density
- stakes chips
- artifact preview
- optional ripple/impact explanation
- clear post-approve state

MVP decision row (canonical wording lives in `03-approval-card.md`):

- Approve
- Modify
- I'll do myself
- Defer, only where the workflow allows it

These four labels map to `approval_requests.decision_required` values `approve`, `revise`, `handle_self`, and `defer`. The Modify button opens the 3-axis structured subform (Tone / Format / Sender request) defined in `03-approval-card.md` and persists the selections to `approval_decisions.revision_request`.

The "I'll do myself" label adapts to artifact type per `03-approval-card.md` ("I'll edit & send" for drafts, "I'll do it myself" for actions).

Do not include a chat/ask affordance in the card.

**Open source** is not part of the decision row. When `client_artifacts.source_links[]` is non-empty, render a separate Link Card affordance below the decision row.

### Artifact Card

Displays prepared output, report, draft, packet, recommendation, travel option, or meeting brief.

Required fields:

- artifact id
- artifact type
- title
- status
- source context
- created by workflow/agent
- visibility
- approval requirement
- updated at

Actions:

- open
- review
- approve where applicable
- revise where applicable
- open source/provider link

### Dialog Step Block

Presents one configured step inside a Briefing or Meeting.

Required fields:

- step id
- title
- prepared context
- prompt or decision
- allowed commands
- linked artifacts
- linked approvals
- state

### Link Card

Opens a source/provider/app/resource.

Required fields:

- label
- provider
- destination uri
- source object id
- permission status
- risk level

Usage examples:

- Gmail source message
- Google Calendar event
- Google Docs / Sheets / Slides file
- travel provider booking page
- project management item
- external report/document

### Meeting Launch Card

Opens a channel-specific Meeting.

Meeting types:

- Comms & Calendar
- Travel
- Projects
- Reports & Artifacts

Required fields:

- meeting type
- prepared status
- open approvals count
- artifact count
- last updated
- primary command

### Briefing Launch Card

Starts Morning Standup, COB Work Day, or Goodnight.

Required fields:

- briefing type
- scheduled/default time
- prepared status
- agenda item count
- approval count
- primary command

### Completion Summary

Confirms decisions made and workflows triggered.

Required fields:

- workflow or interaction id
- decisions captured
- approvals made
- revisions requested
- deferrals
- artifacts opened/created
- provider actions queued
- next expected update

### Status Chip

Shows state, risk, urgency, or completion status.

Common statuses:

- ready
- pending approval
- in progress
- queued
- scheduled
- sent
- deferred
- needs revision
- blocked
- completed
- high stakes
- time sensitive

## Shared Component Rules

- Components must be tenant-scoped.
- Components must be backed by durable state where they represent workflows, artifacts, approvals, providers, or outbound actions.
- Components must not expose SIGMA internals.
- Components must not expose PAC/PTQ, routing metadata, skill names, or raw agent logs to the client.
- Components should prefer plain English.
- Components should support admin diagnostics separately from client-facing presentation.
- Components should be reusable across Command Center, Briefings, Meetings, and Admin Mode.

## Card System (Unified)

All cards on Command Center, Briefings, Meetings, channel surfaces, and the Admin Console derive from a single base shape. Specialized card types extend it with extra fields.

### Base card fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Stable durable record id |
| `client_id` | yes | Tenant-scoped |
| `card_kind` | yes | `approval` / `artifact` / `project` / `calendar` / `link` / `briefing_launch` / `meeting_launch` / `update` / `completion_summary` |
| `title` | yes | Plain-English |
| `status` | yes | From the Card Status Vocabulary below |
| `priority` | no | `urgent` / `high` / `normal` |
| `urgency_reason` | no | One-line plain-English explanation when priority is `urgent` |
| `needs_attention` | no | Boolean; if true, eligible for Command Center Zone 2 |
| `update_type` | no | For Update cards: `completion` / `sync` / `status_change` / `artifact_ready` / `outbound` |
| `agent_attribution` | no | Khadijah / Sinclair / Regine when useful; never raw task ids |
| `project_id` | no | Linked project when relevant |
| `provider_source` | no | e.g. `gmail`, `gcal`, `gdocs`; never raw provider payload |
| `due_at` | no | When relevant |
| `requested_action` | no | Plain-English action being asked of the client |
| `artifact_id` | no | Link to a Client Artifact when present |
| `approval_id` | no | Link to an approval when present |
| `source_link` | no | Link Card payload (uri, label, permission status) |
| `completion_state` | no | `pending` / `completed` / `failed` / `pulled_back` |
| `audit_meta` | no | Audit-safe metadata: who, when, run id, version — display where appropriate, never raw routing |
| `context_id` | no | Client context chip when client has more than one context |

### Card Status Vocabulary (client-facing)

Plain-English only. The list below is the canonical vocabulary; component code should map internal states to one of these for display.

- Needs review
- Ready to approve
- Waiting on you
- Blocked
- In progress
- Draft ready
- Ready for briefing
- Completed
- Sent
- Queued
- Failed
- Pulled back

Internal states (e.g. `ready_for_approval`, `needs_revision`, `state = blocked`) map to these labels at render time. Internal vocabulary never appears in client UI.

### Density

| Density | Use |
|---|---|
| Compact | Command Center zones, channel-surface previews, agenda rails |
| Medium | Channel surfaces, Briefing/Meeting Launch cards |
| Expanded | Focused viewers (artifact viewer, approval expanded review) |

A card switches density based on the surface, not the data. The same record can render compact on Command Center and expanded inside a Briefing without two component definitions.

### Per-card-kind extensions

| Kind | Extensions over base |
|---|---|
| `approval` | Stakes chip set, ripple/impact text, decision row (Approve / Send for revision / I'll handle it / Defer), pre/post-decision state |
| `artifact` | Type, version, preview body, visibility |
| `project` | Status chip, next step, blockers, due date, owner agent |
| `calendar` | Start/end, participants (plain-English), conflict flag |
| `link` | Provider, destination uri, permission status, risk level |
| `briefing_launch` | Briefing type, scheduled time, prepared topic count, approval count, primary command label per state |
| `meeting_launch` | Topic, prepared status summary, approval count, artifact count, last update, primary/secondary command |
| `update` | Update type, when, link back to source surface |
| `completion_summary` | Decisions captured, approvals made, deferrals, artifacts opened/created, outbound actions queued, next expected update |

## Card Surface States

Every card-bearing surface declares behavior for these four states. Surface specs in `11-`–`15-` reference this table.

| State | Card behavior |
|---|---|
| Loading | Skeleton outline matching final density; no spinner takeover; surface shell renders |
| Empty | Collapsible zones hide entirely; non-collapsible zones render with a single plain-English line, never filler cards |
| Error | Affected cards show an inline calm error with a "Try again" or "Open in Admin" command depending on role; surface continues to render other zones |
| Degraded | Affected cards keep rendering with an inline notice; provider degradation also surfaces in the header alert slot when current work is impacted |

Surfaces must not block the whole screen on a single zone's failure.

## What Is Archived From The Old Right Rail

Archived/future-state:

- three persistent chat threads
- active/collapsed right-rail chat
- single global composer
- voice orb
- direct agent DM behavior
- group agent room
- chat-based inline approvals

Preserved as component ideas:

- inline approval reuse
- visible target/context labels
- quiet status
- compact previews
- consistent command affordances
