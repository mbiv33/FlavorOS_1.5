# PAC Triage and Logging Protocol

## Header

- Owner agent: Maxine
- Supporting agents: Sinclair, Kyle, Khadijah
- Related skill: `pac-triage-and-logging`
- Planning source: `planning/14-pac-ptq-evaluation-engine/`

## Purpose

Capture possible work as a Pending Action Candidate without prematurely creating a task or project.

This protocol is the front half of the autonomous PAC/PTQ incubation engine. It exists to buffer ambient operational signals, score them, and keep them latent until they mathematically or operationally deserve commitment.

## Trigger

- `event.inbox.triaged` when a communication may create work
- `event.meeting.completed` when follow-up work may exist
- inbound webhook or manual intake that suggests possible execution
- `event.sweep.message`
- `event.sweep.event`
- `event.sweep.milestone`
- `event.sweep.ripple`

## Inputs

- normalized item or source payload
- source artifact path
- client context
- current project/task state when relevant
- relationship gravity context from Kyle when available
- milestone/goal context when available

## Phase Contract

1. Trigger Evaluation: determine whether the item is informational, actionable, or ambiguous.
2. PAC Definition: extract the candidate summary, source, likely scope, and missing commitment data.
3. PAC Logging: persist the PAC and append the human-readable PAC master list.
4. Autonomous PTQ Scoring: assign time, CRM, milestone, and touch scores.
5. Immediate Tripwire Check: auto-promote if any critical threshold is hit.
6. Incubation Update: if not promoted, compute the cumulative score and return the PAC to the active list.
7. Initial PTQ Assignment: define the first qualification gate and owner.

## Artifacts

- PAC master list update
- PAC readiness note when the case needs explanation or audit context
- PAC score and incubation state rendered into the master list

## SIGMA and Readiness Contract

- Create or update a SIGMA only when the trigger produces durable operating intelligence beyond the PAC itself.
- The PAC master list and any PAC note are readiness artifacts, not long-term workflow storage.
- Every PAC artifact must link back to the source normalized item, source event, or source report.
- Do not mint a SIGMA just to mirror a PAC score change.

## Approval Gates

- Owner confirmation routes to Khadijah when the PTQ is user intent, scope, or commitment sensitive.

## Handoffs

- Emit `event.pac.logged` for PTQ resolution.
- Emit `event.pac.rescored` when a new touch or nightly review materially changes the PAC.
- Route `request.approval.khadijah` when user confirmation is the PTQ.
- Preserve linkage for later project initiation or task creation.

## Failure Modes

- Duplicate trigger: dedupe against open PACs before creating another.
- Existing active project or task already owns the work: attach context there and avoid a new PAC.
- No clear action possibility: classify as informational and stop.
- A PAC has weak signal but non-zero future relevance: incubate instead of forcing commitment.
- A PAC reaches zero utility or 90-day staleness: flag it for purge review through Khadijah.

## Completion Signal

- Publish `report.maxine.pac-triaged`.
