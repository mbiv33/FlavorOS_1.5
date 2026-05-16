# 05 · Call Surface

The voice-first interface for **Scheduled** interactions — briefings, COB wind-downs, project deep-dives, decision sessions, deeper wellness checks.

> Briefings are **calls**, not text walk-throughs. Voice is the primary medium. Khadijah leads, Sinclair interprets, client responds. The Call Surface is what makes that work.

---

## When the Call Surface activates

- client clicks "Start morning briefing now" on Today
- client or an agent dials in via voice trigger
- A scheduled briefing fires automatically at her configured time
- An ad-hoc scheduled meeting (e.g., "30 min Wed 2pm w/ Khadijah") begins per calendar

When a call is active, the surface takes over the right rail (desktop) or goes full-screen (mobile). Other interactions pause until the call ends.

---

## Anatomy

```
┌─────────────────────────────────┐
│ ● Live · Morning Briefing       │  ← Call header
│ [KJ][SJ] · 4 min                │
├─────────────────────────────────┤
│   ╭─ ─ ─ ─╮                      │
│   │ orb │  ← Voice orb /         │
│   ╰─ ─ ─ ─╯  speaker indicator   │
│   speaking: Khadijah             │
├─────────────────────────────────┤
│ AGENDA                          │  ← Live agenda checklist
│ ✓ NTC budget readout             │
│ ✓ FlourishED Q2 pipeline         │
│ ◐ WBEZ podcast — deciding now    │  ← current item
│ ○ Tuesday 4pm meeting            │
│ ○ Paris check-in                 │
│ ○ FY27 line items 14, 22         │
├─────────────────────────────────┤
│ TRANSCRIPT (live)                │  ← Auto-scroll
│ K: "WBEZ producer asked you on   │
│    May 28 — education equity,    │
│    ~2hr commit, 40k listeners.   │
│    Want me to accept?"           │
│ S: [taking note · podcast       │
│     opportunity, Career context] │
│ Y: "Yes — counter for the 30th   │
│    if it's flexible."            │
│ S: [logged: accepted with        │
│     counter for May 30]          │
├─────────────────────────────────┤
│ Quick reply: [Yes] [No] [Defer]  │  ← Silent-mode chips
│ [Pause] [End call] [🔇]           │
└─────────────────────────────────┘
```

---

## Two agents present — Khadijah + Sinclair

Briefings run with **both** primary agents on the call, with distinct roles:

### Khadijah leads — stays on script

- Walks the prepared agenda in order
- Presents context for each item (briefing prep protocol seeds her with 3 degrees of separation worth of context per item)
- Asks for approvals or directions
- Captures decisions

### Sinclair interprets — handles the un-prepped

- Takes notes in real time (visible in transcript as `S: [logged: …]` annotations)
- Fields impromptu questions and side-directives (4th-degree topics Khadijah doesn't have prep for)
- Catches action items client mentions in passing
- Manages the calendar/comms ripples that fall out of decisions

The pairing matters: it lets Khadijah respond from prepared instances (low hallucination risk) while Sinclair gracefully handles whatever client throws into the conversation.

### Visual treatment

- Call header shows both avatars side-by-side (Khadijah coral, Sinclair gold)
- Voice orb pulses with whichever agent is currently speaking; their avatar enlarges slightly
- Sinclair's note-taking appears in the transcript as inline annotations, distinct from spoken dialogue
- client's voice is `Y:` (You) in the transcript

---

## The agenda checklist

Always visible during the call. Items resolve as Khadijah walks them.

| Symbol | Meaning |
|---|---|
| ✓ | Done — decision captured |
| ◐ | Active — currently discussing |
| ○ | Pending — coming up |
| ⏱ | Deferred — client asked to defer |
| ⊘ | Skipped — client or Khadijah pulled it from this call |

client can:
- Skip ahead: "Khadijah, can we jump to the Paris item?"
- Defer an item: "Defer FY27 to tomorrow"
- Add an item mid-call: "While we're here — what's happening with Acme?" → Sinclair captures, agenda updates

---

## Live transcript

Auto-scrolling, never collapsed during a call. client can:

- Glance — sees what was just said
- Scroll back — re-read a few minutes ago
- Search post-call — transcript is preserved as part of the briefing artifact
- Edit annotations — if Sinclair's logged note is wrong, client can correct ("no, log it as deferred")

### Transcript styling

- Bold speaker prefix (`K:`, `S:`, `Y:`)
- Sinclair's note-taking annotations rendered in muted style with brackets: `S: [logged: accepted with counter for May 30]`
- Decisions rendered with a subtle highlight when captured

---

## Quick-reply chips — silent mode

When client can't speak (in a meeting, in public, baby napping), chips below the transcript provide silent answers. Chips adapt to the current question's shape:

| Question shape | Chips |
|---|---|
| Yes/No | `Yes` `No` `Defer` |
| Choice (A vs B) | `[Option A]` `[Option B]` `Defer` |
| Multi-pick | radio rows + `Confirm` |
| Open-ended | `Defer` `Skip · note for later` |

Tapping a chip is recorded the same way as speaking — Khadijah acknowledges and moves on.

### Voice ↔ chip equivalence

Whatever can be said by voice can be tapped via chip and vice versa. client is never forced into voice mode if she's in a context where she can't speak.

---

## Controls

| Control | Behavior |
|---|---|
| **Pause** | Holds the call. Surface dims; agents wait silently. Resume by tapping anywhere. |
| **End call** | Terminates. Surface collapses. Khadijah delivers a recap message in the right-rail thread (Agent Update). |
| **🔇 Mute** | Silences client's mic. She can still tap chips. Useful in shared spaces. |
| **Voice/chip toggle** | Default tries voice first; she can force chip mode for the whole call. |

---

## Out-of-agenda interruptions

client can derail at any time. The surface accommodates:

- *"Before we move on — what's happening with Acme?"* → Sinclair handles (4th-degree territory), captures, returns to Khadijah's agenda when done
- *"Stop, I need to take this call"* → Pause; resumable later
- *"Add a note: I want to revisit Q2 LinkedIn cadence next week"* → Sinclair logs as a future briefing item

Khadijah doesn't lose her place. Once the digression resolves, she picks up where she left off.

---

## End of call

When the call ends, the surface delivers:

### 1. Khadijah's recap message in the right-rail thread

```
[Khadijah] · Briefing recap · May 8 morning
We covered all 6 items in 14 minutes.
- Accepted WBEZ podcast (counter-offered May 30)
- Declined Tuesday 4pm meeting (Sinclair will draft a polite no)
- Paris: refining round 3 continues; tee-up still expected ~May 19
- FY27 line items 14, 22: deferred to tomorrow's briefing — Maxine pulling additional context
- Q2 LinkedIn cadence: confirmed weekly schedule
- AR/AP: nothing new pending

Decisions filed to Library · transcript saved
```

### 2. Briefing artifact in Library

Stored as `Daily Brief — May 8` (or appropriate name). Contains:
- Full transcript
- Agenda + resolution per item
- Decisions captured
- Action items routed to agents
- Sinclair's notes

### 3. Pending Approval Cards spawned

Decisions that produced drafts (e.g., Sinclair's "polite decline" for Tuesday 4pm) appear as Approval Cards in the relevant surfaces (Today, Messages) within the next sync cycle.

---

## Resuming an interrupted call

If a call is paused or dropped, agenda state persists. client can:

- Resume from where she left off
- Have Khadijah continue solo on items that don't need her ("just send the FY27 question to Maxine, I'll catch the rest tonight") → agent processes the rest as background work; results come back as Agent Updates

---

## Wellness deeper check-ins use this surface

Sinclair's monthly slow conversation, sustained-stress recovery sessions, and similar wellness-led scheduled interactions render in the same Call Surface — but with these adaptations:

- Khadijah is absent (Sinclair is the only voice)
- Tone is warmer; pacing is slower
- Agenda is shorter and more open-ended
- Sinclair leads *and* takes notes (no role split)

The Wellness palette/visual tokens may shift slightly (softer color, lower contrast) to signal the mode.

---

## What Call Surface does *not* do

- ❌ Display agent activity logs / sausage-making
- ❌ Surface skill names, protocol IDs, or backend mechanics
- ❌ Allow client to "drive" Khadijah's agenda from a UI panel — she speaks/taps, the agent leads
- ❌ Multitask with other interactions (the surface takes over for a reason — focus is the value)
- ❌ Run if neither agent has prepared context (a briefing without a prep protocol is a system error, not a call)
