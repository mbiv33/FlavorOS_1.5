# Universal Calendar Sync

## Skill

- Skill name: `universal-calendar-sync`
- Owner agent: Sinclair
- Parent capability: `executive-assistant`
- Protocol: `communications-unification.protocol`

## Purpose

Extract meeting invites and scheduling requests from the universal inbox, de-conflict them against the master calendar, and stage proposed calendar changes for approval.

## Trigger

- `event.inbox.triaged` where item intent is `invite` or `scheduling_request`
- Manual scheduling review request from Khadijah
- Owner voice command asking to clear or review calendar requests

## Inputs

- `vault/15-Readiness/universal-inbox-triage.md`
- `vault/20-Meetings/master-calendar.md`
- Scheduling preferences, protected windows, calendar rules, and existing meeting SIGMAs when present

## Execution Steps

1. Extract all calendar invitations and scheduling requests from the universal inbox triage artifact.
2. De-conflict requested times against `master-calendar.md`, protected windows, travel buffers, and scheduling preferences.
3. Draft proposed accepts, declines, counter-proposals, or pending holds.
4. Stage all proposed changes as pending only.
5. Request approval from Khadijah with exact external obligations listed.

## SIGMA and Readiness Contract

- Create or update a `meeting-instance` SIGMA only for meetings with meaningful preparation, negotiation, dependencies, or follow-up state.
- Produce `vault/20-Meetings/pending-scheduling.md` as the readiness artifact for approval.
- Link proposed calendar changes to source inbox items and related meeting, relationship, project, wellness, or ripple SIGMAs.

## Outputs

- `vault/20-Meetings/pending-scheduling.md`
- `request.approval.khadijah`
- `report.sinclair.pending-scheduling-ready`

## Boundaries

- Do not accept meeting invites without HITL approval.
- Do not send counter-proposals without HITL approval.
- Do not create external obligations from a pending artifact.
