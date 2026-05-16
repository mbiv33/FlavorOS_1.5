# FlavorOS UI — Product Requirements

Canonical PRD for the user-facing interface. Owner: Test Client. Audience: anyone designing or building the UI surface.

> **Status:** framework locked. Visual design and prototyping can begin against these specs. Mockup at [`docs/mockups/flavoros-mockup.html`](../../mockups/flavoros-mockup.html).

## Reading order

If you read these in order, you'll understand the framework and *why* it's shaped this way.

| # | Doc | What's in it |
|---|---|---|
| 00 | [Principles & Vocabulary](./00-principles-and-vocabulary.md) | The 6 design principles. The locked agent/user verb vocabulary. Read first — everything else depends on these. |
| 01 | [Interaction Taxonomy](./01-interaction-taxonomy.md) | The five interaction types FlavorOS supports. The whole UI is shaped by this list. |
| 02 | [Information Architecture](./02-information-architecture.md) | Layout, header strip, left nav, contexts. Where things live. |
| 03 | [Approval Card](./03-approval-card.md) | The single canonical decision component. Used everywhere. |
| 04 | [Surfaces](./04-surfaces.md) | Today, Work, Travel, Messages, Calendar, Library, Preferences. |
| 05 | [Call Surface](./05-call-surface.md) | The voice-first briefing/scheduled-call interface (Khadijah leads, Sinclair interprets). |
| 06 | [Right Rail](./06-right-rail.md) | Persistent chat threads + voice orb + composer. |
| 07 | [Protocols Affecting UI](./07-protocols-affecting-ui.md) | Backend protocols whose behavior the UI must honor: email auto-responder, modify floor, scheduling. |
| 08 | [Decisions & Rationale](./08-decisions-and-rationale.md) | Every locked decision with the *why* behind it. The audit trail. |
| 09 | [Open Questions](./09-open-questions.md) | Designed-but-not-yet-finalized items. Onboarding, notifications, mobile. |

## Companion documents

- [`DESIGN_BRIEF.md`](../../../DESIGN_BRIEF.md) — original product overview, agent team, user-facing surfaces
- [`ARCHITECTURE.md`](../../../ARCHITECTURE.md) — system architecture
- Mockup: [`docs/mockups/flavoros-mockup.html`](../../mockups/flavoros-mockup.html) — clickable reference for visual decisions
- `agents/sinclair/skills/executive-assistant/universal-inbox-ingestion.md` — the data shape Messages renders
- `planning/` — workflow protocols (Travel especially) that drive Project surface behavior

## What this PRD does *not* cover

- Onboarding flow (separate spec needed)
- Admin/Khadijah-facing surfaces (agent health, PAC master list)
- Mobile-specific UX beyond layout collapse rules
- Notification model (push, SMS, email escalation)
- Brand identity / visual design system beyond directional tone

## How this was built

This PRD was canonized from an iterative design session with the product owner. The decision log in `08-decisions-and-rationale.md` captures the conversation's path — what was proposed, what was challenged, what was locked.
