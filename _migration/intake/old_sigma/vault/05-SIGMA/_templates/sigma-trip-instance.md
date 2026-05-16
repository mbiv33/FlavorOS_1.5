---
# ── Identity (immutable after promotion) ─────────────────────────────
sigma_id:        SIGMA-YYYYMMDD-HHMMSS-shortslug
type:            trip-instance
status:          draft               # draft | active | superseded | archived
client_id:       marcus
created_at:      YYYY-MM-DDTHH:MM:SSZ
created_by:      scooter
source_protocol: travel.planning.protocol
confidence:      medium

# ── Trip identity ────────────────────────────────────────────────────
trip_id:         TRIP-YYYY-NNN       # matches readiness artifact in 50-Travel/
destination:                         # primary city / region
purpose:                             # business | personal | mixed
business_context:                    # which business or "personal"
depart:          YYYY-MM-DD
return:          YYYY-MM-DD

# ── Phase (the SIGMA mutates as phase advances) ──────────────────────
phase:           planning            # planning | booking | prep | active | return | debrief | closed
phase_history:
  - phase:      planning
    entered_at: YYYY-MM-DDTHH:MM:SSZ
    by:         scooter

# ── Access ───────────────────────────────────────────────────────────
usable_by:
  - khadijah
  - sinclair
  - scooter
  - maxine
  - kyle

# ── Cross-references ─────────────────────────────────────────────────
related_readiness_artifacts: []      # e.g. vault/50-Travel/london-q2.md
related_sigmas: []                   # e.g. ripple SIGMAs spawned by this trip
source_items: []                     # emails, calendar invites, original requests
superseded_by:                       # only if status: superseded
---

# Trip Instance SIGMA: <destination> <month-year>

> Operational knowledge object for one trip. Mutates throughout the trip lifecycle. The corresponding readiness artifact (the human-readable trip page in `50-Travel/`) is rendered from this SIGMA.

## Requirements

Resolved at planning time. Sourced from user request, calendar context, and travel preferences SIGMA.

```yaml
requirements:
  # ── Constraint priority ───────────────────────────────────────────
  # Ordered list — first item is the dominant constraint for THIS trip
  # and is treated as a hard filter (options that violate it are dropped,
  # not down-ranked). Subsequent dimensions are scored as soft preferences.
  #
  # Why this exists, and why it's per-trip:
  #   The dominant constraint changes by context. Examples:
  #     - Client emergency or speaking commitment:
  #         constraint_priority: [dates, budget, lodging-tier]
  #     - Tight cash month, flexible vacation:
  #         constraint_priority: [budget, lodging-tier, dates]
  #     - Anchor venue + hard arrival deadline:
  #         constraint_priority: [dates, venue-proximity, budget]
  #
  # If unspecified, the planning skill falls back to the user's standing
  # priority in the latest active travel-preferences SIGMA. If that's
  # also missing, the default is [budget, dates, lodging-tier, transport-tier]
  # — but every real trip should set this explicitly during planning.
  #
  # ⚠ This is NOT a weighting scheme. It expresses *which dimension cannot
  #   bend.* Numerical weights are intentionally not defined here yet — see
  #   the rationale block at the top of `decision_log` below.
  constraint_priority: []            # e.g. [dates, budget, lodging-tier]

  distance:                          # local | regional | international
  transport_needs: []                # flight, rental, rideshare, train
  accommodation_needs: []            # hotel, short-term-rental, none
  dining_needs:                      # required | optional | none
  travel_dates:
    depart_window: [YYYY-MM-DD, YYYY-MM-DD]
    return_window: [YYYY-MM-DD, YYYY-MM-DD]
    flexibility:                     # rigid | preferred | flexible
  budget:
    target:                          # preference — used in scoring
    ceiling:                         # hard cap — used in filtering (unless constraint_priority demotes budget)
    currency: USD
```

## Resolved preferences

Snapshot of `travel-preferences` SIGMA at trip creation. Recorded so trip is reproducible even if prefs evolve later.

```yaml
preferences_snapshot:
  source_sigma:                      # SIGMA-... id of travel-preferences at this point
  transport: {}
  lodging: {}
  dining: {}
```

## Entities

State — overwritten as bookings and contacts firm up.

```yaml
entities:
  bookings:
    flights: []                      # each: leg, carrier, number, depart, arrive, confirmation, status
    lodging: []                      # each: name, address, checkin, checkout, confirmation, status
    transport: []                    # each: type, from, to, when, vendor, confirmation, status
  people: []                         # each: name, role, link to 40-People/, contact_method
  places: []                         # each: name, address, link, purpose
  vendors: []                        # each: name, vendor_intelligence_sigma_id
  accounts: []                       # loyalty programs, accounts used
```

## Relationships

How entities connect — used for ripple analysis and live trip reasoning.

```yaml
relationships: []
# Each:
#   from: <entity-ref>
#   to:   <entity-ref>
#   kind: depends_on | replaces | conflicts_with | located_at | hosted_by
#   note:
```

## Ripples

Downstream impacts identified by the ripple-effect protocol. Each ripple may spawn its own `ripple` SIGMA.

```yaml
ripples:
  people: []                         # who is affected and how
  places: []                         # which other commitments at other places
  work: []                           # project/deadline shifts
  obligations: []                    # recurring commitments disrupted
```

## Observations (append-only)

Timestamped notes from any agent during any phase. Never edit or remove.

```yaml
observations: []
# Each:
#   at:          ISO-8601 UTC
#   by:          <agent>
#   phase:       <phase at time of observation>
#   note:        free text
#   source:      where this came from (email id, sms, sigma-tick, geo-event, etc.)
#   confidence:  low | medium | high
```

## Divergences (append-only)

Expected-vs-actual deltas observed during the active phase. Trigger logistics protocol re-runs.

```yaml
divergences: []
# Each:
#   at:           ISO-8601 UTC
#   detected_by:  <agent>
#   expected:     description of what the SIGMA said should happen
#   actual:       description of what was observed
#   resolution:   pending | resolved | accepted-as-new-state
#   notes:
```

## Decisions needed

Open decisions that block phase advancement. Each becomes a readiness artifact for human review.

```yaml
decisions_needed: []
# Each:
#   id:               short-slug
#   raised_at:        ISO-8601 UTC
#   raised_by:        <agent>
#   description:
#   options: []
#   recommended:
#   readiness_artifact:   # link once produced
#   status:           open | resolved
#   resolved_to:
#   resolved_at:
```

## Decision log (append-only)

Every meaningful choice made on this trip — what was offered, what the agent recommended, what was actually chosen, whether the user overrode the recommendation, and (when given) why.

```yaml
# ── Why this section exists ────────────────────────────────────────
# This is the input data for empirically learned weighting. We do NOT
# define numeric weights for option scoring up front. The reasons:
#
#   1. Constraint priority changes by trip context (see requirements.
#      constraint_priority above). Static weights can't model that.
#
#   2. The user's real preferences are best inferred from observed
#      choices over time, not from a one-time questionnaire.
#
#   3. Pareto filtering eliminates most options before scoring is
#      needed. The remaining tradeoffs are personal — they belong to
#      the user, not the agent.
#
# Future design (postponed deliberately):
#   - The universe-update protocol reads decision_log entries across
#     N trips and updates the long-term travel-preferences SIGMA with
#     observed weights per dimension.
#   - Until enough data accumulates (~10–20 trips), the planning
#     skill presents 2–3 ranked options and lets the user choose.
#     Recommendation is editorial, not authoritative.
#   - When weights are eventually derived, they live in
#     travel-preferences (not here), and constraint_priority on each
#     trip still overrides them.
#
# What the agent records here right now: enough provenance that future
# learning has clean input. Do not delete fields even if currently
# unused — they will become useful.

decision_log: []
# Each:
#   at:                  ISO-8601 UTC
#   stage:               plan-approval | mid-trip-modification | booking-confirmation | debrief
#   dimension:           flight | lodging | ground | full-set | itinerary | other
#   options_presented:   list of option ids/labels surviving pareto+constraint filter
#   recommended:         option id the agent recommended
#   chosen:              option id the user actually chose
#   override:            true if chosen != recommended, else false
#   override_reason:     free text from the user (or empty)
#   active_priority:     snapshot of requirements.constraint_priority at decision time
#   recorded_by:         <agent>
```

## Receipts and finance

Tracking for the receipt-reminder protocol and post-trip expense reconciliation.

```yaml
finance:
  expected_categories: []            # flights, lodging, ground, meals, other
  receipts_collected: []             # each: at, category, amount, image_path, source
  receipts_missing: []               # each: at, category, expected_amount, prompted_count
  reconciled_at:
```

## Learnings (populated at debrief)

Folded into long-term SIGMAs by the universe-update protocol. Until debrief runs this stays empty.

```yaml
learnings:
  preferences_changed: []            # what to update in travel-preferences SIGMA
  destination_intel:   []            # what to add to destination-intelligence SIGMA
  vendor_intel:        []            # per-vendor updates
  patterns_observed:   []            # cross-cutting observations
```

## Decision use

How agents should reason from this SIGMA:

- **During planning/booking:** read `requirements` + `preferences_snapshot` to drive research and proposals
- **During active phase:** treat `entities.bookings` as the expected state; any divergence detected by webhooks/cron writes to `divergences`
- **For ripple decisions:** consult `relationships` and `ripples`; do not propose changes that worsen existing ripples without flagging
- **At debrief:** populate `learnings`; universe-update reads only this section

## Confidence

Trip-level confidence reflects how well the SIGMA matches reality right now. Should drop to `low` when an unresolved divergence exists.
