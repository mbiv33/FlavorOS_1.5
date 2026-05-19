"""Development seed for tenants, users, and empty profiles."""

from __future__ import annotations

import uuid

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Approval, Artifact, Profile, ProviderConnection, Tenant, User
from app.workflows.communications_outbound import COMMUNICATIONS_SEND_GOVERNED_ACTION

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

    gmail = ProviderConnection(
        client_id=demo_id,
        provider="gmail",
        context_account_id="demo-gmail-primary",
        status="connected",
        enabled=True,
        composio_user_id="demo-composio-user",
    )
    db.add(gmail)
    db.flush()

    draft = Artifact(
        client_id=demo_id,
        kind="client",
        title="Quarterly check-in draft",
        body="Hi — following up on our last conversation.",
        meta={
            "artifact_type": "draft_email",
            "channel": "email",
            "to": "client@example.com",
            "subject": "Quarterly check-in",
        },
        status="ready",
    )
    db.add(draft)
    db.flush()

    db.add(
        Approval(
            client_id=demo_id,
            artifact_id=draft.id,
            governed_action=COMMUNICATIONS_SEND_GOVERNED_ACTION,
            reason="Review and approve sending this email draft.",
            decision="pending",
        )
    )
    db.commit()
