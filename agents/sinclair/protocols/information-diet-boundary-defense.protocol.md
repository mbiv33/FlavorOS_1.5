# Information Diet and Boundary Defense Protocol

## Header

- Owner agent: Sinclair
- Supporting agent: Khadijah
- Related skill: `information-diet-boundary-defense`
- Planning source: `planning/06-information-diet-boundary-defense/`

## Purpose

Hold interruptions during protected windows and produce a concise release brief when the window ends.

## Trigger

- Protected calendar event starts
- Manual flow-state mode begins
- Recovery or family-time rule activates

## Inputs

- Boundary mode, start and end times, communication queue, escalation policy, and protected-window source

## Phase Contract

1. Boundary Trigger: record mode and escalation rules.
2. Active Shielding: hold non-urgent interruptions.
3. Queue Management: tag and prioritize held items.
4. Shield Lowering and Synthesis Brief: summarize and route follow-up work.

## Artifacts

- `wellness-baseline` SIGMA update when durable state or preference changes
- `protected_window_brief.md`
- held communications queue
- escalation audit note

## SIGMA and Readiness Contract

- SIGMAs hold validated wellness and operating preference changes observed during protected windows.
- Readiness artifacts hold the protected-window brief, queue summary, and escalation review surface.
- Held items must preserve source links without exposing raw noise in the owner-facing brief.
- If boundary defense needs its own SIGMA type later, add it through the SIGMA catalog first.

## Approval Gates

- Required for emergency overrides outside stated policy.

## Handoffs

- Sinclair resumes inbox and scheduling actions.
- Khadijah receives the synthesis brief.
- Maxine or Kyle receive extracted work or relationship follow-ups.

## Failure Modes

- Missing end time: request confirmation from Khadijah.
- Ambiguous emergency: escalate minimal context only.
- Queue overflow: summarize by sender and urgency first.

## Completion Signal

- Publish `report.sinclair.boundary-brief`.
