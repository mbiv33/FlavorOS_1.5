# Task Execution and Status Monitoring Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah
- Related skill: `task-execution-status-monitoring`
- Planning source: `planning/13-task-execution-status-monitoring/`

## Purpose

Maintain the daily execution queue and red-yellow-green project status picture.

## Trigger

- Daily operating rhythm
- Manual status review
- Blocker or overdue threshold

## Inputs

- Active task list, milestone map, dependency state, prior status snapshot, and pending approval queue

## Phase Contract

1. Daily Prioritization: rank active work.
2. Dependency Checking: surface blockers and waiting states.
3. Progress Auditing: compare progress to expectations.
4. Escalation: emit status and route owner decisions.

## Artifacts

- project-state SIGMA updates for material progress, blocker, dependency, or risk changes
- daily status snapshot
- prioritized task queue
- escalation brief

## SIGMA and Readiness Contract

- SIGMAs hold internal project state that future prioritization and risk scans use.
- Daily snapshots, prioritized queues, and escalation briefs are readiness artifacts.
- Status artifacts must link to project SIGMAs, task source items, and approval records.

## Approval Gates

- Required for scope changes, tradeoff decisions, external commitments, or owner intervention.

## Handoffs

- Khadijah receives daily briefing inputs.
- Project initiation receives structural gaps.
- Finance receives milestone or billing signals.

## Failure Modes

- Missing status: mark stale and request update.
- Conflicting task states: preserve both and flag reconciliation.
- Too many red items: group by decision needed.

## Completion Signal

- Publish `report.maxine.daily-status`.
