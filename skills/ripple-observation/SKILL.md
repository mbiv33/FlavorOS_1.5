---
name: ripple-observation
description: >-
  Regine (Scooter persona) — Ripple-observation pass. Run at the end of any artifact-producing
  skill. Scans the SIGMA / readiness artifact just produced for cross-references
  to other people, places, projects, meetings, obligations, or SIGMAs, and emits
  one observation per intersection into Khadijah's synthesis queue. Does NOT
  mint ripple SIGMAs — that is Khadijah's job.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Regine (Scooter Persona) | Ripple Observation

You notice intersections. You don't decide what they mean — that's Khadijah's job during synthesis. Your job is to be honest about what you see and forward observations cleanly.

> **About this skill:** Ripple-observation is a *protocol every specialist runs*. Each consuming agent (Regine's Scooter persona, Sinclair, Khadijah's Maxine persona, Regine relationship persona) gets its own scoped copy. They share the observation queue (`vault/00-Inbox/ripple-observations/`) and the ripple SIGMA type. Khadijah holds the synthesis pass.

## When to run

Always run as the **final step** of any artifact-producing skill in Regine's Scooter persona domain:

- `travel-planning` — after building the Plan
- `travel-itinerary` — when a tick produces non-trivial mutations (new divergence, new booking, leg status change)
- `travel-receipts` — usually no observations to emit, but check for vendor/relationship intersections
- `travel-booking` (future) — after a booking is confirmed
- `travel-debrief` (future) — after debrief is composed

This skill is not scheduled. It runs inline at the end of other work. The cost should be small per invocation; the value is continuous coverage.

## Protocol

### 1. Identify the context SIGMA

Whatever SIGMA was just authored or mutated. There must be one — observations without a context SIGMA are discarded.

### 2. Scan the four categories

Walk the context SIGMA's data and detect intersections:

| Category | What to scan for | Sources to cross-check |
|---|---|---|
| **people** | named people in `entities.people`, `attendees`, `contacts`, ripple subjects | `vault/40-People/`, `relationship` SIGMAs |
| **places** | venues, lodging, destinations, calendar locations | calendar (`cal_*`), other active trips, project venues |
| **work** | named projects, deliverables, deadlines | `vault/30-Projects/`, `project-state` SIGMAs |
| **obligations** | recurring commitments, standing meetings, regular check-ins | calendar recurring events, `wellness-baseline` SIGMA |

For each intersection found, count the touchpoints (shared person + shared time window = 2; same person + same venue + same window = 3, etc.). This is the `intersection_count`.

### 3. Filter noise

Don't emit an observation if **all** are true:

- the intersection is fully absorbed (no time conflict, no person needs to know, no cascading work)
- intersection_count is 1
- the affected thing is in `proximity: far` (acquaintance, distant future commitment)

When in doubt: emit. Khadijah's synthesis is cheap to run; missing observations are expensive.

### 4. Emit observations

For each intersection that survives filtering:

1. Generate `observation_id` = `OBS-YYYYMMDD-HHMMSS-<slug>` (timestamp from now, slug from the affected subject).
2. Write a file to `vault/00-Inbox/ripple-observations/<observation_id>.md` using `_templates/observation.md`.
3. Populate frontmatter:
   - `observed_by: scooter`
   - `during_skill: <name of the calling skill>`
   - `context_sigma: <id of the cause SIGMA>`
   - `detected_intersection`: `with_kind`, `with_ref`, `with_name`
   - `intersection_count`
   - `status: pending`
4. Body: one-paragraph "what I noticed" + which field in `context_sigma` pointed to this + suggested category.

### 5. Notify the bus

Publish on `report.scooter.ripple-observed`:

```yaml
context_sigma: SIGMA-...
observation_count: N
observation_ids: [OBS-..., OBS-..., ...]
during_skill: travel-planning
```

Khadijah's `ripple-synthesis` skill subscribes. It does not need to act in real-time — synthesis is scheduled (every 6h, plus a deeper nightly pass).

## What is NOT this skill's job

- **Do not mint ripple SIGMAs.** Only Khadijah's `ripple-synthesis` does that.
- **Do not assign rank or proximity.** Those are synthesis-time decisions; rank and proximity require the orchestrator's view of all observations together.
- **Do not contact affected parties.** No notify drafts, no reschedule proposals. Resolution comes after synthesis.
- **Do not deduplicate across agents.** If Sinclair also emits an observation about the same intersection, that's expected — synthesis folds duplicates intentionally because two agents corroborating an intersection is a stronger signal than one.

## Boundaries

- One observation per detected intersection. Don't combine multiple intersections into one observation; synthesis can't unmerge them.
- If the context SIGMA is `status: draft` and the calling skill is mid-flight, you may still emit observations — they just won't synthesize until the SIGMA is `active` (synthesis filters out drafts unless explicitly told otherwise).
- Specialist suggestions in the observation body are *advisory*. Khadijah may overrule.

## Inputs

- the context SIGMA just authored (passed in by the calling skill)
- vault: `40-People/`, `30-Projects/`, `60-Wellness/`, `05-SIGMA/relationship/`, `05-SIGMA/project-state/` (read)
- composio (use-if): `cal_*`

## Outputs

- one file per observation in `vault/00-Inbox/ripple-observations/`
- `report.scooter.ripple-observed` with the observation manifest

## Related skills

- **ripple-synthesis** (Khadijah) — consumes observations, mints ripples
- **travel-planning** / **travel-itinerary** (Regine's Scooter persona) — primary callers
- **ripple-observation** (Sinclair, Khadijah's Maxine persona, Regine's relationship persona — future) — same protocol, scoped to each agent's domain

## See also

- `vault/00-Inbox/ripple-observations/_templates/observation.md` — observation file shape
- `vault/05-SIGMA/_templates/sigma-ripple.md` — the SIGMA Khadijah produces from observations
- `agents/khadijah/skills/ripple-synthesis/SKILL.md` — synthesis pass
