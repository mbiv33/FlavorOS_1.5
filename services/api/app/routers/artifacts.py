"""Artifact router — tenant-scoped work products."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import Artifact, Tenant, User
from app.schemas import ArtifactCreate, ArtifactRead, ArtifactUpdate
from app.services.artifact_meta import validate_client_artifact_meta

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[ArtifactRead])
def list_artifacts(
    tu: TenantUser,
    db: DB,
    kind: str | None = Query(None),
    artifact_status: str | None = Query(None, alias="status"),
):
    tenant, _ = tu
    q = select(Artifact).where(Artifact.client_id == tenant.id)
    if kind:
        q = q.where(Artifact.kind == kind)
    if artifact_status:
        q = q.where(Artifact.status == artifact_status)
    q = q.order_by(Artifact.created_at.desc())
    return db.execute(q).scalars().all()


@router.post("", response_model=ArtifactRead, status_code=status.HTTP_201_CREATED)
def create_artifact(body: ArtifactCreate, tu: TenantUser, db: DB):
    tenant, _ = tu
    if body.kind == "client":
        validate_client_artifact_meta(body.meta)
    artifact = Artifact(client_id=tenant.id, **body.model_dump())
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact


@router.get("/{artifact_id}", response_model=ArtifactRead)
def get_artifact(artifact_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, _ = tu
    artifact = db.execute(
        select(Artifact).where(Artifact.id == artifact_id, Artifact.client_id == tenant.id)
    ).scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    return artifact


@router.patch("/{artifact_id}", response_model=ArtifactRead)
def update_artifact(artifact_id: uuid.UUID, body: ArtifactUpdate, tu: TenantUser, db: DB):
    tenant, _ = tu
    artifact = db.execute(
        select(Artifact).where(Artifact.id == artifact_id, Artifact.client_id == tenant.id)
    ).scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    updates = body.model_dump(exclude_unset=True)
    if artifact.kind == "client" and "meta" in updates:
        validate_client_artifact_meta(updates["meta"])
    for field, value in updates.items():
        setattr(artifact, field, value)
    db.commit()
    db.refresh(artifact)
    return artifact
