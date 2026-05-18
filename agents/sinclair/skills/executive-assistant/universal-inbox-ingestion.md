# Universal Inbox Ingestion

## Skill

- Skill name: `universal-inbox-ingestion`
- Owner agent: Sinclair
- Parent capability: `executive-assistant`
- Protocol: `communications-unification.protocol`

## Purpose

Gather communications from every configured channel, normalize them into one standard item shape, stage the triage surface, and emit routing events for downstream agents.

## Trigger

- Chron schedule, default every 15 minutes
- Webhook push on `nots.incoming.comm.*`
- Manual request from Khadijah or the owner

## Inputs

- Read-only connected platform APIs: O365, Gmail, LinkedIn, iMessage/SMS bridges, social DMs, and calendar invite sources when configured
- Current channel configuration from client envelope or runtime config
- Existing readiness context from `vault/15-Readiness/`

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

## Execution Steps

1. Pull unread or unprocessed communications from each configured source.
2. Normalize every item into the standard item shape.
3. Deduplicate by source id, thread id, sender, timestamp, and semantic duplicate check.
4. Triage intent and priority.
5. Stage the consolidated readiness artifact at `vault/15-Readiness/universal-inbox-triage.md`.
6. Emit `event.inbox.triaged` with the artifact path and item counts.

## SIGMA and Readiness Contract

- Do not invent a communication-specific SIGMA type during ingestion.
- Link normalized items to existing SIGMAs when they affect meeting, relationship, project, or wellness state.
- Use `vault/15-Readiness/universal-inbox-triage.md` as the reviewable/action-facing surface.
- If a new durable communication-memory SIGMA type becomes necessary, flag it as architecture debt.

## Outputs

- `vault/15-Readiness/universal-inbox-triage.md`
- `event.inbox.triaged`
- `report.sinclair.universal-inbox-triaged`

## Boundaries

- Read only during ingestion.
- Do not send replies.
- Do not accept, decline, or hold meetings.
- Do not update CRM profiles; Kyle owns relationship memory.
