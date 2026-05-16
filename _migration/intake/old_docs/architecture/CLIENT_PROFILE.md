# Client Profile Architecture

## Purpose

FlavorOS exists to unify a client's operational life across multiple contexts without forcing the client to collapse those real-world contexts into one account.

For MVP, the client profile is the semantic source of truth that tells FlavorOS:

- who the client is
- which contexts exist for that client
- which provider accounts belong to each context
- which authority defaults apply before autonomous workflows run
- whether the client is actually ready to activate

The client profile is not the runtime database, not secret storage, and not a dump of every mutable system field.

Companion docs:

- `docs/architecture/CLIENT_ENVELOPE.md`
- `docs/architecture/CLIENT_ONBOARDING.md`
- `docs/runbooks/CLIENT_ONBOARDING_PROTOCOL.md`

## MVP Goal

FlavorOS should let a client keep separate domains such as:

- personal
- work
- business A
- business B

while FlavorOS builds a unified operational layer above them:

- unified inbox awareness
- unified calendar awareness
- unified memory and relationship context
- unified project and task awareness

Agents operate on that unified layer, but the client profile preserves the real shape of the client's life underneath it.

## What A Client Profile Must Answer

For MVP, a valid client profile must answer these questions:

1. Who is this client?
2. What contexts or personas are in scope?
3. Which providers are expected inside each context?
4. Which account aliases should onboarding try to connect?
5. What approval and authority defaults apply?
6. Is this client ready, partial, pending, or blocked?

## Canonical Split

### `clients/<client_id>/profile.yaml`

Human-authored semantic configuration.

Allowed here:

- identity basics
- context definitions
- expected provider definitions
- account aliases
- authority defaults
- onboarding and readiness state
- human-readable notes

Blocked here:

- OAuth refresh tokens
- access tokens
- API keys
- passwords
- runtime sync timestamps
- mutable processing state
- generated work artifacts

### Postgres

Normalized operational state.

This is where FlavorOS should keep:

- `client_accounts`
- `client_profiles`
- `client_contexts`
- `context_accounts`
- `oauth_accounts`
- sync status
- work orders
- provider events
- PAC/PTQ state

### Secrets Storage

Actual secret material.

This is where FlavorOS should keep:

- OAuth refresh tokens
- client secrets
- API credentials

### Vault / Artifacts

Generated outputs and history.

This is where FlavorOS should keep:

- briefs
- drafts
- reports
- PAC master lists
- project and task artifacts
- relationship and memory outputs

## MVP Client Profile Shape

For MVP, `profile.yaml` should be able to represent the following logical sections, even if we later split them into multiple files:

```yaml
client_id: marcus
status: development_test_client

identity:
  display_name: marcus
  timezone: America/New_York
  locale: en-US

contexts:
  - context_id: primary
    context_type: personal
    display_name: Primary
    status: pending
    context_accounts: []

authority_defaults:
  outbound_comms: draft_only
  calendar_commits: approval_required
  travel_booking: approval_required
  money_movement: blocked_without_explicit_approval

onboarding:
  status: pending
  oauth_ready: false
  first_sync_verified: false
  notes:
    - Awaiting provider connection setup
```

## Required MVP Fields

Minimum required fields for onboarding:

- `client_id`
- `status`
- `identity.display_name`
- `identity.timezone`
- at least one context
- for each context:
  - `context_id`
  - `context_type`
  - `display_name`
  - `status`
- for each context account entry, if present:
  - `context_account_id`
  - `provider`
  - `context_account_purpose`
  - `account_alias`
  - `auth_scheme`
- `authority_defaults`
- `onboarding.status`

An initial client profile may begin with one starter context and zero context accounts. The onboarding UI/script is responsible for adding and updating context accounts later.

## Semantic Versus Runtime State

The client profile is declarative.

It should describe:

- what contexts exist
- what context accounts exist
- what category each context belongs to
- what purpose each context account serves

It should not be the source of truth for live runtime state such as:

- whether OAuth is currently connected
- whether an account is actively syncing
- whether a token is expired
- whether a connection is broken

That runtime state belongs in Postgres and secrets storage.

## Relationship Model

The canonical MVP relationship is:

`client -> context -> context_account -> oauth_account -> secret material`

Rules:

- one client has many contexts
- one context has many context accounts
- one context account may use one OAuth account
- one OAuth account is metadata about the auth grant and points to secrets rather than storing raw secret values
- one OAuth account may eventually support multiple context accounts, even if MVP implementations begin more simply

## Why This Exists

This structure gives onboarding enough information to create a client instance without overfitting the long-term system too early.

It lets us:

- create client rows
- create context rows
- create context-account rows
- later attach OAuth connections cleanly
- activate unified workflows only after readiness is proven
