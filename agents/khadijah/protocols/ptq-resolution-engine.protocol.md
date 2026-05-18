# PTQ Resolution Engine Protocol

## Header

- Owner agent: Maxine
- Supporting agents: Khadijah, Sinclair, Kyle
- Related skill: `ptq-resolution-engine`
- Planning source: `planning/14-pac-ptq-evaluation-engine/`

## Purpose

Resolve Project / Task Qualifications so PACs become a real task, a real project, or a cleanly closed non-work item.

This protocol is the back half of the autonomous PAC/PTQ incubation engine. It governs maturation, promotion, redirection, decay, and purge after a PAC has been staged.

## Trigger

- `event.pac.logged`
- `event.ptq.condition_met`
- time-based PTQ review
- manual review request from Khadijah or the owner
- nightly PAC horizon review
- repeat-touch or multi-mention re-score event

## Inputs

- PAC record
- PTQ record
- source artifacts
- service templates
- current task and project state
- current PAC score vector and cumulative score

## Phase Contract

1. PTQ Dispatch: route the qualification gate to the correct resolver.
2. Condition Monitoring: wait for response, time passage, dependency completion, owner decision, or repeat-touch signal.
3. Re-Score Review: recalculate whether the PAC now promotes, waits, decays, or purges.
4. Resolution Assessment: classify result as yes, no, redirect, incubate, or purge-pending.
5. Conversion Or Closure: create the execution object, keep incubating, or close the PAC.
6. Audit Update: clear or update the PAC master list and write final state.

## Artifacts

- PAC master list state update
- PTQ status note when the qualification is non-trivial
- task packet or project-initiation handoff when qualified
- closure note when rejected or expired
- purge review note when stale PACs are batched for Khadijah

## SIGMA and Readiness Contract

- PTQ state lives durably in runtime storage and is rendered into vault artifacts for operator visibility.
- Create or update a project-state SIGMA only when a PAC becomes active work or materially changes an existing project.
- Task packets, project-initiation handoffs, and closure notes are readiness artifacts.

## Approval Gates

- Route owner-facing decisions through Khadijah.
- Do not create new scope, budget exposure, or external obligations without the required approval path.
- Route stale-PAC purge batches through Khadijah before deleting active PACs when user review is required.

## Handoffs

- Qualified bounded work goes to Maxine's task-management layer as a task packet.
- Qualified structured work goes to `project-initiation-milestone-mapping`.
- User-confirmation PTQs flow through `workflow-approval-control` or Khadijah briefing patterns as appropriate.
- Stale PAC cleanup batches go to Khadijah as a lightweight archive decision.

## Failure Modes

- PTQ stalls: mark waiting state and surface the blocker.
- PTQ resolves to an existing project: attach context and close the PAC as redirected.
- PTQ reveals no work: archive context if useful and close the PAC.
- Incubation never resolves because there is no decay policy: treat this as a protocol failure and trigger purge handling.

## Completion Signal

- Publish `report.maxine.ptq-resolved`.
