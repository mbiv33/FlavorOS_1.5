# Secrets Protocol

## Purpose

FlavorOS must keep secrets out of the repo while still giving runtime services the credentials they need.

This document captures the approved protocol direction without copying real secrets or old environment assumptions.

## Core Rules

- No plaintext secrets in git.
- No real `.env` files in git.
- No OAuth refresh tokens in client profile files.
- No provider API keys in docs, prompts, or generated artifacts.
- Runtime services receive only the secrets they need.
- Provider OAuth should use Composio or an approved provider vault where possible.
- Secret access should be auditable.

## Secret Categories

| Category | Treatment |
|---|---|
| Platform API keys | Encrypted secret store or deployment secret manager |
| Provider OAuth grants | Composio/provider vault or encrypted client-scoped secret store |
| Database passwords | Deployment secret manager |
| Per-agent/service credentials | Scoped to the service that needs them |
| Example placeholders | Allowed only as fake templates |

## Client-Scoped Provider Access

Provider credentials must be scoped by:

- tenant/client,
- provider,
- account alias,
- context,
- service permission,
- workflow/action capability.

Agents should not receive blanket access to every provider account.

## Runtime Access Pattern

```text
deployment secret manager / encrypted store
-> service-scoped runtime mount or environment
-> provider integration service
-> audited action / sync receipt
```

## Composio Role

Composio remains the preferred provider-access layer where it fits.

FlavorOS should store:

- provider account metadata,
- connection status,
- grant reference/id,
- scopes,
- refresh status,
- last sync health.

FlavorOS should not store provider OAuth token material in repo docs or client envelope files.

## Never Do

- Do not commit plaintext secret files.
- Do not paste real secret values into documentation or chat.
- Do not bake secrets into container images.
- Do not pass secrets through shell history as ad hoc command flags.
- Do not give every agent every provider credential.
- Do not use development credentials for first-client onboarding.

