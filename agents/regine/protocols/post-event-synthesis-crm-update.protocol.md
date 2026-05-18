# Post-Event Synthesis and CRM Update Protocol

## Header

- Owner agent: Kyle
- Supporting agents: Maxine, Khadijah
- Related skill: `post-event-synthesis-crm-update`
- Planning source: `planning/08-post-event-synthesis-crm-update/`

## Purpose

Turn post-event source material into updated relationship memory and routed follow-up work.

## Trigger

- Meeting ends and transcript or notes are available
- User records post-event notes
- Khadijah requests synthesis

## Inputs

- Transcript, notes, attendee list, calendar event, prior prep brief, and CRM records

## Phase Contract

1. Ingestion: preserve raw source links and event metadata.
2. Entity and Task Extraction: extract people, decisions, commitments, and follow-ups.
3. CRM Profile Updates: create factual update packets.
4. Handoff to PM Engine: route deliverables to Maxine.

## Artifacts

- meeting-instance and relationship SIGMA updates for validated outcomes and relationship state
- post-event synthesis
- CRM update packet
- PM handoff queue item

## SIGMA and Readiness Contract

- SIGMAs hold validated meeting outcomes, relationship state, and decisions.
- Readiness artifacts hold the post-event synthesis, CRM update packet, and PM handoff.
- Every extracted commitment must link back to transcript, note, or source SIGMA.

## Approval Gates

- Required for sensitive CRM updates, public statements, partnership terms, and commitment changes.

## Handoffs

- Maxine receives task and deliverable packets.
- Khadijah receives sensitive decisions and final synthesis.

## Failure Modes

- No transcript: request user note or summarize from calendar context with low confidence.
- Ambiguous owner: route to Khadijah.
- Entity conflict: preserve both and request merge review.

## Completion Signal

- Publish `report.kyle.post-event-synthesized`.
