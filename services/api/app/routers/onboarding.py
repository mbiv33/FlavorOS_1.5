"""Client onboarding workflow endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.adapters import GBrainAdapter
from app.deps import get_db, get_gbrain, require_tenant_match
from app.models import Tenant, User
from app.onboarding import ONBOARDING_TRIGGER, save_onboarding
from app.schemas import OnboardingSaveRead, OnboardingSaveRequest

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]
GBrain = Annotated[GBrainAdapter, Depends(get_gbrain)]


@router.post("/save", response_model=OnboardingSaveRead)
async def save_client_onboarding(
    body: OnboardingSaveRequest,
    tu: TenantUser,
    db: DB,
    gbrain: GBrain,
):
    tenant, user = tu
    profile, provider_connections, onboarding_status, workflow_run, sigma = save_onboarding(
        db,
        tenant=tenant,
        user=user,
        body=body,
    )
    summary = (
        f"Onboarding saved for {profile.display_name}; status={onboarding_status}; "
        f"providers={','.join(conn.provider for conn in provider_connections) or 'none'}."
    )
    await gbrain.ingest(
        client_id=tenant.id,
        category="onboarding",
        content=summary,
        metadata={
            "workflow_run_id": str(workflow_run.id),
            "profile_id": str(profile.id),
            "provider_connection_ids": [str(conn.id) for conn in provider_connections],
        },
    )
    await gbrain.store_sigma(
        client_id=tenant.id,
        sigma_type="client_onboarding_readiness",
        payload={
            "artifact_id": str(sigma.id),
            "workflow_run_id": str(workflow_run.id),
            "onboarding_status": onboarding_status,
        },
    )
    return {
        "trigger": ONBOARDING_TRIGGER,
        "onboarding_status": onboarding_status,
        "profile": profile,
        "provider_connections": provider_connections,
    }
