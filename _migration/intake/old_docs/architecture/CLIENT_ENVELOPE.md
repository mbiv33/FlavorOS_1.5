# Client Envelope Architecture

## Purpose

FlavorOS must work for marcus during development and for client after onboarding. Agent behavior should resolve through a `client_id`, not hardcoded assumptions.

Companion docs:

- `docs/architecture/CLIENT_PROFILE.md`
- `docs/architecture/CLIENT_ONBOARDING.md`
- `docs/runbooks/CLIENT_ONBOARDING_PROTOCOL.md`

## Directory Shape

```text
clients/
  marcus/
    profile.yaml
    preferences.yaml
    account_aliases.yaml
    hitl_policy.yaml
    onboarding_status.yaml
  test-client/
    profile.yaml
    preferences.yaml
    account_aliases.yaml
    hitl_policy.yaml
    onboarding_status.yaml
```

For MVP, `profile.yaml` is the minimum canonical onboarding artifact. The additional files remain useful, but the onboarding script should be able to create a valid client instance from `profile.yaml` plus any later split-out files.

## Rules

- Do not store OAuth tokens, API keys, passwords, or refresh tokens in `clients/`.
- Store account aliases and human-readable configuration only.
- `profile.yaml` should describe identity, contexts, expected providers, authority defaults, and onboarding readiness.
- Client OAuth is explicit and consent-based.
- client's OAuth and personal preferences remain pending until after demo/onboarding.
- The test client may be used for development for OAuth and communication flows.
- Keep operator/admin identity separate from client identity. A human may be both an operator and a client, but those are different roles in the system.
- `clients/` stores client envelope state, not admin permissions or runtime control-plane authority.

## Client-Aware Agent Inputs

Every workflow should include:

```yaml
client_id: marcus
request_source: voice | telegram | email | calendar | cron | manual
authority_mode: draft_only
```

## Early Client IDs

- `marcus`: development and test client.
- `test-client`: first intended real client, pending onboarding.

## Role Separation

- `client`: the person whose contexts, accounts, preferences, and artifacts FlavorOS operates on.
- `operator_admin`: the person allowed to configure clients, connect accounts, inspect runtime health, and run onboarding/deployment steps.

The test client currently exists in both roles:

- `marcus` the client
- the administrator

client currently exists only as a client target, not as an operator/admin identity.
