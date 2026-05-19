# Local Dev Runbook

**Last updated:** 2026-05-19 (K3 verification guardrails)

Repeatable setup for the **demo vertical slice** on one machine. Historical slice checklist: [archive/build_vertical_slice_tasks.md](./archive/build_vertical_slice_tasks.md).

## Prerequisites

- Node.js 20+, pnpm 9+
- Python 3.11+ with `services/api` venv
- PostgreSQL 15+ (local install or Docker — see port notes below)
- Optional: Docker Desktop (only if you use containerized Postgres)

## Port and host conventions (macOS)

| Service | URL | Notes |
|---|---|---|
| Next.js (`apps/flavoros`) | `http://localhost:3000` | `pnpm dev` from repo root or filter |
| FastAPI | `http://127.0.0.1:8001` | **Use `127.0.0.1`, not `localhost`** — Docker Desktop often binds `::1:8000`, so `localhost` can hit the wrong listener |
| PostgreSQL | `localhost:5432` | If Docker claims 5432, use a local Postgres role/db instead |

## Environment files

Copy examples into working env files (never commit secrets):

```bash
cp .env.example .env
cp apps/flavoros/.env.example apps/flavoros/.env.local
```

**Authoritative browser API URL** (Next app):

- Variable: `NEXT_PUBLIC_FLAVOROS_API_URL`
- Example: `http://127.0.0.1:8001`
- Defined in: `apps/flavoros/src/lib/api.ts` and `apps/flavoros/.env.example`

Root `.env.example` also documents `NEXT_PUBLIC_FLAVOROS_API_URL` for monorepo copy-paste. Do not use `NEXT_PUBLIC_API_URL` in the Next app.

## Database bootstrap

1. Create role and database (local Postgres example):

```sql
CREATE USER flavoros WITH PASSWORD 'flavoros';
CREATE DATABASE flavoros OWNER flavoros;
```

2. Set `DATABASE_URL` in `.env` (matches root `.env.example`).

3. Run migrations from `services/api`:

```bash
cd services/api
source .venv/bin/activate   # or your venv path
alembic upgrade head
```

API startup seed runs unless `API_SKIP_STARTUP_SEED=true`.

## Restart API after outbound migration (Lane J / K3)

If the API process started **before** the `outbound_actions` migration landed, routes like `GET /outbound-actions` may return **404** until you restart against a migrated database. Follow this order every time you pull outbound write-back changes or switch branches:

1. **Stop** the running `uvicorn` process (Ctrl+C).
2. **Migrate** (from `services/api` with venv active):

```bash
cd services/api
source .venv/bin/activate
alembic upgrade head
```

3. **Seed refresh** — leave `API_SKIP_STARTUP_SEED` unset (or `false`) so startup seed runs on next boot. If you use `API_SKIP_STARTUP_SEED=true` in `.env`, restart once without it or run your seed path manually so demo pending `send_communication_draft` approvals exist.
4. **Start API** on `127.0.0.1:8001` (see [Start API](#start-api) below).
5. **Health check:**

```bash
curl -sf http://127.0.0.1:8001/health
```

6. **Smoke** (from repo root, with demo credentials in DB):

```bash
./scripts/smoke-vertical-slice.sh
```

The smoke script asserts **outbound status in JSON** after approve (`executed` or `failed` by default), not only row count.

**Deferred execution (optional):** to test enqueue-without-inline-send, start the API with `OUTBOUND_DEFER_EXECUTION=true`, then run:

```bash
SMOKE_OUTBOUND_DEFER=1 ./scripts/smoke-vertical-slice.sh
```

Expect `queued` in the decide response and in `GET /outbound-actions`. Default demo/dev should leave defer **off** so approve → executed remains the investor path.

## Start API

From `services/api` with venv active:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Verify:

```bash
curl -sf http://127.0.0.1:8001/health
```

## Start Next.js

From repo root:

```bash
pnpm --filter flavoros dev
```

Open `http://localhost:3000/login`.

## Demo credentials (seed)

| Field | Value |
|---|---|
| Tenant slug | `demo` |
| Client email | `client@demo.local` |
| Client password | `devclient` (or `DEV_CLIENT_PASSWORD` in `.env`) |
| Admin email | `admin@demo.local` |
| Admin password | `devadmin` (or `DEV_ADMIN_PASSWORD` in `.env`) |

Dev seed uses `.local` emails; API schemas use plain `str` for email fields (not Pydantic `EmailStr`) so `.local` addresses validate.

## Vertical slice smoke path

1. **Login** at `/login` with demo client credentials.
2. If onboarding incomplete → `/onboarding` (Google provider + first sync).
3. After sync → **Command Center** shows real artifact + pending approval from API.
4. **Approve or reject** from inbox; confirm audit/event side effects via API if needed.
5. **Settings** at `/settings` — profile + provider connections from API (Lane F).
6. **Admin** at `/admin` — live overview tiles and list surfaces (Lane C; same session).

Quick API checks (after login, use Bearer token + `X-Client-ID` from session):

```bash
# Replace TOKEN and CLIENT_ID
curl -sf -H "Authorization: Bearer TOKEN" -H "X-Client-ID: CLIENT_ID" \
  http://127.0.0.1:8001/artifacts
curl -sf -H "Authorization: Bearer TOKEN" -H "X-Client-ID: CLIENT_ID" \
  "http://127.0.0.1:8001/approvals?decision=pending"
```

## Settings (Lane F)

- Route: `/settings` (under `(client)` layout + `SessionGuard`)
- Hook: `apps/flavoros/src/lib/hooks/useSettingsData.ts`
- API: `GET /profiles/me`, provider list via `api.ts`

## Operator console (Lane C)

Admin UI lives under `/admin`. It uses a **separate** client module `apps/flavoros/src/lib/admin-api.ts` (not `api.ts`) for read-only list endpoints:

- `GET /providers`, `/workflows`, `/artifacts`, `/approvals`, `/audit`

Login first; `apps/flavoros/src/app/admin/layout.tsx` uses `SessionGuard` + `AppShell` (admin variant).

Key files: `admin-surfaces.ts`, `components/admin/AdminSurfacePanel.tsx`, `hooks/useAdminOverview.ts`.

## API tests (Lane B + J + K3)

From `services/api` with project venv (Python 3.11+ recommended):

```bash
cd services/api
.venv/bin/python -m pytest \
  tests/test_provider_first_sync.py \
  tests/test_approvals_decide.py \
  tests/test_outbound_actions.py \
  -q
```

Expect **30 passed** (includes outbound lifecycle, defer path, pull-back, and failure hooks). Use `.venv` — system Python 3.9 may fail on modern typing in dependencies.

CI runs the same three files on every PR that touches `services/api/**` in [`.github/workflows/api-integration-tests.yml`](../../.github/workflows/api-integration-tests.yml) (additive job; does not change `ci.yml`). The workflow job is not skipped when only docs change — API path filters gate it.

## Quick smoke script (Lane D)

From repo root (API must be running on `127.0.0.1:8001`):

```bash
./scripts/smoke-vertical-slice.sh
```

Checks `GET /health`, `GET /docs`, and (when auth + seed are available) approve → outbound lifecycle with **status assertions** on the decide response and list. Full demo path still requires manual login → onboarding → Command Center (see [archive/build_vertical_slice_tasks.md](./archive/build_vertical_slice_tasks.md) verification checklist).

## Parallel agent coordination

When multiple agents work the repo, use [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) for slice lock, allowed paths per lane, and session log. GBrain-only work stays under `subsystems/gbrain/` — see `subsystems/gbrain/docs/integration/flavoros-monorepo.md`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| CORS or network error from browser | Wrong API URL or API not on 8001 | Set `NEXT_PUBLIC_FLAVOROS_API_URL=http://127.0.0.1:8001`; restart Next |
| Login 422 on email | Old `EmailStr` validation | Ensure `schemas.py` uses `str` for login/user email |
| Connection refused on API | Wrong host | Use `127.0.0.1:8001`, not `localhost:8000` |
| Postgres connection failed | Port conflict with Docker | Local Postgres on 5432 or change `DATABASE_URL` |
| Empty Command Center after sync | Processor not run | Confirm step 4 complete; check `workflow_run_id` on sync response |
| Redirect loop to login | No session in localStorage | Complete login; check `(client)/layout` SessionGuard |
| `/outbound-actions` 404 | Stale API process or missing migration | [Restart API after outbound migration](#restart-api-after-outbound-migration-lane-j--k3) |
| Smoke: outbound stayed `queued` | `OUTBOUND_DEFER_EXECUTION=true` on API | Unset for inline demo, or run `SMOKE_OUTBOUND_DEFER=1` with defer enabled |

## Related docs

- [next_session_handoff.md](./next_session_handoff.md) — **start here** in a new agent session
- [archive/build_vertical_slice_tasks.md](./archive/build_vertical_slice_tasks.md) — archived file-level slice checklist (steps 1–5 complete)
- [build_roadmap_assessment.md](./build_roadmap_assessment.md) — sequencing and gaps
- [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) — parallel agent coordination
