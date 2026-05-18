# 09 · Open Questions

These questions do not block the current build plan, but each needs a focused pass before the relevant feature ships.

## Onboarding UI

Status: required for MVP, not implemented.

Open questions:

- exact step sequence for profile, contexts, providers, approvals, and first workflow lanes,
- how much client envelope detail is edited directly versus generated from guided inputs,
- how provider readiness and consent states are shown,
- how to introduce Khadijah, Sinclair, and Regine without making the UI agent-centric.

Constraint: onboarding must create a governed Client Universe without storing secrets in repo-visible envelope files.

## Current Structure Inventory

Status: needed for repo cleanup.

Open questions:

- where to document actual current folder structure versus target/recommended structure,
- whether to create a generated inventory or maintained doc,
- how often current structure should be reconciled with `repo_structure.md`.

Constraint: `repo_structure.md` is target/recommended structure, not current filesystem truth.

## Provider Connection UX

Status: required for MVP, partially designed.

Open questions:

- exact Google Workspace connection flow,
- how Docs, Sheets, and Slides appear in provider readiness,
- how tier 2 providers are shown without implying they are fully wired,
- what a failed or degraded provider sync looks like on client versus admin surfaces.

Constraint: provider access is not canonical data truth; UI should distinguish connected access from normalized FlavorOS state.

## Outbound Write-Back UX

Status: required for MVP proof loop, not fully specified.

Open questions:

- how queued write-back is displayed after approval,
- how pull-back/cancel works before execution,
- how execution receipts appear,
- how failures route to client versus admin,
- how channel-specific behavior differs for Gmail, Calendar, Docs/Sheets/Slides, PM tools, social DMs.

Constraint: write-back is approval-gated and channel-correct.

## Briefing Data Model

Status: Briefings are required, data model needs detail.

Open questions:

- exact workflow state needed by Morning Standup, COB Work Day, and Goodnight,
- how agenda items relate to artifacts, approvals, provider events, and Client Universe records,
- what completion summary shape each briefing emits,
- what Goodnight stores as soft personal context.

Constraint: Briefings are workflow/storage frameworks, not only UI cards.

## Admin Diagnostics

Status: admin shell exists; diagnostic depth needs detail.

Open questions:

- which fields are safe to show for provider events,
- how to expose GBrain status without leaking sensitive context,
- what workflow failure states need operator action,
- how admin mode distinguishes diagnostics from client-facing summaries.

Constraint: client UI must not expose raw internals; admin UI can, within governance limits.

## Mobile UX

Status: deferred beyond initial layout.

Open questions:

- compact navigation pattern,
- approval card density,
- briefing/meeting step navigation,
- provider source-link behavior,
- future voice affordances without making mobile chat-first.

Constraint: mobile should preserve the visual command model.

## Visual Design System

Status: direction exists; full design system is not complete.

Open questions:

- type scale and font choices,
- spacing and density tokens,
- color system for status/context/provider states,
- iconography,
- focus and accessibility tokens,
- motion language,
- dark mode parity.

Constraint: operational surfaces should feel calm, structured, and high-trust.

## Future Voice And Chat

Status: future-state only.

Open questions:

- whether voice is push-to-talk, session-based, or something else,
- whether chat is contextual help, request capture, or agent conversation,
- how voice/chat wraps existing workflow data without replacing it,
- privacy and consent model for any always-on behavior.

Constraint: visual MVP must work without voice/chat.

## Settled For MVP

The following are settled unless the build plan changes:

- one canonical development plan controls priority order,
- visualization and surfaces are first,
- Command Center is the default landing surface,
- Briefings and Meetings are workflow-backed surfaces,
- Approval Card is the canonical decision component,
- three-agent model is Khadijah, Sinclair, Regine,
- Google Workspace is tier 1 provider scope,
- Travel / Logistics is retained but not the first proof loop,
- finance execution and simulations are post-MVP unless promoted,
- persistent right rail, voice orb, live transcript, and command palette are not MVP requirements.
