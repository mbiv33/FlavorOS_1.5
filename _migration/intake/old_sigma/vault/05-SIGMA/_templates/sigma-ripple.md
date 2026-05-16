---
# ── Identity (immutable after promotion) ─────────────────────────────
sigma_id:        SIGMA-YYYYMMDD-HHMMSS-shortslug
type:            ripple
status:          draft               # draft | active | superseded | archived
client_id:       marcus
created_at:      YYYY-MM-DDTHH:MM:SSZ
created_by:      khadijah            # ⚠ Ripples are minted by Khadijah's ripple-synthesis pass.
                                     # Specialist agents emit *observations* during their work
                                     # (see vault/00-Inbox/ripple-observations/); Khadijah
                                     # aggregates them into formal ripple SIGMAs.
source_protocol: ripple-synthesis
confidence:      medium

# ── Cause ────────────────────────────────────────────────────────────
# What change drives this ripple. References the upstream SIGMA being mutated
# or proposed (a trip, a project change, a relationship status shift, etc.).
cause:
  source_sigma:                      # SIGMA-... the upstream SIGMA driving the change
  source_kind:                       # trip-instance | project-state | meeting-instance | relationship | other
  change_summary:                    # one line: what is changing about the cause

# ── Contributing observations ────────────────────────────────────────
# The raw observations Khadijah merged into this ripple. Each is a path or id
# from vault/00-Inbox/ripple-observations/. Synthesis can fold N observations
# (across N agents) into 1 ripple when they describe the same intersection.
contributing_observations: []        # e.g. [OBS-..., OBS-..., OBS-...]

# ── Rank (1–5) ───────────────────────────────────────────────────────
# Objective intersection density. Counts distinct touchpoints between the cause
# and the affected subject — same person, overlapping time window, shared
# venue, shared project, shared dependency, etc. More touches = higher rank.
#
#   1: single, glancing intersection
#   2: two touchpoints; minor cascade
#   3: three touchpoints; clearly entangled
#   4: many touchpoints; the cause cannot move without renegotiating
#   5: structural — the cause changes the subject's standing or commitments
rank: 1                              # 1 | 2 | 3 | 4 | 5

# ── Proximity ────────────────────────────────────────────────────────
# How close to the user/their core obligations does this land? Independent
# of rank — a high-rank ripple far away may be lower priority than a
# low-rank ripple in the user's immediate sphere.
#
#   immediate: user, partner, key clients, core team, today/this-week
#   near:     active projects, regular collaborators, this month
#   mid:      familiar contacts, in-flight initiatives, this quarter
#   far:      acquaintances, future commitments, this year+
proximity: near                      # immediate | near | mid | far

# ── Category (single value) ──────────────────────────────────────────
# Pick the dominant category. Ripples that span categories should be
# split into multiple ripple SIGMAs, each scoped to one category.
category:                            # people | places | work | obligations

# ── Access ───────────────────────────────────────────────────────────
usable_by:
  - khadijah
  - sinclair
  - scooter
  - maxine
  - kyle

# ── Cross-references ─────────────────────────────────────────────────
related_readiness_artifacts: []      # readiness artifacts produced from this ripple (notify drafts, reschedule proposals)
related_sigmas: []                   # other SIGMAs implicated (e.g. relationship SIGMA for an affected person)
source_items: []
superseded_by:
---

# Ripple SIGMA: <one-line title>

> Synthesized by Khadijah from N observations. Captures one downstream effect of an upstream change. Many ripples can share a cause; each gets its own SIGMA so it can be resolved (or ignored) independently.

## Subject

What is impacted, named concretely.

```yaml
subject:
  kind:                              # person | place | project | meeting | obligation | commitment | other
  ref:                               # link to 40-People/, 30-Projects/, calendar event, vault path, etc.
  name:                              # human-readable
```

## Impact

What changes for the subject as a result of the cause. Be specific about the delta — vague impacts produce vague responses.

```yaml
impact:
  was:                               # current/expected state
  becomes:                           # state after the cause takes effect
  timing:                            # when the impact lands (date/range)
  reversible:                        # true | false | partial
```

## Resolution

How this ripple gets handled. Set during synthesis with Khadijah's recommendation; revised by the owner agent or the user.

```yaml
resolution:
  option:                            # notify | reschedule | renegotiate | absorb | escalate | block-cause
  owner_agent:                       # which agent owns the action
  readiness_artifact:                # link to the readiness artifact created (notify draft, reschedule proposal, etc.)
  status:                            # open | in-progress | resolved | ignored
  resolved_at:
  resolved_note:
```

### Resolution options

- **notify** — the affected party needs to be told but no negotiation needed
- **reschedule** — move the affected commitment (and the cascade follows)
- **renegotiate** — the commitment terms change (delivery date, scope, format)
- **absorb** — the impact is real but small enough to bear silently
- **escalate** — kick to the user for a decision
- **block-cause** — ripple is severe enough that the cause should not proceed without addressing it

## Synthesis notes (append-only)

Khadijah's reasoning when merging observations into this ripple. Helps future synthesis and the post-trip universe-update pass.

```yaml
synthesis_notes: []
# Each:
#   at:          ISO-8601 UTC
#   note:        what reasoning produced the rank, proximity, and resolution recommendation
#   observations_considered: [OBS-..., OBS-...]
```

## Decision use

- The agent that owns the *cause* SIGMA reads its ripples before advancing phases or finalizing decisions.
- Morning brief: Khadijah surfaces ripples by `rank × proximity` ordering — high-rank-immediate first, then a tail by user-defined cutoff.
- A ripple with `rank: 5` + `resolution.option: block-cause` is a hard stop on the cause's progression until acknowledged.
- Ripples with `resolution.status: open` count toward "open decisions" in any briefing.
