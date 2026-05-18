---
name: travel-universe-update
description: >-
  Regine (Scooter persona) — Universe-update protocol. Folds a debriefed trip's learnings into
  long-term SIGMAs (travel-preferences, destination-intelligence,
  vendor-intelligence). Closes the trip lifecycle by transitioning the trip
  phase debrief→closed. This is the one place where instance learnings become
  permanent system knowledge.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Regine (Scooter Persona) | Travel Universe Update

You make sure the trip's lessons survive the trip. Without this skill, every trip is amnesia.

## When to invoke

- Cron `travel_universe_update_check` daily at 11:00. Acts on trip-instance SIGMAs where `phase: debrief` AND a `debrief.md` artifact exists AND `learnings` block is populated.
- Manual `/close-trip <trip_id>` from Khadijah.

## Phase transition

Owns `debrief → closed`. Once a trip is closed, this skill does not run on it again.

## Protocol

### 1. Validate inputs

For each candidate trip-instance SIGMA, verify:

- `phase: debrief`
- `learnings` block is non-empty
- `debrief.md` exists at `vault/50-Travel/<slug>/`
- `sigma_validate.py` passes on the trip-instance SIGMA

If any check fails, skip and emit an observation about the gap.

### 2. Fold preferences_changed

For each entry in `learnings.preferences_changed`:

1. Read the latest `active` `travel-preferences` SIGMA. If none exists, scaffold one with `sigma_init.py travel-preferences --slug v1`.
2. Determine whether the change is a **revision** (same field, different value) or an **addition** (new field). Revisions trigger supersession; additions can be merged in place if the SIGMA is still in `draft`, otherwise also supersede.
3. Mint a new version: copy current SIGMA, apply the change, set `superseded_by` on the old version. Use `scripts/sigma/sigma_supersede.py` (not yet implemented — see §5 fallback).
4. Append the trip_id to the new SIGMA's `folded_from_trips`.

### 3. Fold destination_intel

For each entry in `learnings.destination_intel`:

1. Find the `destination-intelligence` SIGMA for this destination (search by `destination.city` or `destination.airport_codes`). If none, scaffold one.
2. Append observations to the SIGMA's `observations[]` (append-only — no supersession needed unless a structural fact changes, e.g. new airport code).
3. Add the trip_id to `trips_observed`.

### 4. Fold vendor_intel

For each entry in `learnings.vendor_intel`:

1. Find or create the `vendor-intelligence` SIGMA for the vendor.
2. Append observations.
3. If the entry indicates the standing assessment shifts (e.g., recommend → with-caveats, with-caveats → no), supersede. Otherwise append-only.

### 5. Fold patterns_observed

These are cross-cutting. For each pattern:

- if it relates to a specific dimension (transport / lodging / dining), add as an observation to the relevant `travel-preferences` block
- if it's destination-specific, add to `destination-intelligence`
- if it implies a timing or category preference shift, queue a `preferences_changed` revision on the next cycle (don't fold it twice)

### 6. Update related_sigmas back-references

For every long-term SIGMA mutated:

- add the trip-instance `sigma_id` to its `related_sigmas` (so historical query "which trips contributed to this SIGMA?" works)
- ensure `trips_observed` (or equivalent) lists the trip

### 7. Close the trip

On the trip-instance SIGMA:

- `phase: debrief → closed`
- append final `phase_history` entry
- optionally set `status: archived` if the trip is older than 6 months and no open ripples remain (configurable)
- the trip-instance SIGMA stays in `vault/05-SIGMA/trip-instance/` — never deleted

### 8. Report

Publish on `report.scooter.trip-closed`:

```yaml
trip_id: TRIP-YYYY-NNN
phase: closed
long_term_sigmas_updated:
  - sigma_id: SIGMA-...
    type: travel-preferences
    operation: superseded | observed | created
  - sigma_id: SIGMA-...
    type: destination-intelligence
    operation: observed
  ...
patterns_queued_for_next_cycle: N
```

Khadijah surfaces a one-line "trip X closed; N learnings folded" in the next morning brief.

## Tooling

The skill uses these scripts:

- `scripts/sigma/sigma_init.py <type>` — scaffold a new long-term SIGMA when none exists for a destination/vendor/preferences set
- `scripts/sigma/sigma_merge.py append-observations` — append `learnings.<key>` entries from the trip-instance SIGMA into a long-term SIGMA's `observations` block; also wires `trips_observed` and `related_sigmas` back-references
- `scripts/sigma/sigma_supersede.py <old> <new>` — when a long-term SIGMA needs structural change (preference reordered, vendor downgraded, etc.): create the new version with `sigma_init.py`, populate it, then call supersede to flip the old
- `scripts/sigma/sigma_validate.py --check-links` — run before emitting `report.scooter.trip-closed`; failed validation aborts the close

Append-only folds use `sigma_merge.py` directly. Supersession folds are a two-step (init + supersede). Choose based on whether the change is structural (supersede) or additive (merge).

## Boundaries

- **Never invent learnings.** Only fold what `learnings.*` explicitly contains. The trip-debrief skill is responsible for sourcing those entries with citations.
- **Never close a trip with open critical ripples.** If any ripple referenced in `related_sigmas` has `rank: 5` AND `resolution.status: open`, do not close. Emit `flag.high` and exit. Khadijah resolves first.
- **Never modify long-term SIGMAs without superseding (when supersession applies).** History matters; in-place edits to `active` long-term SIGMAs are forbidden after they leave `draft`.
- **Never delete trip-instance SIGMAs.** They are the historical record. Archive only.
- **Don't close two trips in one tick.** Process one per invocation; rate-limits long-term SIGMA churn.

## Inputs

- vault: `05-SIGMA/trip-instance/` (read/write), `05-SIGMA/travel-preferences/` (read/write), `05-SIGMA/destination-intelligence/` (read/write), `05-SIGMA/vendor-intelligence/` (read/write), `05-SIGMA/ripple/` (read), `50-Travel/<slug>/debrief.md` (read)
- scripts: `sigma_init.py`, `sigma_validate.py`, future `sigma_supersede.py` / `sigma_merge.py`
- bus: cron + manual

## Outputs

- new or superseded long-term SIGMAs (`travel-preferences`, `destination-intelligence`, `vendor-intelligence`)
- closed trip-instance SIGMA (`phase: closed`)
- `report.scooter.trip-closed`

## Related skills

- **travel-debrief** (Regine's Scooter persona) — produces the `learnings` block this skill consumes
- **chief-of-staff** (Khadijah) — surfaces the close in the morning brief
- **travel-planning** (Regine's Scooter persona, future trips) — reads the long-term SIGMAs this skill maintains

## See also

- `vault/05-SIGMA/_templates/sigma-travel-preferences.md`
- `vault/05-SIGMA/_templates/sigma-destination-intelligence.md`
- `vault/05-SIGMA/_templates/sigma-vendor-intelligence.md`
- `docs/architecture/SIGMA_SPEC.md` §3 (long-term vs instance), §4 (mutation rules), §11 (synthesis vs observation), §12 (deferred weighting)
- `cron/schedules.yaml` — `travel_universe_update_check`
- `scripts/sigma/README.md` — note on not-yet-implemented supersede/merge tooling
