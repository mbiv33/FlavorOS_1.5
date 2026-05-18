"""Audit Event router — immutable log of significant actions."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import AuditEvent, Tenant, User
from app.schemas import AuditEventCreate, AuditEventRead

router = APIRouter(prefix="/audit", tags=["audit"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[AuditEventRead])
def list_events(
    tu: TenantUser,
    db: DB,
    action: str | None = Query(None),
    limit: int = Query(100, le=500),
):
    tenant, _ = tu
    q = select(AuditEvent).where(AuditEvent.client_id == tenant.id)
    if action:
        q = q.where(AuditEvent.action == action)
    q = q.order_by(AuditEvent.created_at.desc()).limit(limit)
    return db.execute(q).scalars().all()


@router.post("", response_model=AuditEventRead, status_code=status.HTTP_201_CREATED)
def create_event(body: AuditEventCreate, tu: TenantUser, db: DB):
    tenant, user = tu
    event = AuditEvent(client_id=tenant.id, actor_id=user.id, **body.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
