"""Morning Standup Seed skill — Khadijah.

One-time prep run during client onboarding. Reads the Client Universe
profile and context to produce an initial "anchor" artifact that primes
Khadijah's first real Morning Standup.

Output:
- AgentReport (seed output)
- Artifact (kind=sigma, internal agent reference)
- No Approval gate (seed artifacts don't require HITL)
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
    Artifact,
    WorkflowRun,
)
from app.services.client_universe import get_envelope
from app.skills import register_skill

logger = logging.getLogger(__name__)

_KHADIJAH_SEED_SYSTEM = (
    "You are Khadijah, FlavorOS conductor agent. "
    "You are setting up the client's initial Morning Standup profile. "
    "Your job: write a brief orientation note — who this client is, "
    "what matters to them, and what a good standup should focus on. "
    "This note anchors your first real standup. Be specific and practical. "
    "Maximum 3 short paragraphs."
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


def _call_khadijah_seed(content: str) -> tuple[str | None, int]:
    resp = call_llm(system=_KHADIJAH_SEED_SYSTEM, content=content, max_tokens=400)
    return resp.text, resp.input_tokens


@register_skill("morning_standup_seed")
async def morning_standup_seed(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id

    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"
    timezone_str = profile.get("timezone") or "UTC"

    # Gather context from Client Universe
    contexts = envelope.contexts or []
    context_summaries = [
        f"{c.get('type', 'unknown')} context: {c.get('name', 'unnamed')}"
        for c in contexts
        if isinstance(c, dict)
    ]

    sections: list[str] = [
        f"Morning Standup Seed for {display_name}.\n",
        f"Timezone: {timezone_str}.\n",
    ]
    if context_summaries:
        sections.append(
            "Active contexts:\n"
            + "\n".join(f"  - {s}" for s in context_summaries)
            + "\n"
        )
    onboarding = envelope.onboarding or {}
    if onboarding:
        sections.append(
            "Onboarding state: "
            + ", ".join(f"{k}={v}" for k, v in list(onboarding.items())[:5])
            + "\n"
        )

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "khadijah_seed_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_khadijah_seed(content)

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

    seed_body = llm_text or (
        f"Morning Standup seeded for {display_name}. "
        f"Timezone: {timezone_str}. "
        "Khadijah will run the first real standup when scheduled."
    )

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="khadijah",
        report_type="morning_standup_seed",
        summary=seed_body[:500],
        data={
            "display_name": display_name,
            "timezone": timezone_str,
            "context_count": len(contexts),
        },
    )
    db.add(report)
    db.flush()

    # Seed artifacts are sigma (internal) — not shown on Command Center by default
    artifact = Artifact(
        client_id=client_id,
        kind="sigma",
        title="Morning Standup Seed",
        body=seed_body,
        status="ready",
        created_by="agent:khadijah",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "seed_type": "morning_standup",
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    run = db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id)
    ).scalar_one_or_none()
    if run and run.status != "completed":
        run.status = "completed"
        run.completed_at = datetime.now(timezone.utc)
        run.output_data = {
            "artifact_id": str(artifact.id),
            "report_id": str(report.id),
        }
        db.flush()

    return {
        "artifact_id": str(artifact.id),
        "report_id": str(report.id),
        "seed_chars": len(seed_body),
    }
