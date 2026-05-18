# 00 · Principles & Vocabulary

This document defines UI principles for the current FlavorOS 1.5 build direction.

`docs/planning/current_build_plan.md` is the controlling source. If this file conflicts with the current build plan, update this file.

## Principles

### 1. Surfaces come first

The MVP starts by making FlavorOS visible as software: a client Command Center, workflow-backed Briefings and Meetings, channel surfaces, artifact review, approval handling, and operator/admin diagnostics.

The UI should expose useful prepared state before deeper automation is complete.

Operational test: can a client or operator understand what FlavorOS knows, what is ready, what is blocked, and what can be done next?

### 2. Durable state drives the UI

Screens must represent stored FlavorOS state, not one-off mock state. Client, provider, workflow, artifact, approval, outbound action, audit, and onboarding status should all have clear homes in the data model.

Operational test: if a card, status, or action appears on screen, there should be a durable record behind it or an explicit placeholder/gap note while it is being built.

### 3. Client UI is plain-English, admin UI can be diagnostic

Client-facing surfaces show tasks, artifacts, approvals, completion summaries, provider/source links, and next actions in plain English.

Client-facing UI must not expose agent IDs, skill names, PAC/PTQ vocabulary, raw SIGMA vocabulary, routing traces, provider payloads, or backend protocol names.

Admin/operator surfaces may show diagnostics, logs, provider sync state, workflow failures, queues, and configuration details where governance allows it.

Operational test: client UI explains what happened and what is needed; admin UI can explain why the system behaved that way.

### 4. Client Universe is the context boundary

Onboarding, profile, preferences, context accounts, account aliases, OAuth connection references, HITL defaults, provider expectations, and sync readiness should feed the Client Universe.

The UI should not hardcode personal contexts, provider assumptions, authority rules, or account mappings.

Operational test: a new client can have different contexts, providers, approval defaults, and account aliases without redesigning the UI.

### 5. Provider access is not canonical truth

Google Workspace and other providers are connected sources and write-back destinations. The durable FlavorOS model is the normalized record, workflow run, artifact, approval, outbound action, audit event, and Client Universe state.

Operational test: provider/source links are visible where useful, but the UI does not treat Gmail, Calendar, Docs, Sheets, Slides, PM tools, social DMs, finance tools, or Twilio as the product's source of truth.

### 6. Approval-gated write-back is part of MVP

Outbound sync/write-back is part of the MVP proof loop. Governed actions must be approval-gated, channel-correct, source-linked, and auditable.

Approval is required for public-facing communication, calendar commitments, money movement, sensitive relationship actions, irreversible provider actions, and any other governed external side effect.

Operational test: after approval, the UI shows queued, executed, failed, or pulled-back state instead of making provider actions feel invisible.

### 7. Three-agent canon, not agent sprawl

The MVP agent model is Khadijah, Sinclair, and Regine.

User-facing attribution can use those agent names or approved persona signatures, but the UI should not revive retired agent ownership as a parallel product structure.

Operational test: every user-facing prepared item can be understood as orchestration, communications/calendar, or research/logistics/relationship work.

### 8. Briefings are workflows, not decorative cards

Morning Standup, COB Work Day, and Goodnight are UI surfaces and workflow/storage frameworks. They should display prepared agenda state, context, artifacts, approvals, source links, follow-ups, and completion summaries.

Operational test: a Briefing can be resumed, audited, completed, and connected to artifacts or workflow runs.

### 9. Calm means relevant, not empty

FlavorOS should avoid noisy dashboards, raw feeds, placeholder clutter, and constant prompting. Calm UI still needs to show useful status, readiness, blockers, approvals, and next actions.

Operational test: if a zone has no meaningful content, it can disappear; if something affects current work, it should be visible in the right place.

### 10. Voice, chat, and right rail are future wrappers

The MVP must work through visual surfaces, structured flows, command components, artifacts, approvals, and provider/source links.

Voice, chat, persistent right rail, live transcript, call surface, and command palette are future or supporting layers. If they are added, they must wrap the same workflow, artifact, approval, provider, and Client Universe state.

Operational test: every MVP workflow can be completed by reading, clicking, keyboard navigation, and assistive technology.

## Vocabulary Lock

Use a small, consistent vocabulary across UI docs and product copy.

| Concept | Use | Avoid |
|---|---|---|
| Client-facing work | prepared work, artifact, approval, briefing, meeting, completion summary | PAC, PTQ, SIGMA, raw event trace |
| Provider state | connected, syncing, ready, degraded, failed, source link | Gmail is the database, Calendar is the system of record |
| Approval | approve, send for revision, pull back, I'll handle it | reject, agent approved, auto-sent without approval |
| Outbound action | queued, executed, failed, pulled back | magically sent, invisible sync |
| Agent attribution | Khadijah, Sinclair, Regine | retired agent names as standalone MVP owners |
| Client context | context, account alias, preference, authority default | hardcoded life labels |
| Admin diagnostics | provider sync, workflow run, queue, audit, config | client-facing backend jargon |

## Role Vocabulary

| Role | Verbs |
|---|---|
| Client/user | approves, edits, sends, handles, pulls back, defers |
| Agent | prepares, drafts, researches, routes, summarizes, revises |
| System | syncs, stores, normalizes, queues, executes, audits |
| Admin/operator | configures, monitors, diagnoses, retries, resolves |

Rules:

- Only the client/user approves governed actions.
- Agents prepare and revise; they do not independently approve client commitments.
- The system can execute approved actions and record the outcome.
- Admin/operator copy may be technical; client copy should remain plain English.

## Banned Or Replaced UI Copy

| Do not say | Say instead |
|---|---|
| `PTQ pending` | `Needs confirmation in briefing` |
| `Open PAC` | `Potential work item` or hide from client |
| `SIGMA created` | Hide from client; show admin diagnostics only |
| `Agent approved your invoice` | `Approved invoice queued` or `Invoice sent` |
| `Sinclair auto-sent this email` | `Your approved email was sent` |
| `Provider truth` | `Provider source` or `source link` |
| `Reject` | `I'll handle it` or `Pull back` depending on state |
| `Ask the agent` | `Add to briefing`, `Open meeting`, or future request-capture language |

## Persona Attribution

See `docs/agents/agent_persona_model.md`.
