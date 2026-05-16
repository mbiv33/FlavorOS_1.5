# SIGMA and Readiness Artifact Contract

## Purpose

FlavorOS agents create two primary output classes:

1. SIGMAs: structured intelligence artifacts for internal memory and future reasoning.
2. Readiness artifacts: prepared outputs that make the next action reviewable, executable, or presentable.

## SIGMA Definition

SIGMA means Structured Intelligence Graph Memory Artifact.

A SIGMA is an internal knowledge object created during system execution. It captures validated context, relationships, state, preferences, observations, and decision-relevant patterns.

SIGMAs are not triggers. They are created from protocol-driven processing of raw data, events, communications, logs, and agent analysis.

## Readiness Artifact Definition

A readiness artifact is a prepared work product. It is made for review, approval, execution, or briefing.

Examples:

- drafted email response
- calendar proposal
- conflict flag
- task plan
- speaking-event prep packet
- receipt packet
- travel research report
- briefing deck
- gap check
- suggested next moves

## Required Workflow Output

For meaningful workflows, agents should create both:

```text
SIGMA + readiness artifact(s)
```

Example:

```text
Inbound email received.
Sinclair processes context.
Communication log shows hair appointments usually take 3 hours.
User preference/state protocol evaluates the new constraint.
SIGMA is created for the relevant preference/state insight.
Readiness artifacts are created: draft reply, calendar proposal, PM tasks, prep checklist.
```

## Suggested Storage

```text
vault/05-SIGMA/
vault/15-Readiness/
vault/35-Reports/
vault/30-Projects/
vault/20-Meetings/
```

If the vault does not yet contain these folders, use `vault/35-Reports/` for early samples and migrate after the folder map is updated.

## Minimal SIGMA Shape

```yaml
sigma_id: SIGMA-YYYYMMDD-HHMMSS-shortslug
client_id: marcus
created_at: YYYY-MM-DDTHH:MM:SSZ
created_by: sinclair
source_protocol: email_triage
confidence: medium
entities:
  people: []
  organizations: []
  accounts: []
observations: []
relationships: []
preferences_or_state: []
decisions_needed: []
usable_by:
  - khadijah
  - sinclair
  - maxine
  - scooter
  - kyle
links:
  readiness_artifacts: []
  source_items: []
```

## Minimal Readiness Artifact Shape

```yaml
artifact_id: READY-YYYYMMDD-HHMMSS-shortslug
client_id: marcus
created_at: YYYY-MM-DDTHH:MM:SSZ
created_by: sinclair
artifact_type: draft_email
status: prepared_for_review
requires_approval: true
related_sigmas: []
next_action: approve_edit_or_reject
```

