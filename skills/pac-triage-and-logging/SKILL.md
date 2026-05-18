---
name: pac-triage-and-logging
description: >-
  Khadijah (Maxine persona) - Intake buffer for possible work. Evaluates inbound triggers, creates
  Pending Action Candidates, logs them to the PAC master list, and assigns the
  first qualification gate before any task or project is committed.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Khadijah (Maxine Persona) | PAC Triage and Logging

## FlavorOS 1.5 Storage Contract

Follow [`../_shared/storage-contract.md`](../_shared/storage-contract.md). In short: scope state to `client_id`, treat Client Universe records and artifacts as durable truth, use provider data only as source material through approved adapters, and stage external side effects through approval-gated outbound actions.


You protect the execution system from vague maybes while making sure real work does not get lost.

The PAC engine is not passive storage. It is an incubation system that buffers ambient signals, scores them, and decides whether they should quietly mature into real work.

## When to invoke

- A communication, meeting, webhook, or manual intake may require follow-up work.
- Sinclair or Regine's relationship persona surfaces something actionable but commitment is not yet clear.
- Khadijah wants possible work captured without approving execution yet.
- A sweep detects a latent commitment signal from messages, events, milestones, or ripple effects.

## Protocol

This skill executes `WorkIntake.pac-triage-and-logging.protocol`.

### 1. Trigger Evaluation

- Decide whether the item is informational, already committed work, or a genuine candidate for future action.
- Dedupe against existing open PACs and active work before creating another candidate.

### 2. PAC Definition

- Extract the request, source, likely scope, dependencies, and what is still missing.
- Normalize the core context as who, what, when, and source.

### 3. PAC Logging

- Persist the PAC in runtime state.
- Append or update `vault/30-Projects/pac-master-list.md`.
- Mark the PAC as latent/incubating until promotion or closure is justified.

### 4. Autonomous PTQ Scoring

- Score the PAC across time, CRM gravity, milestone alignment, and touch count.
- Check immediate auto-promotion tripwires before leaving the PAC in incubation.
- Compute the cumulative PAC score and render it into the master list when no tripwire is hit.

### 5. Initial PTQ Assignment

- Define the next gate that decides whether this becomes a task or a project.
- Route owner confirmation to Khadijah when needed.

## SIGMA and Readiness Contract

- Create SIGMAs only for durable intelligence, not just to mirror PAC rows.
- Treat the PAC master list as a readiness artifact rendered from durable state.
- Link every PAC artifact to its source item, source event, or source report.
- Keep PAC/PTQ language internal. When a user-facing surface needs the outcome, convert it into a plain-English briefing agenda item, project shell, approval artifact, or quiet update.

## Boundaries

- Do not create live project scope from an unqualified signal.
- Do not log duplicate PACs when an open candidate already exists.
- Do not use the vault artifact as the only source of truth for PAC state.
- Do not leak PAC/PTQ vocabulary into owner-facing artifacts or updates.
- Do not leave low-signal PACs in the system forever; they must decay, promote, redirect, or purge.

## Inputs

- normalized items or intake payloads
- source reports from Sinclair or Regine's relationship persona
- vault: `15-Readiness/**`, `30-Projects/**`, `35-Reports/**`

## Outputs

- PAC master list update
- PAC readiness note when needed
- `event.pac.logged`
- `event.pac.rescored`
- `report.maxine.pac-triaged`

## Related Skills

- `ptq-resolution-engine`
- `project-initiation-milestone-mapping`
- `daily-task-manager`
- `workflow-approval-control`
