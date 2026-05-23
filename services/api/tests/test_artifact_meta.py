"""Tests for draft_email meta validation and approval projection."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Approval, Artifact, NormalizedItem, ProviderEvent, Tenant
from app.services.artifact_meta import COMMUNICATIONS_SEND_GOVERNED_ACTION


def _draft_meta(**overrides: object) -> dict:
    base = {
        "artifact_type": "draft_email",
        "channel": "email",
        "to": "partner@acme.com",
        "subject": "Follow up",
        "preview": {
            "inbound_summary": "They asked for pricing.",
            "body_excerpt": "Hi — following up on our call.",
        },
        "stakes": {"public_facing": True, "irreversible": "Send"},
    }
    base.update(overrides)
    return base


def test_create_client_artifact_rejects_invalid_draft_email_meta(
    client: TestClient,
    auth_headers_a: dict,
):
    resp = client.post(
        "/artifacts",
        json={
            "kind": "client",
            "title": "Incomplete draft",
            "meta": {"artifact_type": "draft_email", "channel": "email"},
        },
        headers=auth_headers_a,
    )
    assert resp.status_code == 422
    detail = resp.json()["detail"]
    assert "missing" in detail
    assert "to" in detail["missing"]
    assert "subject" in detail["missing"]


def test_create_client_artifact_accepts_valid_draft_email_meta(
    client: TestClient,
    auth_headers_a: dict,
):
    resp = client.post(
        "/artifacts",
        json={
            "kind": "client",
            "title": "Follow up",
            "body": "Hi — checking in.",
            "meta": _draft_meta(),
        },
        headers=auth_headers_a,
    )
    assert resp.status_code == 201
    assert resp.json()["meta"]["artifact_type"] == "draft_email"


def test_approval_projection_includes_preview_and_stakes(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    art = Artifact(
        client_id=tenant_a.id,
        kind="client",
        title="Follow up",
        body="Hi — checking in on our proposal.",
        meta=_draft_meta(source_links=[{"label": "Gmail thread", "url": "https://mail.example/t/1"}]),
        status="ready",
    )
    db.add(art)
    db.commit()
    db.refresh(art)

    appr = Approval(
        client_id=tenant_a.id,
        artifact_id=art.id,
        governed_action=COMMUNICATIONS_SEND_GOVERNED_ACTION,
        reason="Send after review.",
        decision="pending",
    )
    db.add(appr)
    db.commit()
    db.refresh(appr)

    listed = client.get("/approvals", headers=auth_headers_a)
    assert listed.status_code == 200
    row = next(item for item in listed.json() if item["id"] == str(appr.id))
    assert row["preview"] is not None
    assert row["preview"]["to"] == "partner@acme.com"
    assert row["preview"]["subject"] == "Follow up"
    assert row["preview"]["body_excerpt"]
    assert len(row["stakes"]) >= 1
    assert row["source_link_label"] == "Gmail thread"

    detail = client.get(f"/approvals/{appr.id}", headers=auth_headers_a)
    assert detail.status_code == 200
    assert detail.json()["preview"]["to"] == "partner@acme.com"

    decided = client.post(
        f"/approvals/{appr.id}/decide",
        json={"decision": "rejected"},
        headers=auth_headers_a,
    )
    assert decided.status_code == 200
    assert decided.json()["decision"] == "rejected"
    assert decided.json()["preview"]["subject"] == "Follow up"
    assert decided.json()["stakes"]


def test_normalized_items_email_filter_includes_sync_receipts(
    client: TestClient,
    db: Session,
    tenant_a: Tenant,
    auth_headers_a: dict,
):
    event = ProviderEvent(
        client_id=tenant_a.id,
        provider="gmail",
        event_type="sync.batch",
        idempotency_key=f"test-{uuid.uuid4()}",
        payload={},
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    email_item = NormalizedItem(
        client_id=tenant_a.id,
        provider_event_id=event.id,
        item_type="email",
        title="Direct email",
        data={"subject": "Hello"},
    )
    receipt_item = NormalizedItem(
        client_id=tenant_a.id,
        provider_event_id=event.id,
        item_type="email_sync_receipt",
        title="Sync receipt",
        data={"subject": "Receipt"},
    )
    calendar_item = NormalizedItem(
        client_id=tenant_a.id,
        provider_event_id=event.id,
        item_type="calendar_event",
        title="Standup",
        data={},
    )
    db.add_all([email_item, receipt_item, calendar_item])
    db.commit()

    resp = client.get(
        "/providers/normalized-items",
        params={"item_type": "email", "limit": 50},
        headers=auth_headers_a,
    )
    assert resp.status_code == 200
    types = {row["item_type"] for row in resp.json()}
    assert types == {"email", "email_sync_receipt"}
