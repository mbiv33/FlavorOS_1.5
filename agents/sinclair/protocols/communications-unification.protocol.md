# Communications Unification Protocol

## Header

- Primary owner: Sinclair
- Supporting agents: Kyle, Khadijah
- Related skills: `universal-inbox-ingestion`, `universal-calendar-sync`, `comms-crm-extraction`, `comms-approval-orchestration`
- Planning source: Communications Unification Protocol

## Purpose

Unify email, DMs, social messages, SMS bridges, and calendar invites into one normalized triage surface, route relationship and scheduling work to the right agent, and preserve HITL approval for all external commitments.

UI canon this protocol must honor:

- Messages surface as triage, drafts, outbox, quiet updates, or true escalations, not raw inbox plumbing.
- Approval-bearing artifacts render through the canonical Approval Card shape with plain-English copy.
- Scheduling or scope questions that are not artifact-driven belong on a briefing agenda, not in standalone question cards.
- Approved outbound messages may batch-send later; the UI must be able to show queued execution and pull-back state.
- Revision loops return as new artifact versions after a real work cycle, not as immediate rewrites.

## Trigger

- Chron schedule, default every 15 minutes
- Webhook push on `nots.incoming.comm.*`
- User voice command such as "Clear my inbox"
- Manual Khadijah review

## Inputs

- Connected read-only communication APIs
- `vault/15-Readiness/universal-inbox-triage.md`
- `vault/20-Meetings/master-calendar.md`
- `vault/40-People/`
- Existing supported SIGMAs when present

## Phase Contract

1. Universal Inbox Ingestion: Sinclair pulls source items, normalizes them, deduplicates them, triages intent and priority, writes `vault/15-Readiness/universal-inbox-triage.md`, and emits `event.inbox.triaged`.
2. Universal Calendar Sync: Sinclair filters triaged items for invites and scheduling requests, de-conflicts them, writes `vault/20-Meetings/pending-scheduling.md`, and emits `request.approval.khadijah`.
3. Communications CRM Extraction: Kyle consumes `event.inbox.triaged`, updates relationship memory where safe, stages follow-ups, and flags critical VIP issues.
4. Communications Approval Orchestration: Khadijah synthesizes triage and scheduling artifacts, briefs the owner, captures decisions, and routes approved execution back to Sinclair.
5. Revision Loop: when the owner chooses modify, Sinclair revises in a non-immediate cycle and returns a new artifact version.
6. Ownership Transfer: when the owner chooses I'll-do-it-myself, Sinclair removes the pending action from agent execution while preserving context.
7. Approved Execution: Sinclair executes only approved sends, accepts, declines, counter-proposals, labels, archives, or calendar actions.

## Normalized Item Shape

```json
{
  "normalized_item_id": "comm_YYYYMMDD_HHMMSS_source_hash",
  "source_item_id": "external-provider-id",
  "platform": "gmail | o365 | linkedin | sms | imessage | social_dm | calendar",
  "channel": "email | dm | sms | calendar",
  "sender": {
    "display_name": "",
    "handle": "",
    "email": "",
    "phone": "",
    "platform_profile_url": ""
  },
  "timestamp": "ISO-8601",
  "thread_id": "",
  "subject": "",
  "body_summary": "",
  "intent": "invite | scheduling_request | action_required | informational | newsletter | relationship_update | unknown",
  "priority": "low | normal | high | urgent",
  "requires_approval": false,
  "source_uri": "",
  "attachments": [],
  "related_sigmas": [],
  "routing_targets": []
}
```

## Artifacts

- `vault/15-Readiness/universal-inbox-triage.md`
- `vault/20-Meetings/pending-scheduling.md`
- `vault/15-Readiness/kyle-deferred-followups.md`
- updated `vault/40-People/` profiles
- `vault/10-Briefs/comms-decision-brief.md`

## SIGMA and Readiness Contract

- Use readiness artifacts as the human/action-facing interface.
- Update supported SIGMAs only when normalized items change durable meeting, relationship, project, or wellness state.
- Do not invent a communication-specific SIGMA type during execution.
- Link every readiness artifact to source items and related SIGMAs where present.

## Approval Gates

- HITL required for external email sends, text/DM sends, accepting meetings, declining relationship-sensitive meetings, counter-proposals, external calendar holds, public statements, sensitive relationship moves, or anything with legal/financial implications.

## Bus Events

- `event.inbox.triaged`
- `request.approval.khadijah`
- `flag.high.khadijah`
- `execute.sinclair.calendar`
- `execute.sinclair.comms`
- `audit.approval.comms`

## Handoffs

- Sinclair to Kyle: relationship extraction from normalized communications.
- Sinclair to Khadijah: pending scheduling and reply approval.
- Khadijah to Sinclair: approved execution commands.
- Kyle to Khadijah: only critical relationship risks or sensitive decisions.
- Sinclair to right-rail update surface: quiet confirmations after sends, filing, or queue changes.

## Failure Modes

- Source API unavailable: mark source as unavailable in triage artifact and continue with other sources.
- Duplicate item suspected: keep one canonical normalized item and list merged source ids.
- Unsupported channel metadata: preserve raw source reference and set intent to `unknown`.
- Ambiguous sender identity: route to Kyle for identity resolution before CRM updates.
- Approval packet lacks exact side effect: Khadijah returns it for revision.
- Owner asks for novel free-text changes on the card: route to thread/call conversation, then convert the result back into a structured revision cycle.

## Completion Signal

- Publish `report.sinclair.communications-unified` after triage and routing.
- Publish `audit.approval.comms` after owner decisions are captured.
