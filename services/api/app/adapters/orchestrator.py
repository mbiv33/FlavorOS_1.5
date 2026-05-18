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
