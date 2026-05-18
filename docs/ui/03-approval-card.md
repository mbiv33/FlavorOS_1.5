# 03 · Approval Card

The single canonical decision component. Used everywhere client makes a decision about an artifact.

> **Important:** Approval Card is the *only* user-facing decision component in FlavorOS. Question Cards, Suggestion Cards, and PTQ confirmation cards are **not** part of the framework. Decisions that aren't artifact-driven (e.g., "should we open a project for this podcast invite?") live on briefing agendas — not as cards on Today. See [01-interaction-taxonomy.md](./01-interaction-taxonomy.md).

---

## Anatomy

```
┌────────────────────────────────────────────────────┐
│ [Avatar] Maxine · drafted invoice · #247           │  ← Headline
│ [💰 $4,200] [FlourishED] [⏱ today]                  │  ← Stakes + context chips
├────────────────────────────────────────────────────┤
│ [Artifact preview — collapsible]                   │  ← The thing being decided about
│   To: Acme Co.  Project: NTC consulting  Net 30    │
├────────────────────────────────────────────────────┤
│ [Ripple ▾]  (only if non-trivial downstream impact)│  ← Conditional
├────────────────────────────────────────────────────┤
│ ▸ Why this amount  (single block, collapsed default)│  ← Reasoning
├────────────────────────────────────────────────────┤
│ [✓ Approve]  [✎ Modify]  [✕ I'll do myself]         │  ← Decision row
└────────────────────────────────────────────────────┘
```

---

## Headline

Format: `[Persona avatar] [Persona name] · [verb] · [object]`

| Persona | Verb | Object |
|---|---|---|
| Maxine | drafted invoice | #247 to Acme |
| Sinclair | drafted reply | to John Smith |
| Scooter | curated booking bundle | Paris hotel + flight |
| Kyle | drafted follow-up | to Acme intro request |
| Regine *(Kyle's social/dev)* | drafted intro request | to Dr. Williams |

**Verb is always past-tense for completed work** ("drafted", "curated", "prepared"). Never present-progressive ("is drafting") on an actionable card — if the work isn't done, there's no card yet.

---

## Stakes chips

Show only when applicable. Most cards have 1–2.

| Chip | Means |
|---|---|
| 💰 **money** | Dollar value involved. Always shown if money is in play. (`$4,200`) |
| ⏱ **time-sensitive** | Decision window. (`today`, `2h`, `expires Fri`) |
| 🔗 **public-facing** | Outbound to a person or channel |
| 🔒 **irreversible** | Booking, send, transfer, post |
| ⚠️ **high-stakes relationship** | Flagged contact (board, family, top clients) |
| **[Context]** | Always shown. Color-coded. (`W2 Work`, `FlourishED`, `Career`, `Personal`) |

The context chip is mandatory — every artifact belongs to a context. The stakes chips are conditional.

---

## Artifact preview

The thing client is deciding about, rendered inline. Collapsible (compact mode = headline + chips + actions only).

### Density modes

- **Compact** *(default in feeds)* — headline + chips + decision row. ~80px tall. Approve in one click without expanding.
- **Expanded** — adds artifact preview + reasoning. Click headline to toggle.
- **Focused** — full screen. Used for long drafts (4-paragraph emails, multi-page briefs) where client needs editing room. Reached via expand icon.

### What the preview shows by artifact type

| Artifact type | Preview content |
|---|---|
| Outbound email | To · Subject · body excerpt or full body |
| Outbound SMS | Recipient · full message |
| Invoice | To · Project · Hours/items · Total · Terms |
| Calendar hold | Title · participants · time · context · purpose |
| Booking choice | Vendor · price · key details · confirmation deadline |
| Brief / report | Title · top-line · table of contents |
| Follow-up | Recipient · what's being followed up on · message body |

---

## Ripple panel — conditional

When the underlying skill flags non-trivial downstream impact (people / place / work / obligations affected by client's decision), a Ripple section reveals the cascade.

```
┌────────────────────────────────────────────────┐
│ Ripple                                          │
│ Approving today brings FlourishED May AR to     │
│ $11,800 open. Acme's prior invoice cleared in   │
│ 18 days.                                        │
└────────────────────────────────────────────────┘
```

**Skip when ripples are nil.** Don't draw an empty Ripple panel just for consistency. Most cards won't have one.

The Ripple Effect Protocol (backend) drives this — it assesses People / Place / Work / Obligations downstream of any major decision. Travel and Finance approvals are the most common Ripple-bearing artifacts.

---

## Reasoning — single block

One expandable "Why" section. Collapsed by default; click to expand. Plain English explanation of how the agent arrived at this artifact.

Example: *"21 hours logged across 6 sessions, billed at the SOW's $200/hr advisory rate."*

Not split into multiple sub-blocks. One pass, fully synthesized.

---

## Decision row — three buttons. No Ask.

```
[✓ Approve]  [✎ Modify]  [✕ I'll do myself]
```

| Button | Behavior |
|---|---|
| **Approve** | Sets artifact for use/send. Card transitions to post-approve state showing scheduling info (see below). Eventually collapses into handled-tray. |
| **Modify** | Opens 3-axis structured subform (see below). Submitting hands the artifact back to the agent for thorough rework. **Minimum 1 hour return time** — this is a floor, not a deadline. |
| **I'll do myself** | Draft disappears from the agent's queue. Task created in client's user-only PM list, with the agent's prior research/draft attached as context. The agent never re-touches this work. |

**No "Ask" button.** If client needs clarification, she opens the chat thread (User-Initiated interaction) — not an affordance on the card. This keeps the card vocabulary tight and pushes ambiguity to the right surface.

### Modify subform — three structured axes

```
┌────────────────────────────────────────────────────┐
│ What should we change?                             │
│                                                    │
│  Tone           ☐ warmer        ☐ more professional│
│  Format         ☐ narrative     ☐ outline         │
│  Sender request ☐ clarity       ☐ additional details│
│                                                    │
│ Maxine will rework using your preferences and      │
│ bring it back when ready (usually same-day or      │
│ next morning).                                     │
│                                                    │
│              [Cancel]  [Send for revision]         │
└────────────────────────────────────────────────────┘
```

Multi-select: client can pick zero, one, or more checkboxes per dimension. **No free-text input** — all modifications are structured.

The 1-hour minimum reflects real refinement (consulting preferences, prior artifacts, cross-agent context). The UI does not promise faster turnaround; copy uses "when ready" language.

**Effect:** Submitting closes the original card and queues a rework. The artifact returns later as a *new* Approval Card (same artifact, marked v2). client sees it whenever it lands.

### "I'll do myself" — adapts label to artifact type

Single underlying behavior. Label adapts so the verb is honest:

| Artifact type | Button label |
|---|---|
| Draft (email, brief, doc) | **I'll edit & send** |
| Action (booking, transfer, post) | **I'll do it myself** |
| Generic / multi-type | **I'll do myself** |

In all cases: task is created, agent's prior work is attached, agent stops touching it.

---

## Post-approve state — scheduling info

Approval doesn't always mean "send right now." Many artifacts route into protocols with scheduled execution. The card shows what happens next:

| Artifact type | Post-approve state |
|---|---|
| Outbound email | "Approved — sending in next batch (4:00 PM)" |
| Outbound SMS / DM | "Approved — sending in next batch (4:00 PM)" |
| Invoice | "Approved — sending tomorrow 9 AM" |
| Internal brief | "Approved — filed to Library" |
| Booking action | "Approved — Scooter executing now" |
| Calendar hold | "Approved — added to your calendar" |

The card stays visible in the post-approve state for ~5 minutes (so client can pull back), then collapses to handled-tray.

See [07-protocols-affecting-ui.md](./07-protocols-affecting-ui.md) for the full email auto-responder protocol the UI honors.

---

## States

```
pending ──Approve──> approved ──[scheduled time]──> sent ──> handled-tray
        ──Modify──> revising  ──[1hr+]──> pending (v2)
        ──I'll do myself──> rejected (logged)  +  task → user PM list
        ──[time elapsed]──> stale  (header pulses; preference-driven escalation)
        ──[agent retracts]──> withdrawn (notice shown briefly)
```

**`stale`** is important: long-pending high-stakes cards should escalate, not silently rot. Behavior driven by Preferences (e.g., "auto-decline meeting requests un-replied after 24h", "never auto-act on money").

---

## Voice

Every card has a short voice handle the agent uses. Disambiguation is `persona + object` — no IDs, no numbers.

| Voice phrase | Effect |
|---|---|
| "Approve the Acme invoice" | Approve |
| "Modify John's reply" | Opens Modify subform; client speaks dimensions ("warmer, more clarity") |
| "I'll do the gala one myself" | I'll do myself |

Voice for Modify subform: spoken dimensions match checkboxes ("warmer", "outline", "more clarity") — system maps voice phrases to checkbox state, then submits.

---

## Bulk

When one skill produces N similar cards (3 follow-up emails, 5 expense categorizations) within a ~10-minute window, group into a **batch card**:

```
[Regine] · drafted 3 follow-ups · gala attendees
[Review each ▾]  [Approve all]  [Reject all]
```

`Approve all` fires the post-approve protocol on each (likely scheduling all to the same batch send). `Reject all` creates 3 separate user-PM tasks. `Review each` expands inline to per-card.

---

## Where Approval Cards appear

A single canonical component. It appears in multiple containers — same component, state synced across surfaces.

- **Today** (Ready-for-you zone)
- **Project Status tab** (per-project pending decisions)
- **Messages** (when an inbound item produced a draft)
- **Right-rail thread** (when surfaced via voice or chat)
- **Calendar** (when a hold is being approved)

Acting from any one updates all the others. Single source of truth.

---

## What Approval Cards do *not* contain

To preserve sausage > sausage-making:

- ❌ Internal coordination ("Khadijah asked Maxine to…")
- ❌ Failed attempts / dead-ends
- ❌ Routine processing summaries
- ❌ Confidence scores or agent metadata
- ❌ Skill names or backend protocol references
- ❌ PTQ / PAC / SIGMA vocabulary
- ❌ "Why" reasoning that exposes agent internals (use plain English)

If we'd be tempted to show it, it goes in **Decisions** (the per-project tab) only when it reflects client's choices, or it stays backend.

---

## Keyboard shortcuts

When a card is focused:

| Key | Action |
|---|---|
| `↵` | Approve (primary) |
| `M` | Open Modify subform |
| `R` | I'll do myself |
| `E` | Expand / collapse preview |
| `↑↓` | Move focus to prev/next card |
| `Esc` | Defocus card |
