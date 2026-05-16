# Hostinger Runtime Model

## Purpose

Hostinger remains the VPS target for FlavorOS 1.5, but the deployment model should be updated for the clean monorepo and visual-first MVP.

This document preserves useful deployment lessons from the old runtime without restoring old five-agent or voice-forward assumptions.

## Current Direction

FlavorOS 1.5 should deploy as a Next.js WebApp plus supporting backend/runtime services.

The MVP runtime should support:

- Next.js client app,
- API service,
- provider ingestion,
- workflow engine,
- artifact engine,
- scheduler,
- database,
- Redis,
- optional transport bus,
- Composio/provider integration,
- GBrain/SIGMA state integration.

## Hostinger Role

Hostinger is the VPS environment for:

- running the deployable WebApp,
- hosting supporting services,
- reverse proxy/TLS,
- environment-specific secrets,
- scheduler/runtime workers,
- provider integration services.

## Future-State Runtime References

Old runtime materials include voice gateway, live call, vault sync, and external agent-container assumptions.

Treatment:

- voice gateway is future-state, not MVP required,
- live call runtime is future-state,
- persistent chat/right rail runtime is future-state,
- old five-agent container deployment is not current canon,
- Obsidian/vault sync can remain projection/export support, not source of truth,
- FLAVOROS_CONTEXT.md is not runtime canon.

## Deployment Shape

Recommended VPS shape:

```text
reverse proxy / TLS
-> Next.js WebApp
-> API service
-> workflow/provider/artifact workers
-> Postgres
-> Redis
-> optional NATS or queue
-> GBrain integration
-> Composio/provider access
```

## Operational Rules

- Do not deploy old standalone Maxine, Kyle, or Scooter runtime agents.
- Do not make voice gateway part of MVP readiness.
- Do not store real secrets in repo files.
- Do not use rendered vault files as durable truth.
- Do not rely on local development client ids in production.
- Do not treat container existence as proof of product correctness.

