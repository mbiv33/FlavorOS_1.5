# Meeting Lifecycle and Time Guarding Protocol

## Header

- Owner agent: Sinclair
- Supporting agents: Khadijah, Kyle, Scooter
- Related skill: `meeting-lifecycle-time-guarding`
- Planning source: `planning/05-meeting-lifecycle-time-guarding/`

## Purpose

Negotiate time while protecting focus, recovery, and family windows.

UI canon this protocol must honor:

- Meeting requests appear as artifacts for approval, not as invisible auto-commits.
- Non-artifact scheduling decisions live on a briefing agenda.
- Approved scheduled sessions can become call-surface events where Khadijah leads and Sinclair supports, or Sinclair-only wellness calls where appropriate.
- Calendar effects should surface as quiet updates unless they truly require interruption.

## Trigger

- Scheduling intent found in a message
- Manual scheduling request
- Calendar conflict or reschedule need

## Inputs

- Calendar availability, protected windows, participants, duration, urgency, and meeting purpose

## Phase Contract

1. Intent Recognition: parse participants, purpose, duration, and stakes.
2. Guard Verification: remove protected or unsafe slots.
3. External Coordination: prepare ranked options and draft coordination message.
4. Booking Confirmation: book or update the approved meeting.
5. Call Surface Handoff: when the approved event is a scheduled briefing, decision session, or deeper check-in, mark it for the correct call mode and agenda ownership.
6. Pre-Meeting Prep Trigger: dispatch prep work to Kyle or Scooter.

## Artifacts

- `meeting-instance` SIGMA for meetings with prep, dependency, negotiation, or follow-up state
- `meeting_proposal_packet.md`
- booking confirmation artifact
- prep trigger work order

## SIGMA and Readiness Contract

- The meeting SIGMA carries internal state: participants, constraints, decisions, conflicts, and follow-up risk.
- Readiness artifacts carry calendar proposals, confirmations, and prep requests for approval or action.
- Booking artifacts must link to the meeting SIGMA and source calendar/email items.

## Approval Gates

- Required for external accepts, declines, reschedules, and protected-window exceptions.

## Handoffs

- Kyle receives relationship-heavy prep.
- Scooter receives logistics-heavy prep.
- Khadijah receives approval packet and final brief.
- Scheduled briefings and decision sessions route back to Khadijah as lead with Sinclair as interpreter and note-capturer.

## Failure Modes

- No safe slots: escalate options and tradeoffs.
- Time zone ambiguity: halt external coordination until resolved.
- Calendar connector failure: write proposal with confidence warning.

## Completion Signal

- Publish `report.sinclair.meeting-proposed` or `report.sinclair.meeting-booked`.
