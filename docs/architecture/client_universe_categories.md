# Client Universe KV categories

Relational tables own **contexts** and **provider connections**. The `client_universe` table stores only operational slices keyed by `(client_id, category, key)`.

## Allowed KV categories

| Category | Keys | Purpose |
|----------|------|---------|
| `authority_defaults` | `defaults` | HITL / outbound policy defaults |
| `onboarding` | `status`, `provider_trigger` | Onboarding lifecycle and last trigger |
| `preferences` | `defaults` | Client preferences projection |
| `readiness` | `onboarding`, `sync`, `universe`, `sync:{provider}` | Gates and per-provider sync completion |
| `provider_expectations` | `{provider}` | Expected provider sync state |

## Deprecated (do not write)

- `context` — use `client_contexts`
- `context_account` — use `provider_connections` with `client_context_id`

## API

- `GET /universe/envelope` — assembled profile, relational contexts + connections, KV slices
- `GET /universe/readiness` — computed readiness flags

See `services/api/app/universe_registry.py` for validation helpers.
