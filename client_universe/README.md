# Client Universe

Client-scoped state model — see [docs/architecture/client_universe_model.md](../docs/architecture/client_universe_model.md).

- `schemas/` — JSON Schema fragments for MVP slices (start with profile).
- `clients/` — human-readable client envelope files and client-scoped working folders.
- `clients/<client_id>/profile.yaml` — canonical MVP profile slice.
- `clients/<client_id>/preferences.yaml` — client preferences and operating notes.
- `clients/<client_id>/account_aliases.yaml` — context accounts and OAuth connection metadata references.
- `clients/<client_id>/hitl_policy.yaml` — HITL and authority defaults.
- `clients/<client_id>/onboarding_status.yaml` — onboarding, consent, provider sync, and approval readiness.
- `clients/<client_id>/artifacts/` — client-facing artifacts prepared for review, approval, delivery, or briefing.
- `clients/<client_id>/sigma/` — internal SIGMA artifacts for workflow and agent state.
- `clients/<client_id>/knowledge_base/` — client-specific reference material.
- `clients/<client_id>/memory/` — durable client memory projections.

Client envelope files may store account aliases, expected providers, approval defaults, and human-readable onboarding state. They must not store OAuth refresh tokens, access tokens, API keys, passwords, raw provider secret blobs, admin/operator permissions, or mutable runtime sync checkpoints.
