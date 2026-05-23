# AGENTS.md

**Shared vocabulary:** See [`docs/FLAVOROS_TAXONOMY.md`](docs/FLAVOROS_TAXONOMY.md) for canonical terms, outbound statuses, surfaces, and repo pointers before cross-cutting PRs.

## API changes: Ruff before push (required)

CI does **not** fail on `git push` — it fails on the **Lint (ruff)** step in `.github/workflows/ci.yml` when `services/api/**` changes. This has recurred across many agent sessions (import order I001, line length E501). **Before finishing any API work or telling the user a push is safe:**

```bash
cd services/api && .venv/bin/ruff check app/
```

Use `--fix` for imports, then re-run. Full context: [`docs/development/api_ci_ruff.md`](docs/development/api_ci_ruff.md).

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

Grep is still right for exact string matches, regular expressions, multiline patterns, and file globs. Run `/sync-gbrain` to refresh, `/sync-gbrain --full` for full reindex.

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

## Design System

- **Source of truth:** [`DESIGN.md`](DESIGN.md) (visual tokens, typography, motion, component skin rules).
- **Product UX canon:** [`docs/ui/`](docs/ui/) (IA, Command Center wireframe, Approval Card, surfaces).
- **Implementation:** `apps/flavoros/src/app/globals.css`, Geist Sans/Mono in `layout.tsx`.
- **Aesthetic:** Calm command — warm stone palette, no chat-first UI, empty zones hide.
- **Token previews:** `docs/design-preview/preview-safe.html` and `preview-risk.html` (open in browser).
- **Approved direction:** SAFE (near-black accent `#1c1917`, Geist only). RISK was declined; see `DESIGN.md`.
