"""Communication Sweep Review skill — Sinclair.

Reads recent NormalizedItems, classifies by urgency, and produces a
structured communications triage artifact for the client.

Output:
- AgentReport (raw Sinclair output)
- Artifact (kind=report, shown on Command Center)
- Approval (HITL gate: client reviews the sweep)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
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
    NormalizedItem,
    WorkflowRun,
)
from app.services.client_universe import get_envelope
from app.skills import register_skill

logger = logging.getLogger(__name__)

_SINCLAIR_SWEEP_SYSTEM = (
    "You are Sinclair, FlavorOS communications agent. "
    "You are running a communication sweep for the client. "
    "Your job: triage recent communications by urgency. "
    "Group into: URGENT (needs response today), NEEDS ATTENTION (respond within 48h), "
    "UPDATES (informational, no action needed), FYI (low priority). "
    "For each item flag the sender, subject, and recommended next step. "
    "Write in second person, concise and actionable. "
    "Maximum 5 short paragraphs."
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


def _call_sinclair_sweep(content: str) -> tuple[str | None, int]:
    settings = get_settings()
    if not settings.anthropic_api_key:
        return None, 0
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=768,
            timeout=30.0,
            system=_SINCLAIR_SWEEP_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text if response.content else None
        tokens = getattr(response.usage, "input_tokens", 0)
        return text, tokens
    except Exception as exc:
        logger.warning("Sinclair Sweep LLM call failed: %s", exc)
        return None, 0


@register_skill("communication_sweep_review")
async def communication_sweep_review(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id

    # Sweep the last 48 h of communications
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)

    comms_items = (
        db.execute(
            select(NormalizedItem)
            .where(
                NormalizedItem.client_id == client_id,
                NormalizedItem.created_at >= cutoff,
            )
            .order_by(NormalizedItem.created_at.desc())
            .limit(40)
        )
        .scalars()
        .all()
    )

    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"

    email_items = [i for i in comms_items if "email" in (i.item_type or "")]
    cal_items = [i for i in comms_items if "calendar" in (i.item_type or "")]
    other_items = [i for i in comms_items if i not in email_items and i not in cal_items]

    sections: list[str] = [
        f"Communication Sweep for {display_name} — last 48 hours.\n",
        f"Total items: {len(comms_items)} "
        f"({len(email_items)} email, {len(cal_items)} calendar, {len(other_items)} other).\n",
    ]

    if email_items:
        lines = "\n".join(f"  - {i.title}" for i in email_items[:15])
        sections.append(f"Email items ({len(email_items)}):\n{lines}\n")

    if cal_items:
        lines = "\n".join(f"  - {i.title}" for i in cal_items[:10])
        sections.append(f"Calendar items ({len(cal_items)}):\n{lines}\n")

    if other_items:
        lines = "\n".join(f"  - {i.title}" for i in other_items[:5])
        sections.append(f"Other items ({len(other_items)}):\n{lines}\n")

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "sinclair_sweep_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_sinclair_sweep(content)

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

    sweep_body = llm_text or (
        f"Communication sweep complete, {display_name}. "
        f"{len(email_items)} email(s), {len(cal_items)} calendar item(s) reviewed. "
        "Open your inbox to review items requiring a response."
    )

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="sinclair",
        report_type="communication_sweep_review",
        summary=sweep_body[:500],
        data={
            "total_items": len(comms_items),
            "email_items": len(email_items),
            "cal_items": len(cal_items),
            "other_items": len(other_items),
        },
    )
    db.add(report)
    db.flush()

    artifact = Artifact(
        client_id=client_id,
        kind="report",
        title="Communication Sweep",
        body=sweep_body,
        status="ready",
        created_by="agent:sinclair",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "email_items": len(email_items),
            "cal_items": len(cal_items),
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    approval = Approval(
        client_id=client_id,
        artifact_id=artifact.id,
        governed_action="comms_sweep_review",
        reason=(
            "Sinclair has completed a communication sweep. "
            "Approve to confirm you've reviewed the triage and are ready to act."
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
        "sweep_chars": len(sweep_body),
        "total_items": len(comms_items),
    }
