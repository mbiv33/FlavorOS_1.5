# 02 · Information Architecture

Layout, header strip, navigation, and the context model.

---

## Layout — three-pane bridge

```
┌────────────────────────────────────────────────────────────────────┐
│ HEADER                                                             │
├──────────────┬─────────────────────────────────┬───────────────────┤
│  LEFT NAV    │  CENTER SURFACE                 │  RIGHT RAIL       │
│              │  (Today / Work / Messages /     │  (persistent      │
│  profile     │   Calendar / Library /          │   chat threads    │
│  + nav       │   Preferences)                  │   + voice orb     │
│              │                                 │   + composer)     │
│              │  swaps based on left-nav        │  ALWAYS PRESENT   │
└──────────────┴─────────────────────────────────┴───────────────────┘
```

- **Left nav** — primary navigation. Profile anchor at top.
- **Center surface** — dynamic, swaps based on left-nav selection. Default: Today.
- **Right rail** — always-present. Three threads (Group / Sinclair / Khadijah) stacked, single composer targets active thread, voice orb above.
- **Header** — status strip, always visible.

### Mobile collapse order

1. Left nav → hamburger first (less essential than chat)
2. Right rail → docked toggle (chat is too core to remove entirely; collapses to a tab)
3. Header → unchanged; status strip remains visible

The Call Surface (when active) takes over the right rail entirely on desktop and goes full-screen on mobile. See [05-call-surface.md](./05-call-surface.md).

---

## Header strip

Sticky top bar. Information-dense but quiet — earns its real estate by replacing navigation client would otherwise do.

### Slot layout

```
[Wordmark]  [Context ▾]  "Next: 10am NTC standup, in 24min"
                                     [● wellness] [⚡ N need you] [🎙 voice ▾] [⌘K]
```

### Slots

| # | Slot | Content | Behavior |
|---|---|---|---|
| 1 | Wordmark | "FlavorOS" | Click → Today |
| 2 | Context selector | Dropdown of configured contexts ("All / W2 Work / LLC Work / Career / Personal" or any subset) | **Hidden entirely if user has 1 context.** Filtering scopes the entire app — Today, Work, Messages, Calendar all narrow. |
| 3 | Next-event line | Plain English: *"Next: 10am NTC standup, in 24min"* / *"Focus block until noon"* / *"Free until 2pm"* | Replaces glancing at calendar |
| 4 | Wellness pulse | Small ambient indicator. Steady glow = baseline. Soft pulse = elevated stress. | Click → Wellness surface |
| 5 | Needs-you badge | Count of pending Approval cards. Shows live count. | Click opens Ready-for-you queue inline. **Hidden when zero.** |
| 6 | Voice state | Idle / listening / processing icon | Dropdown → push-to-talk vs always-on toggle, target persona |
| 7 | System alert chip | Conditional. Auth expired / sync failed / agent stuck. Color-coded. | Only renders when there's something wrong. Never persistent decoration. |
| 8 | ⌘K palette | Search artifacts, contacts, projects, settings. Execute any action. | Keyboard-first power surface |

### Header replaces dashboards

The header IS the status surface. Status is a sentence, not a chart.

---

## Information architecture (left nav)

```
Today                  ← default landing
Work                   ← projects + in-flight loops (client never creates)
  └─ Travel            ← dedicated travel surface with countdowns
Messages               ← Sinclair's triaged inbox view + raw drilldown
Calendar               ← agenda + commitments
Library                ← all durable artifacts, searchable
Preferences            ← life-domain (Travel / Work / Wellness / General)
⌘K                     ← palette; quick-launches and external links live here
```

### Notable absences

- **No "Team" or agent-status surface for client.** Agent health is admin/Khadijah's view. The header system-alert chip surfaces system trouble; otherwise the agents are invisible.
- **No "Notifications" inbox.** Updates live in their relevant threads; Escalations come through the header badge; everything else is invisible.
- **No "Settings" separate from Preferences.** Preferences is grouped by life-domain (Travel / Work / Wellness / General), which is the right axis for an executive's cognition — not a generic app settings tree.

### Why "Work," not "Projects"

client doesn't *create* projects — Maxine does, via the PAC/PTQ pipeline. The label "Projects" implies user-created units; "Work" matches reality: things happening on her behalf, organized into project containers Maxine spins up. There is no "+ New Project" affordance anywhere.

---

## Context model

client has multiple life-streams (called *contexts*):

```
W2 Work     = NTC day job
LLC Work    = FlourishED Strategies (consulting practice)
Career      = personal brand, public profile, professional development
Personal    = household, family, friends, private life
```

Each context has its own accounts (email, social, phone, websites). All accounts feed into a unified data layer (Unified KB, Unified Context, Unified Memory) — the UI renders views over that unified layer.

### Design principles for contexts

1. **Configurable, not hardcoded.** client declares her contexts during onboarding. The UI adapts to whatever she has — 1 context or 6.
2. **Filter, don't fragment.** A single inbox view with context filter chips, not five separate inboxes. Single project list with context chip on each item. Single calendar with color-coded contexts.
3. **Single-context users see no chrome.** If only one context is configured, the context selector is hidden entirely. No empty dropdown, no "All" prefix.
4. **Context fatigue is a real failure mode.** Don't make her think about contexts more than she has to. Default to "All" view; she scopes to a single context only when she chooses to focus.

### Where contexts surface

- Header context selector (hidden if 1)
- Context chip on every artifact, project, message, calendar event
- Filter affordance on Work, Messages, Calendar, Library
- Preferences are shared across contexts unless explicitly scoped

### Underlying file model

Each context lives on client's client profile:

```
clients/test-client/
  contexts/
    w2-ntc/       (channels: emails, social, phones, websites)
    llc-flourished/  (channels: emails, social, phones, websites)
    career/       (channels: speaking, writing, podcasts, social)
    personal/     (channels: family email, social)
```

The context selector reads this file. Adding/removing/renaming a context = updating the profile, not the UI. The UI never hardcodes context labels.

---

## Surfaces and their purpose

Brief one-liner per surface. Full specs in [04-surfaces.md](./04-surfaces.md).

| Surface | Purpose |
|---|---|
| **Today** | What's pending you · Khadijah's master brief · today's agenda · trip countdowns |
| **Work** | All in-flight projects · per-project Status / Brief / Decisions / Files |
| **Travel** *(under Work)* | Trips list with countdowns · per-trip 5-phase progress |
| **Messages** | Sinclair's triage of inbound comms · raw inbox drilldown |
| **Calendar** | Compact agenda strip + dedicated full view |
| **Library** | Every durable artifact, searchable |
| **Preferences** | Life-domain configuration |
| **⌘K** | Search + execute anything |
