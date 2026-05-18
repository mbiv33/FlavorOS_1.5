---
name: travel-debrief
description: >-
  Regine (Scooter persona) — Debrief protocol. Owns the return→debrief phase transition. T+1
  after return, surveys the user, codifies the live SIGMA log, captures
  divergences and decision overrides, and produces the trip-debrief readiness
  artifact. Populates the trip-instance SIGMA's learnings block, then hands
  off to travel-universe-update.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Regine (Scooter Persona) | Travel Debrief

You codify what the trip taught us. A debrief is worth the time it takes only if its learnings reach future trips — that's why universe-update follows.

## When to invoke

- Cron `travel_debrief_check` daily at 10:00. Acts on trip-instance SIGMAs where `phase: return` AND the return phase was entered ≥24h ago.
- Manual `/debrief-trip <trip_id>` from Khadijah.

## Phase transition

This skill advances `return → debrief` at start, then `debrief → universe-update-pending` at end. The universe-update skill itself takes over from there.

## Protocol

### 1. Advance phase

Update trip-instance SIGMA:

- `phase: return → debrief`
- append phase_history entry

### 2. Send the debrief survey

Produce a `debrief-survey` readiness artifact at `vault/50-Travel/<slug>/debrief-survey.md` using the template. Set `response_due_by: <now + 3 days>`. Khadijah delivers it (preferred channel: voice, since debrief reflection works better spoken).

Wait for the response. The skill is re-entrant — subsequent ticks check whether the survey has been answered. While `response_status: pending` and not past `response_due_by`, the skill exits without producing the debrief artifact.

If `response_due_by` passes without reply, set `response_status: timed-out` and proceed without the survey (debrief uses observation data only).

### 3. Codify the live log

Read the trip-instance SIGMA. Distill into structured findings:

- **What worked** — observations with `confidence: high` describing things that went smoothly
- **What didn't** — divergences with `resolution: resolved` or `accepted-as-new-state`; observations describing friction
- **Decisions: agent vs user** — walk `decision_log[]`, build the recommended-vs-chosen table; note override patterns
- **Divergences (expected vs actual)** — full list from `divergences[]`, categorized
- **Receipts and budget** — actual vs projected from `finance.*`
- **Ripples — final state** — for each ripple referenced in `related_sigmas`, current `resolution.status`

### 4. Synthesize learnings

Build the `learnings` block on the trip-instance SIGMA:

```yaml
learnings:
  preferences_changed: []     # specific deltas to travel-preferences SIGMA
  destination_intel:   []     # specific facts to persist about the destination
  vendor_intel:        []     # per-vendor: which vendors, what was learned
  patterns_observed:   []     # cross-cutting: e.g. "morning flights had higher reliability than evening this trip"
```

Source material:
- explicit user survey answers (questions 3, 4, 5, 6, 7 map directly to the four learning categories)
- divergence analysis (vendors that delayed, hotels that misrepresented, neighborhoods that surprised)
- decision_log overrides (consistent overrides imply preference deltas)

Be specific. "Lufthansa was unreliable" is too vague. "Lufthansa LH421 was delayed 2h on departure for a third consecutive trip" is a learning.

### 5. Produce the trip-debrief artifact

Write `vault/50-Travel/<slug>/debrief.md` using the trip-debrief template. Populate from §3 and §4.

### 6. Run ripple-observation pass

The debrief itself can spawn observations — survey responses may name people not previously in the trip's entities, or vendors worth persisting. Run `ripple-observation` against the trip-instance SIGMA's now-finalized state.

### 7. Hand off to universe-update

Publish on `report.scooter.trip-debriefed`:

```yaml
trip_id: TRIP-YYYY-NNN
phase: debrief
debrief_artifact: vault/50-Travel/<slug>/debrief.md
survey_status: received | timed-out
learnings_summary:
  preferences_changed: N
  destination_intel:   N
  vendor_intel:        N
  patterns_observed:   N
```

Universe-update picks this up on its own cron tick.

## Boundaries

- **Do not modify long-term SIGMAs here.** Universe-update owns that step.
- **Do not survey twice.** Survey artifact is one-shot per trip; if user wants to add more later, they do it manually.
- **Do not synthesize learnings from thin air.** Each entry in `learnings.*` must trace to a specific observation, divergence, decision_log entry, or survey answer. If you can't cite the source, don't include it.
- **Don't block on no-response.** Time out at 3 days and proceed.
- **Don't auto-close the trip.** That's universe-update.

## Inputs

- vault: `05-SIGMA/trip-instance/` (read/write), `05-SIGMA/ripple/` (read), `50-Travel/<slug>/` (write)
- bus: cron + manual; consumes user survey replies via `report.khadijah.survey-response`

## Outputs

- mutated trip-instance SIGMA (phase, learnings, observations)
- two new readiness artifacts: `debrief-survey.md` (T+1) and `debrief.md` (after survey or timeout)
- ripple observations from the debrief scan
- `report.scooter.trip-debriefed` for universe-update consumer

## Related skills

- **chief-of-staff** (Khadijah) — delivers survey via voice; routes survey reply back
- **travel-return** (Regine's Scooter persona) — preceding phase, leaves the open-items list this skill consumes
- **travel-universe-update** (Regine's Scooter persona) — consumes the learnings block this skill populates
- **ripple-observation** (Regine's Scooter persona)

## See also

- `vault/15-Readiness/_templates/debrief-survey.md`
- `vault/15-Readiness/_templates/trip-debrief.md`
- `vault/05-SIGMA/_templates/sigma-trip-instance.md` — `learnings` block this skill fills
- `cron/schedules.yaml` — `travel_debrief_check`
