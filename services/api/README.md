# FlavorOS API (MVP)

FastAPI service with multi-tenant dependencies, JWT auth stub, and profile CRUD.

## Setup

```bash
cd services/api
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp ../../.env.example ../../.env   # adjust secrets
docker compose -f ../../docker-compose.yml up -d postgres
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Dev users (after migration seed)

| Email            | Tenant slug | Role             | Password (default) |
|------------------|-------------|------------------|--------------------|
| client@demo.local | demo        | client           | from `DEV_CLIENT_PASSWORD` |
| admin@demo.local  | demo        | developer_admin  | from `DEV_ADMIN_PASSWORD`  |

Pass `X-Client-ID: demo` (slug) or tenant UUID on tenant-scoped routes.

## OpenAPI

`http://localhost:8000/docs`
