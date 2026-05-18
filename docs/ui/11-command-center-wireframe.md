# 11 · Command Center Wireframe

The Command Center is the default client landing surface after login. It is the operating picture: what is ready, what needs attention, what changed, what's launchable next.

This document defines the wireframe, zones, card placement, empty-state behavior, and the durable data each zone expects.

Controlling docs: `docs/planning/current_build_plan.md`, `02-information-architecture.md`, `04-app-surfaces.md`, `06-command-components.md`.

## Goals

- One screen the client can scan in under thirty seconds to know the state of their day.
- Every visible card is backed by a durable record or a deliberate placeholder while a backing record is being built.
- Calm by default: empty zones disappear; noisy counters do not.
- No persistent chat, voice orb, live transcript, or right rail.

## Layout

```text
+----------+--------------------------------------------------------------+
| LEFT NAV | HEADER / STATUS STRIP                                        |
|          +--------------------------------------------------------------+
| Command  |  ZONE 1  Today / Operating Picture                            |
| Briefings|                                                              |
| Meetings |  ZONE 2  Needs Attention            ZONE 8  Briefing Launcher |
| Comms &  |                                                              |
|   Cal    |  ZONE 3  Updates                    ZONE 9  Meeting Launcher  |
| Projects |                                                              |
| Reports  |  ZONE 4  Projects                                            |
|   & Art  |                                                              |
| Travel   |  ZONE 5  Comms & Calendar           ZONE 7  Travel / Logistics|
| Settings |                                                              |
|          |  ZONE 6  Reports & Artifacts                                  |
+----------+--------------------------------------------------------------+
```

The layout is a two-column main region under the header. Briefing Launcher and Meeting Launcher live in the right column at the top of the scroll, alongside Needs Attention and Updates, so the client can both see ready work and start a session in the same eye-line. Lower zones (Projects, Comms & Calendar, Reports & Artifacts, Travel / Logistics) stretch across both columns and act as channel-surface previews.

On narrower viewports the layout collapses to a single column in the order: Today → Needs Attention → Briefing Launcher → Meeting Launcher → Updates → Projects → Comms & Calendar → Reports & Artifacts → Travel / Logistics.

## Zones

### Zone 1 · Today / Operating Picture

The top-of-page calm summary.

Shows:

- date and greeting
- next major event or focus block (plain English)
- day status (e.g. "Morning Standup ready", "On track", "Quiet")
- active briefing status (ready / in progress / completed / not prepared)
- urgent blockers, if any (otherwise hidden)

Empty rule: this zone always renders. If nothing is ready, it shows the date, a calm greeting, and the next scheduled briefing.

Data expected:

- `clients.id`, `clients.display_name`, `clients.timezone`
- next event/focus from normalized calendar items
- latest `briefing_runs` row for today
- escalation records linked to current `client_id`

### Zone 2 · Needs Attention

Surfaces what is blocking the client.

Shows, in priority order:

- approvals waiting on client (Approval Cards, compact density)
- client questions raised by an agent (still routed through Briefing/Meeting agendas; only shown here when escalated)
- missing information the system needs
- blocked work the client can unblock
- time-sensitive items

Max five cards. Overflow expands into the relevant channel surface or Briefing.

Empty rule: if zero items, the entire zone hides.

Data expected:

- `approvals` where `state = needs_approval` and `client_id` matches
- escalations table / `workflow_runs.state = blocked`
- onboarding readiness gaps where the client must act

### Zone 3 · Updates

Quiet confirmation feed of completed agent work.

Shows, newest first:

- completed agent work
- new artifacts ready for review
- provider sync changes that affect current work
- project changes (status flips, milestone reached)
- relevant communications/calendar updates the client should know about

Each row is an Update entry (interaction type 4 from `01-interaction-taxonomy.md`), not a notification. No badge counter.

Max seven items, with an "open completion history" link if more exist.

Empty rule: if zero items in the last 24h, the zone hides.

Data expected:

- `completion_summaries` for today
- `artifacts` with `created_at` in window
- `provider_sync_events` with client-visible impact
- `projects` status diffs
- `outbound_actions` with `state in (executed, queued, failed, pulled_back)`

### Zone 4 · Projects

Channel-surface preview for Projects.

Shows up to four active project cards:

- title
- status chip
- owning agent (Khadijah typically)
- next step (plain English)
- blocked / unblocked state
- due date if relevant

A "Open Projects" command at the bottom routes to the full channel surface.

Empty rule: if no active projects, hide. If exactly one, show it full-width.

Data expected:

- `projects` where `client_id = current` and `state != archived`
- next-step derived from latest `project_tasks` or `workflow_runs`

### Zone 5 · Comms & Calendar

Channel-surface preview.

Shows:

- priority messages prepared for review
- draft responses pending approval
- calendar conflicts
- upcoming meeting in next 4h
- schedule risks

Up to five items. "Open Comms & Calendar" command routes to full surface.

Empty rule: if nothing prepared and no conflicts in the next 24h, hide.

Data expected:

- normalized communication items flagged priority
- `artifacts` of type `communication_draft` with `state = ready_for_approval`
- `calendar_items` in conflict state
- next `calendar_items.start_at` within window

### Zone 6 · Reports & Artifacts

Channel-surface preview.

Shows:

- latest generated artifacts (ready for review or filed)
- pending-review artifacts
- recent reports
- recent summaries

Up to four items. "Open Reports & Artifacts" command routes to full surface.

Empty rule: if no artifacts in the last 7 days and none pending, hide.

Data expected:

- `artifacts` where `visibility = client` and `created_at` in window
- `artifacts` where `state in (ready_for_review, needs_revision)`

### Zone 7 · Travel / Logistics

Channel-surface preview. Retained but not the first proof loop.

Shows:

- upcoming trips (next 30 days)
- itinerary status
- research items in progress
- logistics blockers

Up to three items. "Open Travel / Logistics" command routes to full surface.

Empty rule: if no upcoming trips and no active research, hide.

Data expected:

- `trips` with `start_at` in window
- `artifacts` of type `travel_*` with relevant state

### Zone 8 · Briefing Launcher

Three Briefing Launch Cards stacked, one per briefing type:

- Morning Standup
- COB Work Day
- Goodnight

Each card shows:

- briefing name
- prepared status: `ready` / `in progress` / `completed` / `not prepared`
- scheduled or suggested time
- prepared topic count
- approval count involved
- primary command: `Start` (or `Resume` / `Open summary` based on state)
- secondary command where applicable: `Defer` / `Reschedule`

Empty rule: always renders all three cards. State chips reflect readiness.

Data expected:

- `briefing_runs` for today, one per briefing type
- `agenda_items` count linked to that run
- linked `approvals` count

### Zone 9 · Meeting Launcher

Topic-scoped Meeting Launch Cards:

- Comms & Calendar
- Travel / Logistics
- Projects
- Reports & Artifacts
- General Command Center review

Each card shows:

- topic name
- prepared status summary
- open approvals count
- artifact count
- last update
- primary command: `Open meeting`

Up to five cards. Always renders, since starting a meeting is a deliberate client action and the launcher is how the client initiates one.

Data expected:

- aggregate state from the corresponding channel surface
- last `workflow_runs` or `artifacts.updated_at` for that lane

## Header / Status Strip

Per `02-information-architecture.md` §Header. Recommended slots:

- product mark
- context selector (hidden for single-context clients)
- next relevant event / focus state line
- ready-for-you count (hidden when zero)
- provider/system alert (only when current work is affected)
- profile / admin mode switch

The header never exposes agent internals, raw routing, SIGMA vocabulary, or provider payloads.

## Card Density And Placement Rules

- Approval Cards in Needs Attention use compact density. Expanded review happens inside the source Briefing/Meeting or on a focused artifact view.
- Channel-surface previews (Zones 4–7) use compact channel cards, not full Approval Cards.
- Briefing and Meeting Launch Cards use medium density so prepared status, counts, and the primary command are all scannable.
- No zone shows more than what its rule above specifies; overflow lives on the channel surface.

## State Behavior

| Surface state | Behavior |
|---|---|
| Loading | Skeleton placeholders per zone; zone shells render even before data arrives |
| Empty (per-zone rules) | Zone hides entirely (except Zone 1 and Zone 8) |
| Degraded provider | Provider/system alert slot in header; affected zones keep rendering with a small inline notice on the impacted card |
| Failed workflow | Surfaces as an entry in Updates (Zone 3) with a "Retry" or "Open in Admin" command depending on role |
| Onboarding incomplete | Command Center routes the client to Onboarding first; partial Command Center is not shown |

## What Command Center Is Not

- not a notification feed
- not a chat or DM surface
- not a full inbox replacement
- not a full calendar replacement
- not an agent activity log
- not a place to expose PAC/PTQ, SIGMA, skill names, routing traces, or raw provider payloads

## Data Summary

The Command Center reads from (at minimum):

| Source | Used by zones |
|---|---|
| `clients`, `client_universe` | Zone 1 header line, context selector |
| `approvals` | Zones 2, 8, 9 (counts) |
| `workflow_runs`, `agent_tasks` | Zones 2, 3, 8, 9 |
| `artifacts` | Zones 3, 5, 6, 9 |
| `projects`, `project_tasks` | Zones 3, 4, 9 |
| `calendar_items`, normalized communication items | Zones 1, 5 |
| `trips` (+ travel artifacts) | Zone 7 |
| `outbound_actions` | Zone 3 |
| `briefing_runs`, `agenda_items` | Zones 1, 8 |
| `completion_summaries` | Zone 3 |
| `provider_sync_events`, `provider_connections` | Header alert, inline zone notices |

Each card on Command Center maps to one of these records. If a card cannot map, it does not render.
