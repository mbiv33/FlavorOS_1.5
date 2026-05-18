"""Provider Connection router — external service links per tenant."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import ProviderConnection, Tenant, User
from app.schemas import ProviderConnectionRead, ProviderConnectionWrite

router = APIRouter(prefix="/providers", tags=["providers"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[ProviderConnectionRead])
def list_providers(tu: TenantUser, db: DB):
    tenant, _ = tu
    q = (
        select(ProviderConnection)
        .where(ProviderConnection.client_id == tenant.id)
        .order_by(ProviderConnection.provider)
    )
    return db.execute(q).scalars().all()


@router.post("", response_model=ProviderConnectionRead, status_code=status.HTTP_201_CREATED)
def upsert_provider(body: ProviderConnectionWrite, tu: TenantUser, db: DB):
    tenant, _ = tu
    existing = db.execute(
        select(ProviderConnection).where(
            ProviderConnection.client_id == tenant.id,
            ProviderConnection.provider == body.provider,
        )
    ).scalar_one_or_none()

    if existing:
        for field, value in body.model_dump(exclude={"provider"}).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    conn = ProviderConnection(client_id=tenant.id, **body.model_dump())
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.get("/{provider_id}", response_model=ProviderConnectionRead)
def get_provider(provider_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, _ = tu
    conn = db.execute(
        select(ProviderConnection).where(
            ProviderConnection.id == provider_id,
            ProviderConnection.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Provider connection not found"
        )
    return conn
