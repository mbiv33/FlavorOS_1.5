# Agent Runtime Deployment

FlavorOS keeps the product agent roster separate from the runtime worker that executes each agent. The MVP has three product agents and three runtime workers.

| FlavorOS agent | Runtime worker | Location | Service |
|---|---|---|---|
| Khadijah | Hermes | Cloud VPS | `flavoros-agent-khadijah-hermes` |
| Regine | OpenClaw | Cloud VPS | `flavoros-agent-regine-openclaw` |
| Sinclair | Hermes | Local machine | `flavoros-agent-sinclair-hermes` |

The production app remains on Vercel. The VPS is the cloud background-agent host.

## Canonical Mapping

- Khadijah runs on the VPS through Hermes using `agents/khadijah/agent.yaml`.
- Regine runs on the VPS through OpenClaw using `agents/regine/agent.yaml`.
- Sinclair runs locally through Hermes using `agents/sinclair/agent.yaml`.
- Sinclair must not be deployed to the VPS because its agent config declares an elevated local privacy boundary.

The source of truth for this mapping is `configs/agents.yaml` plus `configs/runtimes.yaml`.

## Secrets And Environment

Cloud agent secrets live on the VPS at:

```bash
/etc/flavoros/agents.env
```

The file must be owned by root and mode `0600`. Do not commit this file.

Recommended minimum cloud env:

```bash
NODE_ENV=production
FLAVOROS_REPO_DIR=/srv/flavoros
HERMES_BIN=hermes
OPENCLAW_BIN=openclaw
```

If the installed runtime CLIs do not match the default command shape, set explicit command overrides:

```bash
FLAVOROS_KHADIJAH_HERMES_COMMAND='hermes agent run --config agents/khadijah/agent.yaml --instructions agents/khadijah'
FLAVOROS_REGINE_OPENCLAW_COMMAND='openclaw agent --agent main --local --config agents/regine/agent.yaml'
```

Local Sinclair secrets stay local, either in the shell environment or a local env file that is not committed. The local helper reads `.env.local` when it exists.

## Cloud Deployment

From the repo root on the local machine:

```bash
bash scripts/deploy-agents-vps.sh
```

The script:

- verifies SSH to `root@2.24.65.59`,
- ensures Node 20, pnpm 9, git, and systemd are available,
- syncs `/srv/flavoros` from GitHub,
- installs dependencies,
- writes a shared agent runner at `/usr/local/bin/flavoros-agent-runner`,
- installs or updates the Khadijah Hermes and Regine OpenClaw systemd services,
- restarts only the agent services.

The script requires `/etc/flavoros/agents.env` to exist before services start. It also checks for the configured `hermes` and `openclaw` binaries on the VPS.

If you are already logged into the VPS, use the current-host installer instead:

```bash
cd /srv/flavoros
bash scripts/install-agents-current-host.sh
```

This installs the same runner and systemd services without SSHing back into the server.

If Hermes/OpenClaw are already running as Hostinger-managed Docker containers, the host may not have `hermes` or `openclaw` binaries in `PATH`. In that case, sync the repo agent bundles into the container data roots instead of installing host-level systemd services:

```bash
cd /srv/flavoros
bash deploy/hostinger-agents/sync-cloud-agent-bundles.sh --restart
```

Defaults:

- Khadijah Hermes data root: `/docker/hermes-agent-kxed/data`
- Regine OpenClaw data root: `/docker/openclaw-pn8l/data`

Override the roots if Hostinger generated different container ids:

```bash
KHADIJAH_DATA_ROOT=/docker/<hermes-container>/data \
REGINE_DATA_ROOT=/docker/<openclaw-container>/data \
bash deploy/hostinger-agents/sync-cloud-agent-bundles.sh --restart
```

## Local Sinclair

Run Sinclair locally:

```bash
bash scripts/run-local-hermes-sinclair.sh
```

Smoke-check the local setup without launching the long-running worker:

```bash
bash scripts/run-local-hermes-sinclair.sh --smoke
```

Override the local command when needed:

```bash
FLAVOROS_SINCLAIR_HERMES_COMMAND='hermes agent run --config agents/sinclair/agent.yaml --instructions agents/sinclair' \
  bash scripts/run-local-hermes-sinclair.sh
```

## Verification

Static repo verification:

```bash
bash scripts/check-agent-runtime-config.sh
```

Cloud service checks:

```bash
ssh root@2.24.65.59 systemctl status flavoros-agent-khadijah-hermes
ssh root@2.24.65.59 systemctl status flavoros-agent-regine-openclaw
ssh root@2.24.65.59 journalctl -u flavoros-agent-khadijah-hermes -n 100 --no-pager
ssh root@2.24.65.59 journalctl -u flavoros-agent-regine-openclaw -n 100 --no-pager
```

Repo checks:

```bash
pnpm --filter flavoros build
pnpm api:test
bash services/smoke-test.sh
```
