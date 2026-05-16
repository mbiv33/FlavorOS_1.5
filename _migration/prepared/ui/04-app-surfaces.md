# 04 · App Surfaces

Status: prepared migration candidate.

This document rewrites the old `04-surfaces.md` intake into the approved FlavorOS 1.5 MVP UI architecture. It is not canon until moved out of `_migration/prepared/` by explicit approval.

## Source Material

- `_migration/decisions.md`
- `_migration/analysis/decision_delta.md`
- `_migration/intake/old_ui/docs/prd/ui/04-surfaces.md`
- `_migration/intake/old_ui/docs/prd/ui/00-principles-and-vocabulary.md`
- `_migration/intake/old_ui/docs/prd/ui/03-approval-card.md`

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

## Surface Map

| Old Surface | FlavorOS 1.5 MVP Surface | Treatment |
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

Launch surfaces must not expose agent internals, workflow traces, SIGMA state, provider implementation details, or old voice-first concepts.

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

Replaces old `Today`.

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

Combines old Messages and Calendar. This is not a full inbox or full calendar replacement.

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

Rewrites old Travel into a structured review and command surface.

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

Rewrites old Work.

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

Rewrites old Library.

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

Reframes old Preferences.

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

- Preserve the old calm dashboard, approval, artifact, status, and source-link thinking.
- Remove the old assumption that a right rail or live call is the center of interaction.
- Treat old voice/chat/call UI as future-state, documented separately in `10-future-voice-and-chat-layer.md`.
