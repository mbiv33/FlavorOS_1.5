# FlavorOS Deployment Protocol

## Current Deployment Decision

The repo is the source of truth for FlavorOS prompts, skills, protocols, shared context, app code, schema, and deployment support files.

The repo does **not** currently deploy the real agents as Python containers.

For the current VPS phase, the actual agent runtimes are Hostinger-managed containers:

| Agent | Runtime | VPS container | Data root |
|---|---|---|---|
| Khadijah | Hermes | `hermes-agent-kxed-hermes-agent-1` | `/docker/hermes-agent-kxed/data` |
| Sinclair | Hermes | `hermes-agent-isuk-hermes-agent-1` | `/docker/hermes-agent-isuk/data` |
| Maxine | OpenClaw | `openclaw-pn8l-openclaw-1` | `/docker/openclaw-pn8l/data` |

Scooter and Kyle remain part of the product design, but they are not deployed as real Hostinger runtimes yet.

The old repo-owned `khadijah`, `sinclair`, `maxine`, `scooter`, and `kyle` Python containers were scaffolding. Do not redeploy them as the agent runtime.

## Repo-Owned Services

`docker-compose.yml` owns shared infrastructure and app surfaces only:

- `nats`
- `redis`
- `postgres`
- `secrets-loader`
- `openrouter-proxy`
- `scheduler`
- `app-api`
- `app-ui`
- `voice-gateway`
- optional `vault-sync`
- optional one-shot `composio-init`

The repo-owned services support storage, transport, app visibility, and provider/API integration. They do not replace Hermes or OpenClaw.

## Hostinger Agent Sync

Run from the repo root on the VPS:

```bash
bash deploy/hostinger-agents/sync-agent-bundles.sh
```

The sync copies the current repo agent bundles into the persistent Hostinger data roots:

- Khadijah -> `/docker/hermes-agent-kxed/data/flavoros`
- Sinclair -> `/docker/hermes-agent-isuk/data/flavoros`
- Maxine -> `/docker/openclaw-pn8l/data/flavoros`

After syncing, configure each Hostinger runtime to use the corresponding `flavoros` folder as its active instruction/workspace source, then restart:

```bash
docker restart hermes-agent-kxed-hermes-agent-1
docker restart hermes-agent-isuk-hermes-agent-1
docker restart openclaw-pn8l-openclaw-1
```

## VPS Baseline

```bash
ssh root@2.24.65.59
cd /home/deploy/apps/flavoros
git status --short
docker ps -a
docker compose config --services
```

Expected real agent containers:

- `hermes-agent-kxed-hermes-agent-1`
- `hermes-agent-isuk-hermes-agent-1`
- `openclaw-pn8l-openclaw-1`
- `traefik-traefik-1`

Expected repo-owned compose services:

- no `khadijah`
- no `sinclair`
- no `maxine`
- no `scooter`
- no `kyle`

## Bring Up Repo-Owned Support Services

```bash
cd /home/deploy/apps/flavoros
docker compose up -d nats redis postgres secrets-loader openrouter-proxy scheduler app-api app-ui
```

For voice support:

```bash
docker compose up -d voice-gateway
```

For vault sync only after SSH host keys and vault remote access are configured:

```bash
docker compose up -d vault-sync
```

## Verify Support Services

```bash
docker compose ps
docker compose logs --tail=50 app-api
curl http://127.0.0.1:8091/health
curl http://127.0.0.1:8091/api/dashboard-state
```

Expected:

- `app-api` connects to Postgres
- `app-api` can reach NATS
- `app-api` sees `/vault`
- dashboard state returns JSON

## Gmail MVP Pull Path

After `app-api` is healthy and the Gmail token secret is mounted:

```bash
curl -X POST "http://127.0.0.1:8091/api/providers/gmail/sync?max_results=5&query=newer_than:7d"
```

Expected MVP path:

1. Gmail messages become `provider_events`.
2. Messages normalize into `normalized_items`.
3. `app-api` stages work for Sinclair.
4. Hostinger Sinclair handles the real agent work once its runtime is pointed at the synced repo bundle.
5. Reports and artifacts are persisted through repo-owned support services.

## Dee Guard

Before deployment, architecture, or file changes in this repo:

```bash
bash scripts/dee-prechange-check.sh --ack
bash scripts/dee-prechange-check.sh
```

Use `--ack` only after `/itc` has been run and current canon drift has been named.

## Never Do

- Do not redeploy the old repo-owned Python agent containers.
- Do not run `docker compose up -d khadijah sinclair maxine scooter kyle`.
- Do not treat running containers as proof the agents are current.
- Do not rotate provider keys outside `docs/runbooks/STACK_API_PROTOCOL.md`.
- Do not print secret values in logs, docs, or chat.
