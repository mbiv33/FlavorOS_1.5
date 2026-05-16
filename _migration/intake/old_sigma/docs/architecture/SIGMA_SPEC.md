---
status: draft
supersedes: none
extends: SIGMA_READINESS_CONTRACT.md
owner: marcus
last_updated: 2026-05-07
---

# SIGMA Operational Spec

This is the implementation-level spec for SIGMAs. The conceptual contract — what a SIGMA is and why it exists alongside readiness artifacts — lives in `SIGMA_READINESS_CONTRACT.md`. This document covers IDs, lifecycle, mutation, validation, the type catalog, and tooling.

## 1. Storage and naming

SIGMAs are markdown files with YAML frontmatter. They live in `vault/05-SIGMA/<type>/` and are also linkable from any other vault folder.

```text
vault/05-SIGMA/
├── _templates/
│   └── sigma.md                           # base
├── trip-instance/
│   └── SIGMA-20260512-093000-london-q2.md
├── travel-preferences/
├── destination-intelligence/
├── vendor-intelligence/
├── ripple/
└── ...
```

**Filename convention:** `<sigma_id>.md` where `sigma_id = SIGMA-YYYYMMDD-HHMMSS-shortslug`. Slugs are lowercase, hyphenated, ≤24 chars.

**Subfolder = SIGMA type.** Folder name matches the `type` field in frontmatter. New types require adding an entry to the catalog in §5 below.

## 2. Lifecycle

A SIGMA moves through these states (`status` in frontmatter):

| status | meaning |
|---|---|
| `draft` | being assembled; do not reason from it |
| `active` | validated, current source of truth for its scope |
| `superseded` | replaced by a newer SIGMA; keeps `superseded_by: <sigma_id>` |
| `archived` | no longer load-bearing; kept for history |

Status transitions are one-way except `draft → active`. Never delete a SIGMA — archive it.

## 3. Scope: long-term vs instance

Two kinds of SIGMA, with different mutation rules:

- **Instance SIGMA** — bound to one entity occurrence (a specific trip, a specific meeting). Mutates frequently during its phase, then transitions `active → archived` when the entity completes. Example: `trip-instance` for one trip.
- **Long-term SIGMA** — bound to a recurring concept (your travel preferences, knowledge about a destination, knowledge about a vendor). Lives indefinitely. Mutates by being superseded with a new version, OR by appending to `observations` (append-only).

The `universe-update` protocols in workflows fold instance SIGMAs into long-term ones at workflow close.

## 4. Mutation rules

Three classes of fields in any SIGMA, treated differently:

| Class | Examples | Rule |
|---|---|---|
| **Identity** | `sigma_id`, `created_at`, `created_by`, `source_protocol` | Immutable after `draft → active` |
| **State** | `status`, `phase`, `confidence`, current `entities`, current `relationships` | Mutable; latest write wins |
| **Append-only** | `observations`, `divergences`, `decision_log` | Only append; each entry timestamped and attributed |

Append-only entries take this shape:

```yaml
observations:
  - at: 2026-05-12T14:30:00Z
    by: scooter
    note: Hotel confirmed early check-in available from 11am.
    source: email:hotel-confirmation-20260512
    confidence: high
```

## 5. SIGMA type catalog

Adding a new type requires: (a) a row here, (b) a template under `_templates/`, (c) a folder under `vault/05-SIGMA/`.

| type | scope | created by | purpose |
|---|---|---|---|
| `trip-instance` | instance | scooter | live operational knowledge for one trip |
| `travel-preferences` | long-term | scooter | user travel prefs (lodging tier, transport, dining) |
| `destination-intelligence` | long-term | scooter | accumulated knowledge about a city/region |
| `vendor-intelligence` | long-term | scooter, kyle | per-airline / per-hotel / per-service-provider knowledge |
| `ripple` | instance | khadijah | downstream impacts of a decision on people/places/work/obligations. Synthesized by Khadijah from observations emitted by specialists during their normal work — never minted directly by a specialist. See `agents/khadijah/skills/ripple-synthesis/`. |
| `meeting-instance` | instance | sinclair | live operational knowledge for one meeting |
| `relationship` | long-term | kyle | what we know about one person |
| `project-state` | long-term | maxine | current state of an active project |
| `wellness-baseline` | long-term | sinclair | user wellness preferences and patterns |

This catalog will grow. Keep entries minimal — one line of purpose.

## 6. Required frontmatter

Every SIGMA MUST have:

```yaml
sigma_id:        SIGMA-YYYYMMDD-HHMMSS-slug   # immutable
type:            trip-instance                # see catalog
status:          draft | active | superseded | archived
client_id:       marcus
created_at:      ISO-8601 UTC
created_by:      <agent-name>
source_protocol: <protocol-id>                # which protocol minted this
confidence:      low | medium | high
usable_by:       [list of agents allowed to read]
```

May also have:

```yaml
superseded_by:               SIGMA-...        # if status: superseded
related_readiness_artifacts: []
related_sigmas:              []
source_items:                []               # vault paths or external URIs
```

Type-specific frontmatter (e.g., `trip_id`, `phase`) is defined per template.

## 7. Validation

A SIGMA is valid if:

1. Filename matches `sigma_id` field
2. `type` matches its parent folder under `vault/05-SIGMA/`
3. All required frontmatter fields present and non-empty
4. `status` ∈ permitted values; `confidence` ∈ {low, medium, high}
5. `usable_by` is a subset of known agents
6. If `status: superseded`, `superseded_by` is set and resolves to an existing SIGMA
7. Append-only sections contain only append-only entries (each entry has `at`, `by`)

Validation runs in three places:
- **`scripts/sigma/sigma_validate.py`** — CLI, single file or directory
- **Pre-commit hook** — blocks commits that introduce invalid SIGMAs
- **Agent runtime** — refuses to act on a SIGMA that fails validation; flags to Khadijah

## 8. Cross-referencing

A SIGMA points outward; it does not get pointed at silently.

- A new SIGMA should set `related_sigmas` and `source_items` at creation time
- A readiness artifact that consumes a SIGMA sets `related_sigmas` in its frontmatter
- A SIGMA that produces a readiness artifact appends to its own `related_readiness_artifacts`
- Bidirectional integrity is checked by `sigma_validate.py --check-links`

## 9. Tooling

Under `scripts/sigma/`:

- `sigma_init.py <type> [--slug X]` — scaffolds a new SIGMA from the type's template, generates ID, opens for editing
- `sigma_validate.py [path]` — validates one file or all SIGMAs; non-zero exit on failure
- `sigma_promote.py <sigma_id>` — `draft → active` after validation passes
- `sigma_supersede.py <old_id> <new_id>` — flips status and writes `superseded_by`
- `sigma_merge.py <instance_sigma> <long_term_sigma>` — used by universe-update protocols to fold instance findings into long-term knowledge
- `sigma_query.py <jq-style-expr>` — flat query across the SIGMA corpus (built on top of an SQLite index regenerated from the YAML)

## 10. Indexing

For graph-style queries (e.g., "every SIGMA that references vendor `delta-airlines`"), maintain an SQLite index at `vault/.sigma-index.sqlite`. Rebuilt by `sigma_index.py rebuild`, incrementally updated by file-watcher in dev.

The index is derived data; it is not committed. The YAML files in the vault are the source of truth.

## 11. Ripples: observations vs synthesis

Ripples are the one SIGMA type produced by *aggregation* rather than direct authoring. Specialist agents do not mint ripple SIGMAs — they emit lightweight observation files into `vault/00-Inbox/ripple-observations/` whenever their work touches another person/place/project/obligation. Khadijah's `ripple-synthesis` skill runs on a schedule (every 6h, deep pass nightly), folds corroborating observations, scores `rank: 1-5` and `proximity: immediate|near|mid|far`, and mints the formal ripple SIGMAs.

Why this split:

- **No specialist sees the whole graph.** Scooter doesn't know what's on Sinclair's calendar. Sinclair doesn't see Maxine's project deadlines. Only Khadijah holds the cross-domain view that makes intersection scoring meaningful.
- **Multiple specialists noticing the same intersection is signal.** Observations corroborate; synthesis folds them into one ripple but tracks all contributors.
- **Synthesis can be deferred.** Specialists emit continuously; Khadijah aggregates on a cadence. This avoids fan-out storms when many SIGMAs mutate at once.

The flow:

```
specialist skill writes/mutates a SIGMA
  → runs `ripple-observation` (specialist-scoped) at the end
  → drops one OBS-... file per detected intersection into 00-Inbox/ripple-observations/
  → emits report.<agent>.ripple-observed

khadijah `ripple-synthesis` (cron: every 6h + nightly deep)
  → reads pending observations
  → folds duplicates by (cause, subject)
  → scores rank + proximity
  → mints ripple SIGMAs
  → updates each cause SIGMA's `ripples` and `related_sigmas`
  → moves observation files to _processed/
  → emits report.khadijah.ripples-synthesized

morning brief
  → consumes top-ranked ripples by (rank desc, proximity asc)
```

## 12. Empirical weighting (deferred by design)

SIGMAs that drive option-curation workflows (planning, scheduling, vendor selection) do **not** carry numeric weights for scoring options. This is deliberate:

- The dominant constraint on a given trip/decision is contextual, not static. A `constraint_priority` field expresses this per-instance — it lists which dimension acts as a hard filter and which fall through to scoring.
- After enough decisions accumulate in the relevant `decision_log` (instance-level append-only field — see the trip-instance template for the canonical shape), the universe-update protocol can derive observed weights and write them into the long-term SIGMA (`travel-preferences`, etc.).
- Until that data exists, agents present a small ranked option set and the user chooses. The recommendation is editorial, not authoritative.

When numeric weights eventually appear in long-term SIGMAs, per-instance `constraint_priority` still overrides them.

## 13. What a SIGMA is NOT

- **Not a log** — append-only `observations` are the closest thing, but a SIGMA represents *current validated state*, not a stream of events
- **Not a draft of a readiness artifact** — readiness artifacts are reviewable work; SIGMAs are knowledge
- **Not a free-form note** — every SIGMA must have a `type`, and every type has a template
- **Not user-facing** — humans see readiness artifacts; SIGMAs feed agent reasoning

When in doubt: if the user reads it directly, it's a readiness artifact.
