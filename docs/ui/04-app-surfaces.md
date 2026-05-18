# 04 · App Surfaces

This document defines the approved FlavorOS 1.5 MVP app surfaces.

It follows `docs/planning/current_build_plan.md`: visualization and surfaces are the first build priority, and these surfaces must be able to show durable workflow, artifact, approval, provider, and Client Universe state.

## Controlling Rule

The MVP app is a visual, structured command-and-control WebApp.

It should feel like:

```text
Open the dashboard.
Pick the work mode.
Review what the system prepared.
Click what should happen next.
```

It should not feel like:

```text
Open the app and talk to agents.
```

## Canonical Flow

```text
App Launch
-> Login / Sign Up
-> Client Onboarding
-> Command Center
-> Briefings / Meetings
-> Channel-Specific Screens
-> Commands / Approvals / Artifacts
-> Completion Summary
```

## Migration Map

This table is a migration reference only. The MVP surfaces below are the canonical app model.

| Prior concept | FlavorOS 1.5 MVP Surface | Treatment |
|---|---|---|
| Today | Command Center Dashboard | Rewrite |
| Work | Projects Meeting | Rewrite |
| Travel | Travel Meeting | Rewrite |
| Messages + Calendar | Comms & Calendar Meeting | Combine and narrow |
| Library | Reports & Artifacts Meeting | Rewrite |
| Preferences | Settings/Admin/Profile | Move out of core MVP |
| Command Palette | Future-state power-user layer | Archive |
| Right Rail | Future-state or command components | Replace |
| Call Surface | Structured Briefing/Meeting Surface | Rewrite |

## 1. App Launch

The first app surface should establish identity, tenant context, and whether the user enters Client Mode or Admin Mode.

MVP screens:

- Login
- Sign Up
- Client Onboarding

Launch surfaces must not expose agent internals, workflow traces, SIGMA state, provider implementation details, or voice-first concepts.

## 2. Client Onboarding

Onboarding gathers the minimum client profile and provider setup needed to personalize the Command Center.

Required onboarding outcomes:

- authenticated user
- selected or created tenant/client
- client profile baseline
- initial context/life-stream labels where needed
- provider connection prompts
- approval posture defaults
- briefing preferences

Onboarding should be guided and button-led. Avoid chat-style onboarding.

## 3. Command Center Dashboard

Command Center is the default client landing surface.

Purpose:

- show what is ready for the client
- launch Briefings
- launch Meetings
- surface prepared artifacts and approvals
- show quiet status without turning into an activity feed

Primary zones:

- greeting/status line
- Ready for You approval zone
- briefing launch cards
- meeting launch cards
- prepared artifacts
- external link cards
- recent completion summaries

Empty-state rule:

- if a zone has no useful content, do not render placeholder clutter
- calm dashboard means less content, not filler content

The Command Center should not include:

- persistent chat
- voice orb
- live transcript
- raw agent activity
- notification feed
- full calendar replacement
- full inbox replacement

## 4. Briefings

Briefings are preconfigured guided flows, usually scheduled or recurring. They are not necessarily live calls.

For build purposes, Briefings are also workflow/storage frameworks. They must be backed by workflow run state, prepared agenda items, Client Universe/GBrain context, artifacts, approvals, provider/source links where relevant, and completion summaries.

MVP Briefing Types:

- Morning Standup
- COB Work Day
- Goodnight

Briefing launch cards should show:

- briefing name
- scheduled or suggested time
- key prepared topics
- count of approvals/artifacts involved
- primary command: start
- secondary command: defer/reschedule where applicable

Briefing screens should contain structured dialog steps, prepared context, approval cards, artifact cards, and a completion summary.

Briefing screens should not be static scripts or decorative launchers. Their job is to display prepared system state correctly.

## 5. Meetings

Meetings are user-initiated workspaces for specific work channels. They are not calendar meetings by default.

MVP Meeting Types:

- Comms & Calendar
- Travel
- Projects
- Reports & Artifacts

Meeting launch cards should show:

- channel name
- what the system prepared
- open decisions
- available artifacts
- last relevant update
- primary command: open meeting

## 6. Comms & Calendar Meeting

Combines communication and schedule review. This is not a full inbox or full calendar replacement.

Comms & Calendar is the first proof lane for provider ingestion, normalization, artifacts, approvals, and approval-gated outbound write-back.

Purpose:

- review communication and schedule-related prepared work
- approve, defer, revise, or open source/provider links
- show selected calendar context needed for the workflow

Included:

- triage summary
- approval cards for drafted responses or calendar holds
- outbox/status cards
- link cards to provider sources
- schedule conflict cards
- completion summary

Excluded:

- raw inbox replacement
- full calendar management UI
- persistent agent DM thread

## 7. Travel Meeting

Travel is a structured review and command surface.

Travel / Logistics is retained as an MVP surface and future-capable workflow lane, but it is not the first proof loop unless explicitly promoted for demo needs.

Purpose:

- review travel options
- compare prepared plans
- approve or defer travel-related actions
- open external booking/provider links
- review travel artifacts

Included:

- current trips list
- phase/status chip for each trip
- option/artifact cards
- approval cards for holds, bookings, or recommendations
- travel brief artifact
- external link cards for airline/hotel/provider actions
- completion summary

Excluded from MVP:

- geolocation-aware travel mode
- active in-trip interruption mode
- always-on voice reminders
- full travel operations replacement

## 8. Projects Meeting

Projects is a structured status, artifact, and approval surface.

Purpose:

- review prepared project status
- inspect project artifacts
- approve project-related actions
- review decisions and next commands

Included:

- project rows/cards
- status chips
- prepared project brief
- artifact cards
- approval cards
- command buttons for approve, defer, revise, escalate, open source
- client-only decision history

Excluded:

- arbitrary user-created projects
- raw agent task logs
- agent status dashboard

## 9. Reports & Artifacts Meeting

Reports & Artifacts is the review surface for generated work product.

Purpose:

- make generated work product visible, reviewable, and actionable
- provide focused artifact viewing
- show decisions and versions where relevant

Included:

- artifact list/cards
- filters by artifact type, context, project, status
- focused artifact viewer
- approval status
- source/provider link cards
- completion summaries

Excluded:

- backend SIGMA visibility
- raw file browser
- agent memory browser

## 10. Settings/Admin/Profile

Settings, Admin, and Profile are operational surfaces, not the center of client work.

Settings are useful, but not a core client work surface.

Settings/Profile may contain:

- profile data
- notification posture
- provider connection controls
- approval preferences
- briefing preferences
- tenant/account context

Admin Mode may contain:

- test app
- configure agents
- add/update skills
- monitor functionality
- provider sync status
- GBrain/SIGMA health
- workflow monitor
- artifact/approval queue

## Component Expectations

All app surfaces should compose from the reusable command components defined in `06-command-components.md`.

Priority components:

- Command Button
- Approval Card
- Artifact Card
- Dialog Step Block
- Link Card
- Meeting Launch Card
- Briefing Launch Card
- Completion Summary
- Status Chip

## Migration Notes

- Preserve calm dashboard, approval, artifact, status, and source-link behavior.
- Do not treat right rail, live call, or persistent chat as the center of interaction.
- Treat voice/chat/call UI as future-state, documented separately in `10-future-voice-and-chat-layer.md`.
