"""Client Universe router — tenant-scoped context store."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import ClientUniverseEntry, Tenant, User
from app.schemas import ClientUniverseEntryRead, ClientUniverseEntryWrite

router = APIRouter(prefix="/universe", tags=["universe"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[ClientUniverseEntryRead])
def list_entries(
    tu: TenantUser,
    db: DB,
    category: str | None = Query(None),
):
    tenant, _ = tu
    q = select(ClientUniverseEntry).where(ClientUniverseEntry.client_id == tenant.id)
    if category:
        q = q.where(ClientUniverseEntry.category == category)
    q = q.order_by(ClientUniverseEntry.category, ClientUniverseEntry.key)
    return db.execute(q).scalars().all()


@router.post("", response_model=ClientUniverseEntryRead, status_code=status.HTTP_201_CREATED)
def upsert_entry(body: ClientUniverseEntryWrite, tu: TenantUser, db: DB):
    tenant, _ = tu
    existing = db.execute(
        select(ClientUniverseEntry).where(
            ClientUniverseEntry.client_id == tenant.id,
            ClientUniverseEntry.category == body.category,
            ClientUniverseEntry.key == body.key,
        )
    ).scalar_one_or_none()

    if existing:
        existing.value = body.value
        db.commit()
        db.refresh(existing)
        return existing

    entry = ClientUniverseEntry(client_id=tenant.id, **body.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(entry_id: str, tu: TenantUser, db: DB):
    import uuid as _uuid

    tenant, _ = tu
    entry = db.execute(
        select(ClientUniverseEntry).where(
            ClientUniverseEntry.id == _uuid.UUID(entry_id),
            ClientUniverseEntry.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    db.delete(entry)
    db.commit()
