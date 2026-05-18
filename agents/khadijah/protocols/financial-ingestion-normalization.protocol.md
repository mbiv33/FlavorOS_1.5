# Financial Ingestion and Normalization Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah when authority, provider scope, or policy changes
- Related skill: `financial-ingestion-normalization`

## Purpose

Convert provider-native finance data into immutable, idempotent FlavorOS finance records.

## Trigger

- Finance webhook
- Scheduled recovery poll
- CSV import
- Manual finance backfill

## Inputs

- provider event payloads, finance normalization configs, client context mappings, merchant aliases

## Phase Contract

1. Source Capture: confirm raw event or file provenance exists.
2. Normalize: map source fields into canonical finance objects.
3. Idempotency: resolve provider-native ids and deterministic fallback hashes.
4. Categorization: apply aliases and confidence scoring.
5. Exception Routing: create review state for ambiguous records.

## Artifacts

- review queue note when a mapping, duplication, or account ambiguity needs intervention

## Approval Gates

- Required only when provider scope, write-back policy, or finance authority changes.

## Failure Modes

- Missing account mapping: hold and flag.
- Duplicate-suspect replay: preserve raw event, do not insert duplicate finance row.
- Invalid amount/currency parse: route to review.

## Completion Signal

- Publish `report.maxine.finance-ingest-updated`.

