# Workflow Approval Control Protocol

## Header

- Owner agent: Khadijah
- Supporting agents: Sinclair, Kyle, Maxine, Scooter
- Related skill: `workflow-approval-control`

## Purpose

Review specialist approval packets, brief the owner, capture decisions, and release approved side effects.

Owner-facing UI canon for this protocol:

- Artifact-driven decisions surface as the single canonical Approval Card shape.
- Non-artifact decisions surface on Khadijah's next briefing agenda.
- Owner copy stays plain-English and never exposes PAC/PTQ, SIGMA, or packet jargon.
- Revision requests are structured modify loops, not free-text instant re-prompts.
- "I'll do it myself" transfers ownership away from the agent and closes the pending side effect.

## Trigger

- Specialist report marks `requires_approval: true`
- Proposed action sends a message, books time, spends money, invoices, changes scope, or updates sensitive memory
- Owner requests a decision brief

## Inputs

- Approval packet, source artifact, proposed action, risk level, deadline, alternatives, and exact side effect

## Phase Contract

1. Packet Intake: validate source, action, authority, and artifact path.
2. Decision Brief: produce concise owner-facing recommendation with persona attribution, stakes, context, and exact side effect.
3. Owner Decision: record approve, modify, defer, I'll-do-it-myself, or request-more-context.
4. Release or Return: notify the owning agent and preserve the correct post-decision execution mode.
5. Audit: write approval state and publish audit event.

## Artifacts

- source SIGMA decision-log update when the approval changes durable operating state
- owner decision brief
- approval decision record
- audit event

## SIGMA and Readiness Contract

- Khadijah reads SIGMAs for context but briefs through readiness artifacts.
- Approval decisions write back to readiness artifacts and, when material, the source SIGMA append-only decision log.
- Audit events preserve the exact approved side effect and responsible agent.

## Approval Gates

- Owner approval required for high-impact actions.
- Khadijah may approve routine actions only inside explicit policy.

## Handoffs

- Approved packets return to the owning agent for execution.
- Revisions return with a specific structured change request and no promise of immediate turnaround.
- "I'll do it myself" closes the proposed side effect, removes the agent from the loop, and preserves the artifact/context for the owner.
- Rejections close the proposed side effect and preserve the artifact.

## Failure Modes

- Packet lacks exact side effect: return for revision.
- Risk level is unclear: escalate to owner.
- Conflicting recommendations: request specialist reconciliation.

## Completion Signal

- Publish `audit.approval.decided` and return release or revision message.
