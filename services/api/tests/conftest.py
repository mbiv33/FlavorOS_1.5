"""Shared fixtures for API tests.

Uses an in-memory SQLite database so tests run without Postgres.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.adapters.gmail_outbound import StubGmailOutboundAdapter, set_gmail_outbound_adapter
from app.config import Settings
from app.database import Base
from app.deps import get_db, get_settings
from app.main import create_app
import app.models  # noqa: F401 — ensure all models are registered with Base
from app.models import Tenant, User

TEST_ENGINE = create_engine(
    "sqlite://",
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(TEST_ENGINE, "connect")
def _set_sqlite_pragma(dbapi_conn, _connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestSession = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def stub_gmail_outbound_adapter() -> Generator[None, None, None]:
    """Tests always use stub send; ignore COMPOSIO_API_KEY from the host env."""
    set_gmail_outbound_adapter(StubGmailOutboundAdapter())
    yield
    set_gmail_outbound_adapter(StubGmailOutboundAdapter())


@pytest.fixture(autouse=True)
def db() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=TEST_ENGINE)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture()
def settings() -> Settings:
    return Settings(
        database_url="sqlite://",
        api_skip_startup_seed=True,
        jwt_secret="test-secret",
        composio_api_key="",
        anthropic_api_key="",
    )


@pytest.fixture()
def tenant_a(db: Session) -> Tenant:
    t = Tenant(id=uuid.uuid4(), name="Tenant A", slug="tenant-a")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@pytest.fixture()
def tenant_b(db: Session) -> Tenant:
    t = Tenant(id=uuid.uuid4(), name="Tenant B", slug="tenant-b")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@pytest.fixture()
def user_a(db: Session, tenant_a: Tenant) -> User:
    u = User(
        id=uuid.uuid4(),
        email="alice@a.com",
        hashed_password="unused",
        tenant_id=tenant_a.id,
        role="client",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture()
def user_b(db: Session, tenant_b: Tenant) -> User:
    u = User(
        id=uuid.uuid4(),
        email="bob@b.com",
        hashed_password="unused",
        tenant_id=tenant_b.id,
        role="client",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _make_token(user: User, tenant: Tenant, secret: str = "test-secret") -> str:
    return jwt.encode(
        {
            "sub": str(user.id),
            "tenant_id": str(tenant.id),
            "tenant_slug": tenant.slug,
            "role": user.role,
            "exp": datetime(2099, 1, 1, tzinfo=timezone.utc).timestamp(),
        },
        secret,
        algorithm="HS256",
    )


@pytest.fixture()
def client(db: Session, settings: Settings) -> TestClient:
    app = create_app()

    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_settings] = lambda: settings
    with TestClient(app) as test_client:
        # Lifespan may wire Composio when COMPOSIO_API_KEY is set in the shell env.
        set_gmail_outbound_adapter(StubGmailOutboundAdapter())
        yield test_client


@pytest.fixture()
def auth_headers_a(user_a: User, tenant_a: Tenant) -> dict[str, str]:
    token = _make_token(user_a, tenant_a)
    return {
        "Authorization": f"Bearer {token}",
        "X-Client-ID": tenant_a.slug,
    }


@pytest.fixture()
def auth_headers_b(user_b: User, tenant_b: Tenant) -> dict[str, str]:
    token = _make_token(user_b, tenant_b)
    return {
        "Authorization": f"Bearer {token}",
        "X-Client-ID": tenant_b.slug,
    }
