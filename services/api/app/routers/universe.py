"""Client Universe KV entries and assembled envelope."""

from __future__ import annotations

import uuid as _uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import ClientUniverseEntry, Tenant, User
from app.schemas import (
    ClientUniverseEntryRead,
    ClientUniverseEntryWrite,
    ClientUniverseEnvelopeRead,
    UniverseReadinessRead,
)
from app.services.client_universe import (
    compute_readiness,
    export_yaml_slices,
    get_envelope,
    upsert_entry,
)
from app.universe_registry import validate_kv_category, validate_kv_key

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]

router = APIRouter(prefix="/universe", tags=["universe"])


@router.get("/envelope", response_model=ClientUniverseEnvelopeRead)
def get_universe_envelope(tu: TenantUser, db: DB) -> ClientUniverseEnvelopeRead:
    tenant, _user = tu
    return get_envelope(db, tenant.id)


@router.get("/readiness", response_model=UniverseReadinessRead)
def get_universe_readiness(tu: TenantUser, db: DB) -> UniverseReadinessRead:
    tenant, _user = tu
    return compute_readiness(db, tenant.id)


@router.get("/export-yaml")
def export_universe_yaml(tu: TenantUser, db: DB) -> dict[str, dict]:
    """Dev-only shaped export of KV slices (does not write to client_universe/ on disk)."""
    tenant, _user = tu
    return export_yaml_slices(db, tenant.id)


@router.get("", response_model=list[ClientUniverseEntryRead])
def list_entries(
    tu: TenantUser,
    db: DB,
    category: str | None = Query(None),
):
    tenant, _user = tu
    q = select(ClientUniverseEntry).where(ClientUniverseEntry.client_id == tenant.id)
    if category:
        q = q.where(ClientUniverseEntry.category == category)
    q = q.order_by(ClientUniverseEntry.category, ClientUniverseEntry.key)
    return list(db.execute(q).scalars().all())


@router.post("", response_model=ClientUniverseEntryRead, status_code=status.HTTP_201_CREATED)
def upsert_universe_entry(body: ClientUniverseEntryWrite, tu: TenantUser, db: DB):
    tenant, _user = tu
    try:
        validate_kv_category(body.category)
        validate_kv_key(body.category, body.key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    entry = upsert_entry(
        db,
        client_id=tenant.id,
        category=body.category,
        key=body.key,
        value=body.value or {},
    )
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(entry_id: str, tu: TenantUser, db: DB):
    tenant, _user = tu
    entry = db.execute(
        select(ClientUniverseEntry).where(
            ClientUniverseEntry.id == _uuid.UUID(entry_id),
            ClientUniverseEntry.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    db.delete(entry)
    db.commit()
