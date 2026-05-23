"""DNA candidate review router — operator HITL queue for Lane Z."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, get_gbrain_adapter, require_tenant_match
from app.models import ClientDnaCandidate, Tenant, User
from app.schemas import ClientDnaCandidateRead, DnaDecision
from app.workflows.client_dna_adoption import adopt_candidate, reject_candidate

router = APIRouter(prefix="/dna", tags=["dna"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]

DNA_DOMAINS = ("contacts", "locations", "entities", "projects")
DNA_STATUSES = ("pending", "accepted", "rejected", "adopted", "purged")


@router.get("/candidates", response_model=list[ClientDnaCandidateRead])
def list_candidates(
    tu: TenantUser,
    db: DB,
    domain: str | None = Query(None),
    candidate_status: str | None = Query(None, alias="status"),
    limit: int = Query(50, le=200),
):
    tenant, _ = tu
    q = select(ClientDnaCandidate).where(
        ClientDnaCandidate.client_id == tenant.id
    )
    if domain and domain in DNA_DOMAINS:
        q = q.where(ClientDnaCandidate.domain == domain)
    if candidate_status and candidate_status in DNA_STATUSES:
        q = q.where(ClientDnaCandidate.status == candidate_status)
    else:
        # Default: show only actionable rows
        q = q.where(ClientDnaCandidate.status == "pending")
    q = q.order_by(
        ClientDnaCandidate.domain,
        ClientDnaCandidate.confidence.desc().nullslast(),
    ).limit(limit)
    return db.execute(q).scalars().all()


@router.get("/candidates/{candidate_id}", response_model=ClientDnaCandidateRead)
def get_candidate(candidate_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, _ = tu
    row = db.execute(
        select(ClientDnaCandidate).where(
            ClientDnaCandidate.id == candidate_id,
            ClientDnaCandidate.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return row


@router.post("/candidates/{candidate_id}/accept", response_model=ClientDnaCandidateRead)
async def accept_candidate(
    candidate_id: uuid.UUID,
    body: DnaDecision,
    tu: TenantUser,
    db: DB,
):
    tenant, user = tu
    row = db.execute(
        select(ClientDnaCandidate).where(
            ClientDnaCandidate.id == candidate_id,
            ClientDnaCandidate.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    if row.status not in ("pending",):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Candidate is already {row.status}",
        )

    gbrain = get_gbrain_adapter()
    await adopt_candidate(db, row, gbrain, actor_id=user.id)
    db.commit()
    db.refresh(row)
    return row


@router.post("/candidates/{candidate_id}/reject", response_model=ClientDnaCandidateRead)
def reject_candidate_route(
    candidate_id: uuid.UUID,
    body: DnaDecision,
    tu: TenantUser,
    db: DB,
):
    tenant, user = tu
    row = db.execute(
        select(ClientDnaCandidate).where(
            ClientDnaCandidate.id == candidate_id,
            ClientDnaCandidate.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    if row.status not in ("pending",):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Candidate is already {row.status}",
        )

    reject_candidate(db, row, actor_id=user.id, note=body.note)
    db.commit()
    db.refresh(row)
    return row
