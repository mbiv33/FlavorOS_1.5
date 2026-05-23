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

## Repo Layer Map

Two-layer rule — **always check this before implementing or creating files:**

| Concept | Authored spec (canon) | Runtime code | Planned (not wired) |
|---|---|---|---|
| Skills | `skills/<name>/` | `services/api/app/skills/` | — |
| Workflows | `docs/workflows/` | `services/api/app/workflows/` | — |
| Agents | `agents/<name>/` (YAML, SOUL.md, protocols) | `services/api/app/adapters/orchestrator.py` | — |
| Personas | `agents/<name>/personas/` | — | — |
| Integrations | `integrations/<name>/` (spec) | `services/api/app/adapters/` | — |
| Planned services | `docs/architecture/planned_services.md` | — | All future microservices live here until real Dockerfile exists |
| Configs | `configs/` (YAML) | API settings loaded via env | — |
| Governance | `governance/` | Enforced in `services/api/app/routers/` | — |
| Client universe | `client_universe/` (schemas, clients) | `services/api/app/routers/` (tenant endpoints) | — |
| Tooling / CI scripts | `scripts/` (FlavorOS), `scripts/gbrain/` (gbrain) | — | — |

**When implementing:** use the Runtime code column.  
**When authoring behavior, personas, or skill specs:** use the Authored spec column.  
**When something only appears in Planned:** do not wire it — add it to `docs/architecture/planned_services.md` instead.  
**`services/` contains only `services/api`** — one real deployable. Any new service lives in Planned until it has a Dockerfile and CI deploy step.

## Deploy Configuration (Vercel)

- **Platform:** Vercel
- **Production URL:** `https://flavoros.vercel.app`
- **App:** `apps/flavoros` (Next.js)
- **Deploy workflow:** Vercel project `mbiv33s-projects/flavoros`; deploy with `pnpm dlx vercel deploy --prod` from `apps/flavoros`, or connect the Git repository for automatic production deploys on `main`.
- **Deploy status command:** `pnpm dlx vercel inspect https://flavoros.vercel.app`
- **Merge method:** squash (team default)
- **Project type:** web app
- **Post-deploy health check:** `curl -sfI "https://flavoros.vercel.app"`

### Required Vercel Environment

- `NEXT_PUBLIC_INSTANT_APP_ID` must be set in Vercel production.
- `INSTANT_APP_ADMIN_TOKEN` is present in local env examples but is not used by the current FlavorOS app. Do not add it to Vercel unless server-side code starts using `@instantdb/admin`.

### Deploy Steps

From `apps/flavoros`:

```bash
pnpm dlx vercel link --yes --project flavoros
pnpm dlx vercel env ls
pnpm dlx vercel deploy --prod --yes
```

### VPS Fallback

If Vercel becomes limiting, the app can still run on a VPS with Node.js 20+, pnpm 9, `pnpm --filter flavoros build`, `pnpm --filter flavoros start`, and a Caddy or nginx reverse proxy to the Next.js process.

## API Deploy (Hostinger VPS — auto-deploy)

- **Production API:** `https://api.flavoros.cc` (Hostinger VPS `2.24.65.59`, Cloudflare tunnel, systemd `flavoros-api`).
- **Auto-deploy:** `.github/workflows/deploy-api.yml` runs on every push to `main` touching `services/api/**`. It SSHes to the VPS, writes `/etc/flavoros/api.env` from GitHub Secrets, pulls code, installs deps, runs `alembic upgrade head`, restarts the service, and health-checks `/health`.
- **Secrets are the single source of truth.** All runtime config lives in **GitHub repo Secrets** (Settings → Secrets → Actions), not hand-edited on the VPS. The deploy rewrites `/etc/flavoros/api.env` every run, so never edit that file by hand — change the GitHub Secret and re-deploy.
- **Required secrets:** `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DATABASE_URL`, `JWT_SECRET`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `COMPOSIO_API_KEY`. Optional: `SSH_FINGERPRINT`.
- **LLM provider:** agents call `app/llm.py:call_llm()` — **OpenRouter primary** (`OPENROUTER_API_KEY`, OpenAI-compatible API, model `anthropic/claude-sonnet-4-6`), Anthropic fallback (`ANTHROPIC_API_KEY`). Per-skill model selection is planned.
- **Manual deploy (fallback):** `ssh root@2.24.65.59`, `cd /opt/flavoros/api/repo && git pull && cd services/api && .venv/bin/alembic upgrade head && systemctl restart flavoros-api`.

## Design System

- **Source of truth:** [`DESIGN.md`](DESIGN.md) (visual tokens, typography, motion, component skin rules).
- **Product UX canon:** [`docs/ui/`](docs/ui/) (IA, Command Center wireframe, Approval Card, surfaces).
- **Implementation:** `apps/flavoros/src/app/globals.css`, Geist Sans/Mono in `layout.tsx`.
- **Aesthetic:** Calm command — warm stone palette, no chat-first UI, empty zones hide.
- **Token previews:** `docs/design-preview/preview-safe.html` and `preview-risk.html` (open in browser).
- **Approved direction:** SAFE (near-black accent `#1c1917`, Geist only). RISK was declined; see `DESIGN.md`.
