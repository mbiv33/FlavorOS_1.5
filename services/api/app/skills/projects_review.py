"""Projects Review skill — Khadijah.

Prepares the Projects Review meeting surface:
- Active projects and their status from Client Universe
- Recent project-related artifacts
- Open decisions and pending approvals linked to project work
- Blockers or items needing escalation

Output:
- AgentReport (Khadijah prep output)
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
    ClientUniverseEntry,
    WorkflowRun,
)
from app.services.client_universe import get_envelope
from app.skills import register_skill

logger = logging.getLogger(__name__)

_KHADIJAH_PROJECTS_SYSTEM = (
    "You are Khadijah, FlavorOS conductor agent. "
    "You are preparing the Projects Review meeting for the client. "
    "Structure your output in three sections:\n"
    "1. STATUS BY PROJECT: what's on track, what's at risk, what's blocked.\n"
    "2. OPEN DECISIONS: decisions that need the client's input to unblock progress.\n"
    "3. NEXT STEPS: one recommended priority action per project, maximum three projects.\n"
    "Be concise and decision-focused. Write in second person. "
    "Maximum 5 short paragraphs total."
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


def _call_khadijah_projects(content: str) -> tuple[str | None, int]:
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
            system=_KHADIJAH_PROJECTS_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text if response.content else None
        tokens = getattr(response.usage, "input_tokens", 0)
        return text, tokens
    except Exception as exc:
        logger.warning("Khadijah Projects LLM call failed: %s", exc)
        return None, 0


@register_skill("projects_review")
async def projects_review(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id
    recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    # Load project entries from Client Universe
    project_entries = (
        db.execute(
            select(ClientUniverseEntry).where(
                ClientUniverseEntry.client_id == client_id,
                ClientUniverseEntry.category.in_(["projects", "milestones", "goals"]),
            )
        )
        .scalars()
        .all()
    )

    # Recent artifacts (reports, work products from last 7 days)
    recent_artifacts = (
        db.execute(
            select(Artifact)
            .where(
                Artifact.client_id == client_id,
                Artifact.kind == "report",
                Artifact.created_at >= recent_cutoff,
            )
            .order_by(Artifact.created_at.desc())
            .limit(10)
        )
        .scalars()
        .all()
    )

    # Pending approvals
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

    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"

    sections: list[str] = [
        f"Projects Review prep for {display_name}.\n",
        f"Project entries: {len(project_entries)}, "
        f"Recent artifacts (7d): {len(recent_artifacts)}, "
        f"Pending approvals: {len(pending_approvals)}.\n",
    ]

    if project_entries:
        lines = "\n".join(
            f"  - [{e.category}] {e.key}: {str(e.value)[:100]}"
            for e in project_entries[:15]
        )
        sections.append(f"Project / goal entries:\n{lines}\n")
    else:
        sections.append("No project entries in Client Universe yet.\n")

    if recent_artifacts:
        lines = "\n".join(f"  - {a.title} ({a.status})" for a in recent_artifacts[:5])
        sections.append(f"Recent work artifacts:\n{lines}\n")

    if pending_approvals:
        lines = "\n".join(
            f"  - {a.governed_action}: {(a.reason or '')[:80]}"
            for a in pending_approvals[:6]
        )
        sections.append(f"Pending approvals ({len(pending_approvals)}):\n{lines}\n")

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "khadijah_projects_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_khadijah_projects(content)

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
        f"Projects Review prepared for {display_name}. "
        f"{len(project_entries)} project entry(ies) in context, "
        f"{len(pending_approvals)} pending approval(s). "
        "Open the Projects surface to review status and open decisions."
    )

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="khadijah",
        report_type="projects_review",
        summary=prep_body[:500],
        data={
            "project_entries": len(project_entries),
            "recent_artifacts": len(recent_artifacts),
            "pending_approvals": len(pending_approvals),
        },
    )
    db.add(report)
    db.flush()

    artifact = Artifact(
        client_id=client_id,
        kind="report",
        title="Projects Review",
        body=prep_body,
        status="ready",
        created_by="agent:khadijah",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "project_entries": len(project_entries),
            "pending_approvals": len(pending_approvals),
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    approval = Approval(
        client_id=client_id,
        artifact_id=artifact.id,
        governed_action="projects_review_brief",
        reason=(
            "Khadijah has prepared the Projects Review brief. "
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
        "project_entries": len(project_entries),
        "pending_approvals": len(pending_approvals),
    }
