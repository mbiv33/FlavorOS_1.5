"""Development seed for tenants, users, and empty profiles."""

from __future__ import annotations

import uuid

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Profile, Tenant, User

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
_settings = get_settings()


def _hash(password: str) -> str:
    return _pwd.hash(password)


def seed_if_empty(db: Session) -> None:
    if db.execute(select(Tenant).limit(1)).scalar_one_or_none():
        return

    demo_id = uuid.uuid4()
    acme_id = uuid.uuid4()
    tenants = [
        Tenant(id=demo_id, slug="demo", name="Demo Client"),
        Tenant(id=acme_id, slug="acme", name="Acme Corp"),
    ]
    db.add_all(tenants)
    db.flush()

    client_user = User(
        id=uuid.uuid4(),
        tenant_id=demo_id,
        email="client@demo.local",
        role="client",
        hashed_password=_hash(_settings.dev_client_password),
    )
    admin_user = User(
        id=uuid.uuid4(),
        tenant_id=demo_id,
        email="admin@demo.local",
        role="developer_admin",
        hashed_password=_hash(_settings.dev_admin_password),
    )
    db.add_all([client_user, admin_user])
    db.flush()

    db.add(
        Profile(
            client_id=demo_id,
            user_id=client_user.id,
            display_name="Demo Client User",
            timezone="UTC",
            preferences={},
        )
    )
    db.add(
        Profile(
            client_id=demo_id,
            user_id=admin_user.id,
            display_name="Demo Admin",
            timezone="UTC",
            preferences={},
        )
    )
    db.commit()
