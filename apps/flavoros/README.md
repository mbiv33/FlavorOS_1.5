# FlavorOS App

**Status: Active client/admin app surface.**

This is the canonical Next.js application for the FlavorOS MVP. It contains the
client Command Center, onboarding, channel surfaces, meeting/briefing routes,
and the operator/admin diagnostic surfaces.

FastAPI/Postgres is the canonical system of record for onboarding, provider
connections, workflow runs, artifacts, approvals, and audit records. GBrain is
the memory/retrieval layer. Composio/provider adapters handle external provider
access. InstantDB remains optional for future realtime UI projection and is not
part of the canonical onboarding path.

## Running

```bash
pnpm dev    # from repo root, runs this app
```

The app reads the API location from:

```bash
NEXT_PUBLIC_FLAVOROS_API_URL=http://localhost:8000
```
