# Communications Approval Orchestration

## Skill

- Skill name: `comms-approval-orchestration`
- Owner agent: Khadijah
- Parent capability: `chief-of-staff`
- Protocol: `communications-unification.protocol`

## Purpose

Synthesize triaged communications and pending scheduling changes into a concise owner-facing decision brief, then route approved actions back to Sinclair.

## Trigger

- `request.approval.khadijah`
- Owner voice command such as "Clear my inbox"
- Khadijah manual review of communications state

## Inputs

- `vault/15-Readiness/universal-inbox-triage.md`
- `vault/20-Meetings/pending-scheduling.md`
- Relevant people, meeting, project, wellness, and ripple SIGMAs

## Execution Steps

1. Synthesize the universal inbox triage and pending scheduling proposals.
2. Draft a concise scannable decision brief that can render as one or more canonical Approval Cards plus briefing agenda items when needed.
3. Keep non-artifact questions off Today; queue them for the next Khadijah-led briefing agenda instead of inventing question cards.
4. Present the brief through the call surface, right-rail thread, or another approved human-facing surface without leaking backend vocabulary.
5. Capture owner decisions: approve, modify, defer, I'll-do-it-myself, or request more context.
6. Treat `modify` as a structured revision request that returns the artifact to Sinclair for a non-immediate rework cycle.
7. Treat `I'll do it myself` as an ownership transfer that removes the pending execution from agent queues while preserving context for the user.
8. For approved outbound messages, preserve batch-send expectations in the brief and hand execution back to Sinclair instead of implying immediate send.
9. For approved scheduling actions, preserve the exact commitment, downstream ripple, and whether the result should surface as a call, a calendar change, or a quiet update.
10. Route approved execution commands back to Sinclair.
11. Write audit state to the decision brief and related artifacts.

## SIGMA and Readiness Contract

- Read SIGMAs for context, but brief from readiness artifacts.
- Write material owner decisions to relevant append-only decision logs when a source SIGMA exists.
- Use `vault/10-Briefs/comms-decision-brief.md` as the owner-facing decision artifact.

## Outputs

- `vault/10-Briefs/comms-decision-brief.md`
- Direct owner-facing decision path
- `execute.sinclair.calendar` for approved scheduling changes
- `execute.sinclair.comms` for approved replies or inbox actions
- `audit.approval.comms`
- briefing agenda items for decisions that are not artifact-driven

## Boundaries

- Do not execute Sinclair actions directly when Sinclair owns the connector side effect.
- Do not collapse multiple approvals into one vague yes/no.
- Do not approve external commitments without a traceable owner or policy decision.
- Do not surface PAC/PTQ, SIGMA, or approval-packet jargon in the owner-facing copy.
