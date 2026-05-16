# 06 · Right Rail — Persistent Chat + Voice

The always-present conversational surface. Voice-first, but text supports.

---

## Layout

```
┌──────────────────────────────────┐
│ Persistent chat · 3 threads      │  ← Section header
├──────────────────────────────────┤
│ [KJ][SJ] Group room    2m  ▾     │  ← Collapsed thread
│   Sinclair: "So excited for      │     (last message preview)
│   Paris — woo woo woo 🌟"        │
├──────────────────────────────────┤
│ [SJ] Sinclair    just now  ●     │  ← ACTIVE thread
│                                   │     (highlighted)
│   Good afternoon — how was        │
│   lunch?                          │
│   You: fine, I'm tired tho        │
│                                   │
├──────────────────────────────────┤
│ [KJ] Khadijah    12m  ▾          │  ← Collapsed thread
│   You: where are we on travel?   │
├──────────────────────────────────┤
│  🎙 Voice idle · talking to      │  ← Voice orb above composer
│     Sinclair  [space to talk]    │
├──────────────────────────────────┤
│ [Type to Sinclair…]         [↑]  │  ← Composer · targets active thread
└──────────────────────────────────┘
```

---

## Three threads, always visible

The three persistent threads are:

| Thread | When she uses it |
|---|---|
| **Group room** (Khadijah + Sinclair) | Joint conversation. Useful when both perspectives matter (project + comms). |
| **Sinclair** | Daily comms, scheduling, calendar, wellness check-ins. The most-used direct lane. |
| **Khadijah** | Strategic synthesis, decision briefs, project-level context. The chief-of-staff lane. |

### Why these three only

Per [DESIGN_BRIEF.md](../../../DESIGN_BRIEF.md), only Khadijah and Sinclair are user-facing direct lanes. The shadow agents (Maxine, Kyle, Scooter, plus Regine and Overton as personas) don't have direct chat surfaces. They surface via:

- Their artifacts and Approval Cards
- @-mentions in the Group thread (Khadijah pulls them in)
- Persona attribution on cards they produced

This guards against context fatigue and reinforces the "chief of staff + EA" mental model.

---

## Active vs collapsed threads

Only one thread is active at a time. The other two collapse to a thin header strip:

- Avatar(s)
- Thread name
- Last message timestamp
- Unread dot if there are unread messages
- Single-line preview of last message

Click any collapsed thread to make it active. The previously-active thread collapses.

### Active thread shows

- Recent messages (auto-scroll to latest)
- Distinct user vs agent message styling
- Timestamps on hover
- Inline Approval Cards if surfaced via voice/chat
- Inline media (images, file attachments) when present

---

## Single global composer

One composer at the bottom. Targets the **active thread**. Switching threads switches what the composer is addressing — visible via the placeholder text ("Type to Sinclair…").

**Why one composer, not three:**

- Reduces visual clutter
- Voice orb above it has a clear target
- Mirrors Slack's narrow-mode behavior — familiar
- Forces focused conversation rather than parallel-thread chaos

### Sending

- `↵` sends
- `Shift+↵` newline
- `↑` up-arrow → recall last message
- Voice → speak, transcription fills composer, auto-sends after pause (configurable)

---

## Voice orb

Sits above the composer. Always visible.

### States

| State | Visual | Meaning |
|---|---|---|
| **Idle** | Outlined orb, neutral color | No active voice activity. Tap or hold space to start. |
| **Listening** | Filled orb, pulsing waveform | Capturing audio. Transcription appears live in composer. |
| **Processing** | Animated dots overlay | Captured; agent thinking. Brief. |
| **Speaking** *(during call)* | Color-coded by which agent | Used in Call Surface; on right rail it just shows idle when an agent has spoken. |

### Color-coding by active thread

The orb takes a color hint from the active thread's persona:

- Khadijah thread → coral tint
- Sinclair thread → gold tint
- Group thread → gradient between

This is a subtle cue: client knows who she's about to address before she starts speaking.

### Targeting and redirect

By default, voice addresses the active thread. To redirect mid-utterance:

- *"Khadijah, draft me a brief on Q2"* — even if Sinclair is the active thread, prepended persona name redirects
- Visual confirmation: target persona's avatar pulses as client speaks the name

---

## Voice modes

Two modes. Mode is **per-session**, not global preference — never persists silently across days.

| Mode | When | Trigger |
|---|---|---|
| **Push-to-talk** *(default)* | client holds space / taps orb / hardware key | Each utterance is discrete |
| **Always-on** *(opt-in per session)* | Continuous listening with optional wake-phrase | "Khadijah, …" / "Sinclair, …" / configured custom phrase |

### Always-on auto-timeout

After configurable idle period (default 15 min), always-on reverts to push-to-talk. Visual notification: *"Always-on timed out. Tap to re-enable."*

### Mode toggle

In header voice dropdown. Privacy-first default ensures she's never surprised by an always-on mic.

---

## Approval Cards in the right rail

Approval Cards can surface inline in any thread. They look identical to Approval Cards on Today / Work / Messages — same component.

```
[Sinclair] · drafted reply · to John Smith (NTC board)
[W2 Work] [outbound]
"Hi John — yes, I can take that slot..."
[✓ Approve] [✎ Modify] [✕ I'll edit & send]
```

When a card surfaces in chat, client can:
- Decide via the card's three buttons
- Say "approve the John reply" — voice resolves the card from anywhere

---

## Composer placeholder text adapts

| Active thread | Placeholder |
|---|---|
| Sinclair | *"Type to Sinclair…"* |
| Khadijah | *"Type to Khadijah…"* |
| Group | *"Talk to Khadijah, Sinclair, or both…"* |

When voice listening is active:
- Live transcription replaces placeholder
- Sends auto-fill the composer

---

## Call mode takeover

When a Scheduled call begins (morning briefing, COB, ad-hoc meeting), the right rail switches to the [Call Surface](./05-call-surface.md). All three threads collapse; the call interface dominates.

After the call ends:
- Right rail returns to the three-thread view
- Khadijah's recap message appears in her thread (and in Group if it was a paired briefing)

---

## Mobile behavior

On mobile, the right rail is too important to remove entirely. It collapses to:

- A persistent **chat tab** at the bottom of the screen (alongside main nav)
- Tapping expands to full-height overlay
- Voice orb stays accessible via a floating button when chat is collapsed

Calls on mobile go full-screen.

---

## What the right rail does *not* do

- ❌ Show every agent's thread (only Khadijah, Sinclair, Group — three threads, always)
- ❌ Surface notifications from outside the agent conversation (no system announcements, no marketing prompts, no "did you know")
- ❌ Become a dumping ground for activity logs (those go to Decisions tab on a project, or stay backend)
- ❌ Show typing indicators for agents (it's not a person typing — feels off)
- ❌ Allow user to add new threads (the three are canonical)
