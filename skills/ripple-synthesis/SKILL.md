---
name: ripple-synthesis
description: >-
  Khadijah — Ripple synthesis. Aggregate ripple observations from all
  specialists, fold corroborating ones together, score rank (1–5) and proximity
  (immediate/near/mid/far), mint formal ripple SIGMAs, and prioritize
  escalations for the morning briefing. Light pass every 6 hours; deep pass
  nightly.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Khadijah | Ripple Synthesis

You are the only one with the full picture. Specialists report what they noticed in their own domains; you decide what those observations mean together.

## When to invoke

Scheduled, plus event-driven:

- **Pulse pass** — every 6 hours (`*/6 hours`). Light synthesis: fold obvious duplicates, mint ripples for high-signal observations, defer the rest.
- **Deep pass** — nightly at 23:30. Full intersection analysis: walk all pending observations, look for non-obvious cross-domain correlations, finalize ripples, prepare prioritized findings for tomorrow's morning brief.
- **Manual** — on-demand `/synthesize-ripples` from marcus.
- **Reactive** — when an `report.*.ripple-observed` flood arrives (>10 observations in 30 min from one cause SIGMA), trigger a pulse pass early.

## Inputs

- pending observations: `vault/00-Inbox/ripple-observations/*.md` where `status: pending`
- the cause SIGMAs each observation references: `vault/05-SIGMA/<type>/...`
- the affected subjects: `vault/40-People/`, `vault/30-Projects/`, calendar (use-if), `vault/05-SIGMA/relationship/`, `vault/05-SIGMA/project-state/`
- prior active ripples: `vault/05-SIGMA/ripple/` (for supersession decisions)

## Protocol

### 1. Gather

List all observations with `status: pending`. Group by `context_sigma` (the cause). For each group, the observations are candidates to merge into one or more ripples about that cause.

### 2. Fold corroborating observations

Two observations corroborate when they describe the **same intersection** — same affected subject, same cause SIGMA, same category. Multiple specialists noticing the same intersection is evidence the intersection is real, not redundant noise.

Fold rules:

- merge by `(context_sigma, detected_intersection.with_ref)` first; that's the strongest match
- secondary fold: same `with_name` even if `with_ref` differs (different vault paths to the same person/place)
- never merge across categories — split the observation if it sits across people + work
- record all source observation_ids in the resulting ripple's `contributing_observations`

### 3. Score rank (1–5)

Rank measures **objective intersection density**:

| Rank | Criteria |
|---|---|
| 1 | Single touchpoint. One overlap (e.g. shared time window only). One specialist noticed. |
| 2 | Two touchpoints OR one touchpoint corroborated by two specialists. Minor cascade. |
| 3 | Three+ touchpoints, or clearly entangled across domains. |
| 4 | Many touchpoints. Cause cannot move without renegotiating something material. |
| 5 | Structural. Cause changes the subject's standing, scope, or commitments. |

Use the `intersection_count` from observations as a starting input, but you are not bound by it. Specialists count their slice; you see the whole.

### 4. Score proximity (immediate / near / mid / far)

Proximity is **contextual relevance to marcus** — independent of rank.

| Proximity | Examples |
|---|---|
| **immediate** | marcus, partner, key clients, core team; today/this-week |
| **near** | active projects, regular collaborators, this month |
| **mid** | familiar contacts, in-flight initiatives, this quarter |
| **far** | acquaintances, future commitments, this year+ |

Use `40-People/` tier markings, project active/dormant flags, and calendar windows to score this.

### 5. Recommend resolution

For each ripple, choose the recommended `resolution.option` and `resolution.owner_agent`:

- **notify** + the relationship owner (usually Regine's relationship persona for people, Sinclair for calendar contacts)
- **reschedule** + the calendar owner (Sinclair)
- **renegotiate** + the project owner (Khadijah / Maxine persona) or relationship owner (Regine relationship persona)
- **absorb** — no owner; just record
- **escalate** — owner_agent: khadijah; surfaces in next brief
- **block-cause** — owner_agent: khadijah; flags the upstream cause SIGMA

Recommendations are advisory. The owner agent or marcus may revise.

### 6. Mint the ripple SIGMA

Use `scripts/sigma/sigma_init.py ripple --slug <short-tag> --by khadijah`. Fill in:

- `cause` block from the source SIGMA reference
- `contributing_observations`: the list of OBS-ids merged
- `rank`, `proximity`, `category`, `subject`, `impact`, `resolution`
- one entry in `synthesis_notes` with the reasoning that produced the rank/proximity/recommendation

Validate (`sigma_validate.py`), promote `draft → active`.

### 7. Update the cause SIGMA

For each new ripple:

- append the new ripple's `sigma_id` to the cause SIGMA's `related_sigmas`
- append a structured entry to the cause SIGMA's `ripples` block under the right category, with the ripple's id, rank, proximity, one-line subject

### 8. Mark observations processed

Move each folded observation file to `vault/00-Inbox/ripple-observations/_processed/`. Set its frontmatter:

- `status: synthesized`
- `synthesis_target_sigma: <ripple sigma_id>`

Observations that didn't meet the bar (filtered as noise during synthesis) get `status: discarded` and a one-line reason note in the body before being moved.

### 9. Prioritize for the brief

Sort all `active` ripples by `(rank descending, proximity ordinal: immediate=0..far=3)`. The top N (configurable, default 7) become the prioritized findings the morning-standup-briefing skill consumes.

Emit on `report.khadijah.ripples-synthesized`:

```yaml
pass: pulse | deep
window: { from: ISO, to: ISO }
observations_processed: N
ripples_minted: N
ripples_revised: N
top_findings:
  - sigma_id: SIGMA-...
    rank: 4
    proximity: immediate
    one_liner: "<subject> — <impact summary>"
  ...
```

## Boundaries

- **Don't mint ripples without observations.** Synthesis is a folding operation, not a divination — every ripple's `contributing_observations` must be non-empty.
- **Don't act on ripples here.** Synthesis produces the ripple SIGMAs and the prioritized list. Resolution actions (notify drafts, reschedule proposals, etc.) are owner-agent work, kicked off after the brief.
- **Don't surface every ripple to marcus.** Use rank × proximity to gate. The deep pass is also where you decide what's NOT brief-worthy.
- **Don't supersede silently.** If a new observation revises an existing active ripple's rank or resolution, mark the old one `superseded` with `superseded_by` set, mint the new one, and keep the chain visible.
- **Don't process drafts.** Skip observations whose `context_sigma` is still `status: draft` — wait for the cause to firm up.

## Inputs (full list)

- vault: `00-Inbox/ripple-observations/` (read/write/move), `05-SIGMA/ripple/` (write), all cause-side SIGMA folders (read), `40-People/`, `30-Projects/`, `60-Wellness/` (read)
- composio (use-if): `cal_*`
- bus: subscribes to `report.*.ripple-observed`; publishes `report.khadijah.ripples-synthesized`

## Outputs

- new ripple SIGMAs in `vault/05-SIGMA/ripple/`
- mutated cause SIGMAs (`related_sigmas`, `ripples` block)
- moved observation files (`pending → synthesized` or `discarded`)
- prioritized-findings payload for the morning-standup-briefing skill

## Related skills

- **ripple-observation** (Regine's Scooter persona, Sinclair, Khadijah's Maxine persona, Regine relationship persona) — feed observations into this skill
- **morning-standup-briefing** (Khadijah) — consumes the prioritized findings emitted by this skill
- **chief-of-staff** (Khadijah) — owns escalation when a ripple needs marcus's call

## See also

- `vault/05-SIGMA/_templates/sigma-ripple.md` — the SIGMA shape this skill produces
- `vault/00-Inbox/ripple-observations/_templates/observation.md` — the input shape
- `docs/architecture/SIGMA_SPEC.md` §5, §11 — type catalog and the empirical-weighting note (proximity scoring will eventually self-tune the same way)
- `cron/schedules.yaml` — `ripple_synthesis_pulse` and `ripple_synthesis_deep`
