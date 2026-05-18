"""Smoke tests for the health endpoint."""

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


def test_health_includes_env(client: TestClient):
    data = client.get("/health").json()
    assert "env" in data
