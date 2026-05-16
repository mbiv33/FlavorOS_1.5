---
sigma_id:        SIGMA-YYYYMMDD-HHMMSS-shortslug
type:            destination-intelligence
status:          draft
client_id:       marcus
created_at:      YYYY-MM-DDTHH:MM:SSZ
created_by:      scooter
source_protocol: travel.universe-update.protocol
confidence:      medium

# Long-term SIGMA. One per city/region. Append observations as new trips
# generate them; supersede only when underlying facts change materially
# (new airport, neighborhood unsafe, etc.).
destination:
  city:
  region:
  country:
  airport_codes: []

trips_observed: []                    # list of trip_ids that contributed

usable_by:
  - khadijah
  - sinclair
  - scooter
  - kyle

related_readiness_artifacts: []
related_sigmas: []
source_items: []
superseded_by:
---

# Destination Intelligence: <city>

## Airports & arrival

```yaml
airports:
  - code:
    name:
    distance_to_central_minutes:
    transit_options:       []
    notes:
```

## Neighborhoods

```yaml
neighborhoods:
  - name:
    use_for:               []         # business-meetings | hotel-stay | dining | nightlife
    avoid_for:             []
    notes:
```

## Transit quirks

Free text — anything weird about getting around (rush hour, transit strikes, peak surge times, etc.).

## Recommended vendors

```yaml
recommended:
  hotels:    []                       # vendor-intelligence sigma_ids
  ground:    []
  dining:    []
```

## Cautions

```yaml
cautions:                             # things to watch out for
  - what:
    why:
    severity:                         # low | medium | high
```

## Observations (append-only)

```yaml
observations: []
# Each: at, by, trip_id, note, source, confidence
```
