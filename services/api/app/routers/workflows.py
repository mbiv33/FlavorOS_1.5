"""Workflow Run router — tracks orchestrator / agent executions."""

from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters import OrchestratorAdapter
from app.deps import get_db, get_orchestrator, require_tenant_match
from app.models import Tenant, User, WorkflowRun
from app.schemas import WorkflowRunCreate, WorkflowRunRead
from app.workflows.communication_sweep import process_communication_sweep
from app.workflows.provider_first_sync import process_provider_first_sync

router = APIRouter(prefix="/workflows", tags=["workflows"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]
Orchestrator = Annotated[OrchestratorAdapter, Depends(get_orchestrator)]


class WorkflowLaunchRequest(BaseModel):
    workflow_type: str
    input_data: dict[str, Any] | None = None


@router.get("", response_model=list[WorkflowRunRead])
def list_runs(
    tu: TenantUser,
    db: DB,
    workflow_status: str | None = Query(None, alias="status"),
):
    tenant, _ = tu
    q = select(WorkflowRun).where(WorkflowRun.client_id == tenant.id)
    if workflow_status:
        q = q.where(WorkflowRun.status == workflow_status)
    q = q.order_by(WorkflowRun.created_at.desc())
    return db.execute(q).scalars().all()


@router.post("", response_model=WorkflowRunRead, status_code=status.HTTP_201_CREATED)
def create_run(body: WorkflowRunCreate, tu: TenantUser, db: DB):
    tenant, _ = tu
    run = WorkflowRun(client_id=tenant.id, **body.model_dump())
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.post("/launch", status_code=status.HTTP_202_ACCEPTED)
async def launch_workflow(
    body: WorkflowLaunchRequest,
    tu: TenantUser,
    orchestrator: Orchestrator,
):
    """Launch a workflow run via the orchestrator.

    Returns immediately with ``run_id`` and ``status="queued"``.
    Poll ``GET /workflows/{run_id}`` to track progress.

    Supported workflow_types:
      morning_standup, cob_workday, provider_first_sync, communication_sweep,
      client_onboarding, morning_standup_seed, travel_research_seed,
      comms_calendar, projects_review
    """
    tenant, _ = tu
    result = await orchestrator.launch(
        client_id=tenant.id,
        workflow_type=body.workflow_type,
        input_data=body.input_data,
    )
    return {
        "run_id": result.run_id,
        "status": result.status,
        "workflow_type": body.workflow_type,
    }


@router.get("/{run_id}", response_model=WorkflowRunRead)
def get_run(run_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, _ = tu
    run = db.execute(
        select(WorkflowRun).where(
            WorkflowRun.id == run_id,
            WorkflowRun.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow run not found",
        )
    return run


# Sync-processor replay map — for dev/ops re-triggering of queued runs.
# Inline (non-executor) processors only. Executor-based workflows are
# replayed by resetting the AgentTask status to "queued" and calling
# dispatch_task directly from /admin tooling.
_PROCESSORS = {
    "provider_first_sync": process_provider_first_sync,
    "communication_sweep": process_communication_sweep,
}


@router.post("/{run_id}/process", response_model=WorkflowRunRead)
def process_run(run_id: uuid.UUID, tu: TenantUser, db: DB):
    """Dev/ops replay — re-run the inline processor for a queued workflow run."""
    tenant, _ = tu
    run = db.execute(
        select(WorkflowRun).where(
            WorkflowRun.id == run_id,
            WorkflowRun.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow run not found",
        )
    processor = _PROCESSORS.get(run.workflow_type)
    if not processor:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No processor registered for workflow_type '{run.workflow_type}'",
        )
    processor(db, run.id)
    db.refresh(run)
    return run
