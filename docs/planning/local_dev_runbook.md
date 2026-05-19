# Local Dev Runbook

Repeatable setup for the **demo vertical slice** on one machine. Canonical task checklist: [build_vertical_slice_tasks.md](./build_vertical_slice_tasks.md).

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

## API tests (Lane B)

From `services/api` with project venv (Python 3.11+ recommended):

```bash
cd services/api
.venv/bin/python -m pytest tests/test_provider_first_sync.py tests/test_approvals_decide.py -q
```

Expect **22 passed**. Use `.venv` — system Python 3.9 may fail on modern typing in dependencies.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| CORS or network error from browser | Wrong API URL or API not on 8001 | Set `NEXT_PUBLIC_FLAVOROS_API_URL=http://127.0.0.1:8001`; restart Next |
| Login 422 on email | Old `EmailStr` validation | Ensure `schemas.py` uses `str` for login/user email |
| Connection refused on API | Wrong host | Use `127.0.0.1:8001`, not `localhost:8000` |
| Postgres connection failed | Port conflict with Docker | Local Postgres on 5432 or change `DATABASE_URL` |
| Empty Command Center after sync | Processor not run | Confirm step 4 complete; check `workflow_run_id` on sync response |
| Redirect loop to login | No session in localStorage | Complete login; check `(client)/layout` SessionGuard |

## Related docs

- [next_session_handoff.md](./next_session_handoff.md) — **start here** in a new agent session
- [build_vertical_slice_tasks.md](./build_vertical_slice_tasks.md) — file-level slice checklist (steps 1–5 complete)
- [build_roadmap_assessment.md](./build_roadmap_assessment.md) — sequencing and gaps (updated 2026-05-19)
- [parallel_lanes_tracker.md](./parallel_lanes_tracker.md) — parallel agent coordination
