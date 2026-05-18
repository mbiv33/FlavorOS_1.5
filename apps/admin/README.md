# FlavorOS Admin

Next.js admin shell — developer/admin diagnostics and configuration for FlavorOS.

## MVP Surfaces

| Route | Surface |
|-------|---------|
| `/` | Admin dashboard overview |
| `/tenants` | Tenant monitor |
| `/agents` | Agent monitor |
| `/workflows` | Workflow monitor |
| `/providers` | Provider sync status |
| `/gbrain` | GBrain ingestion status |
| `/artifacts` | Artifact queue |
| `/approvals` | Approval queue |
| `/logs` | System logs |
| `/config` | Configuration editor |

## Running

From the repo root:

```bash
pnpm install
pnpm dev:admin    # http://localhost:3001
```

Requires `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` in `apps/admin/.env.local`. See the root [README](../../README.md) for setup.

## Architecture Notes

- Admin role (`developer_admin`) required for access.
- All data flows through the FastAPI backend at `services/api`.
- Tenant context resolved via `X-Client-ID` header.
- See [`docs/planning/mvp_build_notes.md`](../../docs/planning/mvp_build_notes.md) for admin surface scope.
