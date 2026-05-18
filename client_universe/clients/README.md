# Client Envelopes

Client envelope folders store human-readable configuration for each Client Universe.

Canonical shape:

```text
client_universe/
  clients/
    <client_id>/
      profile.yaml
      preferences.yaml
      account_aliases.yaml
      hitl_policy.yaml
      onboarding_status.yaml
      artifacts/
      sigma/
      knowledge_base/
      memory/
```

## File Map

| Concern | File or folder |
|---|---|
| client profile | `profile.yaml` |
| client envelope | full `clients/<client_id>/` folder |
| client onboarding | `onboarding_status.yaml` |
| context accounts | `account_aliases.yaml` |
| OAuth connections | `account_aliases.yaml` metadata references only |
| HITL/authority defaults | `hitl_policy.yaml` and `profile.yaml` |
| client artifacts | `artifacts/` |
| SIGMA artifacts | `sigma/` |
| provider sync status | `onboarding_status.yaml` |
| approval records | `onboarding_status.yaml` for readiness state; runtime records belong in the database |

## Rules

- Every record must resolve through `client_id`.
- Contexts are metadata and routing hints, not separate apps.
- OAuth tokens, API keys, passwords, and provider secrets must stay outside the repo.
- Runtime truth lives in the database and approved provider/secrets systems.
- Generated artifacts belong in the client-scoped artifact folders or artifact service, not in profile files.
