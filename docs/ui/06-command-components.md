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

MVP decision row:

- Approve
- Send for revision
- I'll handle it
- Defer, only where the workflow allows it

Do not include a chat/ask affordance in the card.

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
