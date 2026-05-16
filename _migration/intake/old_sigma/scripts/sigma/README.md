# SIGMA tooling

Operational tools for SIGMA artifacts. See `docs/architecture/SIGMA_SPEC.md` for the spec these tools enforce.

## Requirements

```bash
pip3 install pyyaml
```

## Tools

| Script | Purpose |
|---|---|
| `sigma_init.py` | Scaffold a new SIGMA from its type template |
| `sigma_validate.py` | Validate one or many SIGMAs against the spec; `--check-links` resolves cross-references |
| `sigma_render.py` | Print a human-readable preview of a SIGMA |
| `sigma_supersede.py` | Mark an active SIGMA superseded by a new version |
| `sigma_merge.py` | Fold data from one SIGMA into another (universe-update) |
| `trip_init.py` | Scaffold a complete trip (SIGMA + readiness artifact + receipts folder, cross-referenced) |
| `_lib.py` | Shared constants and helpers |

## Quick start

```bash
# Scaffold a complete trip (preferred — does the SIGMA, the readiness artifact, and the receipts folder)
scripts/sigma/trip_init.py london-q2 \
  --destination "London, UK" \
  --depart 2026-06-15 --return 2026-06-20 \
  --purpose business --business "Bivines Group"

# Scaffold a bare SIGMA of any type (lower-level)
scripts/sigma/sigma_init.py trip-instance --slug london-q2

# Validate everything in vault/05-SIGMA/
scripts/sigma/sigma_validate.py

# Validate one file
scripts/sigma/sigma_validate.py vault/05-SIGMA/trip-instance/SIGMA-…-london-q2.md

# Preview a SIGMA in the terminal
scripts/sigma/sigma_render.py vault/05-SIGMA/trip-instance/SIGMA-…-london-q2.md
```

## Adding a new SIGMA type

1. Add a row to `docs/architecture/SIGMA_SPEC.md` §5 catalog
2. Add the type to `KNOWN_TYPES` in `_lib.py`
3. Create `vault/05-SIGMA/_templates/sigma-<type>.md`
4. Create `vault/05-SIGMA/<type>/` folder

After step 2, `sigma_init.py <type>` will work.

## More usage

```bash
# Validate including cross-reference reachability
scripts/sigma/sigma_validate.py --check-links

# Supersede an old SIGMA with a new version (both must already exist)
scripts/sigma/sigma_supersede.py SIGMA-...-old SIGMA-...-new

# Fold a trip's destination_intel learnings into a destination-intelligence SIGMA
scripts/sigma/sigma_merge.py append-observations \
  --from SIGMA-...-trip-instance \
  --to   SIGMA-...-destination-intel \
  --source-key learnings.destination_intel \
  --by scooter
```

## Not yet implemented

- `sigma_promote.py` — `draft → active` with validation gate (currently set the field manually)
- `sigma_query.py` — flat queries across the corpus
- `sigma_index.py` — SQLite index rebuild
- Additional `sigma_merge.py` subcommands (`supersede-with-merge`, structured field updates)
- Per-type readiness renderers (e.g. `render_trip_readiness.py`)
