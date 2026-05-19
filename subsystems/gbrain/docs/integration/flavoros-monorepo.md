# GBrain in the FlavorOS monorepo

GBrain lives under `subsystems/gbrain/` and is developed in **parallel Lane H**: agents may edit only this subtree during the vertical slice freeze.

## Boundary with FlavorOS product code

| Layer | Path | GBrain lane may touch? |
|---|---|---|
| GBrain CLI, engine, MCP | `subsystems/gbrain/**` | Yes |
| FastAPI service | `services/api/**` | No |
| Next.js app | `apps/flavoros/**` | No |
| Root env / compose | `.env.example`, `docker-compose.yml` | No |

FlavorOS does not call GBrain at runtime in the MVP vertical slice. Agents use GBrain locally for semantic search and planning context (`gbrain search`, `gbrain query`, MCP).

## Setup (developer machine)

Configured in repo root `AGENTS.md` / `CLAUDE.md`:

- Mode: local-stdio, engine pglite
- Config: `~/.gbrain/config.json`
- Refresh index: `/sync-gbrain` or `gbrain` sync orchestrator from gstack

## When to work in Lane H

- Improving indexer coverage for this repo
- GBrain MCP or CLI fixes
- Documentation under `subsystems/gbrain/docs/`

Do not use Lane H to implement Command Center, approvals, or admin console features.

## Coordination

See [docs/planning/parallel_lanes_tracker.md](../../../../docs/planning/parallel_lanes_tracker.md) — lane **H — GBrain**.
