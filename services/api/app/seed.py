"""Development seed for tenants, users, and empty profiles."""

from __future__ import annotations

import uuid

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Approval, Artifact, Profile, ProviderConnection, Tenant, User
from app.workflows.calendar_outbound import CALENDAR_SEND_GOVERNED_ACTION
from app.workflows.communications_outbound import COMMUNICATIONS_SEND_GOVERNED_ACTION

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_TENANT_SLUG = "demo"
DEMO_CLIENT_EMAIL = "client@demo.local"
DEMO_ADMIN_EMAIL = "admin@demo.local"


def _hash(password: str) -> str:
    return _pwd.hash(password)


def sync_dev_demo_passwords(db: Session) -> bool:
    """Re-hash demo login users from current Settings (idempotent).

    seed_if_empty only runs on an empty database; existing VPS/cloud DBs may
    have stale bcrypt hashes from an old DEV_*_PASSWORD. This keeps login UI
    credentials (tenant demo, devclient/devadmin) aligned with config on every
    API startup.
    """
    settings = get_settings()
    tenant = db.execute(
        select(Tenant).where(Tenant.slug == DEMO_TENANT_SLUG)
    ).scalar_one_or_none()
    if tenant is None:
        return False

    updated = False
    for email, plain in (
        (DEMO_CLIENT_EMAIL, settings.dev_client_password),
        (DEMO_ADMIN_EMAIL, settings.dev_admin_password),
    ):
        user = db.execute(
            select(User).where(User.tenant_id == tenant.id, User.email == email)
        ).scalar_one_or_none()
        if user is None:
            continue
        if _pwd.verify(plain, user.hashed_password):
            continue
        user.hashed_password = _hash(plain)
        updated = True

    if updated:
        db.commit()
    return updated


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
        hashed_password=_hash(get_settings().dev_client_password),
    )
    admin_user = User(
        id=uuid.uuid4(),
        tenant_id=demo_id,
        email="admin@demo.local",
        role="developer_admin",
        hashed_password=_hash(get_settings().dev_admin_password),
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

    gcal = ProviderConnection(
        client_id=demo_id,
        provider="googlecalendar",
        context_account_id="demo-gcal-primary",
        status="connected",
        enabled=True,
        composio_user_id="demo-composio-user",
    )
    db.add(gcal)
    db.flush()

    hold = Artifact(
        client_id=demo_id,
        kind="client",
        title="Investor sync hold",
        body="Placeholder hold for investor sync — approve to create calendar event.",
        meta={
            "artifact_type": "calendar_hold",
            "channel": "calendar",
            "start": "2026-06-01T15:00:00Z",
            "end": "2026-06-01T16:00:00Z",
            "location": "Zoom",
        },
        status="ready",
    )
    db.add(hold)
    db.flush()

    db.add(
        Approval(
            client_id=demo_id,
            artifact_id=hold.id,
            governed_action=CALENDAR_SEND_GOVERNED_ACTION,
            reason="Review and approve placing this calendar hold.",
            decision="pending",
        )
    )
    db.commit()
