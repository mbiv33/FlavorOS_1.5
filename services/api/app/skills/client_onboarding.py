"""Client Onboarding skill — Khadijah.

Creates a governed Client Universe and initial provider readiness plan.
Runs once at onboarding time.

This is the initial implementation — it reads the current Client Universe
state, generates a readiness summary, and emits a sigma artifact for
agent reference. Full multi-step onboarding orchestration (context creation,
provider expectations, seed workflow chaining) is a Phase 7 deliverable.

Output:
- AgentReport (Khadijah onboarding output)
- Artifact (kind=sigma, internal agent reference)
- Approval (HITL gate: client confirms onboarding context is correct)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
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
from app.services.client_universe import get_envelope
from app.skills import register_skill

logger = logging.getLogger(__name__)

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
    settings = get_settings()
    if not settings.anthropic_api_key:
        return None, 0
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            timeout=30.0,
            system=_KHADIJAH_ONBOARDING_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text if response.content else None
        tokens = getattr(response.usage, "input_tokens", 0)
        return text, tokens
    except Exception as exc:
        logger.warning("Khadijah Onboarding LLM call failed: %s", exc)
        return None, 0


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
            "model": "claude-sonnet-4-6",
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
        }
        db.flush()

    return {
        "artifact_id": str(artifact.id),
        "approval_id": str(approval.id),
        "report_id": str(report.id),
        "onboarding_chars": len(onboarding_body),
        "contexts": len(contexts),
        "providers": len(providers),
    }
