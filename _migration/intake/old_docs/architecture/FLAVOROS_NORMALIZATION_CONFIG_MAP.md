# FlavorOS Normalization Configuration Map

## Purpose

Normalization is the configuration-driven mapping between provider-native data fields and FlavorOS-native fields.

It is not the same thing as storage.

Storage answers:

- where raw data lands
- where normalized data lives
- where app state comes from

Normalization answers:

- how Gmail, Calendar, WhatsApp, and social DM fields become shared FlavorOS objects
- how FlavorOS preserves enough origin metadata to write back to the correct source later
- how bank APIs, Stripe, OCR receipts, and CSV imports become one immutable finance transaction model

## Design Principle

Do not normalize by hand-coded one-off transforms scattered across connectors.

Use a configuration layer that defines:

- provider
- source object type
- target FlavorOS object type
- field mappings
- transforms
- required fields
- route hints
- outbound source references

## Recommended Config Shape

Store normalization configs in a dedicated folder such as:

```text
config/normalization/
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

## Shared FlavorOS Objects

### `normalized_thread`

Represents a cross-channel conversation or coordination container.

Core fields:

- `normalized_thread_id`
- `client_id`
- `thread_kind`
- `provider`
- `external_thread_id`
- `title`
- `primary_counterparty`
- `thread_status`
- `last_activity_at`

### `normalized_item`

Represents the unit that enters the FlavorOS inbox and workflow layer.

Core fields:

- `normalized_item_id`
- `client_id`
- `normalized_thread_id`
- `provider_event_id`
- `provider`
- `item_type`
- `direction`
- `received_at`
- `from_entities`
- `to_entities`
- `subject`
- `body_markdown`
- `requires_response`
- `requires_approval`
- `suggested_route`
- `origin_action_type`
- `origin_write_target`
- `normalization_version`

### `financial_transaction`

Represents one immutable financial fact after provider-specific fields are normalized.

Core fields:

- `financial_transaction_id`
- `client_id`
- `financial_account_id`
- `provider_event_id`
- `provider`
- `external_transaction_id`
- `source_kind`
- `transaction_direction`
- `transaction_status`
- `transaction_date`
- `posted_at`
- `amount_minor`
- `currency`
- `raw_merchant`
- `clean_merchant`
- `description`
- `confidence_score`
- `idempotency_key`
- `immutable_hash`
- `normalization_version`

### `receipt_document`

Represents OCR-extracted receipt data before or alongside transaction matching.

Core fields:

- `receipt_id`
- `client_id`
- `provider_event_id`
- `upload_channel`
- `file_hash`
- `vendor`
- `receipt_date`
- `total_amount_minor`
- `tax_amount_minor`
- `currency`
- `line_items`
- `ocr_status`
- `extraction_json`

## Minimum Mapping Requirements

Every provider mapping must produce:

- a stable source reference
- a stable thread reference when the source system has one
- sender / participant identity
- the message or event body in normalized text or markdown form
- action hints for routing
- enough origin metadata to push a response or update back later

Every finance provider mapping must also produce:

- a stable `idempotency_key`
- an `immutable_hash` for duplicate protection and replay safety
- normalized integer money fields such as `amount_minor`
- account/context provenance
- preserved provider-native ids for reconciliation and write-back

## Provider Mapping Tables

### Gmail message -> FlavorOS normalized item

| Source field | FlavorOS field | Transform | Required | Notes |
| --- | --- | --- | --- | --- |
| `id` | `external_object_id` | copy | yes | message id |
| `threadId` | `external_thread_id` | copy | yes | thread grouping |
| `internalDate` | `received_at` | epoch ms -> ISO | yes | inbound timestamp |
| `payload.headers.Subject` | `subject` | extract header | no | display title |
| `payload.headers.From` | `from_entities` | parse name/email | yes | primary sender |
| `payload.headers.To` | `to_entities` | parse list | no | recipients |
| `snippet` or body parts | `body_markdown` | decode + sanitize | yes | normalized content |
| labels / mailbox state | `thread_status` | map | no | inbox, archived, etc |
| provider account alias | `provider_connection_id` | lookup | yes | account binding |

Route hints:

- if email requests a reply -> `suggested_route: sinclair.comms`
- if email implies follow-up relationship work -> `suggested_route: kyle.relationship`
- if email implies payment or invoice -> `suggested_route: maxine.finance`

Origin write target:

- `origin_action_type: gmail_reply_or_draft`
- `origin_write_target: { "thread_id": "...", "message_id": "..." }`

### Google Calendar event -> FlavorOS normalized item

| Source field | FlavorOS field | Transform | Required | Notes |
| --- | --- | --- | --- | --- |
| `id` | `external_object_id` | copy | yes | event id |
| `iCalUID` or `id` | `external_thread_id` | map | yes | stable event group |
| `summary` | `subject` | copy | no | event title |
| `description` | `body_markdown` | sanitize | no | event notes |
| `start` | `received_at` | normalize datetime | yes | main anchor |
| `attendees[]` | `to_entities` | map participants | no | attendees |
| `organizer` | `from_entities` | map participant | yes | organizer |
| `status` | `thread_status` | map | yes | confirmed, tentative, canceled |
| `hangoutLink` / location | enrichment refs | extract | no | meeting context |

Route hints:

- if event needs scheduling action -> `suggested_route: sinclair.calendar`
- if event needs prep synthesis -> `suggested_route: kyle.prep`

Origin write target:

- `origin_action_type: calendar_event_update_or_proposal`
- `origin_write_target: { "calendar_id": "primary", "event_id": "..." }`

### WhatsApp message -> FlavorOS normalized item

| Source field | FlavorOS field | Transform | Required | Notes |
| --- | --- | --- | --- | --- |
| provider message id | `external_object_id` | copy | yes | message identity |
| chat / conversation id | `external_thread_id` | copy | yes | thread identity |
| sender phone/profile | `from_entities` | normalize participant | yes | sender |
| recipient phone/profile | `to_entities` | normalize participant | no | recipient |
| message text | `body_markdown` | sanitize | yes | message body |
| media caption / attachment refs | enrich body / refs | extract | no | attachment context |
| timestamp | `received_at` | normalize datetime | yes | inbound timestamp |
| direction | `direction` | map inbound/outbound | yes | source direction |

Route hints:

- personal quick reply -> `suggested_route: sinclair.comms`
- relationship-sensitive DM -> `suggested_route: kyle.relationship`

Origin write target:

- `origin_action_type: whatsapp_reply`
- `origin_write_target: { "conversation_id": "...", "message_id": "..." }`

### Social DM message -> FlavorOS normalized item

Use one shared shape for MVP even if providers differ.

| Source field | FlavorOS field | Transform | Required | Notes |
| --- | --- | --- | --- | --- |
| provider message id | `external_object_id` | copy | yes | message identity |
| thread id | `external_thread_id` | copy | yes | conversation identity |
| sender handle/profile id | `from_entities` | normalize participant | yes | sender |
| recipient handle/profile id | `to_entities` | normalize participant | no | recipient |
| message text | `body_markdown` | sanitize | yes | message body |
| created timestamp | `received_at` | normalize datetime | yes | inbound timestamp |
| provider-specific metadata | `origin_write_target` | pass-through subset | yes | reply routing |

Route hints:

- social relationship follow-up -> `suggested_route: kyle.relationship`
- scheduling or admin follow-up -> `suggested_route: sinclair.comms`

Origin write target:

- `origin_action_type: social_dm_reply`
- `origin_write_target: { "provider": "<platform>", "thread_id": "...", "message_id": "..." }`

### Plaid transaction -> FlavorOS financial transaction

| Source field | FlavorOS field | Transform | Required | Notes |
| --- | --- | --- | --- | --- |
| `transaction_id` | `external_transaction_id` | copy | yes | stable Plaid transaction id |
| `account_id` | `financial_account_id` | account lookup | yes | target account |
| `date` | `transaction_date` | date normalize | yes | transaction date |
| `authorized_date` or `datetime` | `posted_at` | datetime normalize | no | posting anchor |
| `amount` | `amount_minor` | decimal -> signed minor integer | yes | normalized money |
| `iso_currency_code` | `currency` | default USD fallback | yes | currency |
| `merchant_name` | `raw_merchant` | copy | no | raw merchant |
| merchant alias map | `clean_merchant` | alias lookup | no | normalized merchant |
| `name` | `description` | copy | no | provider description |
| `pending` | `transaction_status` | bool -> enum | yes | pending/posted |

Required derived fields:

- `source_kind: provider_api`
- `transaction_direction`: derive from signed amount and account semantics
- `idempotency_key`: prefer `transaction_id`; fallback to account/date/amount/merchant composite
- `immutable_hash`: hash of provider + account + date + amount_minor + currency + raw_merchant + external ids

### Stripe balance transaction -> FlavorOS financial transaction

| Source field | FlavorOS field | Transform | Required | Notes |
| --- | --- | --- | --- | --- |
| `id` | `external_transaction_id` | copy | yes | Stripe balance transaction id |
| `source` | provenance ref | copy | no | charge / payout / refund id |
| `type` | `description` / metadata | map | yes | fee, charge, payout, refund |
| `amount` | `amount_minor` | copy signed integer | yes | already in minor units |
| `currency` | `currency` | lowercase -> uppercase | yes | currency |
| `created` | `posted_at` | epoch -> ISO | yes | posting time |
| payout/account mapping | `financial_account_id` | account lookup | yes | processor or clearing account |

Required derived fields:

- `transaction_date`: date part of `created`
- `source_kind: provider_api`
- `idempotency_key`: `id`
- `immutable_hash`: hash of provider + account + id + amount + currency + source

### CSV row -> FlavorOS financial transaction

| Source field | FlavorOS field | Transform | Required | Notes |
| --- | --- | --- | --- | --- |
| configured date column | `transaction_date` | parse date | yes | file-specific mapping |
| configured amount column | `amount_minor` | decimal -> signed minor integer | yes | normalized money |
| configured currency column | `currency` | normalize or default | yes | currency |
| configured merchant/description | `raw_merchant` / `description` | sanitize | yes | source context |
| filename + row number | provenance ref | derive | yes | replay trace |

Required derived fields:

- `source_kind: csv_import`
- `idempotency_key`: file checksum + row number when no native id exists
- `immutable_hash`: hash of account + transaction_date + amount_minor + raw_merchant + row payload

### OCR receipt document -> FlavorOS receipt document

| Source field | FlavorOS field | Transform | Required | Notes |
| --- | --- | --- | --- | --- |
| file bytes | `file_hash` | sha256 | yes | dedupe key |
| OCR vendor text | `vendor` | semantic extraction | yes | extracted vendor |
| OCR date text | `receipt_date` | date parse | yes | extracted purchase date |
| OCR total | `total_amount_minor` | decimal -> minor integer | yes | total |
| OCR tax | `tax_amount_minor` | decimal -> minor integer | no | tax |
| OCR line items | `line_items` | struct extraction | no | line item array |

Matching hints:

- compare vendor alias, amount delta tolerance, date window, and context/account proximity
- store proposed matches separately from transaction facts until confirmed

## Example Config Skeleton

```yaml
provider: gmail
source_object: message
target_object: normalized_item
normalization_version: v1
thread:
  external_thread_id: threadId
  title: payload.headers.Subject
fields:
  external_object_id:
    source: id
    required: true
  received_at:
    source: internalDate
    transform: epoch_ms_to_iso8601
    required: true
  subject:
    source: payload.headers.Subject
  body_markdown:
    source: payload.parts
    transform: gmail_body_to_markdown
route_hints:
  - when: body_contains_scheduling_language
    suggested_route: sinclair.calendar
origin:
  action_type: gmail_reply_or_draft
  target:
    thread_id: threadId
    message_id: id
```

## Best Practices

### Keep raw data raw

- never mutate provider payloads in storage to make them fit the model
- transform into normalized fields separately

### Keep mapping versioned

- every normalized item should record `normalization_version`
- changes to mapping logic should be traceable

### Preserve write-back references

- do not strip out provider thread ids, message ids, or event ids
- outbound sync depends on those references

### Normalize for routing, not for sameness theater

- the goal is not to erase provider differences
- the goal is to create a shared FlavorOS operating layer while preserving provider-specific capabilities

### Make config visible to builders

- field maps should be human-readable and reviewable
- product, backend, and agent builders should be able to inspect how source data becomes FlavorOS data

### Finance normalization must be replay-safe

- rerunning a poll, webhook replay, CSV import, or OCR retry must resolve to the same `idempotency_key`
- normalization output should be deterministic for the same source payload and config version
