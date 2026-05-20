"""Composio onboarding workflow tests."""

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.gbrain import IngestResult, SigmaResult
from app.deps import get_gbrain
from app.models import AgentTask, Artifact, AuditEvent, ClientContext, ClientUniverseEntry, ProviderConnection, WorkflowRun
from app.universe_registry import DEPRECATED_KV_CATEGORIES


class RecordingGBrain:
    def __init__(self):
        self.ingests = []
        self.sigmas = []

    async def ingest(self, client_id, category, content, metadata=None):
        self.ingests.append(
            {
                "client_id": client_id,
                "category": category,
                "content": content,
                "metadata": metadata or {},
            }
        )
        return IngestResult(accepted=True, record_id="ingest_1")

    async def retrieve(self, client_id, query, top_k=5, filters=None):
        return []

    async def build_context(self, client_id, query, token_budget=4000, filters=None):
        raise NotImplementedError

    async def store_sigma(self, client_id, sigma_type, payload):
        self.sigmas.append(
            {
                "client_id": client_id,
                "sigma_type": sigma_type,
                "payload": payload,
            }
        )
        return SigmaResult(success=True, sigma_id="sigma_1")


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
    # composio_user_id is set lazily on connect-link creation (conn:{id}), not at planning.
    assert providers["gmail"]["composio_user_id"] is None
    assert providers["googlecalendar"]["toolkit"] == "googlecalendar"

    saved = db.execute(select(ProviderConnection)).scalars().all()
    assert len(saved) == 2
    contexts = db.execute(select(ClientContext)).scalars().all()
    assert len(contexts) == 1
    for conn in saved:
        assert conn.client_context_id == contexts[0].id

    universe = db.execute(select(ClientUniverseEntry)).scalars().all()
    assert not {e.category for e in universe} & DEPRECATED_KV_CATEGORIES

    workflows = db.execute(select(WorkflowRun)).scalars().all()
    workflow_types = {run.workflow_type for run in workflows}
    assert {"client_onboarding", "morning_standup_seed", "travel_research_seed"}.issubset(
        workflow_types
    )

    tasks = db.execute(select(AgentTask)).scalars().all()
    assert {task.agent for task in tasks} >= {"khadijah", "regine"}
    assert all(str(tenant_id := tasks[0].client_id) == str(task.client_id) for task in tasks)

    sigma = db.execute(select(Artifact).where(Artifact.kind == "sigma")).scalar_one()
    assert sigma.meta["sigma_type"] == "client_onboarding_readiness"
    assert sigma.client_id == tenant_id


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
    assert sync.json()["provider_event_id"]
    assert sync.json()["workflow_run_id"]


def test_onboarding_calls_gbrain_with_tenant_scope(
    client: TestClient,
    auth_headers_a: dict,
):
    recorder = RecordingGBrain()
    client.app.dependency_overrides[get_gbrain] = lambda: recorder

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

    assert resp.status_code == 200
    assert len(recorder.ingests) == 1
    assert recorder.ingests[0]["category"] == "onboarding"
    assert len(recorder.sigmas) == 1
    assert recorder.sigmas[0]["sigma_type"] == "client_onboarding_readiness"
