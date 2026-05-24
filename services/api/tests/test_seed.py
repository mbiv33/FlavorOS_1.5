"""Demo seed password sync (local/cloud credential alignment)."""

from __future__ import annotations

import uuid

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import Tenant, User
from app.seed import DEMO_CLIENT_EMAIL, DEMO_TENANT_SLUG, sync_dev_demo_passwords

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def test_sync_dev_demo_passwords_updates_stale_hash(db: Session, monkeypatch) -> None:
    tenant = Tenant(id=uuid.uuid4(), slug=DEMO_TENANT_SLUG, name="Demo")
    db.add(tenant)
    db.flush()
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=DEMO_CLIENT_EMAIL,
        role="client",
        hashed_password=_pwd.hash("old-wrong-password"),
    )
    db.add(user)
    db.commit()

    monkeypatch.setattr(
        "app.seed.get_settings",
        lambda: Settings(
            database_url="sqlite://",
            dev_client_password="devclient",
            dev_admin_password="devadmin",
        ),
    )

    assert sync_dev_demo_passwords(db) is True
    db.refresh(user)
    assert _pwd.verify("devclient", user.hashed_password)


def test_sync_dev_demo_passwords_noop_when_hash_matches(db: Session, monkeypatch) -> None:
    tenant = Tenant(id=uuid.uuid4(), slug=DEMO_TENANT_SLUG, name="Demo")
    db.add(tenant)
    db.flush()
    good_hash = _pwd.hash("devclient")
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=DEMO_CLIENT_EMAIL,
        role="client",
        hashed_password=good_hash,
    )
    db.add(user)
    db.commit()

    monkeypatch.setattr(
        "app.seed.get_settings",
        lambda: Settings(
            database_url="sqlite://",
            dev_client_password="devclient",
            dev_admin_password="devadmin",
        ),
    )

    assert sync_dev_demo_passwords(db) is False
    db.refresh(user)
    assert user.hashed_password == good_hash
