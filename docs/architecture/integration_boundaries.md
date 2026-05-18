# Integration Boundaries

## Purpose

FlavorOS integrates with three major external subsystems — Composio (provider
access), GBrain (memory/retrieval), and the orchestrator (workflow engine).
Each is accessed through a typed **adapter contract** defined as a Python
`Protocol` in `services/api/app/adapters/`. Product code programs against
these protocols; the running implementation is selected via FastAPI dependency
injection.

This boundary design lets the MVP run end-to-end with stub adapters that
return safe defaults, while real implementations can be swapped in
per-subsystem without touching product routes or business logic.

## Adapter Contracts

### Composio — `ComposioAdapter`

Located in `services/api/app/adapters/composio.py`.

| Method            | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| `list_toolkits`   | Return the catalog of available provider toolkits           |
| `initiate_auth`   | Start an OAuth/auth flow for a provider                     |
| `check_connection`| Return the health/status of a provider connection           |
| `execute_action`  | Execute a governed action through a provider                |
| `trigger_sync`    | Trigger an inbound data sync from a provider into Client Universe |

Governed by `configs/composio.yaml` (toolkit catalog, grants, HITL rules).
See also `docs/architecture/composio_integration.md`.

### GBrain — `GBrainAdapter`

Located in `services/api/app/adapters/gbrain.py`.

| Method          | Purpose                                               |
| --------------- | ----------------------------------------------------- |
| `ingest`        | Ingest a record into the client's memory index        |
| `retrieve`      | Semantic retrieval of top-k relevant records           |
| `build_context` | Build a token-budgeted context packet for a workflow step |
| `store_sigma`   | Create or update a SIGMA artifact in client memory    |

GBrain's runtime mode is declared in `configs/gbrain.yaml`. The stub adapter
returns empty results; the real adapter will call the GBrain MCP/CLI layer.
See also `docs/architecture/gbrain_integration.md`.

### Orchestrator — `OrchestratorAdapter`

Located in `services/api/app/adapters/orchestrator.py`.

| Method           | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `list_workflows` | Return the catalog of launchable workflow types    |
| `launch`         | Start a new workflow run                           |
| `get_status`     | Return the current status of a workflow run        |
| `cancel`         | Attempt to cancel a running workflow               |

Workflow definitions and runtime rules are described in
`docs/workflows/workflow_runtime_model.md`.

## Dependency Injection

All three adapters are exposed as FastAPI dependencies in
`services/api/app/deps.py`:

```python
from app.deps import get_composio, get_gbrain, get_orchestrator
```

To swap in a real implementation:

```python
from app.adapters.composio import RealComposioAdapter

app.dependency_overrides[get_composio] = lambda: RealComposioAdapter(...)
```

## Stub vs Real Implementations

| Adapter       | Stub class                  | Returns                            |
| ------------- | --------------------------- | ---------------------------------- |
| Composio      | `StubComposioAdapter`       | Static toolkit list, no-op actions |
| GBrain        | `StubGBrainAdapter`         | Empty retrieval, rejected ingests  |
| Orchestrator  | `StubOrchestratorAdapter`   | Immediate completion, mock catalog |

The stubs are safe for all MVP flows: UI surfaces show placeholder data,
workflow launches return immediately, and no real provider actions fire.

## Design Rules

1. **No SDK imports in product code.** Routes and services import only the
   Protocol types and data classes from `app.adapters`.
2. **Tenant-scoped calls.** Every adapter method that touches client data
   takes a `client_id` parameter. The adapter never infers tenant context.
3. **HITL enforcement at the caller.** The adapter does not enforce approval
   gates — the calling route/service checks whether the action requires
   human-in-the-loop approval before calling `execute_action`.
4. **Stub mode is the default.** Until an adapter override is configured,
   the system runs with stubs. This means the MVP demo works without any
   external service credentials.
