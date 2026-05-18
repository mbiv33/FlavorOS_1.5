# 07 · Protocols Affecting UI

Backend protocols whose behavior the UI must honor. The UI doesn't define these — they're system architecture — but the UI surfaces and copy must align with how they actually work.

---

## Outbound write-back protocol

### Behavior

- Governed outbound actions are approval-gated.
- Approved actions are staged before execution.
- Each queued action preserves source context, provider, client id, workflow run, artifact, and audit state.
- Channel behavior may differ by provider, but the UI must always show queued, executed, failed, or pulled-back state.

Email may use batch sends. Calendar, Docs, Sheets, Slides, PM tools, and social DMs may need different execution rules.

### UI implications

| Surface | UI element |
|---|---|
| Approval Card | Post-approve state shows queued/execution state |
| Comms & Calendar | Outbound queue/status cards show approved provider actions |
| Completion Summary | Lists provider actions queued, executed, failed, or pulled back |
| Admin provider/workflow views | Show execution and failure diagnostics |

### Pull-back affordance

client can pull back any queued outbound action before the provider executes it, where the channel supports pull-back. UI shows eligible queued items with a `[Pull back]` action.

### Why this is visible

Visible queued state is intentional. It builds trust that the system is not acting invisibly, and it gives the client a clear window to change course before execution where the provider supports it.

---

## Modify protocol — 1 hour minimum

### Behavior

When client hits Modify on an Approval Card and submits the 3-axis subform:

- The artifact returns to the agent's queue
- Agent must take **at least 1 hour** to rework — this is a *floor*, not a deadline
- The agent uses that time to consult preferences, prior artifacts, peer agent context — like handing it back to a real assistant
- New artifact returns as a fresh Approval Card whenever ready (often same-day or next morning)

### UI implications

| Surface | UI copy |
|---|---|
| Modify subform | *"We'll rework using your preferences and bring it back when ready."* |
| Submitted state | Card collapses with note: *"Sent for revision."* — no countdown |
| Returned state | New Approval Card with `v2` indicator, original card linked as parent |

### What the UI does NOT show

- ❌ No countdown timer
- ❌ No "in 1 hour" SLA promise
- ❌ No "estimated return: 4:23 PM"

These would set false expectations and frame the wait as adversarial. The system commits to thoroughness, not speed.

---

## Modify subform — 3 axes only

### Axes

| Dimension | Options |
|---|---|
| **Tone** | warmer · more professional |
| **Format** | narrative · outline |
| **Sender request** | clarity · additional details |

### Rules

- Multi-select within and across dimensions
- Pick zero, one, or many checkboxes per axis
- **No free-text input** — modifications are structured only
- "Send for revision" submits; "Cancel" closes the subform without acting

### Why structured, not free-text

Structured axes:
- Make agent rework predictable and learnable
- Feed preference learning (a client who repeatedly asks for "warmer" reveals a brand voice preference)
- Avoid the prompt-engineering pitfall of vague instructions
- Keep card vocabulary minimal

If the client truly needs free-text direction, it belongs in a future request-capture layer or in the relevant workflow surface, not as an Approval Card affordance.

---

## "I'll do myself" protocol

### Behavior

When client clicks the third button on an Approval Card:

1. Draft disappears from the agent's queue (agent stops touching this work)
2. Task or ownership marker is created in the relevant client-owned work surface
3. Agent's prior research, draft, and context are attached to the task
4. For drafts: the document opens in editor mode for the client to edit and send
5. For actions: the task sits in the client-owned queue with the agent's recs as reference

### UI implications

- Optional one-line reason field on click (feeds preference learning) — non-blocking
- Task or ownership marker lands in the relevant client-owned work surface
- Agent never re-presents this work; it is permanently transferred to client ownership

---

## PAC/PTQ pipeline (backend) → UI surface

### Backend behavior (client never sees this vocabulary)

1. **Trigger** (email arrives, meeting completed, webhook fires) creates a **PAC** (Pending Action Candidate)
2. PAC is stored in durable runtime state
3. Khadijah-owned qualification checks decide whether this becomes real work
4. PTQ resolves: Yes → spin up Project; No → delete PAC; Defer → re-evaluate later

### UI surface

- PAC/PTQ vocabulary is **never** shown to client
- When a PTQ requires client's confirmation (for example, "should we open a project for this podcast invite?"), it surfaces as an **agenda item on the next briefing or relevant meeting**, not as a standalone card on Command Center
- Resolution happens in the relevant Briefing or Meeting surface
- Once resolved, the project/work item is created (or not) and client sees the result via completion summary, artifact, or Approval Card

### Why this matters for UI

This protocol is the reason **Question Cards don't exist** in the UI. The system doesn't interrupt client with "should we do X?" cards — it queues those as agenda items for the next structured conversation.

---

## Briefing prep protocol — 3 degrees of separation

### Backend behavior

Before each Briefing, Khadijah's prep protocol gathers bounded context for each agenda item. Example:

- Agenda item: WBEZ podcast invite
- Degree 1: the producer's note, Sinclair's flag, the show's basic info
- Degree 2: prior podcast appearances, similar invitations, calendar collisions
- Degree 3: stated career goals, recent positioning decisions, audience overlap data

Prepared context should come from Client Universe/GBrain, provider state, artifacts, approvals, and relevant source refs.

### UI implications

- Briefing steps show prepared context and linked artifacts/approvals
- Open or unprepared questions become follow-up work rather than instant improvised answers
- Sinclair-owned communication/calendar items can appear inside the Briefing when relevant

### Why this matters for UI

The important UI requirement is not live agent presence. It is showing prepared state clearly and routing follow-up work through the right workflow/agent.

---

## Scheduled meetings via standard pipeline

### Behavior

When an agent (Khadijah or Sinclair) needs client's time for a non-routine scheduled interaction (project deep-dive, decision session, etc.):

1. Agent drafts a calendar hold via Sinclair
2. Hold appears as an Approval Card: *"Sinclair drafted calendar hold · 30 min Wed 2pm w/ Khadijah · Re: birthday weekend logistics"*
3. client approves via standard 3-button flow
4. Hold lands on calendar
5. At scheduled time, the relevant Briefing or Meeting surface is ready

### UI implications

No special UI for scheduled-meeting requests. They use the same Approval Card component as any other scheduling artifact. The downstream effect is that the relevant Briefing or Meeting workflow becomes scheduled and ready.

---

## Wellness protocols

### Behavior

Sinclair runs continuous wellness monitoring:

- Passive signal collection (calendar density, comm volume, response cadence, voice tone shifts)
- Threshold-based adjustments (auto-hold focus blocks, downgrade ambiguous comm replies to drafts)
- Pre-programmed check-ins (morning ping, midday glance, end-of-day wrap)
- Deeper scheduled conversations (monthly slow check-in)

### UI implications

| Wellness behavior | UI surface |
|---|---|
| Steady state | Header pulse: steady glow |
| Elevated stress | Header pulse: soft pulse animation |
| Pre-programmed quick check-ins | Goodnight or relevant Briefing step |
| Deeper scheduled check-in | Future workflow surface unless promoted |
| Auto-adjustment (focus block held) | Visible in Comms & Calendar; surfaced in Command Center schedule/status where relevant |
| Sustained-stress recovery suggestion | Approval-style card: *"Shift these 3 things off Wed?"* |

### What wellness UI does *not* do

- ❌ Display health surveys with sliders
- ❌ Show stress as a number / score
- ❌ Surface warnings or alarms
- ❌ Prompt for self-reporting (signals are passive)

The wellness layer is **ambient and conversational**, not measured-and-displayed.

---

## Travel-universe-update protocol

### Behavior

Post-trip debrief, the system extracts learning:

- "She preferred 6th arrondissement — save as preference?"
- "Direct flights only on intl > 6h?"
- "Hilton Honors stays — promote in future searches?"

Each inferred preference becomes a small confirmation card.

### UI implications

After Travel project enters Return phase and the debrief artifact is generated, a small batch of "preferences learned" cards appears in the Travel project's Status pane. Each is a one-tap Approve / Skip:

```
[Regine] · Preference inferred · Save?
"Direct flights only for intl > 6h"
[Save] [Skip]
```

Low-friction, optional. client can skip all without consequence.

---

## Receipt ingestion protocol

### Behavior

Receipts enter the system via client texting/messaging an image to the system. The system parses the data, stores the image, files to the right context.

### UI implications

- **No "capture receipt" button anywhere in the UI** — receipts are an ingestion concern, not a UI surface
- Receipts appear in Reports & Artifacts under their context after ingestion
- If parsing fails, Khadijah surfaces a single Approval Card: *"Confirm receipt details?"* with the image and editable fields

That's it. The UI doesn't make client think about receipts.

---

## Communication Sweep protocol

### Behavior

Sinclair ingests communications from configured channels through Communication Sweep:

- Cron every 15 min + webhook push on incoming
- Normalizes to standard item shape
- Triages intent + priority
- Routes to relevant agent
- Updates Client Universe, workflow runs, artifacts, approvals, and completion summaries as needed

### UI implications

The Comms & Calendar surface renders the prepared communication/schedule state. Summary blocks, normalized items, source links, draft artifacts, approval cards, and outbound status map directly to UI elements.

UI must:
- Refresh on provider sweep, webhook, manual sync, or workflow update events
- Surface routing in user-facing language ("Sinclair is preparing this" not "→ sinclair routing")
- Honor the architecture: Sinclair's view is *triage*, not raw inbox replacement

---

## Default position — don't ask

### System-wide rule

Across every protocol: the default is to **not ask client** unless absolutely necessary. Specifically:

- If a preference exists, use it
- If a similar past decision exists, infer
- If a confidence threshold is met, proceed silently (artifact appears in handled-tray)
- Only when none of the above apply does an Approval Card or briefing agenda item get generated

### UI implications

- Cards should be relatively rare in normal operation
- Calm states should be common
- The system proves value via silence and quiet handled-tray counts — not via constant prompting

The UI must visually reward silence (clean empty states) so the system's restraint feels intentional, not broken.
