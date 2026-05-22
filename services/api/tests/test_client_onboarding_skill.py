"""Tests for the full client_onboarding orchestration skill (Lane T / TODO-2b).

Covers: provider expectations written, readiness recorded, seed fan-out
invoked, artifact + approval created, and fan-out failure not breaking
onboarding.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.llm import LLMResponse
from app.models import (
    AgentTask,
    Approval,
    Artifact,
    ClientContext,
    ClientUniverseEntry,
    ProviderConnection,
    Tenant,
    WorkflowRun,
)
from app.skills.client_onboarding import client_onboarding

_CANNED_LLM = LLMResponse(
    text="Welcome. You have two contexts and one provider connected.",
    input_tokens=80,
    model="anthropic/claude-sonnet-4-6",
    provider="openrouter",
)


def _seed_onboarding_state(db: Session, tenant: Tenant) -> WorkflowRun:
    """Create contexts + a provider connection + a queued client_onboarding run."""
    personal = ClientContext(client_id=tenant.id, type="personal", name="Home")
    professional = ClientContext(client_id=tenant.id, type="professional", name="Acme")
    db.add_all([personal, professional])
    db.flush()

    conn = ProviderConnection(
        client_id=tenant.id,
        client_context_id=professional.id,
        provider="gmail",
        account_alias="work@acme.com",
        status="ready",
        enabled=True,
    )
    db.add(conn)
    db.flush()

    run = WorkflowRun(
        client_id=tenant.id,
        workflow_type="client_onboarding",
        agent="khadijah",
        status="queued",
        input_data={},
    )
    db.add(run)
    db.flush()

    task = AgentTask(
        client_id=tenant.id,
        workflow_run_id=run.id,
        agent="khadijah",
        task_type="client_onboarding",
        status="running",
        payload={},
    )
    db.add(task)
    db.commit()
    db.refresh(run)
    return run


def _get_task(db: Session, run: WorkflowRun) -> AgentTask:
    return db.execute(
        select(AgentTask).where(AgentTask.workflow_run_id == run.id)
    ).scalar_one()


async def test_onboarding_sets_provider_expectations(db: Session, tenant_a: Tenant):
    run = _seed_onboarding_state(db, tenant_a)
    task = _get_task(db, run)

    with (
        patch("app.skills.client_onboarding.call_llm", return_value=_CANNED_LLM),
        patch(
            "app.skills.client_onboarding._launch_seed_workflows",
            new=AsyncMock(return_value=["seed-run-1", "seed-run-2"]),
        ),
    ):
        result = await client_onboarding(db=db, task=task)

    assert result["provider_expectations"] == 1

    expectation = db.execute(
        select(ClientUniverseEntry).where(
            ClientUniverseEntry.client_id == tenant_a.id,
            ClientUniverseEntry.category == "provider_expectations",
            ClientUniverseEntry.key == "gmail",
        )
    ).scalar_one()
    assert expectation.value["status"] == "ready"
    assert "inbox triage" in expectation.value["expected_scope"]


async def test_onboarding_records_readiness_and_fans_out(db: Session, tenant_a: Tenant):
    run = _seed_onboarding_state(db, tenant_a)
    task = _get_task(db, run)

    fake_launch = AsyncMock(return_value=["seed-run-1", "seed-run-2"])
    with (
        patch("app.skills.client_onboarding.call_llm", return_value=_CANNED_LLM),
        patch("app.skills.client_onboarding._launch_seed_workflows", new=fake_launch),
    ):
        result = await client_onboarding(db=db, task=task)

    # Fan-out was invoked once with the client id
    fake_launch.assert_awaited_once_with(tenant_a.id)
    assert result["seed_run_ids"] == ["seed-run-1", "seed-run-2"]

    readiness = db.execute(
        select(ClientUniverseEntry).where(
            ClientUniverseEntry.client_id == tenant_a.id,
            ClientUniverseEntry.category == "readiness",
            ClientUniverseEntry.key == "onboarding",
        )
    ).scalar_one()
    assert readiness.value["status"] == "orchestrated"
    assert readiness.value["seed_run_ids"] == ["seed-run-1", "seed-run-2"]
    assert readiness.value["provider_expectations"] == 1

    # Artifact + approval still created
    artifact = db.execute(
        select(Artifact).where(Artifact.client_id == tenant_a.id)
    ).scalar_one()
    assert artifact.kind == "sigma"
    approval = db.execute(
        select(Approval).where(Approval.client_id == tenant_a.id)
    ).scalar_one()
    assert approval.governed_action == "client_onboarding_confirm"

    run_refreshed = db.get(WorkflowRun, run.id)
    assert run_refreshed.status == "completed"


async def test_onboarding_survives_fanout_failure(db: Session, tenant_a: Tenant):
    """Real _launch_seed_workflows with no event loop access still no-ops cleanly."""
    run = _seed_onboarding_state(db, tenant_a)
    task = _get_task(db, run)

    # Patch the orchestrator launch to raise — the helper should swallow it.
    with (
        patch("app.skills.client_onboarding.call_llm", return_value=_CANNED_LLM),
        patch(
            "app.adapters.orchestrator.InProcessOrchestratorAdapter.launch",
            new=AsyncMock(side_effect=RuntimeError("no loop")),
        ),
    ):
        result = await client_onboarding(db=db, task=task)

    # No children launched, but onboarding still completed
    assert result["seed_run_ids"] == []
    run_refreshed = db.get(WorkflowRun, run.id)
    assert run_refreshed.status == "completed"


async def test_onboarding_no_providers(db: Session, tenant_a: Tenant):
    """With zero providers, expectations count is 0 and onboarding still completes."""
    run = WorkflowRun(
        client_id=tenant_a.id,
        workflow_type="client_onboarding",
        agent="khadijah",
        status="queued",
        input_data={},
    )
    db.add(run)
    db.flush()
    db.add(
        AgentTask(
            client_id=tenant_a.id,
            workflow_run_id=run.id,
            agent="khadijah",
            task_type="client_onboarding",
            status="running",
            payload={},
        )
    )
    db.commit()
    db.refresh(run)
    task = _get_task(db, run)

    with (
        patch("app.skills.client_onboarding.call_llm", return_value=_CANNED_LLM),
        patch(
            "app.skills.client_onboarding._launch_seed_workflows",
            new=AsyncMock(return_value=[]),
        ),
    ):
        result = await client_onboarding(db=db, task=task)

    assert result["provider_expectations"] == 0
    assert result["providers"] == 0
    run_refreshed = db.get(WorkflowRun, run.id)
    assert run_refreshed.status == "completed"
