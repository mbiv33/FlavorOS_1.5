"""Client Universe envelope and KV materialization tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.gbrain import LocalFileGBrainAdapter
from app.agent_context import assemble_agent_context
from app.models import ClientContext, ClientUniverseEntry, Profile, ProviderConnection, User
from app.universe_registry import DEPRECATED_KV_CATEGORIES


def test_materialize_onboarding_kv_categories(
    client: TestClient,
    auth_headers_a: dict,
    db: Session,
):
    resp = client.post(
        "/onboarding/save",
        json={
            "identity": {
                "display_name": "Test User",
                "timezone": "America/New_York",
            },
            "authority_defaults": {"outbound_comms": "draft_only"},
            "onboarding": {"status": "pending"},
            "contexts": [
                {
                    "context_id": "business",
                    "context_type": "business",
                    "display_name": "Business",
                    "status": "active",
                    "context_accounts": [
                        {
                            "context_account_id": "biz_gmail",
                            "provider": "gmail",
                            "context_account_purpose": "email",
                            "account_alias": "biz",
                            "auth_scheme": "oauth",
                        }
                    ],
                }
            ],
        },
        headers=auth_headers_a,
    )
    assert resp.status_code == 200

    entries = db.execute(select(ClientUniverseEntry)).scalars().all()
    categories = {e.category for e in entries}
    assert "authority_defaults" in categories
    assert "onboarding" in categories
    assert "readiness" in categories
    assert not categories.intersection(DEPRECATED_KV_CATEGORIES)

    contexts = db.execute(select(ClientContext)).scalars().all()
    assert len(contexts) >= 1
    conns = db.execute(select(ProviderConnection)).scalars().all()
    assert len(conns) == 1
    assert conns[0].client_context_id is not None


def _minimal_onboarding_payload(*, display_name: str = "Envelope Test") -> dict:
    return {
        "identity": {"display_name": display_name, "timezone": "UTC"},
        "authority_defaults": {},
        "onboarding": {"status": "pending"},
        "contexts": [
            {
                "context_id": "personal",
                "context_type": "personal",
                "display_name": "Personal",
                "status": "active",
                "context_accounts": [],
            }
        ],
    }


def test_get_envelope_and_readiness(client: TestClient, auth_headers_a: dict, db: Session):
    save_resp = client.post(
        "/onboarding/save",
        json=_minimal_onboarding_payload(),
        headers=auth_headers_a,
    )
    assert save_resp.status_code == 200

    env_resp = client.get("/universe/envelope", headers=auth_headers_a)
    assert env_resp.status_code == 200
    body = env_resp.json()
    assert body["profile"] is not None
    assert "onboarding" in body

    ready_resp = client.get("/universe/readiness", headers=auth_headers_a)
    assert ready_resp.status_code == 200
    ready = ready_resp.json()
    assert ready["client_id"]
    assert "flags" in ready


def test_readiness_prefers_client_profile_when_tenant_has_admin_profile(
    client: TestClient,
    auth_headers_a: dict,
    db: Session,
    tenant_a,
):
    save_resp = client.post(
        "/onboarding/save",
        json=_minimal_onboarding_payload(display_name="Client Profile"),
        headers=auth_headers_a,
    )
    assert save_resp.status_code == 200

    admin_user = User(
        email="admin@a.com",
        hashed_password="unused",
        tenant_id=tenant_a.id,
        role="developer_admin",
    )
    db.add(admin_user)
    db.flush()
    db.add(
        Profile(
            client_id=tenant_a.id,
            user_id=admin_user.id,
            display_name="Admin Profile",
            timezone="UTC",
            preferences={},
        )
    )
    db.commit()

    # Regression: ISSUE-001 — duplicate tenant profiles crashed /universe/readiness.
    # Found by /qa on 2026-05-21.
    # Report: .gstack/qa-reports/qa-report-localhost-2026-05-21.md
    ready_resp = client.get("/universe/readiness", headers=auth_headers_a)
    assert ready_resp.status_code == 200

    env_resp = client.get("/universe/envelope", headers=auth_headers_a)
    assert env_resp.status_code == 200
    assert env_resp.json()["profile"]["display_name"] == "Client Profile"


def test_export_yaml_slices(client: TestClient, auth_headers_a: dict, db: Session):
    save_resp = client.post(
        "/onboarding/save",
        json={
            **_minimal_onboarding_payload(display_name="Export Test"),
            "authority_defaults": {"calendar_commits": "approval_required"},
            "onboarding": {"status": "ready_for_auth"},
        },
        headers=auth_headers_a,
    )
    assert save_resp.status_code == 200
    export_resp = client.get("/universe/export-yaml", headers=auth_headers_a)
    assert export_resp.status_code == 200
    slices = export_resp.json()
    assert "profile.yaml" in slices
    assert "onboarding_status.yaml" in slices


@pytest.mark.asyncio
async def test_assemble_agent_context_merges_envelope_and_gbrain(
    client: TestClient, auth_headers_a: dict, db: Session, tenant_a, tmp_path
):
    client.post(
        "/onboarding/save",
        json=_minimal_onboarding_payload(display_name="Agent Context Test"),
        headers=auth_headers_a,
    )
    gbrain = LocalFileGBrainAdapter(str(tmp_path))
    await gbrain.ingest(
        tenant_a.id,
        category="onboarding",
        content="Marcus onboarding summary",
        metadata={"source": "test"},
    )
    packet = await assemble_agent_context(
        db,
        client_id=tenant_a.id,
        query="onboarding",
        gbrain=gbrain,
    )
    assert packet["envelope"]["profile"]["display_name"] == "Agent Context Test"
    assert packet["gbrain"]["hits"]
