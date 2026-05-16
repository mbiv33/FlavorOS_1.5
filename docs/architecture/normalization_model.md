# Normalization Model

## Purpose

Normalization maps provider-native data into FlavorOS-native records.

It answers:

- how provider fields become shared FlavorOS objects,
- how source references are preserved,
- how workflow routing hints are derived,
- how write-back targets remain available,
- how replay safety is maintained.

Normalization is not storage. It is the transformation layer between provider ingress and durable application records.

## Design Principle

Use configuration-driven mappings where practical.

Avoid scattering one-off transforms across provider connectors.

Each mapping should define:

- provider,
- source object type,
- target object type,
- field mappings,
- transforms,
- required fields,
- route hints,
- origin write target,
- normalization version.

## Recommended Folder

```text
configs/normalization/
  gmail-message.yaml
  google-calendar-event.yaml
  whatsapp-message.yaml
  social-dm-message.yaml
  plaid-transaction.yaml
  stripe-balance-transaction.yaml
  finance-csv-row.yaml
  receipt-ocr-document.yaml
  quickbooks-invoice.yaml
```

## Shared Target Objects

### Normalized Thread

Represents a cross-channel conversation or coordination container.

Core fields:

- `normalized_thread_id`,
- `client_id`,
- `thread_kind`,
- `provider`,
- `external_thread_id`,
- `title`,
- `primary_counterparty`,
- `thread_status`,
- `last_activity_at`.

### Normalized Item

Represents the unit entering FlavorOS inbox/workflow logic.

Core fields:

- `normalized_item_id`,
- `client_id`,
- `normalized_thread_id`,
- `provider_event_id`,
- `provider`,
- `item_type`,
- `direction`,
- `received_at`,
- `from_entities`,
- `to_entities`,
- `subject`,
- `body_markdown`,
- `requires_response`,
- `requires_approval`,
- `suggested_route`,
- `origin_action_type`,
- `origin_write_target`,
- `normalization_version`.

### Financial Transaction

Represents one immutable financial fact after provider-specific fields are normalized.

Core fields:

- `financial_transaction_id`,
- `client_id`,
- `financial_account_id`,
- `provider_event_id`,
- `provider`,
- `external_transaction_id`,
- `transaction_direction`,
- `transaction_status`,
- `transaction_date`,
- `posted_at`,
- `amount_minor`,
- `currency`,
- `raw_merchant`,
- `clean_merchant`,
- `description`,
- `confidence_score`,
- `idempotency_key`,
- `immutable_hash`,
- `normalization_version`.

## Minimum Requirements

Every mapping should produce:

- stable source identity,
- stable thread identity when available,
- participant identity,
- normalized body/content,
- routing hints,
- origin metadata for future write-back,
- normalization version.

Finance mappings must also produce:

- deterministic idempotency key,
- immutable hash,
- integer money fields,
- provider/account provenance,
- replay-safe output.

## Route Hint Ownership

Route hints should align with the three-agent model:

| Route | Owner |
|---|---|
| Communications/calendar/prep | Sinclair |
| Projects/operations/finance overview | Khadijah |
| Travel/research/relationships/social context | Regine |

Old route names from Maxine, Kyle, or Scooter should be converted into Khadijah or Regine ownership unless the work belongs to Sinclair's private/provider boundary.

