# Executive Prep and Networking Brief Protocol

## Header

- Owner agent: Kyle
- Supporting agents: Sinclair, Khadijah
- Related skill: `executive-prep-networking-brief`
- Planning source: `planning/07-executive-prep-networking-brief/`

## Purpose

Prepare concise dossiers for upcoming meetings and networking moments.

## Trigger

- Calendar look-ahead finds a meeting 12 to 48 hours out
- Sinclair books a relationship-heavy meeting
- Khadijah requests a prep brief

## Inputs

- Calendar event, attendee list, CRM records, relationship notes, prior meetings, and approved public context

## Phase Contract

1. Calendar Look-ahead: identify and rank prep needs.
2. Data Extraction: pull relationship, CRM, notes, and web context.
3. Synthesis: produce posture, talking points, dependencies, and risks.
4. Brief Injection: write brief to `vault/20-Meetings/`.

## Artifacts

- meeting or relationship SIGMA update when validated new context is discovered
- executive prep brief
- attendee dossier notes
- dependency list

## SIGMA and Readiness Contract

- SIGMAs hold internal relationship, meeting, and dependency memory.
- The meeting dossier is the readiness artifact the owner or Khadijah reviews.
- The dossier must link to CRM/source notes and related SIGMAs without exposing unsupported inference as fact.

## Approval Gates

- Required for reputation-sensitive, partnership-sensitive, or public-facing recommendations.

## Handoffs

- Sinclair receives logistical prep notes.
- Khadijah receives the final owner-facing brief.

## Failure Modes

- Unknown attendee: create a low-confidence stub and flag the gap.
- Conflicting CRM memory: prefer higher-confidence source and surface conflict.
- Sensitive inference: label as inference or omit.

## Completion Signal

- Publish `report.kyle.executive-prep-ready`.
