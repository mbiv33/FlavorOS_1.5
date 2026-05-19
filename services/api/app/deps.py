"""FastAPI dependencies — DB session, tenant header, JWT user, adapters."""

from __future__ import annotations

import uuid
from typing import Annotated, Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters import (
    ComposioAdapter,
    GBrainAdapter,
    LocalFileGBrainAdapter,
    OrchestratorAdapter,
    StubComposioAdapter,
    StubGBrainAdapter,
    StubOrchestratorAdapter,
)
from app.config import Settings, get_settings
from app.database import get_session
from app.models import Tenant, User
from app.schemas import TokenPayload

security = HTTPBearer(auto_error=False)


def get_db() -> Session:
    yield from get_session()


def get_tenant_from_header(
    db: Annotated[Session, Depends(get_db)],
    x_client_id: Annotated[Optional[str], Header(alias="X-Client-ID")] = None,
) -> Tenant:
    if not x_client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Client-ID header",
        )
    tenant: Optional[Tenant] = None
    try:
        tid = uuid.UUID(x_client_id)
        tenant = db.execute(select(Tenant).where(Tenant.id == tid)).scalar_one_or_none()
    except ValueError:
        tenant = db.execute(select(Tenant).where(Tenant.slug == x_client_id)).scalar_one_or_none()

    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown tenant",
        )

    return tenant


def decode_token(token: str, settings: Settings) -> TokenPayload:
    try:
        data = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenPayload(
            sub=uuid.UUID(data["sub"]),
            tenant_id=uuid.UUID(data["tenant_id"]),
            tenant_slug=data["tenant_slug"],
            role=data["role"],
        )
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def get_current_user(
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_token(creds.credentials, settings)
    user = db.execute(select(User).where(User.id == payload.sub)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.tenant_id != payload.tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token mismatch")
    return user


def require_tenant_match(
    tenant: Annotated[Tenant, Depends(get_tenant_from_header)],
    user: Annotated[User, Depends(get_current_user)],
) -> tuple[Tenant, User]:
    if user.tenant_id != tenant.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="X-Client-ID does not match authenticated tenant",
        )
    return tenant, user


# ---------------------------------------------------------------------------
# Adapter singletons (swap to real implementations via app.dependency_overrides)
# ---------------------------------------------------------------------------

_composio: ComposioAdapter = StubComposioAdapter()
_gbrain_stub: GBrainAdapter = StubGBrainAdapter()
_gbrain_file_cache: dict[str, GBrainAdapter] = {}
_orchestrator: OrchestratorAdapter = StubOrchestratorAdapter()


def get_composio() -> ComposioAdapter:
    return _composio


def get_gbrain(settings: Annotated[Settings, Depends(get_settings)]) -> GBrainAdapter:
    if settings.gbrain_adapter == "local_file":
        if settings.gbrain_store_dir not in _gbrain_file_cache:
            _gbrain_file_cache[settings.gbrain_store_dir] = LocalFileGBrainAdapter(
                settings.gbrain_store_dir
            )
        return _gbrain_file_cache[settings.gbrain_store_dir]
    return _gbrain_stub


def get_orchestrator() -> OrchestratorAdapter:
    return _orchestrator
