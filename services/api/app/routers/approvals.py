"""Approval router — HITL gates for governed actions."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import Approval, Tenant, User
from app.schemas import ApprovalCreate, ApprovalDecide, ApprovalRead

router = APIRouter(prefix="/approvals", tags=["approvals"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[ApprovalRead])
def list_approvals(
    tu: TenantUser,
    db: DB,
    decision: str | None = Query(None),
):
    tenant, _ = tu
    q = select(Approval).where(Approval.client_id == tenant.id)
    if decision:
        q = q.where(Approval.decision == decision)
    q = q.order_by(Approval.created_at.desc())
    return db.execute(q).scalars().all()


@router.post("", response_model=ApprovalRead, status_code=status.HTTP_201_CREATED)
def create_approval(body: ApprovalCreate, tu: TenantUser, db: DB):
    tenant, _ = tu
    approval = Approval(client_id=tenant.id, **body.model_dump())
    db.add(approval)
    db.commit()
    db.refresh(approval)
    return approval


@router.get("/{approval_id}", response_model=ApprovalRead)
def get_approval(approval_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, _ = tu
    approval = db.execute(
        select(Approval).where(Approval.id == approval_id, Approval.client_id == tenant.id)
    ).scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found")
    return approval


@router.post("/{approval_id}/decide", response_model=ApprovalRead)
def decide_approval(approval_id: uuid.UUID, body: ApprovalDecide, tu: TenantUser, db: DB):
    tenant, user = tu
    approval = db.execute(
        select(Approval).where(Approval.id == approval_id, Approval.client_id == tenant.id)
    ).scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found")
    if approval.decision != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Approval already decided: {approval.decision}",
        )
    approval.decision = body.decision
    approval.decided_by = user.id
    approval.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(approval)
    return approval
