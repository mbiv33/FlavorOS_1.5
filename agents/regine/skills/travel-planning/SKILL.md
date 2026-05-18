---
name: travel-planning
description: >-
  Scooter — Travel Planning. Convert a trip request into a researched,
  ripple-checked, decision-ready travel Plan. Produces a trip-instance SIGMA
  with requirements + research findings, and a Plan readiness artifact that
  routes to Khadijah for approval before booking.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Scooter | Travel Planning

You make trips ready to decide on. Planning ends when the owner can approve a booking with one look.

## When to invoke

- inbound work order says: plan trip / research a trip / "should I go to X" / "look into flights to X"
- Sinclair surfaces a calendar event at a remote location with no travel attached
- a manual `/plan-trip` request from Khadijah

Do **not** run this skill if the trip is already past `phase: planning` in its trip-instance SIGMA.

## Protocol

This skill executes **Travel.research.protocol + Travel.planning** from the FLAVOR Travel Workflow. The output is the populated trip-instance SIGMA and one Plan readiness artifact.

### 1. Set up the trip footprint

If no trip-instance SIGMA exists for this request:

```bash
scripts/sigma/trip_init.py <slug> \
  --destination "<city, region>" \
  --depart YYYY-MM-DD --return YYYY-MM-DD \
  --purpose business|personal|mixed \
  --business "<business or 'personal'>"
```

This creates the trip-instance SIGMA, the trip readiness page, and the receipts folder. Capture the trip_id and sigma_id from stdout — you will reference them for the rest of the run.

### 2. Resolve preferences

- read `vault/05-SIGMA/travel-preferences/` (latest active SIGMA)
- copy the relevant subset into the trip-instance SIGMA's `preferences_snapshot` block, recording the source `sigma_id`
- if no travel-preferences SIGMA exists yet, leave the snapshot empty and add an `observations` entry noting the gap — do not invent prefs

### 3. Resolve requirements

- pull from the work order: distance class, transport needs, accommodation needs, dining needs, dates, flexibility, budget target/ceiling
- consult Sinclair's calendar context for hard timing constraints at the destination
- consult Maxine's finance pulse for current budget headroom
- write all of this into the SIGMA's `requirements` block

### 4. Research

Run web research only. Do not commit to anything bookable.

- flights: 2–3 options ranked by fit (cost × duration × layovers × airline pref)
- lodging: 2–3 options at the owner's tier, ranked by distance × amenities × price
- ground transport: airport↔lodging and lodging↔venues
- destination intelligence: pull or create a `destination-intelligence` SIGMA (terminal layouts, neighborhoods, transit quirks) and reference it from `related_sigmas`
- vendor intelligence: for each candidate vendor, reference the existing `vendor-intelligence` SIGMA if any; create one if not

Append observations as you go (each entry: `at`, `by: scooter`, `note`, `source`, `confidence`).

### 5. Ripple observation pass

Run the `ripple-observation` skill against the trip-instance SIGMA. This emits one observation file per detected intersection into `vault/00-Inbox/ripple-observations/` and notifies Khadijah on `report.scooter.ripple-observed`.

Scope of the scan:

- **people**: named attendees, contacts, VIPs (Kyle's `relationship` SIGMAs)
- **places**: destination + origin during the trip window vs. other active commitments
- **work**: project deadlines, milestones (Maxine's `project-state` SIGMAs)
- **obligations**: recurring commitments (calendar)

Do **not** mint ripple SIGMAs here. Khadijah's `ripple-synthesis` pass folds these observations and produces ripples on a 6-hour pulse plus a nightly deep pass. Until that synthesis runs, the trip-instance SIGMA's `ripples` block remains empty — that is expected.

If a Plan must be produced before synthesis runs (urgent trip), include the observation manifest in the Plan's "Open questions" section so marcus knows ripples are pending.

### 6. Produce the Plan readiness artifact

Write to `vault/50-Travel/<slug>/plan.md` using `vault/15-Readiness/_templates/plan-trip.md`. The Plan must include:

- summary line: dates, destination, purpose
- ranked options for flights / lodging / ground (table form)
- ripple summary (count by category, most material ones)
- budget projection vs target/ceiling
- one explicit `next_action: approve-to-book` with the recommended option set
- back-references: `related_sigmas: [<trip-instance-sigma-id>, …ripple SIGMAs]`

Update the trip-instance SIGMA's `related_readiness_artifacts` to include the Plan path.

### 7. Report back

Publish on `report.scooter`:

```yaml
trip_id: TRIP-YYYY-NNN
phase: planning
status: ready_for_review
plan_artifact: vault/50-Travel/<slug>/plan.md
sigma: SIGMA-...
ripples: { people: N, places: N, work: N, obligations: N }
recommended_option_set: <one-line>
budget: { projected: X, ceiling: Y, headroom: Z }
```

Khadijah owns the approval surface from here.

## Boundaries

- **Never book anything.** No checkout flows, no calendar invites for confirmed flights. Plans only.
- **Never spend money.** Plans propose; Khadijah approves; only then does `travel-booking` execute.
- **Never overwrite preferences.** This skill only *snapshots* preferences into the trip SIGMA — preference updates happen in the post-trip universe-update protocol.
- **Don't advance phase on your own.** Phase moves to `booking` only when Khadijah confirms the Plan.

## Inputs

- work order on `work_order.scooter` with at minimum: `trip_intent`, ideally `destination`, `depart_window`, `purpose`
- vault: `05-SIGMA/travel-preferences/`, `05-SIGMA/destination-intelligence/`, `05-SIGMA/vendor-intelligence/`, `05-SIGMA/relationship/` (read-only via Kyle's domain), `05-SIGMA/project-state/` (read-only via Maxine's domain), `50-Travel/<slug>/`
- composio: `flights`, `hotels`, `cal_*`, web research

## Outputs

- mutated trip-instance SIGMA (state: `draft → active` once required sections are populated)
- one Plan readiness artifact at `vault/50-Travel/<slug>/plan.md`
- zero or more `ripple` SIGMAs in `vault/05-SIGMA/ripple/`
- a `report.scooter` message

## Related skills

- **chief-of-staff** (Khadijah) — receives the Plan, holds the approve-to-book gate
- **executive-assistant** (Sinclair) — calendar context, conflict detection
- **financial-management** (Maxine) — budget headroom check
- **relationship-manager** (Kyle) — VIP ripple check
- **web-research** (Scooter) — invoked from inside this skill
- **logistics-research** (Scooter) — invoked from inside this skill
- **travel-booking** (Scooter, future) — runs only after Plan is approved

## See also

- `docs/architecture/SIGMA_SPEC.md` — SIGMA lifecycle and validation
- `docs/architecture/SIGMA_READINESS_CONTRACT.md` — readiness artifact shape
- `vault/05-SIGMA/_templates/sigma-trip-instance.md` — SIGMA shape this skill populates
- `vault/15-Readiness/_templates/plan-trip.md` — Plan artifact shape this skill produces
- `scripts/sigma/trip_init.py` — scaffolder this skill calls
