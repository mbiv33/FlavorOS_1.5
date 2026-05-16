# Client Onboarding Architecture

## Purpose

Define the canonical model for onboarding multiple clients into FlavorOS while keeping client identity, operator/admin authority, OAuth secrets, and runtime routing cleanly separated.

This spec covers the near-term MVP shape for:

- the test client
- client as the first real client target
- marcus as an operator/admin distinct from his client identity

Companion docs:

- `docs/architecture/CLIENT_PROFILE.md`
- `docs/architecture/CLIENT_ENVELOPE.md`
- `docs/runbooks/CLIENT_ONBOARDING_PROTOCOL.md`

## Core Model

FlavorOS must separate three things:

1. `client`
2. `operator_admin`
3. `context_account`

They are related, but not interchangeable.

### Client

A client is the person FlavorOS is operating for.

Client-owned concerns:

- contexts
- account aliases
- preferences
- approval/HITL defaults
- artifacts
- SIGMAs and readiness outputs

Canonical sources:

- `clients/<client_id>/`
- Postgres rows keyed by `client_id`
- client-scoped vault artifacts

### Operator/Admin

An operator/admin is allowed to configure or maintain the system.

Operator-owned concerns:

- onboarding execution
- provider/OAuth setup
- runtime inspection
- deployment and support-service operations
- client activation/deactivation

Canonical sources:

- platform auth/admin layer
- operator runbooks
- future admin/operator surface

This does not belong under `clients/`.

### Context Account

A context account is a client-scoped software account attached to a specific context, such as a Gmail inbox, Google Calendar, QuickBooks org, LinkedIn account, or Obsidian vault.

Context-account concerns:

- provider name
- account purpose
- account alias
- linked context
- whether OAuth is required

Canonical sources:

- Postgres tables such as `context_accounts` and `oauth_accounts`
- encrypted secrets storage on the VPS for actual credential material

### OAuth Account

An OAuth account is the metadata record for an auth grant that backs a context account when OAuth is used.

OAuth-account concerns:

- external account identifier
- scopes
- refresh status
- expiry metadata
- consent timestamp
- secret reference path

Canonical sources:

- Postgres table `oauth_accounts`
- encrypted secrets storage for the actual refresh token, client secret, and any cached access token

## Identity Separation

The test client can be both:

- `marcus` the client
- the administrator

That does not make the roles the same.

Rules:

- client permissions must never be inferred from admin status
- admin powers must never be inferred from a client record
- first client onboarding must not inherit test administrator credentials, tokens, or operator access

## Directory Contract

Client envelopes remain the human-readable source for client-facing configuration.

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

Allowed in `clients/`:

- context names
- account aliases
- authority defaults
- onboarding progress state
- human-readable notes

Blocked from `clients/`:

- OAuth refresh tokens
- access tokens
- API keys
- raw passwords
- provider secret blobs
- admin/operator ACLs

## Onboarding Outcome

Successful onboarding for a client means all of the following are true:

1. client envelope exists and is complete enough for MVP
2. contexts are defined
3. account aliases are defined per context
4. OAuth consent has been explicitly captured
5. refresh-token or equivalent provider secret material is stored in encrypted client-scoped secret storage
6. `context_accounts` rows exist
7. `oauth_accounts` rows exist when OAuth-backed providers are used
8. HITL/authority defaults are set
9. first workflow lanes are activated
10. runtime services can sync data for that client without hardcoded marcus assumptions

## OAuth Secret Model

Near-term rule:

- repo stores schema, code, templates, and secret names
- VPS stores encrypted actual secret values
- runtime mounts only the secrets needed by the service performing the sync

For Gmail/Google Calendar, the durable secret is typically the refresh token, not the short-lived access token.

Recommended separation:

- `context_accounts`: operational metadata about software accounts attached to contexts
- `oauth_accounts`: scope/expiry/refresh metadata plus a pointer to secret storage
- secret storage: actual refresh token and client secret material

## Client-Scoped Secret Shape

Conceptual shape only:

```text
/run/flavor/secrets/app-api/clients/<client_id>/<provider>/<account_alias>/
  client_id
  refresh_token
  access_token        # optional cache, not canonical
  client_secret       # only if needed at runtime
  metadata.json       # optional derived mount, no raw secret duplication if avoidable
```

The exact filesystem layout may evolve, but the separation principle is fixed:

- secrets are client-scoped
- services mount only what they need
- agents do not get blanket access to every client token

## Context Mapping

Contexts are client-defined during onboarding and remain configurable per client.

Examples:

- `marcus`: may use a simpler development/test context shape
- `test-client`: expected to have multiple contexts such as W2 Work, LLC Work, Career, Personal

Rules:

- contexts are configured during onboarding, not hardcoded in UI or agent prompts
- one provider account may map to one or more contexts by alias/policy
- account aliases in `clients/<client_id>/account_aliases.yaml` must match the runtime/provider metadata used by sync services

## Authority and HITL Defaults

Onboarding must establish client-specific authority defaults before live workflows run.

At minimum:

- draft-only outbound comms by default
- no autonomous external commitments
- no travel booking without approval
- no money movement without approval
- no sensitive relationship actions without approval

These defaults belong in client envelope policy plus runtime DB state, not in ad hoc prompt memory.

## MVP Onboarding Sequence

1. Create or confirm `client_id`
2. Create client envelope files
3. Define contexts
4. Define account aliases per context
5. Capture consent and authority/HITL defaults
6. Connect Gmail/Calendar and any other MVP providers via OAuth
7. Store encrypted client-scoped OAuth secret material on VPS
8. Create `context_accounts` and `oauth_accounts` rows
9. Run first sync health checks for that client
10. Seed preferences and workflow defaults
11. Initialize first readiness/workflow lanes

## Canonical Activation Checklist

Use this as the short-form implementation order:

1. Create client record.
2. Create client envelope files.
3. Define contexts.
4. Define account aliases per context.
5. Capture consent and authority/HITL defaults.
6. Connect Gmail/Calendar/etc via OAuth.
7. Store refresh-token or equivalent provider secret material in client-scoped secret storage.
8. Create `context_accounts` and `oauth_accounts` rows.
9. Verify sync health for that client.
10. Seed preferences and workflow defaults.
11. Activate Sinclair/Khadijah routing for that client.

Rules for this checklist:

- Consent must be captured before live OAuth activation.
- Sync health must be proven before the client is treated as active.
- Client routing must not assume the provider path works until the health check passes.

## Initial Clients

### marcus

- status: development/test client
- OAuth: allowed for test/demo workflows
- operator/admin overlap: yes, but role separation still applies

### client

- status: first real client target
- OAuth: blocked until explicit onboarding and consent
- operator/admin overlap: no by default

## Non-Goals

This spec does not define:

- the polished user-facing onboarding UI
- final admin auth implementation
- long-term multi-tenant RBAC
- production-grade token broker design

It defines the MVP canon so Gmail/Calendar onboarding, client envelopes, and runtime integration do not drift.
