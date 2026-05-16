# 04 · Surfaces

Specs for every center-pane surface. (Right rail and Call interface have their own docs.)

---

## 4.1 Today

Default landing. The single most important screen.

### Active state — something pending

```
Good morning, client.
[● wellness pulse] Wellness: steady · Sinclair handled 14 things overnight · Khadijah's brief is ready
─────────
READY FOR YOU (2)                              ← Approval cards only — no questions
  [Approval card]   Maxine: invoice #247 to Acme
  [Approval card]   Sinclair: drafted reply to John (NTC board)
─────────
KHADIJAH'S BRIEF                               ← Synthesized master roll-up
  [text · 3-5 sentences]
  Drill into: NTC budget brief · FlourishED Q2 · Paris trip · Career pipeline
─────────
ON THE NEXT BRIEFING AGENDA (4)                ← Decisions Khadijah will walk
  • WBEZ podcast — accept?                       at the next scheduled call
  • Tuesday 4pm meeting — decline or counter?
  • FY27 line items 14, 22 — your call
  • Q2 LinkedIn cadence — confirm
  [Start morning briefing now] · scheduled 7:30 AM
─────────
TODAY'S AGENDA                                 ← Compact strip
  [time blocks]
─────────
UPCOMING TRIPS                                 ← Countdown widget if any active
  Paris · 37 days  ·  NYC · 62 days
─────────
Quietly handled · 14 things ▾                  ← Drilldown
```

### Calm state — nothing pending

```
Good morning, client.
Nothing needs you yet.
Khadijah is putting your day together.
─────────
First today: 10am NTC standup
Last night: 12 things handled quietly ▾
```

No empty cards. No "get started" CTAs. No suggestion tiles to fill space. The page gets shorter.

### Sections in detail

#### Greeting + status line

Personalized greeting + one line synthesizing wellness state, overnight activity, and brief readiness. The line adapts:

- *"Wellness: steady · Sinclair handled 14 things overnight · Khadijah's brief is ready"*
- *"Wellness: stretched a bit · Sinclair handled 6 things · Khadijah's brief flagged 2 deferrals"*
- *"Quiet morning · brief is ready"*

#### Ready for you

Renders Approval Cards in compact mode. Renamed from "Needs you" to align with the vocabulary lock — client *approves* (her verb), the agent *prepared* something (its work). She's not being asked; artifacts are ready.

If empty, the entire section doesn't render.

#### Khadijah's brief

The master COS brief. Synthesized from agent mini-briefs (project / time-bound / escalation). School-district-budget pattern: per-project briefs roll up; client reads the synthesis by default and drills only when curious.

Drill-down links open the per-project brief in Library.

#### On the next briefing agenda

**This is where ex-question-card content lives.** Items the system needs client's input on but that aren't artifact-driven (decisions about whether to take on work, which option to choose between framed alternatives, etc.) preview here as a list of agenda items.

The "Start morning briefing now" affordance launches the [Call Surface](./05-call-surface.md) on demand. If she waits, the briefing fires automatically at her configured scheduled time.

If empty, this section doesn't render.

#### Today's agenda

Compact strip showing today's events — time, title, context. Held focus blocks (Sinclair-managed) visually distinct.

#### Upcoming trips

Auto-shows when any trip is in flight. One row per trip with countdown ("37 days to go"), context, and current phase. Click jumps to Travel project Status.

#### Quietly handled

Collapsed drawer showing count of things the system handled silently overnight or during the day. Click expands; rare to expand, but the count is reassuring.

---

## 4.2 Work

Lists all in-flight projects. **No "+ New Project" affordance** — client never creates projects (Maxine does, via the PAC/PTQ pipeline).

### Landing layout

Project rows. Each row:

- Context chip (color-coded)
- Title
- Status sentence (plain English, e.g., *"Refining options · round 3"*)
- Next milestone (e.g., *"Final tee-up ~May 19"*)
- Needs-you badge if pending Approval cards exist for this project

Filterable by context, project type, status. Sortable by next-milestone date or last activity.

### Project detail — four tabs

```
Paris · June 14 · 38 days out
[Status]  [Brief]  [Decisions]  [Files (12)]
```

| Tab | Contents |
|---|---|
| **Status** | At-a-glance: where we are (plain English), what's next, what's pending client. Project-scoped Today. |
| **Brief** | Khadijah's project mini-brief, current + history. Rolls up into master COS brief. |
| **Decisions** | Chronological log of *client's* moments only — approvals, modifications, "I'll do myself" rejections, briefing decisions. Plain English. **No agent activity.** |
| **Files** | Durable artifacts (drafts, briefs, packets, contracts, debriefs). Drilldowns into Library. |

#### Status tab — phase-aware

For multi-phase projects (Travel especially), Status shows a phase indicator and a phase-specific live pane. See Travel section below.

For simpler projects, Status is just: status sentence + needs-you zone + recent decisions + next milestone.

#### Decisions tab — client-only log

This is what people normally call "Activity," reframed. The verbose agent activity log exists in the system but is Khadijah's surface, not client's.

What appears here:

- "May 7 · client approved invoice #247"
- "May 9 · client said yes to WBEZ podcast"
- "May 12 · client modified the Acme follow-up (warmer, additional details)"

What does NOT appear:

- "May 7 · Maxine queried billing API"
- "May 8 · Sinclair scanned 12 calendar invites"

#### Files tab

Durable outputs. Filter chips: `Drafts · Briefs · Packets · Invoices · Contracts · Debriefs · Research · Tee-ups`. Click any file → opens in Library.

---

## 4.3 Travel — dedicated surface under Work

Lives as a sub-item in left nav: `Work › Travel`. Travel is special because trips are long-running, multi-phase, and have prominent countdown utility.

### Travel landing — trips list with countdowns

```
TRAVEL

Paris      Jun 14    37 days, 14 hours    Phase: Planning · refining round 3
NYC        Jul 9     62 days              Phase: Planning · gathering options
Boston     Apr 22    completed            Debrief ready ▸

[+ Past trips ▾]
```

Click any trip → its project Status tab.

### Travel countdown widget on Today

Auto-shown on Today when any trip is in flight. One line per upcoming trip:

```
Paris · 37 days  ·  NYC · 62 days
```

Compact. Click any trip jumps to its Status tab. The countdown number uses a distinctive gradient treatment — this is a beloved feature, treated with weight.

### Travel project Status tab — phase-aware

```
Paris · June 14 · 37 days, 14 hours  [BIG COUNTDOWN]

Phase indicator:  ●─────●─────◐─────○─────○
                  Plan  Book  Prep  Travel Return
                  done  done  active todo  todo

[Phase-specific live pane]
```

#### Five phases

| Phase | Status pane content |
|---|---|
| **Planning** | Search-refine timeline (round 1, round 2, …), current candidates, Ripple Report preview |
| **Booking** | Tee-up bundle: pre-authenticated account links, deep-link forms, calendar holds. One-click "book all" or per-line. *client books — Scooter never books on her behalf.* |
| **Travel Prep** | Travel Brief artifact, Trip PM checklists, prep schedule |
| **Travel** *(during trip)* | Live itinerary + agenda, divergence alerts, voice-pushed reminders, geolocation-aware check-ins |
| **Return** | Travel Debrief artifact, "preferences learned" confirmations, ripple resolution status |

#### Active-Travel phase is its own UI mode

While client is on the trip, the Travel surface optimizes for in-transit interruption:

- Voice-pushed reminders dominate
- Geolocation-aware ("you've landed — confirm or report divergence?")
- Compact glance UI; can be operated one-thumbed
- Receipt ingestion happens via her texting/messaging the receipt image to the system; no UI capture button

#### Iterative search-refine loop (Planning phase)

For trips >21 days out, Scooter runs an iterative loop: search → refine → present → get direction → refine again. The Status timeline narrates this in plain English:

```
May 5  · Scooter started research — 32 candidate hotels, 4 flight pairings
May 7  · Round 1 — 12 hotels presented · client: "closer to 6th arr."
May 9  · Round 2 — 5 hotels presented · client: "$300/night ceiling, walkable to metro"
May 12 · Round 3 — Scooter narrowing within filters  ← active
~May 19 · Final tee-up — flight + hotel + transfers bundled
```

Direction-giving moments (after each round) happen during Scheduled briefings (Khadijah walks the round, client responds). Not as standalone interrupt cards.

For trips <21 days out, fall back to standard Approval Card flow with `time-sensitive` chips.

---

## 4.4 Messages

Sinclair's read of every inbox across all four contexts. Renders the data shape produced by the Universal Inbox Ingestion protocol.

### Top view — Sinclair's triage

```
┌─────────────────────────────────────────────────────┐
│ 47 items came in. 3 need you.                       │
│ Sinclair last triaged 6 minutes ago                  │
│                                                     │
│ [3 need you] [12 scheduling] [8 relationship]       │
│ [22 informational, archived] [2 newsletters]        │
└─────────────────────────────────────────────────────┘

READY FOR YOU (3)                                     ← Approval cards
  [Approval card]   Sinclair: drafted reply to John (NTC board)
  [Approval card]   Kyle: drafted follow-up to Acme intro request
  [Approval card]   Sinclair: drafted decline to Tuesday 4pm

OUTBOX  ▾                                             ← Currently queued sends
  3 approved emails sending at 4:00 PM
  1 invoice scheduled for tomorrow 9 AM

HANDLED · 44 items routed and handled ▾               ← Drilldown
```

The summary row maps directly to the protocol's `Summary` block (Total / High priority / Approval needed / Scheduling / Relationship). Free.

### Outbox indicator

Shows currently queued sends. Click to review or pull back any item before it fires. Provides safety without nag.

### Channel drilldown

Tabs across the top: `All · Email (4 accts) · SMS · Voicemail · LinkedIn DMs · IG DMs`. Items show:

- Sender, subject, body summary, timestamp
- Intent chip (`scheduling_request`, `action_required`, etc.)
- Context chip
- Routing chip (`→ Sinclair handling`, `→ Kyle relationship`)
- Click → opens source via `source_uri` (Gmail/O365/etc.)

The drilldown is a *viewer over Sinclair's work*, not a replacement for her email client. Coverage is the value, not workflow.

### Refresh model

Auto-refreshes every 15 minutes (per ingestion protocol cron) plus on `nots.incoming.comm.*` webhook push. Manual refresh available; rarely needed.

---

## 4.5 Calendar

Compact agenda strip on Today; dedicated full view available under nav.

- Events tied to a project show with project chip
- Click event → jumps to project Status
- Sinclair-held holds are visually distinct (e.g., dotted border, soft fill)
- Color-coded by context
- Travel days marked with route chip ("Paris ✈")
- Briefings (morning, COB, ad-hoc) show as call-style events with Khadijah avatar

The full Calendar surface supports day / week / month views. Default is the week view starting Monday.

---

## 4.6 Library

All durable artifacts produced by the system. Cross-context, searchable.

### Filters

Filter chips:
- `Drafts · Briefs · Packets · Invoices · Contracts · Debriefs · Research · Tee-ups`
- Plus: per-context, per-project, by persona attribution, by date range

Each artifact shows:
- Title
- Persona attribution
- Created date
- Current status (sent / queued / superseded / final / archived)
- Source context + project chips

### Click → focused viewer

Click any artifact → focused viewer with:
- Full artifact rendered
- Edit affordance (per vocabulary: client *edits* — she's not the agent, she's not modifying via the Modify subform)
- Re-send (for past sent comms; opens a new draft based on this)
- Versions (if there are prior versions, e.g., a Modify v1 → v2 chain)
- Decisions trail (when was it approved, by what input)

---

## 4.7 Preferences

Grouped by life-domain, not by app. This is the right axis for an executive's cognition — she thinks "I prefer to fly direct" more than "I want to set the airline-API connector setting."

```
PREFERENCES

Travel
  Transportation prefs (direct flights, aisle seat, …)
  Lodging prefs (neighborhood, brand loyalty, ceiling)
  Dining prefs (dietary, price, ambiance)
  Time prefs (departure windows, jet lag tolerance)

Work
  Focus blocks (when, how long, what triggers them)
  Communication preferences (response cadence, batch send timing)
  Escalation thresholds (what counts as urgent)

Wellness
  Stress signals to watch (back-to-backs, late nights, missed meals)
  Recovery rules (cool-down after big events)
  Holds (when to protect calendar)

General
  Notifications (push, sound, haptic)
  Voice mode default (push-to-talk vs always-on)
  Contexts setup (configure / add / rename life-streams)
```

### Preferences are shared across contexts unless explicitly scoped

Default: a preference applies everywhere. If she wants context-scoped (e.g., "more formal tone in W2 Work, casual in Personal"), she explicitly scopes the preference.

---

## 4.8 ⌘K palette

Keyboard-first power surface.

- Search anything: artifacts, contacts, projects, settings, briefings
- Execute any action: compose, schedule a meeting, ask agent, navigate, jump to project
- External account quick-launches live here (Amex Travel, Hilton Honors, NTC board portal, etc.) — *not* in primary nav
- Voice equivalent: "FlavorOS, find …" / "FlavorOS, jump to …"

Power-user surface. Not required to use the system; everything is accessible via UI clicks. But for keyboard-first users, this is the fastest path.
