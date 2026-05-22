"""Comms & Calendar meeting skill — Sinclair.

Prepares the Comms & Calendar meeting surface:
- Triage recent emails by urgency
- Surface calendar conflicts and upcoming events
- Identify pending drafts / outbound actions

Output:
- AgentReport (Sinclair prep output)
- Artifact (kind=report, shown on Command Center)
- Approval (HITL gate: client reviews before the meeting begins)
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
    OutboundAction,
    WorkflowRun,
)
from app.services.client_universe import get_envelope
from app.skills import register_skill

logger = logging.getLogger(__name__)

_SINCLAIR_COMMS_CAL_SYSTEM = (
    "You are Sinclair, FlavorOS communications and calendar agent. "
    "You are preparing the Comms & Calendar meeting for the client. "
    "Structure your output in three sections:\n"
    "1. INBOX TRIAGE: urgent and needs-attention emails with recommended next steps.\n"
    "2. CALENDAR: upcoming events, conflicts to resolve, and scheduling notes.\n"
    "3. OUTBOX: pending outbound items and drafts awaiting approval.\n"
    "Be concise and actionable. Write in second person. "
    "Maximum 6 short paragraphs total."
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


def _call_sinclair_comms_cal(content: str) -> tuple[str | None, int]:
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
            system=_SINCLAIR_COMMS_CAL_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text if response.content else None
        tokens = getattr(response.usage, "input_tokens", 0)
        return text, tokens
    except Exception as exc:
        logger.warning("Sinclair Comms/Cal LLM call failed: %s", exc)
        return None, 0


@register_skill("comms_calendar")
async def comms_calendar(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)

    # Email and calendar items from last 48 h
    recent_items = (
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

    email_items = [i for i in recent_items if "email" in (i.item_type or "")]
    cal_items = [i for i in recent_items if "calendar" in (i.item_type or "")]

    # Pending outbound actions (drafts queued)
    pending_outbound = (
        db.execute(
            select(OutboundAction).where(
                OutboundAction.client_id == client_id,
                OutboundAction.status == "queued",
            )
        )
        .scalars()
        .all()
    )

    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"

    sections: list[str] = [
        f"Comms & Calendar meeting prep for {display_name}.\n",
        f"Emails: {len(email_items)}, Calendar events: {len(cal_items)}, "
        f"Pending outbound: {len(pending_outbound)}.\n",
    ]

    if email_items:
        lines = "\n".join(f"  - {i.title}" for i in email_items[:12])
        sections.append(f"Recent emails ({len(email_items)}):\n{lines}\n")

    if cal_items:
        lines = "\n".join(f"  - {i.title}" for i in cal_items[:8])
        sections.append(f"Calendar items ({len(cal_items)}):\n{lines}\n")

    if pending_outbound:
        lines = "\n".join(
            f"  - {a.action_type} via {a.provider}"
            for a in pending_outbound[:6]
        )
        sections.append(f"Pending outbound ({len(pending_outbound)}):\n{lines}\n")

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "sinclair_comms_cal_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_sinclair_comms_cal(content)

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

    prep_body = llm_text or (
        f"Comms & Calendar prepared for {display_name}. "
        f"{len(email_items)} email(s), {len(cal_items)} calendar item(s), "
        f"{len(pending_outbound)} pending outbound action(s)."
    )

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="sinclair",
        report_type="comms_calendar",
        summary=prep_body[:500],
        data={
            "email_items": len(email_items),
            "cal_items": len(cal_items),
            "pending_outbound": len(pending_outbound),
        },
    )
    db.add(report)
    db.flush()

    artifact = Artifact(
        client_id=client_id,
        kind="report",
        title="Comms & Calendar",
        body=prep_body,
        status="ready",
        created_by="agent:sinclair",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "email_items": len(email_items),
            "pending_outbound": len(pending_outbound),
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    approval = Approval(
        client_id=client_id,
        artifact_id=artifact.id,
        governed_action="comms_calendar_review",
        reason=(
            "Sinclair has prepared the Comms & Calendar meeting brief. "
            "Review and approve to open the meeting."
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
        "prep_chars": len(prep_body),
        "email_items": len(email_items),
        "cal_items": len(cal_items),
    }
