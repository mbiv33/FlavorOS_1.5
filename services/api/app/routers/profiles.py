"""Tenant-scoped profile endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import Profile, Tenant, User
from app.schemas import ProfileRead, ProfileWrite

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileRead)
def read_me(
    ctx: Annotated[tuple[Tenant, User], Depends(require_tenant_match)],
    db: Annotated[Session, Depends(get_db)],
) -> Profile:
    _tenant, user = ctx
    profile = db.execute(select(Profile).where(Profile.user_id == user.id)).scalar_one_or_none()
    if profile is None:
        profile = Profile(
            client_id=user.tenant_id,
            user_id=user.id,
            display_name=user.email.split("@")[0],
            timezone=None,
            preferences={},
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.patch("/me", response_model=ProfileRead)
def update_me(
    body: ProfileWrite,
    ctx: Annotated[tuple[Tenant, User], Depends(require_tenant_match)],
    db: Annotated[Session, Depends(get_db)],
) -> Profile:
    _tenant, user = ctx
    profile = db.execute(select(Profile).where(Profile.user_id == user.id)).scalar_one_or_none()
    if profile is None:
        profile = Profile(
            client_id=user.tenant_id,
            user_id=user.id,
            display_name=body.display_name,
            timezone=body.timezone,
            preferences=body.preferences or {},
        )
        db.add(profile)
    else:
        profile.display_name = body.display_name
        profile.timezone = body.timezone
        if body.preferences is not None:
            profile.preferences = body.preferences
        profile.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(profile)
    return profile
