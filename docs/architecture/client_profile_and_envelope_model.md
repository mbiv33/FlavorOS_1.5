# Client Profile And Envelope Model

## Purpose

The client profile and client envelope define how FlavorOS represents one client without hardcoding development assumptions into the product.

FlavorOS 1.5 should treat client identity, provider accounts, context labels, approval defaults, and operator/admin authority as separate concepts.

## Core Separation

FlavorOS separates:

1. `client`
2. `operator_admin`
3. `client_context`
4. `context_account`
5. `oauth_connection`

These records may be related, but they must not collapse into one object.

## Client

A client is the person or organization FlavorOS operates for.

Client-owned concerns include:

- profile,
- preferences,
- contexts,
- account aliases,
- artifacts,
- approvals,
- Client Universe records,
- SIGMA Artifacts,
- workflow history.

Client permissions must not imply operator/admin authority.

## Operator/Admin

An operator/admin configures, monitors, tests, and supports the system.

Operator-owned concerns include:

- tenant setup,
- provider connection support,
- workflow and agent configuration,
- runtime inspection,
- deployment operations,
- diagnostics.

Admin powers must not be inferred from a client profile.

## Client Context

A client context is a domain inside the Client Universe, such as:

- personal,
- work,
- business,
- household,
- career,
- travel,
- finance.

Contexts are metadata and routing hints, not separate apps.

## Context Account

A context account is a provider account attached to a client context.

Examples:

- Gmail inbox for work,
- Google Calendar for personal scheduling,
- QuickBooks organization,
- LinkedIn account,
- project management workspace.

Context accounts store provider/account metadata. They do not store secret material.

## OAuth Connection

An OAuth connection is the consent and grant metadata behind a provider account.

OAuth metadata may include:

- provider,
- external account id,
- scopes,
- consent timestamp,
- refresh status,
- expiry metadata,
- secret reference.

OAuth refresh tokens, access tokens, API keys, and client secrets must live in approved secrets storage or provider vaults, not in client profile files.

## Profile Shape

The canonical profile should be able to represent:

```yaml
client_id: client_123
status: onboarding

identity:
  display_name: Example Client
  timezone: America/New_York
  locale: en-US

contexts:
  - context_id: primary
    context_type: personal
    display_name: Primary
    status: pending

authority_defaults:
  outbound_comms: draft_only
  calendar_commits: approval_required
  travel_booking: approval_required
  money_movement: blocked_without_explicit_approval

onboarding:
  status: pending
  oauth_ready: false
  first_sync_verified: false
```

## Allowed In Client Envelope Files

Client envelope files may contain:

- identity basics,
- context names,
- account aliases,
- expected providers,
- authority defaults,
- onboarding progress,
- human-readable notes.

## Blocked From Client Envelope Files

Client envelope files must not contain:

- OAuth refresh tokens,
- access tokens,
- API keys,
- passwords,
- raw provider secret blobs,
- admin/operator permissions,
- mutable sync checkpoints,
- generated work artifacts.

## Runtime Relationship

```text
client
-> client_context
-> context_account
-> oauth_connection
-> secret/provider vault reference
```

The profile is declarative. Runtime truth lives in the database and approved provider/secrets systems.

