# Planned Services (Post-MVP Extraction Targets)

These services do not exist yet as deployable units. Today their logic lives inside `services/api` (the monolith). Each will be extracted when it has its own Dockerfile, deploy pipeline, and independently deployable surface.

**Rule:** A folder appears under `services/` only when it has a real Dockerfile and CI deploy step. Until then, its design lives here.

| Service | Purpose | Current home in monolith | Depends on | When to extract |
|---|---|---|---|---|
| `orchestrator` | Agent orchestration, workflow execution, approval routing | `services/api/app/adapters/orchestrator.py`, `app/workflows/` | API, DB | When workflow volume justifies separate scaling |
| `briefing_engine` | Build and schedule briefing artifacts | `services/api/app/skills/` (briefing skills) | Orchestrator, DB | Post-agent workflow MVP |
| `artifact_engine` | Store, version, and serve generated artifacts | `services/api/app/routers/` (artifact endpoints) | DB, GBrain | When artifact storage moves off Postgres |
| `meeting_engine` | Calendar and meeting lifecycle management | `services/api/app/adapters/composio.py` | Composio, orchestrator | Post-calendar integration MVP |
| `notification_engine` | Cross-channel notification dispatch | `services/api/app/routers/` (outbound actions) | Composio, Twilio | After outbound scheduling matures |
| `scheduler` | Cron and time-triggered workflow execution | `services/api/app/scripts/dispatch_outbound_due.py` | DB, orchestrator | When cron volume justifies separation |
| `tenant_manager` | Tenant provisioning and config management | `services/api/app/routers/admin.py` | DB | Multi-tenant SaaS scale |
| `auth` | Auth service extraction (JWT, session) | `services/api/app/routers/auth.py` | DB | If auth needs to serve non-API consumers |
| `voice_gateway` | Voice I/O (Sinclair voice, Twilio) | `integrations/twilio/` spec only | Twilio, orchestrator | Post-voice MVP |
| `worker` | Background async task worker | Inline FastAPI background tasks | DB, orchestrator | When task queue moves to Redis/Celery |
