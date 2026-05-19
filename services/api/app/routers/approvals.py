"""Approval router — HITL gates for governed actions."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import Approval, AuditEvent, Tenant, User
from app.schemas import (
    ApprovalCreate,
    ApprovalDecide,
    ApprovalDecideRead,
    ApprovalRead,
    OutboundActionRead,
)
from app.workflows import communications_outbound

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


@router.post("/{approval_id}/decide", response_model=ApprovalDecideRead)
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
    db.add(
        AuditEvent(
            client_id=tenant.id,
            actor_id=user.id,
            action="approval.decided",
            resource_type="approval",
            resource_id=approval.id,
            detail={
                "governed_action": approval.governed_action,
                "decision": approval.decision,
                "artifact_id": str(approval.artifact_id) if approval.artifact_id else None,
            },
        )
    )

    outbound_action = None
    if body.decision == "approved" and communications_outbound.is_communications_send(approval):
        try:
            outbound_action = communications_outbound.maybe_enqueue_and_execute(
                db, approval=approval, user=user
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(exc),
            ) from exc

    db.commit()
    db.refresh(approval)
    base = ApprovalRead.model_validate(approval).model_dump()
    if outbound_action is not None:
        base["outbound_action"] = OutboundActionRead.model_validate(outbound_action)
    return ApprovalDecideRead(**base)
