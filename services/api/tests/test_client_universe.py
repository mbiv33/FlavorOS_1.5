"""Client Universe envelope and registry tests."""

import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ClientContext, ClientUniverseEntry, ProviderConnection
from app.universe_registry import DEPRECATED_KV_CATEGORIES, KV_CATEGORIES, validate_kv_category


def test_kv_registry_excludes_context_categories():
    assert "context" not in KV_CATEGORIES
    assert "context_account" not in KV_CATEGORIES
    assert "context" in DEPRECATED_KV_CATEGORIES


def test_deprecated_category_rejected():
    try:
        validate_kv_category("context")
        assert False, "expected ValueError"
    except ValueError as exc:
        assert "deprecated" in str(exc).lower()


def test_universe_envelope_after_onboarding(
    client: TestClient,
    auth_headers_a: dict,
    db: Session,
):
    payload = {
        "identity": {
            "display_name": "Envelope Test",
            "timezone": "America/New_York",
            "locale": "en-US",
        },
        "authority_defaults": {"outbound_comms": "draft_only"},
        "onboarding": {"status": "pending"},
        "contexts": [
            {
                "context_id": str(uuid.uuid4()),
                "context_type": "business",
                "display_name": "Business",
                "status": "active",
                "context_accounts": [
                    {
                        "context_account_id": "biz_gmail",
                        "provider": "gmail",
                        "context_account_purpose": "email",
                        "account_alias": "biz_email",
                        "auth_scheme": "oauth",
                    }
                ],
            }
        ],
    }
    save = client.post("/onboarding/save", json=payload, headers=auth_headers_a)
    assert save.status_code == 200

    contexts = db.execute(select(ClientContext)).scalars().all()
    assert len(contexts) == 1
    conns = db.execute(select(ProviderConnection)).scalars().all()
    assert len(conns) == 1
    assert conns[0].client_context_id == contexts[0].id

    entries = db.execute(select(ClientUniverseEntry)).scalars().all()
    categories = {e.category for e in entries}
    assert not categories & DEPRECATED_KV_CATEGORIES
    assert "authority_defaults" in categories
    assert "onboarding" in categories

    env = client.get("/universe/envelope", headers=auth_headers_a)
    assert env.status_code == 200
    body = env.json()
    assert len(body["contexts"]) == 1
    assert body["contexts"][0]["provider_connections"][0]["client_context_id"] == str(
        contexts[0].id
    )
    assert body["authority"] is not None

    ready = client.get("/universe/readiness", headers=auth_headers_a)
    assert ready.status_code == 200
    assert ready.json()["flags"]["has_contexts"] is True
