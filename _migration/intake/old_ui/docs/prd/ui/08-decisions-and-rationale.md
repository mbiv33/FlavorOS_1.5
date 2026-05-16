# 08 · Decisions & Rationale

The audit trail. Every locked design decision with the *why* behind it. If something here contradicts a downstream doc, this doc supersedes — but flag the inconsistency for cleanup.

Decisions are loosely chronological, grouped by theme.

---

## Layout & navigation

### D-01 · Three-pane bridge layout (left nav · center · right rail)

**Decision:** primary layout is three panes, with the right rail (chat) always present.

**Rationale:** FlavorOS is closer to a *command bridge* than a chatbot. Voice/conversation is the primary input but it's never the destination — client navigates artifacts and statuses while talking. Chat docked to the right (vs floating widget) makes voice a first-class state, not a feature.

**Mobile:** left nav collapses first; right rail persists as docked tab.

---

### D-02 · Today opens calm by default, not Approvals queue

**Decision:** Today is a calm landing surface even when approvals are pending. The pending-approvals zone *appears* on Today but doesn't take over the page.

**Rationale:** Two principles in tension: "silence equals working" vs "approvals are highest-leverage interaction." Calm wins. Approvals get prominent placement at the top of Today but the rest of the surface — brief, agenda, trips, handled-tray — stays visible. client sees pending work but isn't naggingly redirected to a queue every time she opens the app.

**Tradeoff acknowledged:** if she has 10 approvals, the page gets busy. Acceptable; bulk batching mitigates.

---

### D-03 · No Team / agent-status surface for client

**Decision:** the user-facing nav has no agent team view. Agent health is admin/Khadijah surface only.

**Rationale:** "What the agent is doing" is a network-admin question, not a user question. client wants tasks, artifacts, suggestions — the sausage, not the sausage-making. Showing a team status board invites her to micromanage specialists. Status of *deliverable progress* lives in each Project's Status tab; agent health is invisible unless something breaks (header system-alert chip).

---

### D-04 · client never creates projects

**Decision:** no "+ New Project" affordance anywhere. Projects are created by Maxine via PAC/PTQ pipeline.

**Rationale:** the executive-OS model is *work happens on her behalf*. If she had to create projects, she'd be doing assistant work. The system anticipates and proposes; she confirms.

**Implication:** the `Work` left-nav surface is reflective, not generative.

---

### D-05 · Briefs nest as tab inside each Project, not top-level nav

**Decision:** Briefs are a tab on each Project (`Status / Brief / Decisions / Files`), not a separate nav item.

**Rationale:** a "project brief" is a brief about a project — top-level Briefs would create dual-pathing. Khadijah's master COS brief lives on Today; per-project briefs roll up into it and live on the project detail.

---

### D-06 · Renamed "Projects" → "Work"; "Needs you" → "Ready for you"

**Decision:** vocabulary shifts to match the user-side experience.

**Rationale:** client doesn't *create* projects; she has *work* happening. She doesn't *need* something; the agent has *prepared* an artifact she can approve. The vocabulary respects her role — she's the executive, not the assistant.

---

## Components

### D-07 · One canonical decision component: Approval Card

**Decision:** every decision client makes goes through the same Approval Card shape. No proliferating card types.

**Rationale:** she learns the affordances once. Different artifacts, different agents, different contexts — same component.

---

### D-08 · Question Cards killed

**Decision:** there is no Question Card type in the framework.

**Rationale:** "Should this become real work?" decisions belong in **structured/scheduled briefings**, not as interrupt cards on Today. The boss-to-assistant interview model fits better than the chatbot prompt-and-respond model. Default position: don't ask unless absolutely necessary; when asking is necessary, do it in a structured conversation.

**What replaces Question Cards:**
- Information needs → briefing agenda items (Scheduled interaction)
- Genuine urgency → Agent Escalation (badge + DM)

---

### D-09 · Suggestion Cards killed

**Decision:** no Suggestion Card type.

**Rationale:** lower-stakes nudges are still nudges. The system should either know enough to act (and surface as an Approval Card if needed) or save the suggestion for the next briefing. "Khadijah suggests X" as a pop-in card is too prompty for the boring/reliable/unsung principle.

---

### D-10 · Phase-transition Cards rolled into Approval Cards

**Decision:** what was "Phase-transition Card" is just an Approval Card with a phase-transition artifact (e.g., "Move to Booking phase?").

**Rationale:** the canonical Approval Card handles it. Less component sprawl.

---

### D-11 · Approval Card has 3 buttons, no Ask

**Decision:** `[Approve] [Modify] [I'll do myself]`. No Ask button.

**Rationale:** if client has a clarifying question, she opens the chat thread (User-Initiated interaction) — not an affordance on the card. Pushing ambiguity to the right surface keeps the card vocabulary tight.

---

### D-12 · Modify is structured 3-axis, not free-text

**Decision:** Modify opens a subform with three axes (Tone, Format, Sender request), checkbox-based, multi-select.

**Rationale:**
- Predictable agent rework
- Feeds preference learning
- Avoids prompt-engineering pitfalls
- Keeps card simple

If client needs free-text direction, she opens chat — that's a User-Initiated interaction.

---

### D-13 · Modify has 1-hour minimum, framed as "when ready"

**Decision:** modifications cannot return faster than 1 hour. UI never promises a deadline; copy is "when ready."

**Rationale:** the agent should genuinely refine using preferences and prior context — like handing it back to a human assistant. A "ready in ~1 hour" promise creates artificial pressure and frames the wait as adversarial. "When ready" is honest and matches how a real EA operates.

---

### D-14 · Reject relabeled to "I'll do myself"

**Decision:** the third Approval Card button is "I'll do myself" (label adapts: "I'll edit & send" for drafts, "I'll do it myself" for actions).

**Rationale:** rejection isn't *kill the work* — it's *transfer ownership to me*. The work still needs doing. Creating a task in client's PM list with the agent's prior context attached prevents lost work. Verb is honest about what happens next.

---

### D-15 · Ripple panel is conditional, not default

**Decision:** the Ripple panel on Approval Cards renders only when the underlying skill flags non-trivial downstream impact.

**Rationale:** most cards have no significant ripples. Drawing an empty Ripple panel for consistency would clutter. The Ripple Effect Protocol drives this: when triggered, the panel reveals; otherwise it doesn't render.

---

## Vocabulary

### D-16 · Agent verbs vs User verbs are locked

**Decision:**
- Agent → *modifies* artifacts
- User → *approves · edits · sends/uses* artifacts

**Rationale:** this is the role boundary. Confusing verbs ("agent sent the email", "user modified the draft") would blur authorship and accountability. Even one slip in copy reveals the wrong mental model.

---

### D-17 · No PTQ / PAC / SIGMA vocabulary in user-facing UI

**Decision:** internal protocol names never surface to client.

**Rationale:** sausage > sausage-making. She never sees "PTQ pending" or "open PAC" or "SIGMA created." Plain English: "Khadijah will walk this at the briefing" / "pending decision" / *(SIGMA never surfaces — it's runtime-only)*.

---

### D-18 · Persona attribution is artifact-level, not nav-level

**Decision:** Regine and Overton are persona skins on Kyle and Maxine, surfaced on artifacts they produced. Not separate agents in nav.

**Rationale:** the team is 5 agents. The personas give work the right voice (Regine for social/dev work, Overton for household/IT) without sprawling the agent roster. Artifact signatures carry the persona; nav stays clean.

---

## Interaction model

### D-19 · Five interaction types, no sixth

**Decision:** Scheduled · User-Initiated · Agent Updates · Agent Escalations · Wellness Corner. Every interaction belongs to one.

**Rationale:** bounding the taxonomy prevents UI sprawl. Every time someone proposes a new interaction pattern, the question is "which of the five?" — if none fits, redesign.

---

### D-20 · Briefings are calls, not text walk-throughs

**Decision:** Scheduled interactions run in a voice-first Call Surface, not a chat-style sequential reveal.

**Rationale:** voice-first principle. Briefings are conversational, agenda-driven, and benefit from real-time back-and-forth. Quick-reply chips below transcript provide silent-mode fallback when she can't speak.

---

### D-21 · Briefings have both Khadijah and Sinclair present

**Decision:** Khadijah leads (stays on script via prep protocol's 3-degree context); Sinclair interprets, takes notes, fields un-prepped questions (4th-degree+).

**Rationale:** prevents hallucination from Khadijah on novel territory while keeping conversation graceful. Mirrors a real chief-of-staff + EA pairing in an executive 1:1. UI shows both avatars in the call header.

---

### D-22 · Default position: don't ask unless absolutely necessary

**Decision:** the system biases hard toward not interrupting. Cards should be relatively rare; calm states should be common.

**Rationale:** if the system prompts constantly, it's not doing its job. The whole point is "boring, reliable, unsung" — 95% of work pre-done, anticipated, behind the scenes. UI must visually reward silence.

---

### D-23 · No instant work — agents defer when un-prepped

**Decision:** if client makes a request the agent isn't prepared for, the agent defers to a later return (overnight, next briefing, scheduled cron).

**Rationale:** matches a real assistant's behavior. "Let me look into that and bring it back" is the right response to novel requests — it sets honest expectations and prevents low-confidence improvisation. The UI doesn't fake instant turnaround.

---

## Voice & input

### D-24 · Voice is push-to-talk by default

**Decision:** push-to-talk is the default mode; always-on is per-session opt-in with auto-timeout (default 15 min).

**Rationale:** privacy-first. Always-on never persists silently across days. Auto-timeout prevents accidental ambient capture.

---

### D-25 · Single composer in right rail, targets active thread

**Decision:** one composer at the bottom of the right rail; clicking another thread switches what the composer is addressing.

**Rationale:** reduces clutter; mirrors familiar patterns (Slack narrow mode); voice orb above has a clear single target.

---

### D-26 · Three threads only in right rail (Khadijah, Sinclair, Group)

**Decision:** persistent chat surfaces only the two user-facing agents and a group room. Shadow agents have no direct chat.

**Rationale:** matches DESIGN_BRIEF user-facing surfaces; guards against context fatigue; reinforces "chief of staff + EA" mental model.

---

## Surfaces

### D-27 · Travel is a dedicated surface under Work

**Decision:** Travel gets a sub-nav slot with a trips list + countdowns; per-trip detail is a Project view with 5-phase indicator.

**Rationale:** trips are long-running, multi-phase, and have unique countdown utility. The 5-phase pattern (Plan / Book / Prep / Travel / Return) matches the workflow protocol document. Countdown is a beloved feature; deserves visual weight.

---

### D-28 · Calendar at center is wrong — agenda strip + dedicated view

**Decision:** Today shows compact agenda strip; full Calendar lives as its own surface.

**Rationale:** a full month grid mid-page conflicts with the calm principle and competes with brief/approvals. A compact strip is enough for at-a-glance.

---

### D-29 · Library mirrors skill taxonomy lightly

**Decision:** Library filter chips loosely group by artifact type (Drafts / Briefs / Packets / Invoices / Contracts / Debriefs / Research / Tee-ups). Not by underlying skill.

**Rationale:** client thinks in artifact types ("show me my contracts"), not in skill IDs.

---

### D-30 · Preferences grouped by life-domain, not by app

**Decision:** Travel / Work / Wellness / General — not Twilio / Gmail / Composio / etc.

**Rationale:** matches how she thinks. "I prefer direct flights" not "configure airline-API connector."

---

### D-31 · ⌘K palette holds quick-launches and external links

**Decision:** external account links (Amex Travel, Hilton Honors, NTC board portal) live in ⌘K, not primary nav.

**Rationale:** they're utilities, not destinations. Keyboard-first surface is the right home.

---

## Architecture-driven

### D-32 · Email auto-responder batched at 8am/12pm/4pm; UI exposes schedule

**Decision:** approved emails post-approve state shows next batch time. Outbox indicator on Messages shows queued sends.

**Rationale:** the protocol IS that emails batch. Hiding it would make client wonder when sends fire. Showing it builds trust.

---

### D-33 · Receipts ingest via text/message; no UI capture

**Decision:** no "capture receipt" button. client texts a receipt image; system parses and files.

**Rationale:** receipts are an ingestion problem, not a UX problem. The right design is to make her not think about it.

---

### D-34 · Context model is configurable, not hardcoded

**Decision:** UI does not hardcode context labels (W2 Work, LLC Work, Career, Personal). Contexts come from `clients/test-client/contexts/*` configured at onboarding.

**Rationale:** future-flexible. Single-context users never see switcher chrome. client who renames "FlourishED" to "ConsultCo" sees the rename everywhere automatically.

---

### D-35 · Travel-universe-update produces low-friction confirmation cards

**Decision:** post-trip, system surfaces "preferences learned" as small Approval-style cards. Skip-friendly.

**Rationale:** the protocol learns; the UI lets client ratify or skip. Optional, low-stakes.

---

## Open / not yet locked

These decisions remain open. See [09-open-questions.md](./09-open-questions.md):

- Notification model (push/email/SMS escalation channels and rules)
- Onboarding flow
- Mobile UX beyond layout collapse
- Group thread voice arbitration (when both agents could respond)
- Cross-context Khadijah brief presentation pattern
- Visual design system (color tokens beyond per-agent, type scale, spacing tokens, dark mode parity)
