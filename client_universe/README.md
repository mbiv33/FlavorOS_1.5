# Client Universe

Client-scoped operating context — see [docs/architecture/client_universe_model.md](../docs/architecture/client_universe_model.md) and [docs/architecture/client_universe_categories.md](../docs/architecture/client_universe_categories.md).

## Runtime truth (production)

| Layer | Where |
|-------|--------|
| Contexts + provider connections | Postgres `client_contexts`, `provider_connections` |
| Policy / onboarding / readiness KV | Postgres `client_universe` |
| Semantic memory | GBrain |
| Artifacts, approvals, outbound | Postgres workflow tables |

The API assembles an agent envelope via `GET /universe/envelope`. Nothing in this folder is read at request time.

## This folder (dev seed + export only)

- `schemas/` — JSON Schema for YAML import/export slices.
- `clients/<client_id>/` — optional fixtures: `profile.yaml`, `preferences.yaml`, `hitl_policy.yaml`, `onboarding_status.yaml`, `account_aliases.yaml`.

Import: `scripts/seed_client_universe.py` (requires existing tenant + profile).  
Export: `GET /universe/export-yaml` (JSON shape; does not write files here).

## Legacy folders (not runtime)

May exist for demos; do not treat as canonical:

- `clients/<id>/artifacts/` — DB `artifacts`
- `clients/<id>/sigma/` — GBrain + `artifacts` (`kind=sigma`)
- `clients/<id>/memory/` — GBrain only
- `clients/<id>/knowledge_base/` — reference ingest via GBrain

Never store OAuth tokens, API keys, or passwords in YAML or KV.
