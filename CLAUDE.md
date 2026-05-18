# CLAUDE.md

## GBrain Configuration (configured by /setup-gbrain)
- Mode: local-stdio
- Engine: pglite
- Config file: ~/.gbrain/config.json (mode 0600)
- Setup date: 2026-05-12
- MCP registered: yes (user scope)
- Artifacts sync: off
- Current repo policy: n/a (not a git repo with origin)

## GBrain Search Guidance (configured by /sync-gbrain)
<!-- gstack-gbrain-search-guidance:start -->

GBrain is set up on this machine. Prefer gbrain over Grep when the question is semantic or you don't know the exact identifier yet.

Prefer gbrain when:
- "Where is X handled?" / semantic intent, no exact string yet:
    `gbrain search "<terms>"` or `gbrain query "<question>"`
- "Where is symbol Y defined?" / symbol-based code questions:
    `gbrain code-def <symbol>` or `gbrain code-refs <symbol>`
- "What calls Y?" / "What does Y depend on?":
    `gbrain code-callers <symbol>` / `gbrain code-callees <symbol>`
- "What did we decide last time?" / past plans, retros, learnings:
    `gbrain search "<terms>"`

Grep is still right for known exact strings, regex, multiline patterns, and file globs. Run `/sync-gbrain` to refresh, `/sync-gbrain --full` for full reindex.

<!-- gstack-gbrain-search-guidance:end -->

## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).

## Deploy Configuration (VPS — fill in placeholders)

- **Platform:** custom (VPS)
- **Production URL:** `https://YOUR_DOMAIN` (replace)
- **App:** `apps/flavoros` (Next.js `next start`)
- **Deploy workflow:** manual SSH (or your own CI that runs the same steps)
- **Deploy status command:** `curl -sfI "https://YOUR_DOMAIN" | head -n1` (replace domain)
- **Merge method:** squash (team default)
- **Project type:** web app
- **Post-deploy health check:** `https://YOUR_DOMAIN` (or add `GET /api/health` later and point here)

### Server prerequisites

- Node.js **20+** and **pnpm 9** (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Build on the server **or** build in CI and rsync `.next` + `node_modules` + package files (building on-server is simpler to start)

### One-time server setup

1. **SSH access:** add a host in `~/.ssh/config` (example: `Host flavoros` → `HostName YOUR_VPS_IP`, `User deploy`).
2. **Repo:** clone this monorepo to e.g. `/srv/flavoros` and check out the branch you deploy from.
3. **Env:** copy `apps/flavoros/.env.example` → `apps/flavoros/.env` on the server; set `NEXT_PUBLIC_INSTANT_APP_ID` and `INSTANT_APP_ADMIN_TOKEN` (never commit `.env`).

### Deploy steps (run on the VPS)

From the **repository root**:

```bash
cd /srv/flavoros
git pull
pnpm install --frozen-lockfile
pnpm --filter flavoros build
```

Run the app (pick **one**):

- **systemd** (below) with `PORT=3000` and reverse proxy on 443, or
- **PM2:** `pnpm --filter flavoros start` wrapped in `pm2 start` with the same env.

### systemd unit (example)

Save as `/etc/systemd/system/flavoros.service` (adjust `User`, `WorkingDirectory`, env):

```ini
[Unit]
Description=FlavorOS Next.js
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/srv/flavoros
Environment=NODE_ENV=production
Environment=PORT=3000
# EnvironmentFile=/srv/flavoros/apps/flavoros/.env
ExecStart=/usr/bin/pnpm --filter flavoros start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then: `sudo systemctl daemon-reload && sudo systemctl enable --now flavoros`

### Reverse proxy

Terminate TLS on **Caddy** or **nginx** and proxy to `127.0.0.1:3000`.

**Caddy** site block (minimal):

```
YOUR_DOMAIN {
  reverse_proxy 127.0.0.1:3000
}
```

### gstack `/land-and-deploy` notes

- **Deploy trigger:** your process (SSH + commands above, or a script you maintain).
- **Deploy status:** HTTP check to production URL until `200`, or rerun `systemctl is-active flavoros`.
- Fill in **`Production URL`** and **`Deploy status command`** once DNS and TLS work.

### Optional: GitHub Actions → VPS over SSH

Add a workflow that SSHs to the VPS and runs the **Deploy steps** block; store `SSH_PRIVATE_KEY` and `KNOWN_HOSTS` (or host key fingerprint) as repo secrets. Keep secrets out of this file.
