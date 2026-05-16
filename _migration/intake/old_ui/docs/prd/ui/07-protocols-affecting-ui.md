# 07 · Protocols Affecting UI

Backend protocols whose behavior the UI must honor. The UI doesn't define these — they're system architecture — but the UI surfaces and copy must align with how they actually work.

---

## Email auto-responder protocol

### Behavior

- Approved outbound emails are **batched, not sent immediately**
- Three batches per day: **8:00 AM · 12:00 PM · 4:00 PM EST**
- On approve, email moves to drafts/outbox queue
- At batch time, queued items send
- client is notified via Agent Update after each batch fires

### UI implications

| Surface | UI element |
|---|---|
| Approval Card | Post-approve state shows: *"Approved — sending in next batch (4:00 PM)"* |
| Messages | **Outbox** indicator shows queued items: *"3 approved emails sending at 4:00 PM"* |
| Right-rail thread | Agent Update lands at batch time: *"Sent 5 approved emails just now."* |

### Pull-back affordance

client can pull back any queued email from the Outbox before it sends. UI shows each queued item with a `[Pull back]` action. Pulling back returns the email to draft state in the agent's queue.

### Why this is visible

The batch send is intentional — prevents the system from feeling spammy or rushed, gives client a buffer to change her mind, batches comms into predictable rhythms. The UI exposes the schedule so she **trusts** the batch model rather than wondering when something will go.

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
| Modify subform | *"Maxine will rework using your preferences and bring it back when ready (usually same-day or next morning)."* |
| Submitted state | Card collapses with note: *"Sent for revision — Maxine will bring it back."* — no countdown |
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
- Feed preference learning (client who repeatedly asks for "warmer" reveals her brand voice)
- Avoid the prompt-engineering pitfall of vague instructions
- Keep card vocabulary minimal

If she truly needs free-text direction, she opens the chat thread and says it — that's a User-Initiated interaction, not a card affordance.

---

## "I'll do myself" protocol

### Behavior

When client clicks the third button on an Approval Card:

1. Draft disappears from the agent's queue (agent stops touching this work)
2. Task created in client's user-only PM list
3. Agent's prior research, draft, and context are attached to the task
4. For drafts: the document opens in editor mode for her to edit and send
5. For actions: the task sits in her queue with the agent's recs as reference

### UI implications

- Optional one-line reason field on click (feeds preference learning) — non-blocking
- Task lands in user PM list (visible in Today's Decisions, in the Project's Decisions tab, in ⌘K search)
- Agent never re-presents this work — it's permanently transferred to her ownership

---

## PAC/PTQ pipeline (backend) → UI surface

### Backend behavior (client never sees this vocabulary)

1. **Trigger** (email arrives, meeting completed, webhook fires) creates a **PAC** (Pending Action Candidate)
2. PAC sits on `vault/30-Projects/pac-master-list.md`
3. Maxine assigns a **PTQ** (Project/Task Qualification) — the test for whether this becomes real work
4. PTQ resolves: Yes → spin up Project; No → delete PAC; Defer → re-evaluate later

### UI surface

- PAC/PTQ vocabulary is **never** shown to client
- When a PTQ requires client's confirmation (e.g., "should we open a project for this podcast invite?"), it surfaces as an **agenda item on the next briefing** — not as a card on Today
- Resolution happens during the Scheduled Call (briefing), client says yes/no/defer in conversation
- Once resolved, the project is created (or not) and client sees the result via Agent Update or Approval Card

### Why this matters for UI

This protocol is the reason **Question Cards don't exist** in the UI. The system doesn't interrupt client with "should we do X?" cards — it queues those as agenda items for the next structured conversation.

---

## Briefing prep protocol — 3 degrees of separation

### Backend behavior

Before each Scheduled briefing, Khadijah's prep protocol gathers context for each agenda item to **3 degrees of separation**. This bounds her response capacity:

- Agenda item: WBEZ podcast invite
- Degree 1: the producer's note, Sinclair's flag, the show's basic info
- Degree 2: prior podcast appearances, similar invitations, calendar collisions
- Degree 3: stated career goals, recent positioning decisions, audience overlap data

Khadijah responds confidently within those 3 degrees. Beyond that (4th-degree and further: ad-hoc tangents, novel questions client raises), **Sinclair handles the response** — she's prepared for the role of interpreter.

### UI implications

- Both agents are present in the Call Surface (see [05-call-surface.md](./05-call-surface.md))
- Khadijah leads agenda items; her responses are sourced from prep
- Sinclair takes notes and fields un-prepped territory
- When client goes off-agenda, Khadijah doesn't pretend to know — she signals to Sinclair, or Sinclair jumps in proactively

### Why this matters for UI

The pairing isn't decorative — it's structural. The UI shows **both avatars** during calls because both are operating; missing this would obscure how the system actually thinks.

---

## Scheduled meetings via standard pipeline

### Behavior

When an agent (Khadijah or Sinclair) needs client's time for a non-routine scheduled interaction (project deep-dive, decision session, etc.):

1. Agent drafts a calendar hold via Sinclair
2. Hold appears as an Approval Card: *"Sinclair drafted calendar hold · 30 min Wed 2pm w/ Khadijah · Re: birthday weekend logistics"*
3. client approves via standard 3-button flow
4. Hold lands on calendar
5. At scheduled time, the Call Surface activates

### UI implications

No special UI for scheduled-meeting requests. They use the same Approval Card component as any other scheduling artifact. The downstream effect (Call Surface activation) is invisible at approval time — it just becomes a calendar event with a `briefing` chip.

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
| Pre-programmed quick check-ins | One-line ping in Sinclair's right-rail thread |
| Deeper scheduled check-in | Call Surface (Sinclair-only mode) |
| Auto-adjustment (focus block held) | Visible in Calendar; surfaced in Today's agenda strip |
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
[Scooter] · Preference inferred · Save?
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
- Receipts appear in Library under their context after ingestion
- If parsing fails, Maxine surfaces a single Approval Card: *"Maxine couldn't parse a receipt — confirm details?"* with the image and editable fields

That's it. The UI doesn't make client think about receipts.

---

## Universal Inbox Ingestion protocol

### Behavior

Sinclair ingests communications from every configured channel (per `agents/sinclair/skills/executive-assistant/universal-inbox-ingestion.md`):

- Cron every 15 min + webhook push on incoming
- Normalizes to standard item shape
- Triages intent + priority
- Routes to relevant agent
- Stages `vault/15-Readiness/universal-inbox-triage.md`

### UI implications

The Messages surface (see [04-surfaces.md §4.4](./04-surfaces.md#44-messages)) renders that artifact. The summary block, normalized items array, and routing field map directly to UI elements.

UI must:
- Auto-refresh on `event.inbox.triaged` (every 15 min)
- Surface routing in user-facing language ("Sinclair handling" not "→ sinclair routing")
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
