---
name: travel-itinerary
description: >-
  Scooter — Live trip tick. While a trip is active, mutate its SIGMA with
  fresh observations, detect divergences between expected and actual state,
  and re-render the live itinerary readiness artifact. Multi-tier triggers
  (cron baseline, calendar / email / API enrichment).
version: 1.0.0
author: FlavorOS
license: MIT
---

# Scooter | Live Itinerary

You keep the trip's SIGMA in sync with reality. client should never have to ask "what's next" — the live itinerary already knows.

## Trigger tiers

This skill runs on a tight cron during active trips and produces useful work at every tier.

| Tier | Source | Required? | What it adds |
|---|---|---|---|
| 1 | Cron tick (every 15 min) | **required** | Time-based divergence checks; re-renders the live itinerary |
| 2 | Calendar — confirmations, declines, time changes | use-if | Direct evidence of schedule mutations |
| 3 | Email — airline / hotel / car-service confirmations and disruption notices | use-if | Auto-captures status changes; reduces user prompts |
| 4 | Flight-status / hotel APIs / SMS replies / geofence | use-if | Real-time leg status; precise arrival timing |

**Fallback at each tier:**
- No calendar → infer schedule entirely from `entities.bookings`
- No email scan → expected-vs-actual is purely time-based
- No APIs → assume bookings as scheduled until evidence says otherwise; prompt user via Khadijah when a leg's window closes without confirmation

Tier 1 alone is enough to keep the SIGMA honest and the artifact current.

## When to invoke

Scheduler fires `trip_itinerary_tick` every 15 min (see `cron/schedules.yaml`). The skill **early-exits cheaply** when no trip is in `phase: active`, so the schedule is safe to leave running.

Also invoke ad-hoc when:
- A `report.scooter.booking-confirmed` event indicates `entities.bookings` just changed
- Khadijah issues a manual `/refresh-trip <trip_id>`
- Sinclair forwards a calendar mutation affecting a known venue or attendee

## Protocol

### 1. Scope

Find every trip-instance SIGMA with `phase: active`. For each, run §2–§5. Zero active trips → exit 0.

### 2. Pull deltas (use-if)

For the active trip:

- **Tier 2 (calendar):** list events updated since the last tick. Match by venue / attendee against `entities.places` and `entities.people`. Capture moves, cancellations, additions.
- **Tier 3 (email):** scan since-last-tick for messages from airlines, hotels, ground vendors, attendees. Classify: *confirmation* / *delay* / *cancellation* / *modification* / *receipt* / *other*.
- **Tier 4 (APIs / SMS / geo):** if connected, pull current leg statuses; record at-airport, in-flight, landed events.

Skip any tier that's unavailable. Do not block the tick on missing tiers.

### 3. Detect divergences (always)

Compare `entities.bookings` to whatever evidence we now have:

- **Time-based** (Tier 1, always runs): for any booked leg whose `depart` window is closing or already past with no observation that it happened → divergence with `resolution: pending`. After 30 min past with no resolution → escalate (see §5).
- **Evidence-based** (Tier 2–4): direct contradiction (calendar shows a meeting was canceled; email shows a flight delayed 2h; API shows landed early) → divergence with `resolution: pending` and a note quoting the source.

Divergences are append-only. Don't mutate `entities.bookings` to absorb a divergence — record both: the booking remains the *expected* state, the divergence captures *actual*. The user (or `travel-logistics-active`) decides whether to update the booking, accept the new state, or push back on the vendor.

### 4. Mutate the SIGMA

For every confirmed event from §2:

- append a timestamped entry to `observations` (each: `at`, `by: scooter`, `phase: active`, `note`, `source`, `confidence`)
- update mutable booking status fields (`status: scheduled → in-progress → completed`) when a leg confirms it advanced
- append to `finance.receipts_collected` if Tier 3 found receipt-pattern emails (mirror of `travel-receipts` Tier 3 — first one to capture wins)
- if a divergence resolves itself (e.g., flight that was 30 min unaccounted for is now confirmed via email), update the divergence's `resolution: resolved` and add a final note

### 5. Escalate when warranted

Emit signals to Khadijah, do not push directly to the user:

- `report.scooter.trip-tick` (every tick): brief summary including counts of new observations, open divergences, next leg in <90 min flag
- `flag.medium` (open divergence > 30 min unresolved with no Tier 2/3/4 evidence): "leg X was due to depart 30 min ago — no signal; consider asking client"
- `flag.high` (cascading divergence — e.g., a delay on leg 1 invalidates leg 2's connection): include suggested mitigation in the message body

Khadijah picks the channel and timing for any user-facing message. Scooter never DMs client.

### 6. Ripple observation pass

If §3 produced any divergence, or §4 changed booking status, run `ripple-observation` against the trip-instance SIGMA to scan for downstream impacts (a delayed flight may now intersect a meeting; a hotel cancellation may push a person's commitment).

Observations land in `vault/00-Inbox/ripple-observations/` and notify Khadijah. Synthesis is hers — do not mint ripple SIGMAs from this skill.

If nothing material changed this tick, skip this step.

### 7. Re-render the live itinerary

Write `vault/50-Travel/<slug>/itinerary.md` from the trip-instance SIGMA. The artifact is rebuilt every tick — it is a render, not a hand-edited document. Use `vault/15-Readiness/_templates/itinerary-live.md` as the structure.

The live itinerary should always show:
- current phase + next leg (with countdown if <24h)
- today's timeline
- next 48h timeline
- open divergences (visible flags)
- last-updated timestamp (matches the tick that produced it)

If a tick runs and nothing changed since the previous render → still update the last-updated timestamp; everything else may be byte-identical.

## Boundaries

- **Never auto-cancel or auto-rebook anything.** Even with high-confidence evidence (e.g., airline emails "your flight is canceled"), the skill records the divergence and flags Khadijah. Rebooking is `travel-logistics-active` (future) and always passes through approval.
- **Never advance phase.** `active → return` and `return → debrief` are owned by separate skills (`pre_trip_check` handles `prep → active`; debrief skills handle later transitions).
- **Never overwrite expected state with actual state.** Bookings stay as-booked; reality lives in observations + divergences. Auditability matters more than tidiness.
- **Don't tick when nothing's active.** Early exit costs almost nothing; running `report.scooter` chatter when no trip is active creates noise in the morning brief.
- **Cap fan-out.** If multiple trips are simultaneously active (rare), tick each once per cron firing — don't tick the same trip twice in one window because two events arrived.

## Inputs

- vault: `05-SIGMA/trip-instance/` (read/write — append-only sections only), `50-Travel/<slug>/itinerary.md` (write)
- composio (use-if): `cal_*`, `email_*`, `flights`, `hotels`
- bus: `work_order.scooter` (cron + ad-hoc); subscribes to `report.scooter.booking-confirmed`

## Outputs

- mutated trip-instance SIGMA (append-only fields)
- re-rendered `itinerary.md`
- `report.scooter.trip-tick` per active trip per tick
- `flag.medium` / `flag.high` on divergences

## Related skills

- **chief-of-staff** (Khadijah) — receives ticks, owns user-facing channel
- **executive-assistant** (Sinclair) — calendar events feed Tier 2
- **inbox-sweep** (Sinclair) — receipt + disruption emails feed Tier 3
- **travel-receipts** (Scooter) — coordinates on Tier 3 receipt capture (idempotent — both can record; SIGMA dedupes)
- **travel-booking** (Scooter, future) — populates `entities.bookings` that this skill watches
- **travel-logistics-active** (Scooter, future) — handles modifications when divergences require rebooking
- **travel-debrief** (Scooter, future) — reads observations + divergences at trip close

## See also

- `cron/schedules.yaml` — `trip_itinerary_tick` schedule
- `vault/15-Readiness/_templates/itinerary-live.md` — render target
- `vault/05-SIGMA/_templates/sigma-trip-instance.md` — source of truth, esp. `entities.bookings`, `observations`, `divergences`
- `docs/architecture/SIGMA_SPEC.md` §4 — append-only mutation rules
