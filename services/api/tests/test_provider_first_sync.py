"""Tests for the provider_first_sync workflow processor.

Covers:
- sync → process → artifact + approval created
- WorkflowRun moves queued → completed
- AgentTask reaches completed status
- Idempotency: calling processor twice on a completed run is a no-op
- process_run endpoint: 200 for known type, 422 for unknown type
- Per-item dedup: re-sync with same message_id skips existing ProviderEvents
- Connection-scoped entity_id: new connections use conn:{id}, not tenant:{id}:user:{id}
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.composio import ConnectLinkResult, SyncResult
from app.deps import get_composio
from app.models import (
    AgentTask,
    Approval,
    Artifact,
    NormalizedItem,
    ProviderConnection,
    ProviderEvent,
    Tenant,
    WorkflowRun,
)
from app.workflows.provider_first_sync import process_provider_first_sync

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_workflow_run(db: Session, tenant: Tenant, provider: str = "gmail") -> WorkflowRun:
    run = WorkflowRun(
        client_id=tenant.id,
        workflow_type="provider_first_sync",
        agent="sinclair",
        status="queued",
        input_data={
            "provider": provider,
            "provider_connection_id": str(uuid.uuid4()),
            "normalized_item_id": str(uuid.uuid4()),
        },
    )
    db.add(run)
    db.flush()
    db.add(
        AgentTask(
            client_id=tenant.id,
            workflow_run_id=run.id,
            agent="sinclair",
            task_type="provider_first_sync_review",
            status="queued",
            payload={},
        )
    )
    db.commit()
    db.refresh(run)
    return run


# ---------------------------------------------------------------------------
# Unit tests — processor called directly
# ---------------------------------------------------------------------------


def test_processor_creates_artifact(db: Session, tenant_a: Tenant):
    run = _make_workflow_run(db, tenant_a)
    process_provider_first_sync(db, run.id)

    artifacts = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalars().all()
    assert len(artifacts) == 1
    art = artifacts[0]
    assert art.kind == "report"
    assert art.title == "First inbox sweep"
    assert art.status == "ready"
    assert art.workflow_run_id == run.id
    assert art.created_by == "system:provider_first_sync"


def test_processor_creates_pending_approval(db: Session, tenant_a: Tenant):
    run = _make_workflow_run(db, tenant_a)
    process_provider_first_sync(db, run.id)

    approvals = db.execute(
        select(Approval).where(Approval.client_id == tenant_a.id)
    ).scalars().all()
    assert len(approvals) == 1
    appr = approvals[0]
    assert appr.decision == "pending"
    assert appr.governed_action == "provider_first_sync_review"
    assert appr.artifact_id is not None


def test_processor_approval_linked_to_artifact(db: Session, tenant_a: Tenant):
    run = _make_workflow_run(db, tenant_a)
    process_provider_first_sync(db, run.id)

    artifact = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalar_one()
    approval = db.execute(
        select(Approval).where(Approval.client_id == tenant_a.id)
    ).scalar_one()
    assert approval.artifact_id == artifact.id


def test_processor_completes_workflow_run(db: Session, tenant_a: Tenant):
    run = _make_workflow_run(db, tenant_a)
    process_provider_first_sync(db, run.id)

    db.refresh(run)
    assert run.status == "completed"
    assert run.completed_at is not None
    assert run.output_data is not None
    assert "artifact_id" in run.output_data


def test_processor_completes_agent_task(db: Session, tenant_a: Tenant):
    run = _make_workflow_run(db, tenant_a)
    process_provider_first_sync(db, run.id)

    task = db.execute(
        select(AgentTask).where(
            AgentTask.workflow_run_id == run.id,
            AgentTask.task_type == "provider_first_sync_review",
        )
    ).scalar_one()
    assert task.status == "completed"
    assert task.result is not None
    assert "artifact_id" in task.result
    assert "approval_id" in task.result


def test_processor_idempotent_on_completed_run(db: Session, tenant_a: Tenant):
    run = _make_workflow_run(db, tenant_a)
    process_provider_first_sync(db, run.id)
    process_provider_first_sync(db, run.id)  # second call — should be a no-op

    artifacts = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalars().all()
    assert len(artifacts) == 1

    approvals = db.execute(
        select(Approval).where(Approval.client_id == tenant_a.id)
    ).scalars().all()
    assert len(approvals) == 1


def test_processor_noop_on_missing_run(db: Session, tenant_a: Tenant):
    process_provider_first_sync(db, uuid.uuid4())  # should not raise

    artifacts = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalars().all()
    assert len(artifacts) == 0


# ---------------------------------------------------------------------------
# HTTP endpoint tests — POST /workflows/{id}/process
# ---------------------------------------------------------------------------


def test_process_endpoint_creates_artifact_and_approval(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    run = _make_workflow_run(db, tenant_a)

    resp = client.post(f"/workflows/{run.id}/process", headers=auth_headers_a)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["output_data"]["artifact_id"]

    artifacts = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalars().all()
    assert len(artifacts) == 1

    approvals = db.execute(
        select(Approval).where(Approval.client_id == tenant_a.id)
    ).scalars().all()
    assert len(approvals) == 1


def test_process_endpoint_unknown_workflow_type(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    run = WorkflowRun(
        client_id=tenant_a.id,
        workflow_type="unsupported_type",
        status="queued",
    )
    db.add(run)
    db.commit()

    resp = client.post(f"/workflows/{run.id}/process", headers=auth_headers_a)
    assert resp.status_code == 422


def test_process_endpoint_not_found(
    client: TestClient,
    auth_headers_a: dict,
):
    resp = client.post(f"/workflows/{uuid.uuid4()}/process", headers=auth_headers_a)
    assert resp.status_code == 404


def test_process_endpoint_tenant_isolation(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_b: dict,
):
    run = _make_workflow_run(db, tenant_a)
    resp = client.post(f"/workflows/{run.id}/process", headers=auth_headers_b)
    assert resp.status_code == 404


def test_processor_populates_artifact_meta(db: Session, tenant_a: Tenant):
    provider_connection_id = uuid.uuid4()
    normalized_item_id = uuid.uuid4()
    run = WorkflowRun(
        client_id=tenant_a.id,
        workflow_type="provider_first_sync",
        agent="sinclair",
        status="queued",
        input_data={
            "provider": "gmail",
            "provider_connection_id": str(provider_connection_id),
            "normalized_item_id": str(normalized_item_id),
        },
    )
    db.add(run)
    db.commit()

    process_provider_first_sync(db, run.id)

    artifact = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalar_one()
    assert artifact.meta["provider"] == "gmail"
    assert artifact.meta["provider_connection_id"] == str(provider_connection_id)
    assert artifact.meta["normalized_item_id"] == str(normalized_item_id)
    assert "Gmail" in artifact.body


def test_sync_endpoint_materializes_artifact_and_approval(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    """Full sync path: POST /providers/gmail/sync creates artifact + pending approval."""
    save = client.post(
        "/onboarding/save",
        json={
            "identity": {"display_name": "Alice", "timezone": "UTC", "locale": "en-US"},
            "authority_defaults": {},
            "onboarding": {"status": "pending"},
            "contexts": [
                {
                    "context_id": "business",
                    "context_type": "business",
                    "display_name": "Business",
                    "status": "active",
                    "context_accounts": [
                        {
                            "context_account_id": "business_gmail",
                            "provider": "gmail",
                            "context_account_purpose": "email",
                            "account_alias": "business_email",
                            "auth_scheme": "oauth",
                        }
                    ],
                }
            ],
        },
        headers=auth_headers_a,
    )
    assert save.status_code == 200
    provider_connection_id = save.json()["provider_connections"][0]["id"]

    callback = client.get(
        "/providers/callback",
        params={
            "provider_connection_id": provider_connection_id,
            "status": "ACTIVE",
            "connected_account_id": "ca_sync_test",
        },
        headers=auth_headers_a,
    )
    assert callback.status_code == 200

    sync = client.post(
        "/providers/gmail/sync",
        json={"provider_connection_id": provider_connection_id},
        headers=auth_headers_a,
    )
    assert sync.status_code == 200
    assert sync.json()["workflow_run_id"]

    artifacts = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalars().all()
    approvals = db.execute(
        select(Approval).where(Approval.client_id == tenant_a.id)
    ).scalars().all()
    assert len(artifacts) >= 1
    report = next(a for a in artifacts if a.kind == "report")
    assert report.title == "First inbox sweep"
    assert report.status == "ready"

    assert len(approvals) == 1
    assert approvals[0].decision == "pending"
    assert approvals[0].artifact_id == report.id
    assert approvals[0].governed_action == "provider_first_sync_review"


# ---------------------------------------------------------------------------
# LLM path and fallback tests (real email items in NormalizedItem)
# ---------------------------------------------------------------------------


def _make_workflow_run_with_items(
    db: Session, tenant: Tenant, items: list[dict]
) -> WorkflowRun:
    """Create a WorkflowRun backed by a NormalizedItem with real email items."""
    pe = ProviderEvent(
        client_id=tenant.id,
        provider="gmail",
        event_type="provider_first_sync",
        idempotency_key=f"test:{uuid.uuid4()}",
        status="received",
        payload={"records_synced": len(items)},
    )
    db.add(pe)
    db.flush()

    ni = NormalizedItem(
        client_id=tenant.id,
        provider_event_id=pe.id,
        item_type="email_sync_receipt",
        title="gmail first sync",
        data={
            "provider_connection_id": str(uuid.uuid4()),
            "records_synced": len(items),
            "status": "ready",
            "items": items,
        },
    )
    db.add(ni)
    db.flush()

    run = WorkflowRun(
        client_id=tenant.id,
        workflow_type="provider_first_sync",
        agent="sinclair",
        status="queued",
        input_data={
            "provider": "gmail",
            "provider_connection_id": str(uuid.uuid4()),
            "normalized_item_id": str(ni.id),
        },
    )
    db.add(run)
    db.flush()
    db.add(
        AgentTask(
            client_id=tenant.id,
            workflow_run_id=run.id,
            agent="sinclair",
            task_type="provider_first_sync_review",
            status="queued",
            payload={},
        )
    )
    db.commit()
    db.refresh(run)
    return run


_FAKE_ITEMS = [
    {
        "subject": "Q2 review agenda",
        "snippet": "Please review before Thursday.",
        "message_id": "msg1",
    },
    {"subject": "Invoice #1234", "snippet": "Your invoice is attached.", "message_id": "msg2"},
]


def test_processor_llm_path_uses_sinclair_response(db: Session, tenant_a: Tenant):
    """When NormalizedItem has items and Sinclair succeeds, artifact body = LLM response."""
    run = _make_workflow_run_with_items(db, tenant_a, _FAKE_ITEMS)

    from app.llm import LLMResponse

    mock_resp = LLMResponse(
        text="Two emails need attention: Q2 review and an invoice.",
        input_tokens=100,
        model="anthropic/claude-sonnet-4-6",
        provider="openrouter",
    )

    with patch("app.workflows.provider_first_sync.call_llm", return_value=mock_resp):
        process_provider_first_sync(db, run.id)

    artifact = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalar_one()
    assert artifact.title == "Gmail inbox review (2 messages)"
    assert artifact.body == "Two emails need attention: Q2 review and an invoice."
    assert artifact.meta["items_count"] == 2


def test_processor_llm_fallback_on_no_provider(db: Session, tenant_a: Tenant):
    """When call_llm returns text=None, processor still creates artifact with canned body."""
    run = _make_workflow_run_with_items(db, tenant_a, _FAKE_ITEMS)

    from app.llm import LLMResponse

    mock_resp = LLMResponse(
        text=None,
        input_tokens=0,
        model="anthropic/claude-sonnet-4-6",
        provider="none",
    )

    with patch("app.workflows.provider_first_sync.call_llm", return_value=mock_resp):
        process_provider_first_sync(db, run.id)

    artifact = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalar_one()
    assert artifact.title == "Gmail inbox review (2 messages)"
    assert "2 messages" in artifact.body
    assert artifact.meta["items_count"] == 2

    run_refreshed = db.get(WorkflowRun, run.id)
    assert run_refreshed.status == "completed"


# ---------------------------------------------------------------------------
# Per-item dedup (TODO-5)
# ---------------------------------------------------------------------------


def _make_stub_composio_with_items(items: list[dict]):
    """Return a mock ComposioAdapter whose trigger_sync returns the given items."""
    adapter = MagicMock()
    adapter.trigger_sync = AsyncMock(
        return_value=SyncResult(
            provider="gmail",
            records_synced=len(items),
            items=items,
        )
    )
    adapter.create_connect_link = AsyncMock(
        return_value=ConnectLinkResult(
            provider="gmail",
            url="https://stub.composio.url",
            connected_account_id=None,
        )
    )
    return adapter


def _onboarding_and_callback(client, auth_headers, context_account_id="personal_gmail"):
    """Helper: save onboarding + simulate OAuth callback; returns provider_connection_id."""
    save = client.post(
        "/onboarding/save",
        json={
            "identity": {"display_name": "Alice", "timezone": "UTC", "locale": "en-US"},
            "authority_defaults": {},
            "onboarding": {"status": "pending"},
            "contexts": [
                {
                    "context_id": "personal",
                    "context_type": "personal",
                    "display_name": "Personal",
                    "status": "active",
                    "context_accounts": [
                        {
                            "context_account_id": context_account_id,
                            "provider": "gmail",
                            "context_account_purpose": "email",
                            "account_alias": context_account_id,
                            "auth_scheme": "oauth",
                        }
                    ],
                }
            ],
        },
        headers=auth_headers,
    )
    assert save.status_code == 200
    conn_id = save.json()["provider_connections"][0]["id"]
    callback = client.get(
        "/providers/callback",
        params={
            "provider_connection_id": conn_id,
            "status": "ACTIVE",
            "connected_account_id": "ca_dedup_test",
        },
    )
    assert callback.status_code == 200
    return conn_id


def test_per_item_dedup_skips_duplicate_message_ids(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
    settings,
):
    """Re-syncing with the same message_id must not create duplicate ProviderEvents."""
    items = [
        {"subject": "Hello", "snippet": "Hi there", "message_id": "msg_abc"},
        {"subject": "Meeting", "snippet": "Tomorrow?", "message_id": "msg_def"},
    ]
    stub = _make_stub_composio_with_items(items)

    from app.main import create_app

    app = create_app()
    from app.deps import get_db, get_settings

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_composio] = lambda: stub
    from fastapi.testclient import TestClient as _TC

    c = _TC(app)

    conn_id = _onboarding_and_callback(c, auth_headers_a, "dedup_gmail")

    c.post("/providers/gmail/sync", json={"provider_connection_id": conn_id}, headers=auth_headers_a)
    c.post("/providers/gmail/sync", json={"provider_connection_id": conn_id}, headers=auth_headers_a)

    item_events = db.execute(
        select(ProviderEvent).where(
            ProviderEvent.client_id == tenant_a.id,
            ProviderEvent.event_type == "item_ingested",
        )
    ).scalars().all()

    assert len(item_events) == 2, (
        f"Expected 2 per-item ProviderEvents (one per message_id), got {len(item_events)}"
    )
    keys = {pe.idempotency_key for pe in item_events}
    assert any("msg_abc" in k for k in keys)
    assert any("msg_def" in k for k in keys)


# ---------------------------------------------------------------------------
# Connection-scoped entity_id (Task B)
# ---------------------------------------------------------------------------


def test_connect_link_uses_connection_scoped_entity_id(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
    settings,
):
    """A new connection (no composio_user_id set) must use conn:{id} as entity_id."""
    stub = _make_stub_composio_with_items([])

    from app.main import create_app

    app = create_app()
    from app.deps import get_db, get_settings

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_composio] = lambda: stub
    from fastapi.testclient import TestClient as _TC

    c = _TC(app)

    save = c.post(
        "/onboarding/save",
        json={
            "identity": {"display_name": "Alice", "timezone": "UTC", "locale": "en-US"},
            "authority_defaults": {},
            "onboarding": {"status": "pending"},
            "contexts": [
                {
                    "context_id": "personal",
                    "context_type": "personal",
                    "display_name": "Personal",
                    "status": "active",
                    "context_accounts": [
                        {
                            "context_account_id": "personal_gmail",
                            "provider": "gmail",
                            "context_account_purpose": "email",
                            "account_alias": "personal_email",
                            "auth_scheme": "oauth",
                        }
                    ],
                }
            ],
        },
        headers=auth_headers_a,
    )
    assert save.status_code == 200
    conn_id = save.json()["provider_connections"][0]["id"]

    link = c.post(
        "/providers/gmail/connect-link",
        json={
            "provider_connection_id": conn_id,
            "redirect_uri": "https://app.example.com/onboarding",
        },
        headers=auth_headers_a,
    )
    assert link.status_code == 200
    returned_entity_id = link.json()["composio_user_id"]
    assert returned_entity_id == f"conn:{conn_id}", (
        f"Expected conn-scoped entity_id 'conn:{conn_id}', got '{returned_entity_id}'"
    )

    conn = db.execute(
        select(ProviderConnection).where(ProviderConnection.id == uuid.UUID(conn_id))
    ).scalar_one()
    assert conn.composio_user_id == f"conn:{conn_id}"
