# PAC and PTQ Evaluation Engine

## Purpose

This document defines the FlavorOS buffer between inbound triggers and committed execution work.

Use this pattern when a message, meeting, webhook, or manual note may require follow-up, but the system should not yet create a live task or project.

## Canonical FlavorOS Terms

- `PAC`: Pending Action Candidate
- `PTQ`: Project / Task Qualification

If the team wants one shorthand for "we may create a task or project from this," use `PAC`.

## Executive Summary

Not every email, passing idea, or calendar invite deserves to become a task or project. FlavorOS uses the PAC/PTQ engine to capture possible work, hold it in a latent incubation state, score it against relational and temporal vectors, and only promote it when the signal is strong enough or a hard tripwire is hit.

Primary owner:

- Maxine

Supporting agents:

- Sinclair
- Kyle
- Khadijah

Primary human-readable artifact:

- `vault/30-Projects/pac-master-list.md`

## Why This Exists

FlavorOS should not create durable execution objects for every vague ask, FYI, or passing suggestion.

The PAC/PTQ layer separates:

1. capture of possible work
2. qualification of whether the work is real
3. commitment into a task packet or project shell

That separation keeps the task system cleaner, preserves auditability, and gives Khadijah a crisp approval surface when human confirmation is needed.

## End-To-End Flow

```text
ambient data or trigger
  -> sweep detects possible commitment
  -> PAC staging and logging
  -> autonomous PTQ scoring
  -> immediate tripwire check
     -> YES: create task/project
     -> NO: incubate on PAC master list
  -> event-driven or nightly re-score
  -> promote, decay, or purge
```

## Phase 1: Ingestion (The Sweeps)

Other agents continuously scan the operating environment for signals that may create future work.

Canonical sweep lanes:

- Message Sweep (Sinclair)
- Event Sweep (Sinclair)
- Milestone/Holiday Sweep (Kyle)
- Ripple Protocol (Scooter and Maxine)

Examples:

- inbox mention of a future commitment
- pending invite or unconfirmed RSVP
- birthday, anniversary, or renewal milestone
- ripple from a confirmed trip or project dependency

These sweeps emit triggers onto the bus. Maxine does not need the user to manually log the idea first.

## Phase 2: PAC Staging And Generation

When a sweep detects a possible commitment, Maxine:

1. extracts the core context: who, what, when, source
2. dedupes against existing open PACs or active work
3. creates or updates a PAC in durable runtime storage
4. renders the PAC onto `vault/30-Projects/pac-master-list.md`

At this point the work is in limbo, not yet committed.

## Phase 3: Autonomous PTQ Scoring Matrix

Maxine immediately scores the PAC across four vectors.

### Time Score

Measures temporal urgency.

Suggested baseline bands:

- `5.0`: urgent, under 48 hours, or immediate response required
- `1.0`: under 5 days
- `0.75`: over 10 days out
- `0.5`: over 21 days out or long-horizon mention

### CRM Score

Measures relationship gravity using Kyle's relationship model.

Suggested baseline bands:

- `5.0`: VIP or immediate-response contact
- `1.0`: client or high-importance direct relationship
- `0.75`: family contact, client lead, or important friend
- `0.5`: friend contact
- `0.25`: colleague, coworker, or low-gravity social-channel follow-up

### Milestone Score

Measures alignment with active goals or confirmed milestones.

Suggested baseline bands:

- `5.0`: direct dependency for a confirmed goal or milestone
- `1.0`: probable goal/milestone alignment
- `0.5`: possible goal/milestone alignment
- `0.0`: no meaningful alignment yet

### Touch Score

Measures how many times the candidate has been surfaced.

Suggested baseline bands:

- `5.0`: second-plus mention or repeated protocol hit within 24 hours
- `2.0`: prior touch score already above zero plus another mention within a few days
- `1.0`: initial mention

The purpose of Touch Score is to let repeated weak signals mature into real work without asking the user too early.

## Phase 4: Promotion Tripwires (Immediate Resolution)

After scoring, Maxine checks immediate promotion tripwires.

Auto-promote the PAC immediately when any critical threshold is hit, such as:

- time urgency is maximal
- CRM gravity is maximal
- the PAC is a direct dependency for a confirmed goal or milestone
- repeated touches push the candidate over the multi-touch threshold

When a PAC auto-promotes:

- remove it from the active PAC list
- convert it into a real task packet or project shell
- preserve the audit trail linking the PAC to the resulting execution object

If no immediate tripwire is hit, calculate the cumulative PAC score and return it to incubation.

## Phase 5: Incubation Loop (Latent Maturation)

PACs on the master list are not dead. They are monitored latent variables.

Two mechanisms mature them:

### Event-Driven Re-Scoring

If another sweep hits the same topic:

- attach the new signal to the existing PAC
- increase Touch Score
- recompute the cumulative score

### Chron-Driven Re-Scoring

On a nightly Maxine review:

- recalculate Time Score for open PACs
- raise temporal pressure naturally as the horizon approaches
- promote any PAC that now crosses the threshold

This allows a casual future mention to quietly ripen into real work at the correct moment.

## Phase 6: Decay And Purge (Garbage Collection)

To keep the PAC layer from becoming a graveyard:

### Score Decay

If a PAC has:

- no hard date
- no new touches
- no strong milestone gravity

then its cumulative score should degrade after roughly 30 days of inactivity.

### Purge PTQ

Flag the PAC for purge when:

- its score reaches zero
- or it remains unpromoted for roughly 90 days

### HITL Final Check

Before deletion, Maxine batches stale PACs for Khadijah to present as a lightweight cleanup decision.

User-facing language should be plain English, for example:

- "I have 4 stale items that haven't moved in 3 months. Shall I archive them?"

### Resolution

If approved:

- purge the PAC from the active queue
- preserve historical context in durable memory or SIGMA form when useful

## Placement In The Current Architecture

```text
provider event or manual trigger
  -> normalized item or direct request
  -> sweep trigger
  -> PAC triage and logging
  -> pending_action_candidates
  -> autonomous PTQ scoring
  -> YES: task packet or project shell
  -> NO: incubate, re-score, decay, or close candidate
```

This layer sits between normalized inputs and committed execution objects.

It complements, but does not replace:

- Sinclair's inbox and calendar triage
- Kyle's relationship and post-meeting extraction
- Maxine's project initiation and task execution layers
- Khadijah's approval orchestration

## Infrastructure Alignment

### Postgres

Use Postgres as the durable source of truth for PAC/PTQ state.

Recommended tables:

### `pending_action_candidates`

Purpose:

- store candidate work before commitment

Key fields:

- `pac_id`
- `client_id`
- `source_normalized_item_id`
- `source_provider_event_id`
- `source_agent`
- `source_trigger_type`
- `candidate_summary`
- `candidate_scope` (`task`, `project`, `unknown`)
- `state` (`awaiting_ptq`, `incubating`, `qualified`, `disqualified`, `expired`, `converted`, `purge_pending`)
- `time_score`
- `crm_score`
- `milestone_score`
- `touch_score`
- `cumulative_score`
- `last_touched_at`
- `hard_date`
- `current_ptq_id`
- `created_at`
- `updated_at`

Update rule:

- insert once when the PAC is created
- update lifecycle state with audit-friendly transitions

### `qualification_checks`

Purpose:

- store the active and historical PTQs attached to PACs

Key fields:

- `ptq_id`
- `pac_id`
- `client_id`
- `qualification_type`
- `condition_summary`
- `resolution_mode`
- `assigned_agent`
- `status` (`open`, `waiting`, `met`, `failed`, `canceled`)
- `tripwire_type`
- `threshold_value`
- `resolved_at`
- `resolution_notes`
- `approval_decision_id`

Update rule:

- insert one row per PTQ
- update status as the condition progresses
- keep historical PTQs instead of overwriting them

### Redis

Use Redis only for:

- `lock:pac:<id>`
- `timer:ptq:<id>`
- dedupe hints for repeated triggers

Do not treat Redis as durable PAC/PTQ storage.

### Vault

Use the vault for human-readable artifacts:

- `vault/30-Projects/pac-master-list.md`
- optional PAC-specific readiness notes in `vault/15-Readiness/`
- downstream task packets, project shells, and decision briefs
- stale-PAC purge note when Khadijah batches cleanup

The PAC master list is an operating artifact, not the sole system of record.

### NATS

Use bus events for transport only:

- `event.sweep.message`
- `event.sweep.event`
- `event.sweep.milestone`
- `event.sweep.ripple`
- `event.pac.logged`
- `event.pac.rescored`
- `event.ptq.condition_met`
- `event.pac.purge_pending`
- `request.approval.khadijah` when owner confirmation is the PTQ
- existing Maxine completion signals such as `report.maxine.project-initiated`

## Decision Rules

### Create a PAC when

- a trigger may require work but commitment is not yet explicit
- the item needs more context, time, budget, or owner input
- the system should preserve the possibility without cluttering live execution queues
- the signal is worth incubation even if it is not worth immediate execution

### Do not create a PAC when

- the item is purely informational
- the item is already a clearly approved execution object
- an existing project or task should simply be updated instead

## Resolution Outcomes

### YES

If the PTQ resolves positively or a tripwire auto-promotes:

- create a standalone task packet when the work is bounded and does not need a project shell
- invoke `project-initiation-milestone-mapping` when the work needs milestones, structure, or a durable project object
- close the PAC as `converted`

### NO

If the PTQ resolves negatively:

- archive the context if it matters for memory
- close the PAC as `disqualified` or `expired`

### REDIRECT

If the PTQ reveals that the item belongs somewhere else:

- attach it to an existing task or project
- reroute it to another specialist lane
- close or supersede the PAC

### INCUBATE

If the candidate is real enough to preserve but not strong enough to commit:

- render the score and current rationale into the PAC master list
- keep it active for event-driven and nightly re-scoring
- promote only when a tripwire or cumulative threshold is met

### PURGE

If the candidate decays into irrelevance:

- batch it for Khadijah review when required
- archive historical context if useful
- clear it from the live PAC queue

## Agent Ownership

- Maxine owns PAC triage, PAC logging, PTQ dispatch, and conversion into work objects
- Khadijah owns owner-facing confirmation and approval surfaces
- Sinclair and Kyle can originate PAC-worthy triggers from communications and meetings
- Scooter and Maxine can originate PAC-worthy triggers from ripple/proximity effects
- Project initiation remains a downstream Maxine workflow, not the intake buffer itself
