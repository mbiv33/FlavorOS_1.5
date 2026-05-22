"""Invite-only registration flow (Lane Q / TODO-3)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import InviteToken, Profile, Tenant, User

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture()
def admin_user(db: Session, tenant_a: Tenant) -> User:
    u = User(
        id=uuid.uuid4(),
        email="admin@a.com",
        hashed_password=_pwd.hash("adminpass"),
        tenant_id=tenant_a.id,
        role="developer_admin",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture()
def auth_headers_admin(admin_user: User, tenant_a: Tenant) -> dict[str, str]:
    from tests.conftest import _make_token

    token = _make_token(admin_user, tenant_a)
    return {"Authorization": f"Bearer {token}"}


def _create_join_invite(client, tenant_slug: str, email: str = "newuser@example.com"):
    return client.post(
        "/auth/invites",
        json={
            "email": email,
            "role": "client",
            "tenant_slug": tenant_slug,
        },
    )


def test_create_invite_dev_no_auth(client, tenant_a: Tenant):
    resp = _create_join_invite(client, tenant_a.slug)
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "newuser@example.com"
    assert body["mode"] == "join_tenant"
    assert body["tenant_slug"] == tenant_a.slug
    assert len(body["token"]) >= 16


def test_create_invite_requires_admin_in_production(client, tenant_a: Tenant, settings: Settings):
    settings.api_env = "production"
    resp = _create_join_invite(client, tenant_a.slug)
    assert resp.status_code == 401


def test_create_invite_with_admin(client, tenant_a: Tenant, auth_headers_admin: dict):
    resp = client.post(
        "/auth/invites",
        headers=auth_headers_admin,
        json={
            "email": "invited@a.com",
            "role": "client",
            "tenant_slug": tenant_a.slug,
        },
    )
    assert resp.status_code == 201


def test_create_invite_rejects_client_role(client, tenant_a: Tenant, auth_headers_a: dict):
    resp = client.post(
        "/auth/invites",
        headers=auth_headers_a,
        json={
            "email": "nope@a.com",
            "role": "client",
            "tenant_slug": tenant_a.slug,
        },
    )
    assert resp.status_code == 403


def test_create_invite_new_tenant(client):
    resp = client.post(
        "/auth/invites",
        json={
            "email": "founder@startup.com",
            "role": "client",
            "new_tenant_slug": "startup-co",
            "new_tenant_name": "Startup Co",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["mode"] == "new_tenant"
    assert body["tenant_slug"] == "startup-co"
    assert body["tenant_name"] == "Startup Co"


def test_create_invite_mutually_exclusive_fields(client, tenant_a: Tenant):
    resp = client.post(
        "/auth/invites",
        json={
            "email": "bad@example.com",
            "tenant_slug": tenant_a.slug,
            "new_tenant_slug": "other",
            "new_tenant_name": "Other",
        },
    )
    assert resp.status_code == 422


def test_validate_invite(client, tenant_a: Tenant):
    create = _create_join_invite(client, tenant_a.slug, "validate@example.com")
    token = create.json()["token"]
    resp = client.get(f"/auth/invites/{token}/validate")
    assert resp.status_code == 200
    body = resp.json()
    assert body["valid"] is True
    assert body["email"] == "validate@example.com"
    assert body["mode"] == "join_tenant"


def test_validate_invalid_token(client):
    resp = client.get("/auth/invites/not-a-real-token/validate")
    assert resp.status_code == 404


def test_register_join_tenant(client, db: Session, tenant_a: Tenant):
    create = _create_join_invite(client, tenant_a.slug, "joiner@example.com")
    token = create.json()["token"]
    resp = client.post(
        "/auth/register",
        json={"token": token, "password": "securepass1", "display_name": "Joiner"},
    )
    assert resp.status_code == 201
    assert "access_token" in resp.json()

    user = db.execute(
        select(User).where(User.tenant_id == tenant_a.id, User.email == "joiner@example.com")
    ).scalar_one()
    assert user.role == "client"
    profile = db.execute(select(Profile).where(Profile.user_id == user.id)).scalar_one()
    assert profile.display_name == "Joiner"

    me = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {resp.json()['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "joiner@example.com"


def test_register_new_tenant(client, db: Session):
    create = client.post(
        "/auth/invites",
        json={
            "email": "owner@newco.com",
            "new_tenant_slug": "new-co",
            "new_tenant_name": "New Co",
        },
    )
    token = create.json()["token"]
    resp = client.post(
        "/auth/register",
        json={"token": token, "password": "securepass1"},
    )
    assert resp.status_code == 201

    tenant = db.execute(select(Tenant).where(Tenant.slug == "new-co")).scalar_one()
    user = db.execute(
        select(User).where(User.tenant_id == tenant.id, User.email == "owner@newco.com")
    ).scalar_one()
    assert user.tenant_id == tenant.id
    profile = db.execute(select(Profile).where(Profile.user_id == user.id)).scalar_one()
    assert profile.display_name == "owner"


def test_register_single_use(client, tenant_a: Tenant):
    create = _create_join_invite(client, tenant_a.slug, "once@example.com")
    token = create.json()["token"]
    first = client.post(
        "/auth/register",
        json={"token": token, "password": "securepass1"},
    )
    assert first.status_code == 201
    second = client.post(
        "/auth/register",
        json={"token": token, "password": "securepass1"},
    )
    assert second.status_code == 410


def test_register_duplicate_user(client, tenant_a: Tenant, user_a: User):
    create = _create_join_invite(client, tenant_a.slug, user_a.email)
    token = create.json()["token"]
    resp = client.post(
        "/auth/register",
        json={"token": token, "password": "securepass1"},
    )
    assert resp.status_code == 409


def test_expired_invite_rejected(client, db: Session, tenant_a: Tenant):
    from app.routers.auth import _hash_invite_token

    raw = "expired-test-token-value"
    invite = InviteToken(
        id=uuid.uuid4(),
        token_hash=_hash_invite_token(raw),
        email="expired@example.com",
        role="client",
        tenant_id=tenant_a.id,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    db.add(invite)
    db.commit()

    assert client.get(f"/auth/invites/{raw}/validate").status_code == 410
    assert (
        client.post(
            "/auth/register",
            json={"token": raw, "password": "securepass1"},
        ).status_code
        == 410
    )


def test_login_after_register(client, tenant_a: Tenant):
    create = _create_join_invite(client, tenant_a.slug, "loginme@example.com")
    token = create.json()["token"]
    client.post(
        "/auth/register",
        json={"token": token, "password": "mypassword1"},
    )
    login = client.post(
        "/auth/login",
        json={
            "tenant_slug": tenant_a.slug,
            "email": "loginme@example.com",
            "password": "mypassword1",
        },
    )
    assert login.status_code == 200
    assert "access_token" in login.json()
