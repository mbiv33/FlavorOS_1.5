---
sigma_id:        SIGMA-YYYYMMDD-HHMMSS-shortslug
type:            travel-preferences
status:          draft
client_id:       marcus
created_at:      YYYY-MM-DDTHH:MM:SSZ
created_by:      scooter
source_protocol: travel.universe-update.protocol
confidence:      medium

# Long-term SIGMA. One active at a time. Updated by superseding with a new version
# whenever travel-universe-update folds a trip's learnings.preferences_changed.
# The previous version moves to status: superseded with superseded_by set.
folded_from_trips: []                 # list of trip_ids whose learnings shaped this version

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

# Travel Preferences

## Transport

```yaml
transport:
  flight:
    preferred_airlines:    []         # ranked
    avoid_airlines:        []
    seat_class:                       # economy | premium-economy | business | first
    seat_preference:                  # window | aisle | exit | bulkhead
    layover_tolerance:                # max minutes
    departure_time_bands: []          # e.g. [morning, early-afternoon]
    loyalty: {}                       # airline → status
  ground:
    preferred_modes:       []         # rideshare, rental, train, taxi
    rental_class:                     # economy | mid | premium
    avoid_modes:           []
```

## Lodging

```yaml
lodging:
  tier:                               # budget | mid | premium | luxury
  preferred_brands:        []
  avoid_brands:            []
  room_preferences: {}                # quiet floor, high floor, king, etc.
  amenities_required:      []         # gym, breakfast, etc.
  loyalty: {}
```

## Dining

```yaml
dining:
  cuisine_preferences:     []
  cuisine_avoid:           []
  dietary_restrictions:    []
  meal_timing:             {}         # typical lunch/dinner times
```

## Observed weights (deferred)

> See SIGMA_SPEC.md §12 — numeric weights are intentionally not defined here yet. After enough trips accumulate decision_log entries, universe-update will derive weights and write them into this section.

```yaml
observed_weights:
  flight:    {}                       # dimension → 0..1
  lodging:   {}
  ground:    {}
  derived_from_trips: []
```

## Notes

Free-form annotations the user wants persisted across trips.
