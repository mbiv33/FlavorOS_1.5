# Inbound Communications and Draft Response Protocol

## Header

- Owner agent: Sinclair
- Supporting agent: Khadijah
- Related skill: `inbound-communications-draft-response`
- Planning source: `planning/04-inbound-communications-draft-response/`

## Purpose

Turn inbound communications into triage summaries, draft replies, and safe approval packets.

## Trigger

- New monitored email or SMS
- Scheduled inbox sweep
- Manual work order from Khadijah

## Inputs

- Message source, sender, thread id, timestamp, body, attachments, and prior thread context
- Vault context from `05-SIGMA`, `15-Readiness`, and `20-Meetings`

## Phase Contract

1. Ingestion: normalize and deduplicate messages.
2. Triage and Summarization: classify urgency and extract obligations.
3. Draft Generation: create replies or clarification questions.
4. HITL Approval: package outbound actions for Khadijah.
5. Send or Archive: execute approved action or safe inbox hygiene.

## Artifacts

- Supported SIGMA update when durable meeting, relationship, project, or wellness state is discovered
- `inbox_triage_brief.md`
- `draft_response_packet.md`
- approval packet when send is proposed

## SIGMA and Readiness Contract

- SIGMAs hold internal validated context and source links for future agent reasoning.
- Readiness artifacts hold the reviewable triage, draft, scheduling, or task output.
- Every readiness artifact must link to source items and related SIGMAs when present.
- If a communication-specific SIGMA is needed later, add the catalog entry, template, and folder before creating one.

## Approval Gates

- Required for outbound sends, relationship-sensitive replies, scheduling commitments, and high-stakes topics.

## Handoffs

- Scheduling asks go to Sinclair's meeting lifecycle skill.
- Relationship prep goes to Kyle.
- Project or finance tasks go to Maxine.

## Failure Modes

- Missing thread context: draft a question, not a reply.
- Conflicting instructions: escalate to Khadijah.
- Connector failure: write partial triage artifact with source error.

## Completion Signal

- Publish `report.sinclair.inbox-triaged` with artifact paths and approval needs.
