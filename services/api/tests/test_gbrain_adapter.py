"""GBrain adapter behavior."""

import uuid

import pytest

from app.adapters.gbrain import LocalFileGBrainAdapter


@pytest.mark.asyncio
async def test_local_file_gbrain_adapter_is_client_scoped(tmp_path):
    adapter = LocalFileGBrainAdapter(str(tmp_path))
    client_a = uuid.uuid4()
    client_b = uuid.uuid4()

    ingest = await adapter.ingest(
        client_a,
        category="onboarding",
        content="Marcus onboarding provider readiness",
        metadata={"source": "test"},
    )
    await adapter.ingest(
        client_b,
        category="onboarding",
        content="Other tenant onboarding",
        metadata={"source": "test"},
    )
    sigma = await adapter.store_sigma(
        client_a,
        sigma_type="client_onboarding_readiness",
        payload={"status": "ready_for_auth"},
    )

    hits_a = await adapter.retrieve(client_a, "Marcus")
    hits_b = await adapter.retrieve(client_b, "Marcus")

    assert ingest.accepted is True
    assert sigma.success is True
    assert hits_a
    assert hits_a[0].metadata["source"] == "test"
    assert not hits_b or "Marcus" not in hits_b[0].content
