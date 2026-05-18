"""Composio onboarding workflow tests."""

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ProviderConnection


def _payload(accounts):
    return {
        "identity": {
            "display_name": "Marcus Bivines",
            "timezone": "America/New_York",
            "locale": "en-US",
        },
        "authority_defaults": {
            "outbound_comms": "draft_only",
            "calendar_commits": "approval_required",
        },
        "onboarding": {"status": "pending"},
        "contexts": [
            {
                "context_id": "business",
                "context_type": "business",
                "display_name": "Business",
                "status": "active",
                "context_accounts": accounts,
            }
        ],
    }


def test_onboarding_save_plans_oauth_provider_connections(
    client: TestClient,
    auth_headers_a: dict,
    db: Session,
):
    resp = client.post(
        "/onboarding/save",
        json=_payload(
            [
                {
                    "context_account_id": "business_gmail",
                    "provider": "gmail",
                    "context_account_purpose": "email",
                    "account_alias": "business_email",
                    "auth_scheme": "oauth",
                    "external_identifier": "marcus@example.com",
                },
                {
                    "context_account_id": "business_calendar",
                    "provider": "google_calendar",
                    "context_account_purpose": "calendar",
                    "account_alias": "business_calendar",
                    "auth_scheme": "oauth",
                },
            ]
        ),
        headers=auth_headers_a,
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["trigger"] == "client_onboarding.profile_saved"
    assert body["onboarding_status"] == "ready_for_auth"
    assert len(body["provider_connections"]) == 2

    providers = {conn["provider"]: conn for conn in body["provider_connections"]}
    assert providers["gmail"]["status"] == "not_started"
    assert providers["gmail"]["toolkit"] == "gmail"
    assert providers["gmail"]["context_account_id"] == "business_gmail"
    assert providers["gmail"]["composio_user_id"].startswith("tenant:")
    assert providers["googlecalendar"]["toolkit"] == "googlecalendar"

    saved = db.execute(select(ProviderConnection)).scalars().all()
    assert len(saved) == 2


def test_onboarding_save_without_oauth_does_not_plan_composio(
    client: TestClient,
    auth_headers_a: dict,
):
    resp = client.post(
        "/onboarding/save",
        json=_payload(
            [
                {
                    "context_account_id": "manual_notes",
                    "provider": "notion",
                    "context_account_purpose": "knowledge_base",
                    "account_alias": "manual_notes",
                    "auth_scheme": "manual",
                }
            ]
        ),
        headers=auth_headers_a,
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["onboarding_status"] == "pending"
    assert body["provider_connections"] == []


def test_onboarding_save_is_idempotent_for_context_accounts(
    client: TestClient,
    auth_headers_a: dict,
    db: Session,
):
    payload = _payload(
        [
            {
                "context_account_id": "business_gmail",
                "provider": "gmail",
                "context_account_purpose": "email",
                "account_alias": "business_email",
                "auth_scheme": "oauth",
            }
        ]
    )

    first = client.post("/onboarding/save", json=payload, headers=auth_headers_a)
    second = client.post("/onboarding/save", json=payload, headers=auth_headers_a)

    assert first.status_code == 200
    assert second.status_code == 200
    saved = db.execute(select(ProviderConnection)).scalars().all()
    assert len(saved) == 1


def test_connect_link_and_callback_are_tenant_scoped(
    client: TestClient,
    auth_headers_a: dict,
    auth_headers_b: dict,
):
    resp = client.post(
        "/onboarding/save",
        json=_payload(
            [
                {
                    "context_account_id": "business_gmail",
                    "provider": "gmail",
                    "context_account_purpose": "email",
                    "account_alias": "business_email",
                    "auth_scheme": "oauth",
                }
            ]
        ),
        headers=auth_headers_a,
    )
    provider_connection_id = resp.json()["provider_connections"][0]["id"]

    blocked = client.post(
        "/providers/gmail/connect-link",
        json={
            "provider_connection_id": provider_connection_id,
            "redirect_uri": "http://localhost:3000/onboarding",
        },
        headers=auth_headers_b,
    )
    assert blocked.status_code == 404

    link = client.post(
        "/providers/gmail/connect-link",
        json={
            "provider_connection_id": provider_connection_id,
            "redirect_uri": "http://localhost:3000/onboarding",
        },
        headers=auth_headers_a,
    )
    assert link.status_code == 200
    assert "stub=true" in link.json()["url"]
    assert link.json()["status"] == "pending_consent"

    callback = client.get(
        "/providers/callback",
        params={
            "provider_connection_id": provider_connection_id,
            "status": "ACTIVE",
            "connected_account_id": "ca_123",
        },
        headers=auth_headers_a,
    )
    assert callback.status_code == 200
    assert callback.json()["status"] == "connected"
    assert callback.json()["connected_account_id"] == "ca_123"

    sync = client.post(
        "/providers/gmail/sync",
        json={"provider_connection_id": provider_connection_id},
        headers=auth_headers_a,
    )
    assert sync.status_code == 200
    assert sync.json()["status"] == "ready"
