# 09 · Open Questions

Designed but not yet finalized. These don't block visual design or the initial build, but each will need its own pass before shipping.

---

## Onboarding

**Status:** out of scope for the framework PRD; needs its own spec.

**Touches:**
- Context configuration (declaring W2 Work / LLC Work / Career / Personal — or whatever applies)
- Account connection (Gmail, O365, social, phones, websites per context)
- Agent introduction (client meets Khadijah and Sinclair; understands the team model)
- Voice setup (push-to-talk vs always-on default; wake-phrase if any)
- Preferences seeding (initial Travel/Work/Wellness/General prefs)
- First-week protocol (heavier check-ins; gradual hand-off as preferences learned)

**Why deferred:** onboarding is a guided flow with its own UX patterns (progressive disclosure, skip-able steps, conversational setup). Should not contaminate the steady-state UI framework. Build steady-state first; onboarding follows.

---

## Notification model

**Status:** routing/escalation rules not yet designed.

**Open questions:**
- Which Agent Escalations trigger push notifications vs in-app badge only?
- SMS fallback for off-device escalations?
- Email digest of Updates (opt-in for asynchronous catch-up)?
- Quiet hours / Do Not Disturb integration?
- Per-context notification preferences (e.g., W2 Work escalations off after 7pm)?

**Constraint:** the system biases hard toward not-interrupting. Whatever gets designed should make Escalations feel rare and earned.

---

## Mobile UX (beyond layout collapse)

**Status:** layout collapse rules locked. Full mobile spec deferred.

**Layout decisions already made:**
- Left nav → hamburger
- Right rail → docked tab at bottom
- Calls → full-screen takeover
- Header → unchanged

**Open:**
- Voice-first on mobile (likely heavier than desktop)
- Receipt-text-in workflow (already in protocol; confirm UX)
- One-handed thumb zones for active-Travel mode
- Push notification design
- Lock-screen interactions (tap a notification to approve directly?)

---

## Group thread voice arbitration

**Status:** unresolved.

**Question:** when client is in the Group thread and asks something neither agent's name was prepended to, who responds?

**Possibilities:**
- Khadijah by default (as chief of staff)
- Whoever has more relevant context for the question
- Both, with one leading and the other adding nuance
- client explicitly chooses by saying a name first

**Recommendation in interim:** Khadijah leads by default; Sinclair joins if her domain is implicated (calendar/comms/wellness). Tune via observation.

---

## Cross-context Khadijah briefs

**Status:** acknowledged but pattern not detailed.

**Scenario:** work in two contexts collides — e.g., NTC board meeting and FlourishED client engagement need the same morning. Khadijah's master brief mentions the collision. But what's the *presentation*?

**Possibilities:**
- A dedicated "Cross-context conflicts" subsection in the master brief
- A specific kind of Approval Card ("which to prioritize?")
- Simply text in the brief; client resolves via briefing conversation

**Lean:** brief text + briefing conversation. No new component. But pressure-test against real cases when they occur.

---

## Visual design system

**Status:** tone direction is set; comprehensive design system not yet produced.

**Locked tone:**
- Professional but warm
- Soft gradients, generous whitespace
- Glassmorphism acceptable but not noisy
- Per-agent color tokens (Khadijah coral · Sinclair gold · Maxine teal · Kyle purple · Scooter blue)
- No gratuitous analytics widgets

**Open:**
- Full type scale and family
- Spacing tokens (8/16/24/40/etc.)
- Dark mode parity from day one (committed; not yet specified)
- Iconography system
- Motion / transition language (calm, not bouncy)
- Accessibility tokens (contrast, focus states, motion-reduced variants)
- Persona avatar style (illustrated? photographic? abstract?)

**Recommendation:** commission or build a design-system pass before serious engineering. Mockup at `docs/mockups/flavoros-mockup.html` is directional, not authoritative on tokens.

---

## Wellness Corner deeper specs

**Status:** framework includes Wellness as one of five interaction types; specific protocols not detailed.

**Open:**
- Exact stress-signal taxonomy (passive signals to monitor)
- Threshold tuning (what counts as "elevated")
- Voice tone shifts in Wellness mode (cooler? slower? warmer?)
- Recovery suggestion patterns (when to suggest, what to suggest)
- Family/personal-life integration (Sinclair's territory but boundary unclear)

**Why deferred:** wellness is sensitive and personal. Best designed via observation of real use, with explicit client-in-the-loop tuning, rather than pre-specced abstract protocols.

---

## ⌘K palette command vocabulary

**Status:** concept locked; full command vocabulary undefined.

**Examples that must work:**
- "go to Paris" → jump to Paris trip
- "find Acme contracts" → Library search filtered
- "ask Khadijah about Q2" → opens Khadijah thread with prefilled
- "schedule 30 min with Maxine on Tuesday" → drafts a calendar hold (Approval Card)
- "what's pending" → opens Today's Ready-for-you zone

**Open:** is the palette also a *natural language command* surface, or strictly search + structured actions? Recommendation: hybrid — search-first with command suggestions appearing as you type.

---

## Calendar deep view

**Status:** compact agenda strip on Today is locked. Full Calendar surface is acknowledged but minimally specced.

**Open:**
- Default view (week starting Monday committed; confirm)
- Color-coding strategy (by context vs by agent vs by project type)
- How to surface Sinclair-held holds vs human-scheduled events vs travel days
- How briefings render as calendar events (chip? avatar? distinct shape?)
- Calendar editing — does client edit events directly, or always via Sinclair?

**Likely answer to last:** edits go through Sinclair (an Approval Card spawned from "client moved the 2pm to 3pm" via voice). Direct in-UI editing risks divergence from agent state.

---

## Library — focused viewer details

**Status:** Library exists; focused-viewer affordances need detail.

**Open:**
- How does client edit a sent artifact (e.g., add a note to her records)?
- Re-send flow (does it open a new draft? does Sinclair take over?)
- Versioning UI (when an artifact has v1 → v2 → v3 from Modify cycles)
- Sharing artifacts externally (export to PDF? share link?)
- Linking artifacts to each other (e.g., this brief references that contract)

---

## What is intentionally NOT an open question

The following are settled. Not re-opening unless client explicitly requests:

- Three-pane layout (D-01)
- Today opens calm (D-02)
- No team surface for client (D-03)
- client never creates projects (D-04)
- Question Cards killed (D-08)
- Suggestion Cards killed (D-09)
- 3-button Approval Card (D-11)
- 3-axis structured Modify (D-12)
- 1-hour Modify floor, "when ready" copy (D-13)
- Briefings are calls (D-20)
- Two agents in briefings (D-21)
- Push-to-talk default (D-24)
- Three threads in right rail (D-26)
- Receipts via text-in (D-33)
- Context-agnostic UI (D-34)
