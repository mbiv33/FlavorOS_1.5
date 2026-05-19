"""Tests for the approval decide endpoint.

Covers:
- Approve a pending approval → decision = approved, decided_by/decided_at set
- Reject a pending approval → decision = rejected
- AuditEvent created on decide (action = "approval.decided")
- Double-decide returns 409
- Deciding another tenant's approval returns 404
"""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Approval, AuditEvent, Artifact, Tenant, User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_approval(
    db: Session,
    tenant: Tenant,
    artifact_id: uuid.UUID | None = None,
) -> Approval:
    appr = Approval(
        client_id=tenant.id,
        artifact_id=artifact_id,
        governed_action="provider_first_sync_review",
        reason="Please confirm the first sync looked correct.",
        decision="pending",
    )
    db.add(appr)
    db.commit()
    db.refresh(appr)
    return appr


def _make_artifact(db: Session, tenant: Tenant) -> Artifact:
    art = Artifact(
        client_id=tenant.id,
        kind="report",
        title="First inbox sweep",
        status="ready",
        created_by="system:provider_first_sync",
    )
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_approve_sets_decision_approved(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    user_a: User,
    auth_headers_a: dict,
):
    appr = _make_approval(db, tenant_a)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "approved"
    assert data["decided_by"] == str(user_a.id)
    assert data["decided_at"] is not None


def test_reject_sets_decision_rejected(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    appr = _make_approval(db, tenant_a)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "rejected"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 200
    assert resp.json()["decision"] == "rejected"


def test_decide_creates_audit_event(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    user_a: User,
    auth_headers_a: dict,
):
    art = _make_artifact(db, tenant_a)
    appr = _make_approval(db, tenant_a, artifact_id=art.id)

    client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )

    events = db.execute(
        select(AuditEvent).where(
            AuditEvent.client_id == tenant_a.id,
            AuditEvent.action == "approval.decided",
        )
    ).scalars().all()
    assert len(events) == 1
    evt = events[0]
    assert evt.actor_id == user_a.id
    assert evt.resource_type == "approval"
    assert evt.resource_id == appr.id
    assert evt.detail["decision"] == "approved"
    assert evt.detail["governed_action"] == "provider_first_sync_review"
    assert evt.detail["artifact_id"] == str(art.id)


def test_decide_audit_event_includes_null_artifact_id(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    appr = _make_approval(db, tenant_a)  # no artifact

    client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "rejected"},
        headers=auth_headers_a,
    )

    evt = db.execute(
        select(AuditEvent).where(
            AuditEvent.client_id == tenant_a.id,
            AuditEvent.action == "approval.decided",
        )
    ).scalar_one()
    assert evt.detail["artifact_id"] is None


def test_double_decide_returns_409(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    appr = _make_approval(db, tenant_a)

    client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    resp2 = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "rejected"},
        headers=auth_headers_a,
    )
    assert resp2.status_code == 409


def test_decided_approval_excluded_from_pending_list(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    appr = _make_approval(db, tenant_a)
    client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )

    pending = client.get("/approvals?decision=pending", headers=auth_headers_a)
    assert pending.status_code == 200
    ids = [a["id"] for a in pending.json()]
    assert str(appr.id) not in ids


def test_decide_cross_tenant_returns_404(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_b: dict,
):
    appr = _make_approval(db, tenant_a)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_b,
    )
    assert resp.status_code == 404


def test_decide_invalid_decision_rejected(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    appr = _make_approval(db, tenant_a)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "maybe"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 422


def test_decide_not_found_returns_404(
    client: TestClient,
    auth_headers_a: dict,
):
    resp = client.post(
        f"/approvals/{uuid.uuid4()}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 404
