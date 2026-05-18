# FlavorOS Client

Next.js client shell — the primary user-facing surface for FlavorOS.

## MVP Surfaces

| Route | Surface |
|-------|---------|
| `/` | Command Center — day-at-a-glance dashboard |
| `/briefings` | Briefing launcher (Morning Standup, COB, Goodnight) |
| `/meetings` | Meeting launcher (Comms, Travel, Projects, Reports) |
| `/comms` | Comms & Calendar meeting |
| `/projects` | Projects meeting |
| `/reports` | Reports & Artifacts meeting |
| `/travel` | Travel & Logistics meeting |
| `/settings` | Profile & preferences |

## Running

From the repo root:

```bash
pnpm install
pnpm dev:client    # http://localhost:3000
```

Requires `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` in `apps/client/.env.local`. See the root [README](../../README.md) for setup.

## Architecture Notes

- Visual-first, command-and-control UI — not voice/chat-forward.
- All data flows through the FastAPI backend at `services/api`.
- Tenant context resolved via `X-Client-ID` header.
- See [`docs/ui/`](../../docs/ui/) for canonical surface and component specs.
