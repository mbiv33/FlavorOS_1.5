# 01 · Interaction Taxonomy

FlavorOS MVP supports a visual-first interaction model. Every user-facing interaction should fit one of these types.

This taxonomy follows the current build plan priority: visualization and surfaces first, then durable state, integrations, onboarding, provider ingestion, and agent workflows.

## The Five Types

| # | Type | What it is | Primary surface |
|---|---|---|---|
| 1 | Briefing | Scheduled or recurring guided workflow for day-start, day-close, or personal context | Briefings / Structured Interaction Surface |
| 2 | Meeting | User-launched, topic-scoped client-to-agent workspace over a channel surface's data | Meetings launcher / Structured Interaction Surface |
| 3 | Approval | A prepared artifact or governed action requiring explicit client decision | Approval Card |
| 4 | Update | Quiet confirmation, completion summary, or status change | Command Center, Completion Summary, relevant Meeting |
| 5 | Escalation | Rare blocking or urgent item that needs client action | Ready-for-you zone, header/status indicator, relevant workflow surface |

There is no sixth MVP interaction type. Voice, chat, right rail, direct agent DM, and command palette are future or supporting layers, not MVP interaction primitives.

## 1. Briefing

Briefings are recurring workflow/storage frameworks presented as guided UI surfaces.

MVP briefing types:

- Morning Standup
- COB Work Day
- Goodnight

Briefings should be backed by durable workflow run state, prepared context, Client Universe/GBrain retrieval, artifacts, approvals, and completion summaries.

They are not decorative launch cards. Their job is to display the system's prepared state and capture decisions cleanly.

## 2. Meeting

Meetings are user-launched, topic-scoped client-to-agent workspaces opened from the Meetings launcher. They are not third-party calendar meetings.

MVP meeting topics:

- Comms & Calendar
- Travel / Logistics
- Projects
- Reports & Artifacts
- General Command Center review

Meetings reuse the underlying channel surface's data and show prepared work, workflow state, source/provider links, artifacts, decisions, approvals, and completion summaries for the selected topic.

The channel surfaces themselves (Comms & Calendar, Projects, Reports & Artifacts, Travel / Logistics) are standing left-nav surfaces, not Meetings. A Meeting is a focused session opened over one of them.

## 3. Approval

Approval is the canonical decision moment.

Use Approval Cards for:

- outbound communications,
- calendar commitments,
- money movement,
- travel bookings,
- sensitive relationship actions,
- irreversible provider actions,
- other governed external side effects.

Approvals must be explicit, audit-safe, and linked to source context. They may appear inside Command Center, Briefings, Meetings, artifact views, or admin/operator surfaces.

## 4. Update

Updates are quiet status and completion signals.

Examples:

- approved outbound messages were queued or sent,
- a workflow completed,
- an artifact was filed,
- a provider sync finished,
- an agent returned prepared work.

Updates should not become a notification feed. They appear where they matter: Command Center, the relevant Meeting, artifact history, completion summaries, or admin diagnostics.

## 5. Escalation

Escalations are rare. They exist when the system is blocked or the stakes require explicit client attention.

Examples:

- an approval is time-sensitive,
- provider sync failed and affects current work,
- a workflow is blocked,
- a high-stakes contact or commitment requires same-day handling,
- a governed action cannot continue without the client.

Escalations should use the smallest visible surface that solves the problem. The system should bias toward calm silence.

## What Is Not An MVP Interaction Type

- persistent chat thread
- right-rail conversation room
- voice-first call
- live transcript
- command palette workflow
- agent status conversation
- raw notification feed
- question card
- suggestion card

Future layers may wrap the same workflow data, but they must not replace the visual command system.

## Mapping To Surfaces

| Surface | Interaction types |
|---|---|
| Command Center | Updates, Escalations, Approval previews, Briefing/Meeting launch |
| Briefings | Briefing, Approval, Update, Escalation |
| Meetings | Meeting, Approval, Update, Escalation |
| Approval Card | Approval |
| Artifact Card / Viewer | Approval, Update |
| Completion Summary | Update |
| Admin Console | Update, Escalation, diagnostics |

## Default Position

Do not ask the client unless the system needs a decision, approval, or missing input that cannot be inferred safely.

When the system can proceed silently, it should. When the system cannot proceed, it should surface the smallest possible decision in the most relevant workflow surface.
