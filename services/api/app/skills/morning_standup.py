"""Morning Standup skill — Khadijah.

Generates a prioritized daily briefing from:
- pending Approvals requiring the client's decision
- recent NormalizedItems (emails, calendar events) from the last 48 h
- Client Universe profile and context summary

Output:
- AgentReport (raw Khadijah output)
- Artifact (kind=report, shown on Command Center)
- Approval (HITL gate: client confirms the briefing before it is "active")
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

_KHADIJAH_SYSTEM = (
    "You are Khadijah, FlavorOS conductor agent. "
    "You prepare the client's daily Morning Standup briefing. "
    "Your job: give the client a clear, calm operating picture for the day. "
    "Lead with anything that needs a decision or approval today. "
    "Then cover scheduled meetings or events. "
    "Then surface emails or items that warrant attention. "
    "Close with a one-sentence priority recommendation. "
    "Write in second person, professional but warm. "
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


def _call_khadijah(content: str) -> tuple[str | None, int]:
    """Call Claude as Khadijah. Returns (text, input_tokens)."""
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
            system=_KHADIJAH_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text if response.content else None
        tokens = getattr(response.usage, "input_tokens", 0)
        return text, tokens
    except Exception as exc:
        logger.warning("Khadijah LLM call failed: %s", exc)
        return None, 0


@register_skill("morning_standup")
async def morning_standup(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)

    # Load pending approvals
    pending_approvals = (
        db.execute(
            select(Approval).where(
                Approval.client_id == client_id,
                Approval.decision == "pending",
            )
        )
        .scalars()
        .all()
    )

    # Load recent NormalizedItems
    recent_items = (
        db.execute(
            select(NormalizedItem)
            .where(
                NormalizedItem.client_id == client_id,
                NormalizedItem.created_at >= cutoff,
            )
            .order_by(NormalizedItem.created_at.desc())
            .limit(20)
        )
        .scalars()
        .all()
    )

    # Load Client Universe envelope for profile context
    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"

    # Build LLM prompt
    sections: list[str] = [f"Morning Standup for {display_name}.\n"]

    if pending_approvals:
        approval_lines = "\n".join(
            f"- {a.governed_action}: {a.reason[:120] if a.reason else '(no reason)'}"
            for a in pending_approvals
        )
        sections.append(f"Pending approvals ({len(pending_approvals)}):\n{approval_lines}\n")
    else:
        sections.append("No pending approvals.\n")

    email_items = [
        i for i in recent_items if "email" in (i.item_type or "")
    ]
    cal_items = [
        i for i in recent_items if "calendar" in (i.item_type or "")
    ]

    if cal_items:
        cal_lines = "\n".join(f"- {i.title}" for i in cal_items[:5])
        sections.append(f"Recent calendar events:\n{cal_lines}\n")

    if email_items:
        email_lines = "\n".join(f"- {i.title}" for i in email_items[:10])
        sections.append(f"Recent emails:\n{email_lines}\n")

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "khadijah_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_khadijah(content)

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

    briefing_body = llm_text or (
        f"Good morning, {display_name}. "
        f"You have {len(pending_approvals)} pending approval(s) and "
        f"{len(recent_items)} recent item(s) to review. "
        "Open your approvals queue to start."
    )

    # Create AgentReport (raw output envelope)
    run_id = task.workflow_run_id
    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="khadijah",
        report_type="morning_standup",
        summary=briefing_body[:500],
        data={
            "pending_approvals": len(pending_approvals),
            "recent_items": len(recent_items),
            "email_items": len(email_items),
            "cal_items": len(cal_items),
        },
    )
    db.add(report)
    db.flush()

    # Create Artifact (visible on Command Center)
    artifact = Artifact(
        client_id=client_id,
        kind="report",
        title="Morning Standup",
        body=briefing_body,
        status="ready",
        created_by="agent:khadijah",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "pending_approvals": len(pending_approvals),
        },
    )
    db.add(artifact)
    db.flush()

    # Update AgentReport with artifact FK
    report.artifact_id = artifact.id
    db.flush()

    # HITL gate — client confirms the briefing before it is marked "active"
    approval = Approval(
        client_id=client_id,
        artifact_id=artifact.id,
        governed_action="morning_standup_review",
        reason=(
            "Khadijah has prepared your Morning Standup. "
            "Review and approve to confirm it reflects your priorities for the day."
        ),
        decision="pending",
    )
    db.add(approval)
    db.flush()

    _emit(db, task, "hitl_gate", {"approval_id": str(approval.id)})

    # Mark WorkflowRun completed
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
        "briefing_chars": len(briefing_body),
        "pending_approvals": len(pending_approvals),
        "items_reviewed": len(recent_items),
    }
