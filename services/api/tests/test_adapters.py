"""Adapter contract smoke tests — stubs return safe defaults."""

import uuid

import pytest

from app.adapters import (
    StubComposioAdapter,
    StubGBrainAdapter,
    StubOrchestratorAdapter,
)


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
