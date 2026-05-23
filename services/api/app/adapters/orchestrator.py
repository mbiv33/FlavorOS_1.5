"""Orchestrator / workflow-engine adapter contract.

The ``OrchestratorAdapter`` protocol defines how the API service
dispatches and monitors workflow executions. The real implementation
will coordinate agents, tools, and approval gates. The stub returns
immediately-completed placeholder results.

Responsibilities covered:
- start a workflow run
- query the status of a running workflow
- cancel a running workflow
- list available workflow definitions
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Protocol, runtime_checkable


@dataclass(frozen=True)
class WorkflowDefinition:
    """Registered workflow type that can be launched."""

    workflow_type: str
    label: str
    description: str
    owner_agent: str


@dataclass(frozen=True)
class WorkflowStatus:
    run_id: uuid.UUID
    workflow_type: str
    status: str  # queued | running | completed | failed | cancelled
    progress_pct: int = 0
    output: dict[str, Any] = field(default_factory=dict)
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


@dataclass(frozen=True)
class LaunchResult:
    run_id: uuid.UUID
    status: str
    error: str | None = None


@runtime_checkable
class OrchestratorAdapter(Protocol):
    """Boundary contract for workflow orchestration."""

    async def list_workflows(self) -> list[WorkflowDefinition]:
        """Return the catalog of launchable workflow types."""
        ...

    async def launch(
        self,
        client_id: uuid.UUID,
        workflow_type: str,
        input_data: dict[str, Any] | None = None,
    ) -> LaunchResult:
        """Start a new workflow run and return its initial status."""
        ...

    async def get_status(self, run_id: uuid.UUID) -> WorkflowStatus:
        """Return the current status of a workflow run."""
        ...

    async def cancel(self, run_id: uuid.UUID) -> bool:
        """Attempt to cancel a running workflow. Return True if accepted."""
        ...


class StubOrchestratorAdapter:
    """Noop implementation — workflows complete immediately with placeholder output."""

    _CATALOG: list[WorkflowDefinition] = [
        WorkflowDefinition(
            workflow_type="client_onboarding",
            label="Client Onboarding",
            description="Create a governed Client Universe and provider readiness plan.",
            owner_agent="khadijah",
        ),
        WorkflowDefinition(
            workflow_type="provider_first_sync",
            label="Provider First Sync",
            description="Verify a connected provider and queue tenant-scoped review work.",
            owner_agent="sinclair",
        ),
        WorkflowDefinition(
            workflow_type="morning_standup_seed",
            label="Morning Standup Seed",
            description="Prepare first briefing state from onboarding context.",
            owner_agent="khadijah",
        ),
        WorkflowDefinition(
            workflow_type="travel_research_seed",
            label="Travel Research Seed",
            description="Prepare Regine's initial travel and research context.",
            owner_agent="regine",
        ),
        WorkflowDefinition(
            workflow_type="morning_standup",
            label="Morning Standup",
            description="Daily briefing with prioritized agenda and pending approvals.",
            owner_agent="khadijah",
        ),
        WorkflowDefinition(
            workflow_type="cob_workday",
            label="COB Work Day",
            description="End-of-day wrap-up with completion summary.",
            owner_agent="khadijah",
        ),
        WorkflowDefinition(
            workflow_type="comms_calendar",
            label="Comms & Calendar",
            description="Communication triage and calendar review meeting.",
            owner_agent="sinclair",
        ),
        WorkflowDefinition(
            workflow_type="projects_review",
            label="Projects Review",
            description="Active project status and decision review.",
            owner_agent="khadijah",
        ),
    ]

    async def list_workflows(self) -> list[WorkflowDefinition]:
        return list(self._CATALOG)

    async def launch(
        self,
        client_id: uuid.UUID,
        workflow_type: str,
        input_data: dict[str, Any] | None = None,
    ) -> LaunchResult:
        run_id = uuid.uuid4()
        return LaunchResult(run_id=run_id, status="completed")

    async def get_status(self, run_id: uuid.UUID) -> WorkflowStatus:
        now = datetime.now(timezone.utc)
        return WorkflowStatus(
            run_id=run_id,
            workflow_type="unknown",
            status="completed",
            progress_pct=100,
            started_at=now,
            completed_at=now,
        )

    async def cancel(self, run_id: uuid.UUID) -> bool:
        return False


# ---------------------------------------------------------------------------
# In-process real implementation
# ---------------------------------------------------------------------------


class InProcessOrchestratorAdapter:
    """Real orchestrator backed by the in-process async executor.

    On ``launch``:
      1. Creates a WorkflowRun + AgentTask in the DB.
      2. Fires ``asyncio.create_task(dispatch_task(task_id))`` so the skill
         runs asynchronously without blocking the HTTP response.
      3. Returns ``LaunchResult(status="queued")`` immediately.

    ``get_status`` reads live from the DB. ``cancel`` marks the run
    cancelled if it is still queued (running tasks are left to finish).

    Activate by setting ``ORCHESTRATOR_ADAPTER=in_process``.
    """

    # Catalog mirrors StubOrchestratorAdapter so the API surface is identical.
    _CATALOG: list[WorkflowDefinition] = StubOrchestratorAdapter._CATALOG

    # Map workflow_type → agent + task_type
    _WORKFLOW_TASK_MAP: dict[str, dict[str, str]] = {
        "morning_standup": {"agent": "khadijah", "task_type": "morning_standup"},
        "cob_workday": {"agent": "khadijah", "task_type": "cob_workday"},
        "provider_first_sync": {
            "agent": "sinclair",
            "task_type": "provider_first_sync_review",
        },
        "communication_sweep": {
            "agent": "sinclair",
            "task_type": "communication_sweep_review",
        },
        "client_onboarding": {
            "agent": "khadijah",
            "task_type": "client_onboarding",
        },
        "morning_standup_seed": {
            "agent": "khadijah",
            "task_type": "morning_standup_seed",
        },
        "travel_research_seed": {
            "agent": "regine",
            "task_type": "travel_research_seed",
        },
        "comms_calendar": {
            "agent": "sinclair",
            "task_type": "comms_calendar",
        },
        "projects_review": {
            "agent": "khadijah",
            "task_type": "projects_review",
        },
        "account_sweep": {
            "agent": "sinclair",
            "task_type": "account_sweep",
        },
        "client_dna_parse": {
            "agent": "sinclair",
            "task_type": "client_dna_parse",
        },
    }

    async def list_workflows(self) -> list[WorkflowDefinition]:
        return list(self._CATALOG)

    async def launch(
        self,
        client_id: uuid.UUID,
        workflow_type: str,
        input_data: dict[str, Any] | None = None,
    ) -> LaunchResult:
        import asyncio

        from app.database import SessionLocal
        from app.executor import dispatch_task
        from app.models import AgentTask, WorkflowRun

        task_cfg = self._WORKFLOW_TASK_MAP.get(workflow_type, {})
        agent = task_cfg.get("agent", "khadijah")
        task_type = task_cfg.get("task_type", workflow_type)

        db = SessionLocal()
        try:
            run = WorkflowRun(
                client_id=client_id,
                workflow_type=workflow_type,
                agent=agent,
                status="queued",
                input_data=input_data or {},
            )
            db.add(run)
            db.flush()

            task = AgentTask(
                client_id=client_id,
                workflow_run_id=run.id,
                agent=agent,
                task_type=task_type,
                status="queued",
                payload={
                    "schema_version": "flavoros.agent_task.v1",
                    "workflow_run_id": str(run.id),
                    "client_id": str(client_id),
                    "target_agent": agent,
                    "task_type": task_type,
                    "inputs": input_data or {},
                },
            )
            db.add(task)
            db.commit()
            run_id = run.id
            task_id = task.id
        finally:
            db.close()

        asyncio.create_task(dispatch_task(task_id))

        return LaunchResult(run_id=run_id, status="queued")

    async def get_status(self, run_id: uuid.UUID) -> WorkflowStatus:
        from sqlalchemy import select

        from app.database import SessionLocal
        from app.models import WorkflowRun

        db = SessionLocal()
        try:
            run = db.execute(
                select(WorkflowRun).where(WorkflowRun.id == run_id)
            ).scalar_one_or_none()
        finally:
            db.close()

        if run is None:
            return WorkflowStatus(
                run_id=run_id,
                workflow_type="unknown",
                status="failed",
                error="WorkflowRun not found",
            )

        pct = {"queued": 0, "running": 50, "completed": 100}.get(run.status, 0)
        return WorkflowStatus(
            run_id=run_id,
            workflow_type=run.workflow_type,
            status=run.status,
            progress_pct=pct,
            output=run.output_data or {},
            error=run.error,
            started_at=run.started_at,
            completed_at=run.completed_at,
        )

    async def cancel(self, run_id: uuid.UUID) -> bool:
        from sqlalchemy import select

        from app.database import SessionLocal
        from app.models import WorkflowRun

        db = SessionLocal()
        try:
            run = db.execute(
                select(WorkflowRun).where(WorkflowRun.id == run_id)
            ).scalar_one_or_none()
            if run and run.status == "queued":
                run.status = "cancelled"
                db.commit()
                return True
            return False
        finally:
            db.close()
