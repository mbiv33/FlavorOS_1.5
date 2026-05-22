"""Client Onboarding skill — Khadijah.

Orchestrates the governed Client Universe setup at onboarding time:
1. Reads existing contexts + provider connections (contexts are created
   upstream at onboarding-save; this skill does not re-create them).
2. Sets provider expectations (one KV row per connected provider).
3. Generates an LLM orientation summary as a sigma artifact + HITL gate.
4. Fans out to the seed workflows (morning_standup_seed,
   travel_research_seed) to prime the agents for their first real runs.
5. Records onboarding readiness with the child run IDs.

Output:
- AgentReport (Khadijah onboarding output)
- Artifact (kind=sigma, internal agent reference)
- Approval (HITL gate: client confirms onboarding context is correct)
- provider_expectations + readiness KV rows
- child seed WorkflowRuns (fanned out, non-blocking)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.llm import call_llm
from app.models import (
    AgentReport,
    AgentTask,
    AgentTaskEvent,
    Approval,
    Artifact,
    ClientContext,
    ProviderConnection,
    WorkflowRun,
)
from app.services.client_universe import get_envelope, upsert_entry
from app.skills import register_skill

logger = logging.getLogger(__name__)

# Seed workflows fanned out at the end of onboarding to prime the agents.
_SEED_WORKFLOWS: tuple[str, ...] = ("morning_standup_seed", "travel_research_seed")

# Expected scope per provider — written to provider_expectations KV so agents
# know what each connection is for.
_PROVIDER_SCOPE: dict[str, str] = {
    "gmail": "inbox triage and communications drafting",
    "googlecalendar": "schedule review and calendar holds",
}


def _set_provider_expectations(
    db: Session,
    client_id: uuid.UUID,
    providers: list[ProviderConnection],
) -> int:
    """Write one provider_expectations KV row per connected provider."""
    for p in providers:
        upsert_entry(
            db,
            client_id=client_id,
            category="provider_expectations",
            key=p.provider,
            value={
                "provider": p.provider,
                "status": p.status,
                "expected_scope": _PROVIDER_SCOPE.get(
                    p.provider, "general assistant support"
                ),
                "account_alias": p.account_alias,
            },
        )
    db.flush()
    return len(providers)


async def _launch_seed_workflows(client_id: uuid.UUID) -> list[str]:
    """Fan out to seed workflows. Returns launched child run IDs.

    Each launch opens its own DB session, commits, and schedules dispatch,
    so it is independent of the parent skill's session. Guarded: a failure
    logs and is skipped so onboarding never breaks on fan-out.
    """
    from app.adapters.orchestrator import InProcessOrchestratorAdapter

    orchestrator = InProcessOrchestratorAdapter()
    child_run_ids: list[str] = []
    for workflow_type in _SEED_WORKFLOWS:
        try:
            result = await orchestrator.launch(client_id, workflow_type)
            child_run_ids.append(str(result.run_id))
        except Exception as exc:
            logger.warning("Onboarding fan-out to %s failed: %s", workflow_type, exc)
    return child_run_ids

_KHADIJAH_ONBOARDING_SYSTEM = (
    "You are Khadijah, FlavorOS conductor agent. "
    "You are completing the client onboarding setup. "
    "Your job: review the client's current setup and write a clear orientation summary:\n"
    "1. Who this client is and what their key contexts are.\n"
    "2. Which providers are connected and what their current status is.\n"
    "3. What you recommend as the first three priorities to make FlavorOS useful for them.\n"
    "Be specific and actionable. Write in second person. "
    "Maximum 4 paragraphs."
)


def _emit(
    db: Session,
    task: AgentTask,
    event_type: str,
    detail: dict[str, Any] | None = None,
) -> None:
    db.add(
        AgentTaskEvent(
            client_id=task.client_id,
            agent_task_id=task.id,
            event_type=event_type,
            detail=detail or {},
        )
    )
    db.flush()


def _call_khadijah_onboarding(content: str) -> tuple[str | None, int]:
    resp = call_llm(system=_KHADIJAH_ONBOARDING_SYSTEM, content=content)
    return resp.text, resp.input_tokens


@register_skill("client_onboarding")
async def client_onboarding(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id

    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"
    timezone_str = profile.get("timezone") or "UTC"

    # Load contexts
    contexts = (
        db.execute(
            select(ClientContext).where(ClientContext.client_id == client_id)
        )
        .scalars()
        .all()
    )

    # Load provider connections
    providers = (
        db.execute(
            select(ProviderConnection).where(
                ProviderConnection.client_id == client_id
            )
        )
        .scalars()
        .all()
    )

    sections: list[str] = [
        f"Client Onboarding for {display_name}.\n",
        f"Timezone: {timezone_str}.\n",
    ]

    if contexts:
        ctx_lines = "\n".join(
            f"  - {c.type}: {c.name}" for c in contexts
        )
        sections.append(f"Contexts ({len(contexts)}):\n{ctx_lines}\n")
    else:
        sections.append("No contexts configured yet.\n")

    if providers:
        prov_lines = "\n".join(
            f"  - {p.provider} ({p.status}): {p.account_alias or 'no alias'}"
            for p in providers
        )
        sections.append(f"Provider connections ({len(providers)}):\n{prov_lines}\n")
    else:
        sections.append("No providers connected yet.\n")

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "khadijah_onboarding_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_khadijah_onboarding(content)

    _emit(
        db,
        task,
        "llm_response",
        {
            "model": "anthropic/claude-sonnet-4-6",
            "input_tokens": input_tokens,
            "chars": len(llm_text) if llm_text else 0,
        },
    )

    onboarding_body = llm_text or (
        f"Welcome to FlavorOS, {display_name}. "
        f"{len(contexts)} context(s) configured, "
        f"{len(providers)} provider(s) connected. "
        "Khadijah will guide you through your first workflows."
    )

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="khadijah",
        report_type="client_onboarding",
        summary=onboarding_body[:500],
        data={
            "contexts": len(contexts),
            "providers": len(providers),
            "display_name": display_name,
            "timezone": timezone_str,
        },
    )
    db.add(report)
    db.flush()

    # Onboarding artifact is sigma (internal) — becomes the agent anchor doc
    artifact = Artifact(
        client_id=client_id,
        kind="sigma",
        title="Client Onboarding Summary",
        body=onboarding_body,
        status="ready",
        created_by="agent:khadijah",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "onboarding_phase": "initial",
            "contexts": len(contexts),
            "providers": len(providers),
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    # HITL: client confirms their onboarding context is correct
    approval = Approval(
        client_id=client_id,
        artifact_id=artifact.id,
        governed_action="client_onboarding_confirm",
        reason=(
            "Khadijah has reviewed your onboarding setup. "
            "Approve to confirm your contexts and providers are correct "
            "and to activate your FlavorOS operating picture."
        ),
        decision="pending",
    )
    db.add(approval)
    db.flush()

    _emit(db, task, "hitl_gate", {"approval_id": str(approval.id)})

    # Set provider expectations — one KV row per connected provider.
    expectations_count = _set_provider_expectations(db, client_id, list(providers))
    _emit(
        db,
        task,
        "tool_called",
        {"tool": "set_provider_expectations", "count": expectations_count},
    )

    # Fan out to seed workflows to prime the agents (non-blocking, guarded).
    child_run_ids = await _launch_seed_workflows(client_id)
    _emit(db, task, "fan_out", {"seed_workflows": _SEED_WORKFLOWS, "child_run_ids": child_run_ids})

    # Record onboarding readiness with the fan-out result.
    upsert_entry(
        db,
        client_id=client_id,
        category="readiness",
        key="onboarding",
        value={
            "status": "orchestrated",
            "contexts": len(contexts),
            "providers": len(providers),
            "provider_expectations": expectations_count,
            "seed_run_ids": child_run_ids,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    db.flush()

    run = db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id)
    ).scalar_one_or_none()
    if run and run.status != "completed":
        run.status = "completed"
        run.completed_at = datetime.now(timezone.utc)
        run.output_data = {
            "artifact_id": str(artifact.id),
            "approval_id": str(approval.id),
            "report_id": str(report.id),
            "provider_expectations": expectations_count,
            "seed_run_ids": child_run_ids,
        }
        db.flush()

    return {
        "artifact_id": str(artifact.id),
        "approval_id": str(approval.id),
        "report_id": str(report.id),
        "onboarding_chars": len(onboarding_body),
        "contexts": len(contexts),
        "providers": len(providers),
        "provider_expectations": expectations_count,
        "seed_run_ids": child_run_ids,
    }
