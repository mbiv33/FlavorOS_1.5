---
sigma_id:        SIGMA-YYYYMMDD-HHMMSS-shortslug
type:            vendor-intelligence
status:          draft
client_id:       marcus
created_at:      YYYY-MM-DDTHH:MM:SSZ
created_by:      scooter
source_protocol: travel.universe-update.protocol
confidence:      medium

# Long-term SIGMA. One per vendor (airline, hotel chain, car-service, etc.).
# Append observations across trips; supersede when standing assessment shifts.
vendor:
  name:
  kind:                               # airline | hotel | hotel-chain | rental | rideshare | restaurant | other
  identifier:                         # IATA code, brand id, chain id, etc.

trips_observed: []                    # contributing trip_ids

usable_by:
  - khadijah
  - sinclair
  - scooter
  - kyle
  - maxine

related_readiness_artifacts: []
related_sigmas: []
source_items: []
superseded_by:
---

# Vendor Intelligence: <vendor name>

## Standing assessment

```yaml
standing:
  recommend:                          # yes | with-caveats | no
  reliability:                        # high | medium | low
  quality_at_tier:                    # what tier of service this vendor delivers in practice
  notes:
```

## Loyalty

```yaml
loyalty:
  program:
  status:
  member_id_secret_ref:               # reference to secret store, never the literal id
  known_perks:           []
```

## Known gotchas

Free text — patterns to watch out for that a generic search wouldn't reveal (bait-and-switch upgrades, surprise fees, app glitches, etc.).

## Per-property / per-route notes

```yaml
specifics: []
# Each:
#   identifier:                       # property name / route number
#   what_to_know:
```

## Observations (append-only)

```yaml
observations: []
# Each: at, by, trip_id, note, source, confidence
```
