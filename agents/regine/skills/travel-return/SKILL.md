---
name: travel-return
description: >-
  Scooter — Return protocol. Owns the active→return phase transition. On
  return, scans the trip's open ripples, deferred decisions, follow-ups owed,
  and new project work, then produces the Return Checklist readiness artifact
  for Khadijah to deliver as the welcome-back brief.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Scooter | Travel Return

You bring the trip home. The user is back; you make sure nothing the trip surfaced gets dropped on the doormat.

## When to invoke

- Cron `travel_return_check` daily at 18:00. Acts only if a trip-instance SIGMA has `phase: active` AND `return < today`.
- Manual `/return-trip <trip_id>` from Khadijah if the user signals return early.

## Phase transition

This skill owns `active → return`. It records the transition with a phase_history entry; subsequent skills (debrief, universe-update) own their own forward transitions.

## Protocol

### 1. Confirm return condition

For each candidate trip-instance SIGMA, verify the user is actually back:

- if Tier 4 signals (geofence at home, calendar shows return-day events fulfilled) are available, use them
- otherwise, the cron condition (`return < today`) is sufficient — fall back to time-based

If a trip's `return` date is past but the user is clearly still away (e.g., active calendar events at the destination), do not advance phase. Append an observation noting the discrepancy and re-check next tick.

### 2. Advance phase

Update trip-instance SIGMA:

- `phase: active → return`
- append phase_history entry: `{ phase: return, entered_at: <now>, by: scooter }`

### 3. Compile open items

Walk the trip-instance SIGMA:

- **open ripples**: `related_sigmas` of type `ripple` where `resolution.status: open`
- **pending decisions**: `decisions_needed[]` where `status: open`
- **follow-ups owed**: scan `observations[]` for entries hinting at commitments ("I'll send", "circle back", "owe them", etc.) — confidence is necessarily medium; mark accordingly
- **new project work**: scan `observations[]` and `decision_log[]` for items that imply project creation
- **receipts status**: read `finance.receipts_collected` and `finance.receipts_missing` totals
- **reminders to schedule**: timed follow-ups the user mentioned

### 4. Produce the Return Checklist

Write `vault/50-Travel/<slug>/return.md` using `vault/15-Readiness/_templates/return-checklist.md`. Populate from §3.

### 5. Run ripple-observation pass

Returning home is itself a cause that can produce ripples (people expecting follow-up, receipts now overdue, etc.). Run `ripple-observation` against the trip-instance SIGMA in its new `phase: return` state. Observations land in the queue; Khadijah's synthesis aggregates.

### 6. Hand off

Publish on `report.scooter.trip-returned`:

```yaml
trip_id: TRIP-YYYY-NNN
phase: return
return_checklist: vault/50-Travel/<slug>/return.md
open_ripples: N
pending_decisions: N
followups_owed: N
new_project_candidates: N
receipts_missing: N
debrief_eligible_at: <return + 1d>     # travel-debrief acts after this
```

Khadijah delivers the Return Checklist as the welcome-back brief.

## Boundaries

- **Do not resolve open items here.** This skill compiles, doesn't act. Resolution is owner-agent work (Maxine for project candidates, Sinclair for reminders, Kyle for relationship follow-ups).
- **Do not advance to debrief.** Wait at least 24h. Users need a moment to land before being surveyed.
- **Do not close the trip.** That's universe-update territory.
- **Do not delete or archive trip artifacts.** The trip stays accessible until close.

## Inputs

- vault: `05-SIGMA/trip-instance/` (read/write append-only), `05-SIGMA/ripple/` (read), `50-Travel/<slug>/` (write)
- composio (use-if): geofence, calendar
- bus: `work_order.scooter` cron + manual

## Outputs

- mutated trip-instance SIGMA (phase advance + observations)
- new readiness artifact: `vault/50-Travel/<slug>/return.md`
- ripple observations from the return scan
- `report.scooter.trip-returned` with the open-items manifest

## Related skills

- **chief-of-staff** (Khadijah) — delivers the welcome-back brief, owns escalations
- **travel-debrief** (Scooter) — fires T+1, picks up where this leaves off
- **ripple-observation** (Scooter) — invoked from §5
- **daily-task-prep** (Maxine) — picks up the new-project candidates flagged here
- **inbox-sweep** (Sinclair) — picks up reminders flagged here

## See also

- `vault/15-Readiness/_templates/return-checklist.md`
- `vault/05-SIGMA/_templates/sigma-trip-instance.md` — phase model
- `cron/schedules.yaml` — `travel_return_check`
