# Hostinger Agent Sync

## Purpose

The repo owns FlavorOS prompts, skills, protocols, and shared context.

For now, the actual agent runtimes are the Hostinger-managed containers already running on the VPS:

- Khadijah: `hermes-agent-kxed-hermes-agent-1`
- Sinclair: `hermes-agent-isuk-hermes-agent-1`
- Maxine: `openclaw-pn8l-openclaw-1`

Do not deploy repo-owned Python `khadijah`, `sinclair`, or `maxine` containers. Those were scaffolding and are not the target runtime.

## Sync

Run from the repo root on the VPS:

```bash
bash deploy/hostinger-agents/sync-agent-bundles.sh
```

The script copies each agent's repo bundle into the mounted persistent Hostinger data directory:

- `/docker/hermes-agent-kxed/data/flavoros`
- `/docker/hermes-agent-isuk/data/flavoros`
- `/docker/openclaw-pn8l/data/flavoros`

It also creates timestamped backups under `/root/flavoros-agent-backups/`.

After syncing, configure each Hostinger agent UI/runtime to use its `flavoros` bundle as the active workspace or instruction source, then restart the corresponding Hostinger container.
