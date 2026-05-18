# Communications CRM Extraction

## Skill

- Skill name: `comms-crm-extraction`
- Owner agent: Kyle
- Parent capability: `revenue-ops`
- Protocol: `communications-unification.protocol`

## Purpose

Read universal inbox triage output, extract relationship and follow-up signals, update people profiles, and stage deferred follow-up work.

## Trigger

- `event.inbox.triaged`
- Manual CRM extraction request from Khadijah
- VIP or relationship-sensitive communication flag from Sinclair

## Inputs

- `vault/15-Readiness/universal-inbox-triage.md`
- `vault/40-People/`
- Existing relationship SIGMAs or relationship markdown profiles when present

## Execution Steps

1. Scan normalized communications for new contacts, updated titles, social handles, relationship context, and follow-up commitments.
2. Cross-reference `vault/40-People/` for existing profiles.
3. Append recent interaction context to the correct profile when confidence is high.
4. Stage uncertain updates for review instead of overwriting existing memory.
5. Stage promised follow-ups in `vault/15-Readiness/kyle-deferred-followups.md`.
6. Emit `flag.high.khadijah` only for critical VIP, reputation, partnership, or time-sensitive relationship risk.

## SIGMA and Readiness Contract

- Update relationship SIGMAs or people profiles only with validated, source-linked facts.
- Use `vault/15-Readiness/kyle-deferred-followups.md` as the readiness artifact for follow-up work.
- Link every update to the source normalized item and triage artifact.

## Outputs

- Updated markdown profiles in `vault/40-People/`
- `vault/15-Readiness/kyle-deferred-followups.md`
- Optional `flag.high.khadijah`
- `report.kyle.comms-crm-extracted`

## Boundaries

- Silent execution by default.
- Do not send messages.
- Do not invent contact details or relationship context.
- Do not overwrite higher-confidence CRM memory.
