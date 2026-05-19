"""Tests for outbound_actions lifecycle (Lane J)."""

from __future__ import annotations

import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Approval,
    Artifact,
    AuditEvent,
    OutboundAction,
    ProviderConnection,
    Tenant,
    User,
)
from app.workflows.calendar_outbound import (
    CALENDAR_SEND_GOVERNED_ACTION,
    enqueue_calendar_for_approval,
)
from app.workflows.communications_outbound import (
    COMMUNICATIONS_SEND_GOVERNED_ACTION,
    enqueue_for_approval,
)


def _make_gmail_connection(db: Session, tenant: Tenant) -> ProviderConnection:
    conn = ProviderConnection(
        client_id=tenant.id,
        provider="gmail",
        context_account_id=f"acct-{uuid.uuid4()}",
        status="connected",
        enabled=True,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


def _make_comms_draft(db: Session, tenant: Tenant) -> Artifact:
    art = Artifact(
        client_id=tenant.id,
        kind="client",
        title="Follow up with Acme",
        body="Hi — checking in on our proposal.",
        meta={
            "artifact_type": "draft_email",
            "channel": "email",
            "to": "partner@acme.com",
            "subject": "Follow up",
        },
        status="ready",
    )
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


def _make_comms_approval(
    db: Session,
    tenant: Tenant,
    artifact_id: uuid.UUID,
) -> Approval:
    appr = Approval(
        client_id=tenant.id,
        artifact_id=artifact_id,
        governed_action=COMMUNICATIONS_SEND_GOVERNED_ACTION,
        reason="Send this draft after review.",
        decision="pending",
    )
    db.add(appr)
    db.commit()
    db.refresh(appr)
    return appr


def _make_outbound(
    db: Session,
    tenant: Tenant,
    approval: Approval,
    *,
    status: str = "queued",
) -> OutboundAction:
    outbound = OutboundAction(
        client_id=tenant.id,
        approval_id=approval.id,
        artifact_id=approval.artifact_id,
        provider="gmail",
        action_type="gmail_send_draft",
        status=status,
        idempotency_key=f"approval:{approval.id}",
    )
    db.add(outbound)
    db.commit()
    db.refresh(outbound)
    return outbound


def test_list_outbound_actions_tenant_scoped(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    tenant_b: Tenant,
    auth_headers_a: dict,
):
    art_a = _make_comms_draft(db, tenant_a)
    appr_a = _make_comms_approval(db, tenant_a, art_a.id)
    _make_outbound(db, tenant_a, appr_a)

    art_b = _make_comms_draft(db, tenant_b)
    appr_b = _make_comms_approval(db, tenant_b, art_b.id)
    _make_outbound(db, tenant_b, appr_b)

    resp = client.get("/outbound-actions", headers=auth_headers_a)
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 1
    assert rows[0]["approval_id"] == str(appr_a.id)


def test_get_outbound_cross_tenant_returns_404(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_b: dict,
):
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)
    outbound = _make_outbound(db, tenant_a, appr)

    resp = client.get(f"/outbound-actions/{outbound.id}", headers=auth_headers_b)
    assert resp.status_code == 404


def test_pull_back_only_when_queued(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)
    outbound = _make_outbound(db, tenant_a, appr, status="queued")

    ok = client.post(f"/outbound-actions/{outbound.id}/pull-back", headers=auth_headers_a)
    assert ok.status_code == 200
    assert ok.json()["status"] == "pulled_back"

    events = db.execute(
        select(AuditEvent).where(
            AuditEvent.client_id == tenant_a.id,
            AuditEvent.action == "outbound.pulled_back",
        )
    ).scalars().all()
    assert len(events) == 1

    executed = _make_outbound(
        db,
        tenant_a,
        _make_comms_approval(db, tenant_a, _make_comms_draft(db, tenant_a).id),
        status="executed",
    )
    bad = client.post(
        f"/outbound-actions/{executed.id}/pull-back",
        headers=auth_headers_a,
    )
    assert bad.status_code == 409


def test_approve_comms_creates_outbound_executed(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    user_a: User,
    auth_headers_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("OUTBOUND_DEFER_EXECUTION", "false")
    _make_gmail_connection(db, tenant_a)
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["outbound_action"] is not None
    assert data["outbound_action"]["status"] == "executed"

    outbound = db.execute(
        select(OutboundAction).where(OutboundAction.approval_id == appr.id)
    ).scalar_one()
    assert outbound.status == "executed"
    assert outbound.executed_at is not None

    audit_actions = {
        e.action
        for e in db.execute(
            select(AuditEvent).where(
                AuditEvent.client_id == tenant_a.id,
                AuditEvent.resource_id == outbound.id,
            )
        ).scalars()
    }
    assert "outbound.queued" in audit_actions
    assert "outbound.executed" in audit_actions


def test_approve_comms_without_gmail_returns_409(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 409
    assert "Gmail" in resp.json()["detail"]


def test_reject_comms_does_not_create_outbound(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    _make_gmail_connection(db, tenant_a)
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "rejected"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 200
    assert resp.json().get("outbound_action") is None

    count = db.execute(
        select(OutboundAction).where(OutboundAction.approval_id == appr.id)
    ).scalar_one_or_none()
    assert count is None


def test_approve_comms_defer_execution_leaves_queued(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("OUTBOUND_DEFER_EXECUTION", "true")
    _make_gmail_connection(db, tenant_a)
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 200
    assert resp.json()["outbound_action"]["status"] == "queued"

    pull = client.post(
        f"/outbound-actions/{resp.json()['outbound_action']['id']}/pull-back",
        headers=auth_headers_a,
    )
    assert pull.status_code == 200
    assert pull.json()["status"] == "pulled_back"


def test_outbound_execution_failure(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("OUTBOUND_DEFER_EXECUTION", "false")
    _make_gmail_connection(db, tenant_a)
    art = _make_comms_draft(db, tenant_a)
    art.meta = {**(art.meta or {}), "_force_failure": True}
    db.add(art)
    db.commit()
    db.refresh(art)
    appr = _make_comms_approval(db, tenant_a, art.id)

    resp = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 200
    assert resp.json()["outbound_action"]["status"] == "failed"


def test_enqueue_for_approval_idempotent(
    db: Session,
    tenant_a: Tenant,
    user_a: User,
):
    _make_gmail_connection(db, tenant_a)
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)

    first = enqueue_for_approval(db, approval=appr, user=user_a)
    second = enqueue_for_approval(db, approval=appr, user=user_a)
    assert first.id == second.id

    count = db.execute(
        select(OutboundAction).where(OutboundAction.approval_id == appr.id)
    ).scalars().all()
    assert len(count) == 1


def test_execute_endpoint_runs_queued_outbound(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("OUTBOUND_DEFER_EXECUTION", "true")
    _make_gmail_connection(db, tenant_a)
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)

    decide = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert decide.status_code == 200
    outbound_id = decide.json()["outbound_action"]["id"]
    assert decide.json()["outbound_action"]["status"] == "queued"

    execute = client.post(
        f"/outbound-actions/{outbound_id}/execute",
        headers=auth_headers_a,
    )
    assert execute.status_code == 200
    assert execute.json()["status"] == "executed"
    assert execute.json()["executed_at"] is not None

    audit_actions = {
        e.action
        for e in db.execute(
            select(AuditEvent).where(
                AuditEvent.client_id == tenant_a.id,
                AuditEvent.resource_id == uuid.UUID(outbound_id),
            )
        ).scalars()
    }
    assert "outbound.executed" in audit_actions


def test_execute_on_executed_returns_409(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("OUTBOUND_DEFER_EXECUTION", "false")
    _make_gmail_connection(db, tenant_a)
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)

    decide = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert decide.status_code == 200
    outbound_id = decide.json()["outbound_action"]["id"]
    assert decide.json()["outbound_action"]["status"] == "executed"

    again = client.post(
        f"/outbound-actions/{outbound_id}/execute",
        headers=auth_headers_a,
    )
    assert again.status_code == 409
    assert "executed" in again.json()["detail"]


def _make_gcal_connection(db: Session, tenant: Tenant) -> ProviderConnection:
    conn = ProviderConnection(
        client_id=tenant.id,
        provider="googlecalendar",
        context_account_id=f"gcal-{uuid.uuid4()}",
        status="connected",
        enabled=True,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


def _make_calendar_hold(db: Session, tenant: Tenant) -> Artifact:
    art = Artifact(
        client_id=tenant.id,
        kind="client",
        title="Investor sync hold",
        body="Placeholder hold for investor sync.",
        meta={
            "artifact_type": "calendar_hold",
            "channel": "calendar",
            "start": "2026-06-01T15:00:00Z",
            "end": "2026-06-01T16:00:00Z",
        },
        status="ready",
    )
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


def _make_calendar_approval(
    db: Session,
    tenant: Tenant,
    artifact_id: uuid.UUID,
) -> Approval:
    appr = Approval(
        client_id=tenant.id,
        artifact_id=artifact_id,
        governed_action=CALENDAR_SEND_GOVERNED_ACTION,
        reason="Place this calendar hold after review.",
        decision="pending",
    )
    db.add(appr)
    db.commit()
    db.refresh(appr)
    return appr


def test_approve_calendar_defer_then_execute(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("OUTBOUND_DEFER_EXECUTION", "true")
    _make_gcal_connection(db, tenant_a)
    hold = _make_calendar_hold(db, tenant_a)
    appr = _make_calendar_approval(db, tenant_a, hold.id)

    decide = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert decide.status_code == 200
    outbound = decide.json()["outbound_action"]
    assert outbound is not None
    assert outbound["provider"] == "googlecalendar"
    assert outbound["action_type"] == "calendar_create_hold"
    assert outbound["status"] == "queued"

    execute = client.post(
        f"/outbound-actions/{outbound['id']}/execute",
        headers=auth_headers_a,
    )
    assert execute.status_code == 200
    assert execute.json()["status"] == "executed"
    assert execute.json()["execution_result_json"] is not None


def test_enqueue_calendar_for_approval_idempotent(
    db: Session,
    tenant_a: Tenant,
    user_a: User,
):
    _make_gcal_connection(db, tenant_a)
    hold = _make_calendar_hold(db, tenant_a)
    appr = _make_calendar_approval(db, tenant_a, hold.id)

    first = enqueue_calendar_for_approval(db, approval=appr, user=user_a)
    second = enqueue_calendar_for_approval(db, approval=appr, user=user_a)
    assert first.id == second.id

    rows = db.execute(
        select(OutboundAction).where(OutboundAction.approval_id == appr.id)
    ).scalars().all()
    assert len(rows) == 1
