"""JWT auth — login, current user, invite-only registration.

Invite design (TODO-3): we persist invites in ``invite_tokens`` rather than using
only a signed JWT because single-use enforcement and audit (who created / consumed
the invite) require server-side state. Opaque tokens are hashed at rest; expiry
and consumption are checked on every validate/register call.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.deps import decode_token, get_current_user, get_db, security
from app.models import InviteToken, Profile, Tenant, User
from app.schemas import (
    InviteCreateRequest,
    InviteCreateResponse,
    InviteValidateResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_INVITE_EXPIRE_HOURS = 168  # 7 days


def _create_token(user: User, tenant: Tenant, settings: Settings) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id),
        "tenant_slug": tenant.slug,
        "role": user.role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _hash_invite_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _invite_mode(invite: InviteToken) -> Literal["new_tenant", "join_tenant"]:
    return "join_tenant" if invite.tenant_id is not None else "new_tenant"


def _invite_tenant_slug(invite: InviteToken, tenant: Optional[Tenant]) -> Optional[str]:
    if tenant is not None:
        return tenant.slug
    return invite.new_tenant_slug


def _invite_tenant_name(invite: InviteToken, tenant: Optional[Tenant]) -> Optional[str]:
    if tenant is not None:
        return tenant.name
    return invite.new_tenant_name


def _load_invite_tenant(db: Session, invite: InviteToken) -> Optional[Tenant]:
    if invite.tenant_id is None:
        return None
    return db.execute(select(Tenant).where(Tenant.id == invite.tenant_id)).scalar_one_or_none()


def _get_active_invite(db: Session, raw_token: str) -> InviteToken:
    token_hash = _hash_invite_token(raw_token)
    invite = db.execute(
        select(InviteToken).where(InviteToken.token_hash == token_hash)
    ).scalar_one_or_none()
    if invite is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite token")
    now = datetime.now(timezone.utc)
    if invite.used_at is not None:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite already used")
    expires = invite.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires <= now:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite expired")
    return invite


def _require_invite_creator(
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[Session, Depends(get_db)],
) -> Optional[User]:
    """developer_admin JWT required in production; development allows unauthenticated create."""
    if creds is not None and creds.scheme.lower() == "bearer":
        payload = decode_token(creds.credentials, settings)
        user = db.execute(select(User).where(User.id == payload.sub)).scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        if user.role != "developer_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only developer_admin can create invites",
            )
        return user
    if settings.api_env == "development":
        return None
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenResponse:
    tenant = db.execute(select(Tenant).where(Tenant.slug == body.tenant_slug)).scalar_one_or_none()
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown tenant")

    user = db.execute(
        select(User).where(User.tenant_id == tenant.id, User.email == body.email)
    ).scalar_one_or_none()
    if user is None or not _pwd.verify(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = _create_token(user, tenant, settings)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserPublic)
def me(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserPublic:
    tenant = db.execute(select(Tenant).where(Tenant.id == user.tenant_id)).scalar_one()
    return UserPublic(
        id=user.id,
        email=user.email,
        tenant_id=user.tenant_id,
        tenant_slug=tenant.slug,
        role=user.role,
    )


@router.post("/invites", response_model=InviteCreateResponse, status_code=status.HTTP_201_CREATED)
def create_invite(
    body: InviteCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    creator: Annotated[Optional[User], Depends(_require_invite_creator)],
) -> InviteCreateResponse:
    join_slug = body.tenant_slug
    new_slug = body.new_tenant_slug
    new_name = body.new_tenant_name

    if join_slug and (new_slug or new_name):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide tenant_slug OR new_tenant_slug/new_tenant_name, not both",
        )
    if not join_slug and not (new_slug and new_name):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide tenant_slug to join an existing tenant, "
            "or new_tenant_slug and new_tenant_name for a new tenant",
        )

    tenant: Optional[Tenant] = None
    if join_slug:
        tenant = db.execute(select(Tenant).where(Tenant.slug == join_slug)).scalar_one_or_none()
        if tenant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown tenant")
    else:
        assert new_slug is not None
        existing = db.execute(select(Tenant).where(Tenant.slug == new_slug)).scalar_one_or_none()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tenant slug already taken",
            )

    hours = body.expires_in_hours or DEFAULT_INVITE_EXPIRE_HOURS
    expires_at = datetime.now(timezone.utc) + timedelta(hours=hours)
    raw_token = secrets.token_urlsafe(32)

    invite = InviteToken(
        id=uuid.uuid4(),
        token_hash=_hash_invite_token(raw_token),
        email=body.email,
        role=body.role,
        tenant_id=tenant.id if tenant else None,
        new_tenant_slug=new_slug if tenant is None else None,
        new_tenant_name=new_name if tenant is None else None,
        expires_at=expires_at,
        created_by_user_id=creator.id if creator else None,
    )
    db.add(invite)
    db.commit()

    mode = _invite_mode(invite)
    return InviteCreateResponse(
        token=raw_token,
        expires_at=expires_at,
        email=invite.email,
        role=invite.role,  # type: ignore[arg-type]
        mode=mode,
        tenant_slug=_invite_tenant_slug(invite, tenant),
        tenant_name=_invite_tenant_name(invite, tenant),
    )


@router.get("/invites/{token}/validate", response_model=InviteValidateResponse)
def validate_invite(
    token: str,
    db: Annotated[Session, Depends(get_db)],
) -> InviteValidateResponse:
    invite = _get_active_invite(db, token)
    tenant = _load_invite_tenant(db, invite)
    if invite.tenant_id is not None and tenant is None:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite tenant no longer exists")

    return InviteValidateResponse(
        valid=True,
        email=invite.email,
        role=invite.role,  # type: ignore[arg-type]
        mode=_invite_mode(invite),
        tenant_slug=_invite_tenant_slug(invite, tenant),
        tenant_name=_invite_tenant_name(invite, tenant),
        expires_at=invite.expires_at,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenResponse:
    invite = _get_active_invite(db, body.token)
    tenant = _load_invite_tenant(db, invite)

    if invite.tenant_id is not None:
        if tenant is None:
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite tenant no longer exists")
    else:
        assert invite.new_tenant_slug and invite.new_tenant_name
        taken = db.execute(
            select(Tenant).where(Tenant.slug == invite.new_tenant_slug)
        ).scalar_one_or_none()
        if taken is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tenant slug already taken",
            )
        tenant = Tenant(
            id=uuid.uuid4(),
            slug=invite.new_tenant_slug,
            name=invite.new_tenant_name,
        )
        db.add(tenant)
        db.flush()

    assert tenant is not None
    existing_user = db.execute(
        select(User).where(User.tenant_id == tenant.id, User.email == invite.email)
    ).scalar_one_or_none()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists for this tenant",
        )

    display_name = body.display_name or invite.email.split("@")[0]
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=invite.email,
        role=invite.role,
        hashed_password=_pwd.hash(body.password),
    )
    db.add(user)
    db.flush()

    db.add(
        Profile(
            client_id=tenant.id,
            user_id=user.id,
            display_name=display_name,
            timezone="UTC",
            preferences={},
        )
    )

    invite.used_at = datetime.now(timezone.utc)
    invite.used_by_user_id = user.id
    db.commit()
    db.refresh(user)

    access_token = _create_token(user, tenant, settings)
    return TokenResponse(access_token=access_token)
