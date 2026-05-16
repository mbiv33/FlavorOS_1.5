# 01 · Interaction Taxonomy

FlavorOS supports exactly **five interaction types**. The whole UI is shaped by this list — every surface, every component, every notification belongs to one of these. If a proposed feature doesn't fit, redesign.

---

## The five types

| # | Type | What it is | Primary surface |
|---|---|---|---|
| 1 | **Scheduled** | Pre-planned agent-led meeting on client's calendar — routine *or* ad-hoc | [Call Surface](./05-call-surface.md) — voice-first, agenda-driven |
| 2 | **User-Initiated** | client starts a conversation with an agent — call or chat | Right-rail thread + voice orb |
| 3 | **Agent Updates** | Passive confirmations and follow-up reports the agent owes client | Right-rail thread messages (no badge) |
| 4 | **Agent Escalations** | Genuinely urgent items the system can't handle without her | Header badge + direct DM (the only interrupt pattern) |
| 5 | **Wellness Corner** | Sinclair-led pre-programmed protocols around client's well-being | Persistent ambient indicator + scheduled deeper checks (uses Call Surface) |

That's the entire taxonomy. There is no sixth.

---

## 1. Scheduled

Any agent-led meeting on client's calendar.

### Subtypes

| Subtype | Examples |
|---|---|
| **Routine** | Morning briefing (start of day), COB wind-down (end of day), weekly planning |
| **Project deep-dive** | "Khadijah wants 30 min Wed PM re: birthday weekend logistics — Scooter has options to walk" |
| **Decision session** | Multi-item approval review, FY27 budget walk-through, RFP review |
| **Wellness deeper check-in** | Sinclair's monthly slow conversation |

### How they land on the calendar

Through the **standard approval pipeline** — no special UI. Khadijah or Sinclair drafts a calendar hold, presents it as an Approval Card. client approves the hold. Once on the calendar, it's a Scheduled interaction. Same Call Surface for any subtype.

### Lead pattern — Khadijah + Sinclair pairing

Briefings and scheduled calls run with **both agents present**, each with a distinct role:

- **Khadijah** stays on script — walks the prepared agenda, presents context, asks for approvals/directions
- **Sinclair** interprets, takes notes, fields impromptu questions and directives

This pairing is intentional: Khadijah's responses are sourced from prepared context (3 degrees of separation backing each agenda item, per the briefing prep protocol), so she answers without hallucinating. Sinclair handles the un-prepped territory (4th degree and beyond) — clarifications, pivots, side-questions, action capture.

The UI surfaces both agents in the call interface. See [Call Surface](./05-call-surface.md) for full spec.

---

## 2. User-Initiated

client starts a conversation. Right-rail thread or voice.

### Patterns

- Asks a question of an agent
- Makes a request
- Raises a suggestion
- Vents / thinks out loud (Sinclair-appropriate)

### Default behavior when client makes an unprepared request

The agent **defers** — just like a real EA would. *"Let me look into that and bring it back."* The system doesn't fake instant work. The request gets logged, the agent works on it (often overnight or via cron), and an **Agent Update** comes back later with a result or an Approval Card.

This is a strong default. The agent doesn't pretend to know things it didn't prepare for. Voice/chat replies that defer should feel competent, not evasive.

---

## 3. Agent Updates

Passive notifications. Things the agent owes client as confirmations, follow-up reports, batch send confirmations, etc.

### Examples

- *"Sent 5 approved emails just now."* (after 4pm batch)
- *"The Acme invoice you approved cleared. Maxine has filed it."*
- *"Scooter's finished refining round 3 of the Paris hotels — 3 finalists are ready for the next briefing."*
- *"The brief you asked about earlier is in Library."*

### UI rules

- Land in the relevant right-rail thread
- **No badge** — these are passive, not interrupts
- Sometimes aggregate ("3 updates from Sinclair this morning ▾")
- Voice-readable on demand ("Sinclair, what's new?")

### Distinguishing from Escalations

If something is urgent, it's an Escalation, not an Update. Updates are quiet by design.

---

## 4. Agent Escalations

The only **interrupt** pattern in the whole system. Reserved for genuinely urgent or blocking items.

### Triggers

- An external dependency expires (flight booking window closing in 2 hours)
- A high-stakes contact replies and needs same-day acknowledgment (board chair, top client)
- A workflow is genuinely blocked and client is the only unlock
- A wellness threshold is crossed (per Sinclair's protocol)
- A system failure that affects her work product

### UI

- **Header badge** illuminates with count
- **Direct DM** in the relevant agent's right-rail thread (with `[escalation]` chip)
- Sound/haptic cue (when configured)
- Voice announcement available on demand

Escalations should be **rare**. If the badge is lit weekly, the threshold needs tuning. The default pressure is toward not-asking — Escalation is the exception that proves the rule.

---

## 5. Wellness Corner

Sinclair's domain. Pre-programmed interactions that maintain client's well-being without her having to ask.

### Patterns

- **Ambient indicator** — small persistent pulse in header (steady = baseline, soft pulse = elevated stress signals)
- **Passive holds** — Sinclair guards focus blocks and recovery time on the calendar without being asked
- **Pre-programmed check-ins** — short scheduled "how are you?" moments (morning, midday, end-of-day) — *not* survey interrupts; embedded in the briefing or as a single-line ping
- **Deeper check-ins** — monthly or trigger-driven, run as Scheduled calls (uses Call Surface)
- **Adaptive responses** — when stress signals elevate, Sinclair adjusts: pulls back optional commitments, reroutes ambiguous comms to drafts, suggests recovery via Suggestion-style nudges

### UI rules

- Wellness never escalates as a card on Today (with one exception: a Sinclair-led recovery suggestion after a sustained-stress trigger, which lands as an Approval-style "shift these 3 things off Wed?" card)
- Check-ins are conversational, not form-based
- Voice-tone shift is permitted (Sinclair's voice gets warmer in deeper check-ins)

---

## What is NOT an interaction type

- ❌ **Question cards on Today.** Killed. If Khadijah needs a decision, it goes on the next briefing's agenda. Default is structured/scheduled, not interruption.
- ❌ **Notification feeds.** client doesn't have a notification center to manage. Updates live in threads; Escalations come through the badge; everything else is invisible.
- ❌ **In-app prompts / coach marks.** No "did you know you can…" tooltips. The system shows competence by working, not by teaching.
- ❌ **Search-driven workflows.** ⌘K palette exists, but client isn't expected to search to find work. Work finds her.

---

## Mapping interaction types to surfaces

| Surface | Interaction types it handles |
|---|---|
| Today | (presents pending Approvals; previews next Scheduled briefing's agenda) |
| Call Surface | Scheduled (1) |
| Right Rail | User-Initiated (2), Agent Updates (3), Agent Escalations (4 — DM portion) |
| Header | Agent Escalations (4 — badge), Wellness ambient (5) |
| Wellness Corner UI | Wellness Corner (5) |
| Approval Cards (component) | The decision moment within types 1, 2, 3, 4, 5 |

Approval Cards are the through-line. They appear inside any of the five interaction types when a decision is needed. See [03-approval-card.md](./03-approval-card.md).
