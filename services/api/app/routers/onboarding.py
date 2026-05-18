"""Client onboarding workflow endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import Tenant, User
from app.onboarding import ONBOARDING_TRIGGER, save_onboarding
from app.schemas import OnboardingSaveRead, OnboardingSaveRequest

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]


@router.post("/save", response_model=OnboardingSaveRead)
def save_client_onboarding(body: OnboardingSaveRequest, tu: TenantUser, db: DB):
    tenant, user = tu
    profile, provider_connections, onboarding_status = save_onboarding(
        db,
        tenant=tenant,
        user=user,
        body=body,
    )
    return {
        "trigger": ONBOARDING_TRIGGER,
        "onboarding_status": onboarding_status,
        "profile": profile,
        "provider_connections": provider_connections,
    }
