"""Scheduled outbound window helpers and batch dispatch."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

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
from app.workflows.communications_outbound import (
    COMMUNICATIONS_SEND_GOVERNED_ACTION,
    dispatch_due_outbound_actions,
    enqueue_for_approval,
    maybe_enqueue_and_execute,
)
from app.workflows.outbound_schedule import next_send_window


def test_next_send_window_same_day_afternoon():
    tz = ZoneInfo("America/New_York")
    after = datetime(2026, 5, 22, 11, 30, tzinfo=timezone.utc)
    nxt = next_send_window(after, tz, hours=(10, 13, 16))
    local = nxt.astimezone(tz)
    assert local.hour == 10
    assert local.minute == 0


def test_next_send_window_rolls_to_next_day():
    tz = ZoneInfo("America/New_York")
    after = datetime(2026, 5, 22, 17, 0, tzinfo=timezone.utc)
    nxt = next_send_window(after, tz, hours=(10, 13, 16))
    local = nxt.astimezone(tz)
    assert local.hour == 16


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
        title="Follow up",
        body="Hello",
        meta={
            "artifact_type": "draft_email",
            "channel": "email",
            "to": "partner@example.com",
            "subject": "Follow up",
        },
        status="ready",
    )
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


def _make_comms_approval(db: Session, tenant: Tenant, artifact_id: uuid.UUID) -> Approval:
    appr = Approval(
        client_id=tenant.id,
        artifact_id=artifact_id,
        governed_action=COMMUNICATIONS_SEND_GOVERNED_ACTION,
        reason="Send after review.",
        decision="pending",
    )
    db.add(appr)
    db.commit()
    db.refresh(appr)
    return appr


def test_approve_comms_queues_for_batch_window(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.delenv("OUTBOUND_INLINE_EXECUTE_ON_APPROVE", raising=False)
    monkeypatch.delenv("OUTBOUND_INLINE_EXECUTE", raising=False)
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
    assert data["outbound_action"]["status"] == "queued"
    assert data["outbound_action"]["scheduled_send_at"] is not None
    assert data["outbound_action"]["target_reference_json"]["scheduled_label"]

    outbound = db.execute(
        select(OutboundAction).where(OutboundAction.approval_id == appr.id)
    ).scalar_one()
    assert outbound.scheduled_send_at is not None


def test_dispatch_due_executes_past_scheduled(
    db: Session,
    tenant_a: Tenant,
    user_a: User,
    monkeypatch: pytest.MonkeyPatch,
):
    _make_gmail_connection(db, tenant_a)
    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)
    outbound = enqueue_for_approval(db, approval=appr, user=user_a)
    past = datetime(2020, 1, 1, 12, 0, tzinfo=timezone.utc)
    outbound.scheduled_send_at = past
    db.add(outbound)
    db.commit()

    dispatched = dispatch_due_outbound_actions(
        db, as_of=datetime.now(timezone.utc), limit=10
    )
    db.commit()
    assert len(dispatched) == 1
    assert dispatched[0].status == "executed"


def test_apply_send_result_marks_failed_without_exception(
    db: Session,
    tenant_a: Tenant,
):
    from app.adapters.gmail_outbound import SendDraftResult, apply_send_result

    art = _make_comms_draft(db, tenant_a)
    appr = _make_comms_approval(db, tenant_a, art.id)
    outbound = OutboundAction(
        client_id=tenant_a.id,
        approval_id=appr.id,
        artifact_id=art.id,
        provider="gmail",
        action_type="gmail_send_draft",
        status="queued",
    )
    db.add(outbound)
    db.commit()
    db.refresh(outbound)

    apply_send_result(
        outbound,
        SendDraftResult(
            success=False,
            external_result_id=None,
            receipt_status="failed",
            response_summary="composio rejected",
        ),
    )
    assert outbound.status == "failed"
    assert outbound.last_error_summary == "composio rejected"
    assert outbound.executed_at is None
