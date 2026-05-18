# 15 · Admin / Operator Console

The Admin Console is the diagnostic surface for operators. It is **not** a client work surface and may show technical detail that the client UI never exposes.

Admins are effectively clients with elevated read/diagnose/configure ability. They can also access client-style surfaces where appropriate.

Controlling docs: `docs/planning/current_build_plan.md` §MVP Surfaces, `docs/governance/governance_and_permissions.md`, `docs/governance/secrets_protocol.md`.

## Routing

After login, an admin lands on the Admin Console home (not Command Center).

Left nav for admin mode:

1. Tenant Monitor
2. Provider Sync Status
3. Workflow Monitor
4. Agent Monitor
5. GBrain Ingestion Status
6. Artifact Queue
7. Approval Queue
8. Logs
9. Config Editor

A mode switcher in the header lets the admin enter a specific client's Command Center in read-mostly mode (writes still require role permission per governance rules).

## Console Home

Quiet operational dashboard:

- tenant count + clients with active runs
- providers degraded / failed
- workflows failed in the last hour
- pending approvals across tenants
- ingestion backlog size
- recent audit notables

Each tile links to its surface. No noisy counters; tiles only render when non-zero (except the static "tenants" tile).

## 1. Tenant Monitor

Lists tenants and clients with isolation posture.

Per tenant:

- tenant id, display name
- client count
- environment (dev/stage/prod)
- isolation health (boundary checks passing/failing)

Per client (drill-in):

- client id, display name
- onboarding status
- Client Universe readiness
- last activity

Read-only at MVP. No tenant deletion from the UI.

Data: `tenants`, `clients`, `client_universe`, isolation health checks.

## 2. Provider Sync Status

Provider connections across clients.

Shows per connection:

- client id, provider, scope
- connection state (connected / degraded / failed / disconnected)
- last successful sync
- last error (truncated, with "open log" link)
- backlog size

Commands:

- Retry sync
- Force reconnect (opens OAuth flow scoped to that connection)
- Mark for follow-up

Data: `provider_connections`, `provider_sync_events`.

## 3. Workflow Monitor

Workflow runs across clients.

Lists:

- active runs
- failed runs (last 24h)
- completed runs (last 24h)
- retry queue
- scheduled runs upcoming

Per run:

- run id, workflow definition, client, started_at, current state
- agent task tree (collapsible)
- linked artifacts and approvals
- error trace (admin-only)
- commands: retry, cancel, mark for follow-up

Data: `workflow_runs`, `agent_tasks`, `workflow_definitions`.

## 4. Agent Monitor

Activity across Khadijah, Sinclair, and Regine.

Per agent:

- active task count
- failed task count (last 24h)
- average task duration
- last task ids with state

Drill-in to a task shows the full `agent_task` + `agent_report` envelope per `agent_runtime_contracts.md`.

Data: `agent_tasks`, `agent_reports`.

## 5. GBrain Ingestion Status

Memory/context readiness.

Shows:

- ingestion queue size per client
- indexed item counts (today / total)
- failed ingest items with reason
- retrieval health

Commands:

- Retry ingestion
- Reindex client
- Open ingest log

Data: per `architecture/gbrain_integration.md` and `mcp__gbrain__get_ingest_log`.

## 6. Artifact Queue

Cross-client artifact pipeline.

Tabs:

- Drafts (Client Artifacts in early states)
- Pending review
- Approved / filed
- SIGMA artifacts (admin only — never visible client-side)

Per artifact:

- id, type, client, state, version
- linked workflow run
- linked approvals
- commands: open viewer, mark for follow-up

Data: `artifacts` (with `artifact_class` distinguishing Client vs SIGMA).

## 7. Approval Queue

HITL state across clients.

Tabs:

- Needs approval
- Approved (recent)
- Failed execution
- Pulled back

Per approval:

- id, category, client, stakes, requested by workflow/agent
- linked artifact / outbound action
- requested at, decided at, executed at

Commands: open in context, mark for follow-up. Admins do not approve client-governed actions from this surface; this is observability, not override.

Data: `approvals`, `outbound_actions`.

## 8. Logs

Audit-safe runtime events.

Filters:

- client
- event type (provider sync, workflow, agent, approval, outbound, ingest)
- severity
- time range

Each entry: timestamp, actor, target, summary, detail link.

Logs never display secrets in plain text (per `governance/secrets_protocol.md`).

Data: `audit_events`.

## 9. Config Editor

Controlled configuration surface.

Editable in MVP:

- workflow definition flags
- briefing/meeting definition flags
- authority default templates
- feature flags
- agent persona pack assignments

Read-only (managed via secrets protocol):

- provider OAuth credentials
- API keys
- service tokens

Every edit captures an audit event with old/new redacted as needed.

## Cross-Console Rules

- Admin surfaces may use technical vocabulary (`workflow_run`, `agent_task`, `provider_sync_event`, `audit_event`).
- Admin surfaces still never display secrets in plain text.
- Admin actions are scoped by permission per `governance/governance_and_permissions.md`.
- Every admin-initiated action writes an audit event.
- Admin Console is read-mostly by default; destructive actions require explicit confirmation.

## What The Admin Console Is Not

- not a place to bypass client approval for governed actions
- not a chat surface
- not a free-form database editor
- not a place to expose client journal entries, wellness data, or other client-private content without an explicit governance basis
