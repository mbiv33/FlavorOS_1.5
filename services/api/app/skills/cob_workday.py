"""COB Work Day skill — Khadijah.

Generates an end-of-day wrap-up from:
- WorkflowRuns completed today
- Approvals decided today (approved / rejected)
- Artifacts created today
- NormalizedItems ingested today

Output:
- AgentReport (raw Khadijah output)
- Artifact (kind=report, shown on Command Center)
- Approval (HITL gate: client confirms the wrap before it is filed)
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
    NormalizedItem,
    WorkflowRun,
)
from app.services.client_universe import get_envelope
from app.skills import register_skill

logger = logging.getLogger(__name__)

_KHADIJAH_COB_SYSTEM = (
    "You are Khadijah, FlavorOS conductor agent. "
    "You prepare the client's end-of-day COB Work Day wrap-up. "
    "Your job: give the client a clear summary of what happened today. "
    "Lead with what was completed or approved. "
    "Then note what is still pending or needs attention tomorrow. "
    "Close with one carry-forward recommendation. "
    "Write in second person, professional but warm. "
    "Maximum 4 short paragraphs."
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


def _call_khadijah_cob(content: str) -> tuple[str | None, int]:
    resp = call_llm(system=_KHADIJAH_COB_SYSTEM, content=content)
    return resp.text, resp.input_tokens


@register_skill("cob_workday")
async def cob_workday(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # Workflows completed today
    completed_runs = (
        db.execute(
            select(WorkflowRun).where(
                WorkflowRun.client_id == client_id,
                WorkflowRun.status == "completed",
                WorkflowRun.completed_at >= today_start,
            )
        )
        .scalars()
        .all()
    )

    # Approvals decided today
    decided_approvals = (
        db.execute(
            select(Approval).where(
                Approval.client_id == client_id,
                Approval.decision.in_(["approved", "rejected"]),
                Approval.decided_at >= today_start,
            )
        )
        .scalars()
        .all()
    )

    # Still-pending approvals
    still_pending = (
        db.execute(
            select(Approval).where(
                Approval.client_id == client_id,
                Approval.decision == "pending",
            )
        )
        .scalars()
        .all()
    )

    # Items ingested today
    today_items = (
        db.execute(
            select(NormalizedItem).where(
                NormalizedItem.client_id == client_id,
                NormalizedItem.created_at >= today_start,
            )
        )
        .scalars()
        .all()
    )

    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"

    # Build LLM prompt
    sections: list[str] = [f"COB Work Day wrap-up for {display_name}.\n"]

    if completed_runs:
        run_lines = "\n".join(
            f"- {r.workflow_type} ({r.agent or 'system'})"
            for r in completed_runs
        )
        sections.append(f"Workflows completed today ({len(completed_runs)}):\n{run_lines}\n")
    else:
        sections.append("No workflows completed today.\n")

    if decided_approvals:
        dec_lines = "\n".join(
            f"- {a.governed_action}: {a.decision}"
            for a in decided_approvals
        )
        sections.append(
            f"Approvals decided today ({len(decided_approvals)}):\n{dec_lines}\n"
        )

    if still_pending:
        pend_lines = "\n".join(
            f"- {a.governed_action}: {(a.reason or '')[:80]}"
            for a in still_pending
        )
        sections.append(
            f"Still pending approval ({len(still_pending)}):\n{pend_lines}\n"
        )

    sections.append(f"Items ingested today: {len(today_items)}\n")

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "khadijah_cob_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_khadijah_cob(content)

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

    wrap_body = llm_text or (
        f"Good work today, {display_name}. "
        f"{len(completed_runs)} workflow(s) completed, "
        f"{len(decided_approvals)} approval(s) decided, "
        f"{len(still_pending)} still pending. "
        "Review pending items before you close out."
    )

    run_id = task.workflow_run_id

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="khadijah",
        report_type="cob_workday",
        summary=wrap_body[:500],
        data={
            "completed_runs": len(completed_runs),
            "decided_approvals": len(decided_approvals),
            "still_pending": len(still_pending),
            "today_items": len(today_items),
        },
    )
    db.add(report)
    db.flush()

    artifact = Artifact(
        client_id=client_id,
        kind="report",
        title="COB Work Day",
        body=wrap_body,
        status="ready",
        created_by="agent:khadijah",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "completed_runs": len(completed_runs),
            "still_pending": len(still_pending),
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    approval = Approval(
        client_id=client_id,
        artifact_id=artifact.id,
        governed_action="cob_workday_review",
        reason=(
            "Khadijah has prepared your COB Work Day wrap-up. "
            "Review and approve to file it before you close out."
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
        "wrap_chars": len(wrap_body),
        "completed_runs": len(completed_runs),
        "still_pending": len(still_pending),
    }
