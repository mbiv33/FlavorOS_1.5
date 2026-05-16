# FlavorOS Secrets Protocol

How OAuth tokens, API keys, and credentials are stored, distributed, and rotated. The repo can live in a public Git repo without leaking anything.

---

## Threat model

- VPS host could be compromised → no plaintext secrets at rest in any image
- Git repo could leak → no plaintext secrets in version control
- A single agent could be compromised → that agent only sees the secrets it needs, nothing else
- OAuth tokens for the user's email/bank/CRM → never on disk; held by Composio, fetched JIT

## Layered model

```
┌──────────────────────────────────────────────────────────────────┐
│ Layer 0 — Master key                                             │
│   age private key. Lives only on the VPS at /etc/flavoros/age.key │
│   Backed up offline (1Password, hardware key). Never in git.      │
└──────────────────────────────────────────────────────────────────┘
                               │ unlocks
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Layer 1 — Encrypted blobs in git (SOPS + age)                    │
│   infra/secrets/secrets.enc.yaml  ← .env equivalent               │
│   infra/secrets/agents/<name>.enc.yaml ← per-agent secrets        │
│   Safe to commit. Only Layer 0 can decrypt.                       │
└──────────────────────────────────────────────────────────────────┘
                               │ secrets-loader decrypts at boot
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Layer 2 — Runtime tmpfs                                          │
│   /run/flavor/secrets/  (tmpfs, never written to disk)            │
│   Per-agent subdirs, mode 0400, owner = agent uid                 │
│   Wiped on container stop.                                        │
└──────────────────────────────────────────────────────────────────┘
                               │ agents read
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Layer 3 — Composio (OAuth)                                       │
│   Email, calendar, bank, CRM tokens never touch our infra.        │
│   We hold a Composio workspace API key (Layer 1).                 │
│   Composio mints scoped, short-lived tokens on demand per agent.  │
└──────────────────────────────────────────────────────────────────┘
```

**Net effect:** Everything in this repo is git-safe. The only secret that exists in plaintext on the VPS is the age private key (Layer 0). All Layer 1 blobs are encrypted-at-rest. Layer 2 lives in RAM. Layer 3 (the long-tail OAuth tokens) lives in Composio.

---

## What goes in which layer

| Secret | Layer 1 (encrypted in git) | Layer 3 (Composio) |
|--------|----------------------------|--------------------|
| `OPENROUTER_API_KEY` | ✅ | — |
| `COMPOSIO_API_KEY` | ✅ | — |
| `TELEGRAM_BOT_TOKEN` | ✅ (Khadijah only) | — |
| `ELEVENLABS_API_KEY` + `VOICE_ID` | ✅ (Khadijah only) | — |
| `OPENAI_API_KEY` (Whisper STT) | ✅ (Khadijah only) | — |
| `POSTGRES_PASSWORD` | ✅ | — |
| `OBSIDIAN_GIT_SSH_KEY` | ✅ | — |
| Gmail OAuth (Biz A, B, Personal) | — | ✅ |
| Google Calendar OAuth | — | ✅ |
| Mercury / Plaid / Ramp OAuth | — | ✅ |
| HubSpot / Attio / Linear / Notion OAuth | — | ✅ |
| TripIt / Hotels / Flights | — | ✅ |
| LinkedIn / X | — | ✅ |

---

## Setup (one-time)

```bash
# 1. Generate age keypair on a trusted local machine (NOT the VPS yet)
age-keygen -o age.key
# Public key looks like: age1xyz...
# Save the private key to 1Password / hardware key.

# 2. Add the public key to .sops.yaml so SOPS knows who can decrypt
# (already templated in infra/secrets/.sops.yaml — replace the placeholder)

# 3. Create your Layer 1 blob from the template
cp infra/secrets/secrets.example.yaml infra/secrets/secrets.yaml
$EDITOR infra/secrets/secrets.yaml          # fill in real values
sops --encrypt --in-place infra/secrets/secrets.yaml
mv infra/secrets/secrets.yaml infra/secrets/secrets.enc.yaml

# 4. Verify the encrypted blob is git-safe
grep -i "sk-" infra/secrets/secrets.enc.yaml || echo "✓ encrypted"
git add infra/secrets/secrets.enc.yaml infra/secrets/.sops.yaml

# 5. Copy ONLY the private key to the VPS (out-of-band: scp, restic, manual)
scp age.key root@vps:/etc/flavoros/age.key
ssh root@vps "chmod 0400 /etc/flavoros/age.key && chown root:root /etc/flavoros/age.key"

# 6. On the VPS, bring up the loader first
docker compose up -d secrets-loader
docker compose logs secrets-loader   # should report "decrypted N secrets"

# 7. Bring up the rest
docker compose up -d
```

## OAuth bootstrap (Composio)

Composio holds the user's OAuth tokens. We connect each account once interactively from the VPS:

```bash
docker compose run --rm composio-init
# This launches an interactive flow that:
#   1. Lists connections needed from infra/composio.yaml
#   2. For each one, prints a URL — the user visits it on a phone/laptop
#   3. User completes the OAuth handshake; Composio stores the token in their vault
#   4. composio-init records only the connection alias → connection_id mapping
#      in /run/flavor/secrets/composio_connections.json (Layer 2, in-memory)

# To re-authorize a single account (e.g., Gmail token expired):
docker compose run --rm composio-init --reauth email_biz_a
```

The mapping file is small and non-secret (just IDs). It can also be encrypted into Layer 1 for redundancy: `sops --encrypt infra/secrets/composio-connections.enc.json`.

## Per-agent scoping

Each agent only mounts the secrets it needs. `infra/secrets/agents/<name>.enc.yaml` is decrypted to `/run/flavor/secrets/<name>/`, and `docker-compose.yml` mounts only that subdirectory into that agent's container.

Examples:
- Sinclair gets: `composio_connections.json` (filtered to email/cal aliases only), `openrouter.key`
- Kyle gets: `composio_connections.json` (filtered to bank/CRM aliases), `openrouter.key`
- Khadijah gets: `telegram_bot_token`, `composio_connections.json` (filtered to comms only), `openrouter.key`

The filtering happens in the `secrets-loader` based on `infra/composio.yaml` grants — agents never see other agents' connection IDs.

## Rotation

```bash
# Rotate any Layer 1 secret
sops infra/secrets/secrets.enc.yaml      # opens decrypted, edits in place, re-encrypts
docker compose restart secrets-loader     # re-decrypt, refresh tmpfs
docker compose restart <affected-agents>

# Rotate Composio OAuth (per account)
docker compose run --rm composio-init --reauth <alias>

# Rotate the master age key (annually or on suspected compromise)
# 1. Generate new keypair locally
# 2. Add new public key to .sops.yaml as second recipient
# 3. `sops updatekeys infra/secrets/*.enc.yaml`  ← rewrites blobs to be readable by both keys
# 4. Distribute new private key to VPS, restart secrets-loader, verify
# 5. Remove old public key from .sops.yaml; `sops updatekeys` again
# 6. Old key now useless. Destroy.
```

## Audit

Every secret read is logged:
- secrets-loader emits one line per agent on boot: `agent=sinclair secrets=[openrouter,composio_email] sha256=...`
- Composio API logs are queryable via their dashboard
- OpenRouter usage attributed by agent via the `X-Agent` header set in the proxy

## What you must never do

- Commit `infra/secrets/secrets.yaml` (plaintext). Pre-commit hook in `infra/git-hooks/pre-commit` blocks this.
- Put secrets in `.env` on the VPS. We use SOPS instead.
- Pass secrets via `docker compose -e SECRET=...` — they show up in `docker inspect` and shell history.
- Bake secrets into images. Builds happen in CI without secret access.
- Share the age private key over Slack/email. Use a password manager or hardware key.
