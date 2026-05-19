"""Outbound actions — approval-gated provider write-back lifecycle."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import AuditEvent, OutboundAction, Tenant, User
from app.schemas import OutboundActionRead
from app.workflows import calendar_outbound, communications_outbound

router = APIRouter(prefix="/outbound-actions", tags=["outbound-actions"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[OutboundActionRead])
def list_outbound_actions(
    tu: TenantUser,
    db: DB,
    status_filter: str | None = Query(None, alias="status"),
    provider: str | None = Query(None),
    artifact_id: uuid.UUID | None = Query(None),
):
    tenant, _ = tu
    q = select(OutboundAction).where(OutboundAction.client_id == tenant.id)
    if status_filter:
        q = q.where(OutboundAction.status == status_filter)
    if provider:
        q = q.where(OutboundAction.provider == provider)
    if artifact_id:
        q = q.where(OutboundAction.artifact_id == artifact_id)
    q = q.order_by(OutboundAction.created_at.desc())
    return db.execute(q).scalars().all()


@router.get("/{outbound_id}", response_model=OutboundActionRead)
def get_outbound_action(outbound_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, _ = tu
    outbound = db.execute(
        select(OutboundAction).where(
            OutboundAction.id == outbound_id,
            OutboundAction.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not outbound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Outbound action not found"
        )
    return outbound


@router.post("/{outbound_id}/pull-back", response_model=OutboundActionRead)
def pull_back_outbound(outbound_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, user = tu
    outbound = db.execute(
        select(OutboundAction).where(
            OutboundAction.id == outbound_id,
            OutboundAction.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not outbound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Outbound action not found"
        )
    if outbound.status != "queued":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot pull back outbound in status: {outbound.status}",
        )
    outbound.status = "pulled_back"
    outbound.updated_at = datetime.now(timezone.utc)
    db.add(
        AuditEvent(
            client_id=tenant.id,
            actor_id=user.id,
            action="outbound.pulled_back",
            resource_type="outbound_action",
            resource_id=outbound.id,
            detail={
                "outbound_action_id": str(outbound.id),
                "approval_id": str(outbound.approval_id),
                "status": outbound.status,
            },
        )
    )
    db.commit()
    db.refresh(outbound)
    return outbound


@router.post("/{outbound_id}/execute", response_model=OutboundActionRead)
def execute_outbound_action(outbound_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, user = tu
    outbound = db.execute(
        select(OutboundAction).where(
            OutboundAction.id == outbound_id,
            OutboundAction.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not outbound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Outbound action not found"
        )
    if outbound.status == "executed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Outbound action already executed",
        )
    if outbound.status != "queued":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot execute outbound in status {outbound.status}",
        )
    try:
        if outbound.provider == communications_outbound.COMMUNICATIONS_PROVIDER:
            communications_outbound.execute_outbound_with_audit(
                db, outbound=outbound, user=user
            )
        elif outbound.provider == calendar_outbound.CALENDAR_PROVIDER:
            calendar_outbound.execute_calendar_outbound_with_audit(
                db, outbound=outbound, user=user
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Unsupported outbound provider: {outbound.provider}",
            )
    except (
        communications_outbound.OutboundExecuteConflictError,
        calendar_outbound.CalendarExecuteConflictError,
    ) as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    db.commit()
    db.refresh(outbound)
    return outbound
