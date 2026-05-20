"""Client Context router — manages personal/professional/business context instances."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db, require_tenant_match
from app.models import ClientContext, Tenant, User
from app.onboarding import providers_for_context
from app.schemas import ClientContextCreate, ClientContextRead, ProviderCatalogItem

router = APIRouter(prefix="/contexts", tags=["contexts"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]

_SINGLETON_TYPES = {"personal", "professional"}  # max 1 per client


@router.get("", response_model=list[ClientContextRead])
def list_contexts(tu: TenantUser, db: DB):
    tenant, _ = tu
    return (
        db.execute(
            select(ClientContext)
            .where(ClientContext.client_id == tenant.id)
            .order_by(ClientContext.type, ClientContext.name)
        )
        .scalars()
        .all()
    )


@router.post("", response_model=ClientContextRead, status_code=status.HTTP_201_CREATED)
def create_context(body: ClientContextCreate, tu: TenantUser, db: DB):
    tenant, _ = tu
    if body.type in _SINGLETON_TYPES:
        existing = db.execute(
            select(ClientContext).where(
                ClientContext.client_id == tenant.id,
                ClientContext.type == body.type,
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A {body.type} context already exists for this client.",
            )
    ctx = ClientContext(client_id=tenant.id, type=body.type, name=body.name)
    db.add(ctx)
    db.commit()
    db.refresh(ctx)
    return ctx


@router.get(
    "/{context_id}/providers",
    response_model=list[ProviderCatalogItem],
)
def list_providers_for_context(context_id: UUID, tu: TenantUser, db: DB):
    """Return the provider catalog available for a specific client context.

    The returned list is filtered by the context's type
    (personal / professional / business) so the onboarding UI knows which
    providers to offer.
    """
    tenant, _ = tu
    ctx = db.execute(
        select(ClientContext).where(
            ClientContext.id == context_id,
            ClientContext.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if ctx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Context not found.")
    return providers_for_context(ctx.type)
