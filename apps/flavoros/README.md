# FlavorOS (InstantDB Experiment)

**Status: Experimental — not part of the MVP client/admin/API slice.**

This app is an InstantDB-backed scaffold used for early prototyping. It is separate from the canonical FlavorOS MVP path defined in `apps/client`, `apps/admin`, and `services/api`.

## Running

```bash
pnpm dev:flavoros    # http://localhost:3002 (or next available port)
```

## Relationship to MVP

The MVP architecture uses FastAPI + PostgreSQL as the backend (see root [README](../../README.md)). This app may be used for isolated InstantDB experiments but should not be confused with the production client surface.
