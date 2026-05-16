# PAC And PTQ Model

## Purpose

PAC/PTQ is the buffer between inbound signals and committed execution work.

It prevents FlavorOS from turning every email, note, meeting mention, or weak signal into a task or project too early.

## Terms

| Term | Meaning |
|---|---|
| PAC | Pending Action Candidate |
| PTQ | Project / Task Qualification |

A PAC is possible work. A PTQ decides whether that possible work should become committed work.

## MVP Ownership

Under FlavorOS 1.5:

- Khadijah owns PAC/PTQ policy, promotion, approval surfacing, and project/operations conversion.
- Sinclair can originate PACs from communications, calendar, meetings, and sensitive provider context.
- Regine can originate PACs from travel, logistics, relationship, research, vendor, and social context.
- GBrain stores/retrieves supporting memory and SIGMA state.

Older references to Maxine as primary PAC owner should map to Khadijah.
Older Kyle/Scooter triggers should map to Regine unless they belong to Sinclair's communications/private boundary.

## Flow

```text
ambient signal
-> Communication Sweep or workflow detects possible work
-> PAC staging
-> dedupe against active work and existing PACs
-> PTQ scoring
-> promotion tripwire check
-> incubate, convert, redirect, disqualify, or purge
```

## Scoring Vectors

PAC/PTQ can score across:

- time urgency,
- relationship gravity,
- milestone alignment,
- repeated touches,
- risk,
- explicit user language,
- provider/source reliability.

Scores are advisory. Governed actions still require HITL.

## Resolution Outcomes

| Outcome | Meaning |
|---|---|
| Convert | Create task, project, workflow run, or approval request |
| Incubate | Keep as possible work and re-score later |
| Redirect | Attach to existing work or route to another workflow |
| Disqualify | Close because the signal is not actionable |
| Purge | Archive stale/low-value candidate after review policy |

## Durable Records

Recommended records:

- `pending_action_candidates`,
- `qualification_checks`,
- `pac_events`,
- links to `provider_events`,
- links to `normalized_items`,
- links to `workflow_runs`,
- links to `approval_requests`,
- links to `sigma_artifacts`.

Redis may support locks, debounce, and repeated-trigger hints, but must not be durable PAC/PTQ storage.

## User Experience

PAC/PTQ should surface to the user through:

- Command Center summaries,
- Approval Cards,
- Completion Summaries,
- Projects Meeting artifacts,
- Reports & Artifacts Meeting outputs.

The UI should explain the work in plain English. It should not expose PAC/PTQ jargon unless the admin mode needs it.

