---
name: travel-booking
description: >-
  Scooter — Booking execution. Activates after Khadijah marks the Plan
  approved. Walks the chosen option set, produces a booking-execution
  readiness artifact (one row per booking), tracks status as confirmations
  arrive, populates the trip-instance SIGMA's entities.bookings, advances
  phase planning→booking→prep, and records the plan-approval decision in the
  decision_log. Never auto-pays.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Scooter | Travel Booking

You execute what client approves. You don't decide; you don't pay; you make the chosen plan real and verifiable.

## When to invoke

- An approved Plan readiness artifact arrives. Trigger comes from Khadijah on `work_order.scooter` with `skill: travel-booking` and the artifact path/trip_id.
- Manual `/book-trip <trip_id>` after marcus confirms approval verbally.

The skill **must verify approval** on entry. If the Plan's `status` is not `approved` and the work order does not include `approval_confirmed: true` from Khadijah, exit with `flag.medium` and request re-routing through the COS.

## Phase transitions

This skill owns two transitions:

- `planning → booking` at start (after approval verification)
- `booking → prep` at end (when all booking rows reach `confirmed`)

If any booking row stays unconfirmed beyond a configurable window (default: 48h), the skill emits `flag.medium` but does **not** advance to prep. Escalation goes to Khadijah.

## Protocol

### 1. Verify approval

Read the Plan readiness artifact. Required fields:

- `status: approved`
- `approval_owner: khadijah` (sanity check)
- a non-empty `recommended_option_set` or `chosen_option_set`

If `chosen_option_set` differs from `recommended_option_set`, the user/Khadijah modified the Plan during approval. Use `chosen_option_set` and record the override in §6.

### 2. Advance phase

Update trip-instance SIGMA:

- `phase: planning → booking`
- append phase_history entry

### 3. Produce the booking-execution artifact

Write `vault/50-Travel/<slug>/booking.md` from `vault/15-Readiness/_templates/booking-execution.md`. One row per booking item across flights, lodging, ground transport. Each row starts in `status: queued`.

### 4. Execute (use-if; otherwise queue for human)

For each booking item, attempt execution in this order — stop at the first tier that succeeds:

| Tier | Source | What happens |
|---|---|---|
| 1 | Composio API write (use-if available, never auto-pays) | record returned confirmation; row → `confirmed` |
| 2 | Vendor's web flow with credentials on file | render a deep-link, hand to Khadijah for delivery; row → `requested` |
| 3 | Plain text instructions | produce a checklist for the user; row → `queued` |

The skill never enters payment information autonomously. If a vendor flow is reached, the user completes payment.

If the trip is being booked through a travel agent or assistant outside FlavorOS, mark all rows `requested` and exit; rows update as confirmations email back (picked up by `travel-itinerary` Tier 3 email scan during prep).

### 5. Track confirmations

The skill is re-entrant. On subsequent invocations (manual or via `report.scooter.booking-confirmation-received` from email auto-capture):

- match incoming confirmation to a booking row by vendor + dates
- update the row: `status: confirmed`, `confirmation_number`, `actual_cost`
- mirror into trip-instance SIGMA's `entities.bookings.<category>[]`
- append an `observations` entry on the SIGMA citing the source

Confirmations that don't match any pending row → flag (possible duplicate booking or a rebooking we didn't expect).

### 6. Record decision provenance

Append a `decision_log` entry to the trip-instance SIGMA, stage `plan-approval`:

```yaml
- at: <approval timestamp>
  stage: plan-approval
  dimension: full-set
  options_presented:  [list of every option that survived pareto+filter in planning]
  recommended:        <recommended_option_set from Plan>
  chosen:             <chosen_option_set as approved>
  override:           <true if chosen != recommended>
  override_reason:    <text from Khadijah's approval reply, or empty>
  active_priority:    <snapshot of requirements.constraint_priority at approval time>
  recorded_by:        scooter
```

This is the input data for empirical weight tuning (see SIGMA_SPEC §12). One entry per approved plan.

### 7. Run ripple-observation pass

Bookings can spawn ripples — choosing a hotel locks a neighborhood; choosing a flight locks an arrival window that may now intersect commitments. Run `ripple-observation` against the trip-instance SIGMA after `entities.bookings` is populated.

### 8. Advance to prep when all confirmed

Re-entrant check: if every row in the booking-execution artifact is `status: confirmed`:

- update trip-instance SIGMA `phase: booking → prep`
- append phase_history entry
- emit `report.scooter.bookings-complete`

If any row stays `queued` or `requested` past the timeout window:

- emit `flag.medium` with the row IDs and last-attempted tier
- do not advance phase
- next invocation re-checks

### 9. Update the trip page

Reflect confirmed bookings into `vault/50-Travel/<slug>/<slug>.md` (the consolidated trip readiness artifact). The Flights/Accommodation/Ground Transport tables get filled with confirmation numbers, addresses, and dates as bookings firm up.

## Boundaries

- **Never spend money.** No card numbers, no checkout autocompletion, no submit-payment clicks. Vendor sites that require auth use credentials on file; the user completes payment.
- **Never re-book without explicit instruction.** If a confirmed booking needs to change, that's `travel-logistics-active` (future skill), not this one.
- **Never advance phase past `prep`.** Even with all bookings confirmed, this skill stops at `prep`. The active phase begins via `pre_trip_check` on the depart day.
- **Don't assume approval is implicit.** Even when the work order looks routine, verify the Plan artifact's `status: approved` field. The cost of a wrongly-booked trip is too high.
- **Don't paint over divergence.** If a booking comes back at a price 20%+ above the Plan's projection, flag and pause — don't silently accept.

## Inputs

- the approved Plan readiness artifact (`vault/50-Travel/<slug>/plan.md`)
- the trip-instance SIGMA
- vault: `05-SIGMA/trip-instance/` (read/write), `50-Travel/<slug>/` (write)
- composio (use-if): `flights`, `hotels`, vendor-specific writes
- bus: `work_order.scooter` with `skill: travel-booking`; subscribes to `report.scooter.booking-confirmation-received`

## Outputs

- mutated trip-instance SIGMA (phase, entities.bookings, decision_log, observations)
- new readiness artifact: `vault/50-Travel/<slug>/booking.md`
- updated trip page with confirmation data
- ripple observations from §7
- `report.scooter.bookings-complete` when all rows confirmed

## Related skills

- **chief-of-staff** (Khadijah) — approves the Plan, hands off, receives the bookings-complete report
- **travel-planning** (Scooter) — produces the Plan this skill consumes
- **travel-itinerary** (Scooter) — once `phase: active`, watches for booking divergences (delays, cancellations)
- **travel-logistics-active** (Scooter, future) — handles modifications after `entities.bookings` exists
- **ripple-observation** (Scooter) — invoked from §7

## See also

- `vault/15-Readiness/_templates/plan-trip.md` — the artifact this skill consumes
- `vault/15-Readiness/_templates/booking-execution.md` — the artifact this skill produces
- `vault/05-SIGMA/_templates/sigma-trip-instance.md` — `entities.bookings` and `decision_log` blocks this skill writes
- `agents/scooter/SOUL.md` — "Never spend money or confirm bookings without approval routed through Khadijah."
