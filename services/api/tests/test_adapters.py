"""Adapter contract smoke tests — stubs return safe defaults."""

import uuid
from unittest.mock import patch

import pytest

from app.adapters import (
    StubComposioAdapter,
    StubGBrainAdapter,
    StubOrchestratorAdapter,
)
from app.config import Settings
from app.deps import get_composio


@pytest.mark.asyncio
async def test_stub_composio_list_toolkits():
    adapter = StubComposioAdapter()
    result = await adapter.list_toolkits()
    assert isinstance(result, list)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_stub_gbrain_retrieve_empty():
    adapter = StubGBrainAdapter()
    result = await adapter.retrieve(client_id=uuid.uuid4(), query="anything", top_k=5)
    assert result == []


@pytest.mark.asyncio
async def test_stub_orchestrator_launch_returns_result():
    adapter = StubOrchestratorAdapter()
    result = await adapter.launch(
        client_id=uuid.uuid4(),
        workflow_type="morning_standup",
        input_data={},
    )
    assert result.run_id is not None
    assert result.status == "completed"


def test_composio_injection_returns_stub_when_no_api_key():
    stub_settings = Settings(
        database_url="sqlite://",
        api_skip_startup_seed=True,
        jwt_secret="test-secret",
        composio_api_key="",
    )
    adapter = get_composio(stub_settings)
    assert isinstance(adapter, StubComposioAdapter)


def test_composio_injection_returns_real_when_api_key_set():
    from app.adapters import RealComposioAdapter

    real_settings = Settings(
        database_url="sqlite://",
        api_skip_startup_seed=True,
        jwt_secret="test-secret",
        composio_api_key="test-api-key",
    )
    with patch("app.adapters.composio.RealComposioAdapter.__init__", return_value=None):
        adapter = get_composio(real_settings)
    assert isinstance(adapter, RealComposioAdapter)
