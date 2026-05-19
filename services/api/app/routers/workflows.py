"""Workflow Run router — tracks orchestrator / agent executions."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import Tenant, User, WorkflowRun
from app.schemas import WorkflowRunCreate, WorkflowRunRead
from app.workflows.provider_first_sync import process_provider_first_sync

router = APIRouter(prefix="/workflows", tags=["workflows"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]


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


@router.get("/{run_id}", response_model=WorkflowRunRead)
def get_run(run_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, _ = tu
    run = db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id, WorkflowRun.client_id == tenant.id)
    ).scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow run not found")
    return run


_PROCESSORS = {
    "provider_first_sync": process_provider_first_sync,
}


@router.post("/{run_id}/process", response_model=WorkflowRunRead)
def process_run(run_id: uuid.UUID, tu: TenantUser, db: DB):
    """Dev/ops replay — re-run the processor for a queued workflow run."""
    tenant, _ = tu
    run = db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id, WorkflowRun.client_id == tenant.id)
    ).scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow run not found")
    processor = _PROCESSORS.get(run.workflow_type)
    if not processor:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No processor registered for workflow_type '{run.workflow_type}'",
        )
    processor(db, run.id)
    db.refresh(run)
    return run
