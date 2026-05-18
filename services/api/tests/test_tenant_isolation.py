"""Tenant isolation tests — verify cross-tenant data leaks are blocked."""

from fastapi.testclient import TestClient

from app.models import Tenant


def test_missing_client_id_rejected(client: TestClient):
    resp = client.get("/artifacts")
    assert resp.status_code in (400, 401, 422)


def test_unknown_tenant_rejected(client: TestClient, auth_headers_a: dict):
    headers = {**auth_headers_a, "X-Client-ID": "nonexistent-slug"}
    resp = client.get("/artifacts", headers=headers)
    assert resp.status_code == 404


def test_create_artifact_scoped_to_tenant(
    client: TestClient,
    auth_headers_a: dict,
    auth_headers_b: dict,
    tenant_a: Tenant,
):
    resp = client.post(
        "/artifacts",
        json={"kind": "client", "title": "Tenant A doc"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 201
    artifact_id = resp.json()["id"]
    assert resp.json()["client_id"] == str(tenant_a.id)

    detail_a = client.get(f"/artifacts/{artifact_id}", headers=auth_headers_a)
    assert detail_a.status_code == 200

    detail_b = client.get(f"/artifacts/{artifact_id}", headers=auth_headers_b)
    assert detail_b.status_code == 404


def test_approval_decide_prevents_double_decide(
    client: TestClient,
    auth_headers_a: dict,
):
    resp = client.post(
        "/approvals",
        json={"governed_action": "send_email"},
        headers=auth_headers_a,
    )
    assert resp.status_code == 201
    approval_id = resp.json()["id"]

    decide1 = client.post(
        f"/approvals/{approval_id}/decide",
        json={"decision": "approved"},
        headers=auth_headers_a,
    )
    assert decide1.status_code == 200
    assert decide1.json()["decision"] == "approved"

    decide2 = client.post(
        f"/approvals/{approval_id}/decide",
        json={"decision": "rejected"},
        headers=auth_headers_a,
    )
    assert decide2.status_code == 409
