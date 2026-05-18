# Project Initiation and Milestone Mapping Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah
- Related skill: `project-initiation-milestone-mapping`
- Planning source: `planning/12-project-initiation-milestone-mapping/`

## Purpose

Turn new work into a structured project shell, milestone map, and initial task queue.

## Trigger

- New client engagement
- Approved internal initiative
- Manual project setup request
- Qualified PAC/PTQ handoff for work that needs project structure

## Inputs

- Intake brief, scope, stakeholders, deadlines, budget exposure, service template, and success criteria
- PAC/PTQ handoff context when the work originated as conditional intake

## Phase Contract

1. Intake Ingestion: capture core project facts.
2. Service Template Application: select template and note deviations.
3. Set Milestones: define phases, acceptance criteria, and dates.
4. Resource Allocation: assign agent and human responsibilities.
5. Initial Task Generation: create task packet and project shell.

## Artifacts

- project-state SIGMA for active operating state
- project shell
- milestone map
- initial task packet

## SIGMA and Readiness Contract

- The project-state SIGMA holds internal operating state, milestones, dependencies, and risk.
- The project shell, milestone map, and initial task packet are readiness artifacts.
- Project readiness artifacts must link to intake source items, approval decisions, and related SIGMAs.

## Approval Gates

- Required for new scope, budget commitments, contractual interpretation, or external obligations.

## Handoffs

- Task monitoring consumes project shell and initial tasks.
- Receivables consumes billable milestone metadata.
- Khadijah receives scope-sensitive decisions.

## Failure Modes

- Missing signed scope: create draft project shell and mark blocked.
- Template mismatch: use closest template and flag assumptions.
- Ambiguous owner: escalate.

## Completion Signal

- Publish `report.maxine.project-initiated`.
