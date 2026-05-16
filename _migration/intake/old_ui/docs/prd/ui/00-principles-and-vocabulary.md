# 00 · Principles & Vocabulary

These govern every UI decision. When two principles conflict, the earlier one wins.

---

## Principles

### 1. Sausage over sausage-making

client sees **tasks, artifacts, and decisions** in plain English. She never sees agent IDs, skill names, event traces, PAC/PTQ vocabulary, SIGMA types, routing metadata, or backend protocol names. That layer exists for Khadijah and admin surfaces — not for her.

**Operational test:** if a UI element exposes how the system gets work done (rather than what got done), it's wrong.

### 2. Silence equals working

Empty states are the proof of value. When nothing needs client, the surface is short, calm, and mostly whitespace — no placeholder cards, no "no items yet," no suggestion tiles to fill space, no analytics widgets for their own sake.

**Operational test:** if a zone has no content, it doesn't render. The page gets shorter, not noisier.

### ~~3. Voice-first, not voice-optional~~

~~The composer, transcription, and listening orb are first-class surfaces. Text and click are supporting modes. Calls (briefings, scheduled meetings) are the primary interaction shape — not chat.~~

~~**Operational test:** every card action and major affordance has a voice phrase client can say.~~

### 4. Context-agnostic, context-fatigue-guarded

client configures her contexts during onboarding. The UI adapts to whatever she has — 1 context or 6. No hardcoded contexts, no chrome bloat for single-context users, no forced "context picker" if there's only one.

**Operational test:** a single-context user sees zero context-switching UI.

### 5. Human-in-the-loop on commitments only

Money, time commitments, public-facing comms, and sensitive relationships require explicit approval. Everything else runs silently in the background.

**Operational test:** if the system is asking client something that doesn't move money/time/comms/relationships, redesign — it shouldn't be asking.

### 6. One canonical component per decision

A single Approval Card shape handles every decision client makes. Different artifacts, different agents, different contexts — all rendered through the same component. She learns the affordances once.

**Operational test:** if a designer is reaching for a new card variant, ask whether the canonical one with adjusted content can do the job. Almost always yes.

### 7. Boring, reliable, unsung is the goal

The agent should feel like an industrious capable virtual employee. 95% of work is pre-done, anticipated, or behind the scenes. The interface is primarily a place to **show artifacts** so client can be great. It is not a command surface for prompting work.

**Operational test:** if client is being asked to direct work, ask whether the system could have anticipated. Default position: don't ask unless absolutely necessary.

### 8. No instant work

Modifications, redrafts, and research take real time — agents use that time to consult preferences, prior artifacts, peer agent context. Nothing is rushed. The UI sets this expectation honestly: no countdown timers, no "in 1 hour" promises. Just "ready when ready" or, when the system genuinely knows: "back same-day or next morning."

**Operational test:** no UI element implies a time SLA on agent work shorter than human-EA-equivalent.

---

## Vocabulary lock

The shared verb vocabulary between agents and the user is small and precise. UI copy must respect it.

| Role | Verbs |
|---|---|
| **Agent** | *modifies* artifacts |
| **User (client)** | *approves · edits · sends/uses* artifacts |

### What this means in practice

- An agent never "approves" anything. Only client approves.
- An agent never "sends" outbound comms on its own (except via approved auto-responder protocol — and client is the one who approved each item).
- The user never "modifies" — when she changes something herself, the verb is **edit**.
- "Reject" is replaced by **"I'll do it myself"** — the artifact returns to her control, with the agent's prior work attached as context.

### Banned UI copy

The following phrasings are forbidden because they leak backend mechanics or reverse the role vocabulary:

- ❌ "Agent approved your invoice" → ✅ *(never happens)*
- ❌ "Sinclair sent the email" → ✅ "Your approved emails went out at 4pm"
- ❌ "Modify the artifact" *(user-facing)* → ✅ "Edit it" *(when user is acting)*; "Send for revision" *(when handing back to agent)*
- ❌ "PTQ pending" → ✅ "Khadijah will walk this at the briefing"
- ❌ "Open PAC" → ✅ "Pending decision"
- ❌ "SIGMA created" → ✅ *(never surfaced)*

### Persona attribution

See agent_agent_persona_model -Biv_5/15/26