"""Provider First Sync Review skill — Sinclair.

Runs after a provider sync completes. Reads the NormalizedItems produced by
the sync, classifies their urgency, and writes a structured review artifact
for the client's attention.

Input (from task.payload.inputs):
- workflow_run_id: the sync WorkflowRun that produced the items (optional)

Output:
- AgentReport (raw Sinclair output)
- Artifact (kind=report, shown on Command Center)
- Approval (HITL gate: client reviews the sync summary)
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
    ProviderConnection,
    WorkflowRun,
)
from app.services.client_universe import get_envelope
from app.skills import register_skill

logger = logging.getLogger(__name__)

_SINCLAIR_SYSTEM = (
    "You are Sinclair, FlavorOS communications and provider agent. "
    "You have just completed a provider sync for the client. "
    "Your job: give a concise, structured review of what arrived. "
    "Group items by type (email, calendar, file, etc.). "
    "Flag anything that looks urgent or requires a decision. "
    "Keep it factual and scannable — no filler. "
    "Write in second person, professional tone. "
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


def _call_sinclair(content: str) -> tuple[str | None, int]:
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
            system=_SINCLAIR_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text if response.content else None
        tokens = getattr(response.usage, "input_tokens", 0)
        return text, tokens
    except Exception as exc:
        logger.warning("Sinclair LLM call failed: %s", exc)
        return None, 0


@register_skill("provider_first_sync_review")
async def provider_first_sync_review(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id

    # Look back 72 h for items (covers the sync window)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=72)

    recent_items = (
        db.execute(
            select(NormalizedItem)
            .where(
                NormalizedItem.client_id == client_id,
                NormalizedItem.created_at >= cutoff,
            )
            .order_by(NormalizedItem.created_at.desc())
            .limit(50)
        )
        .scalars()
        .all()
    )

    # Load connected providers for context
    connected_providers = (
        db.execute(
            select(ProviderConnection).where(
                ProviderConnection.client_id == client_id,
                ProviderConnection.enabled.is_(True),
            )
        )
        .scalars()
        .all()
    )

    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"

    # Group items by type
    by_type: dict[str, list[NormalizedItem]] = {}
    for item in recent_items:
        by_type.setdefault(item.item_type or "unknown", []).append(item)

    sections: list[str] = [
        f"Provider First Sync Review for {display_name}.\n",
        f"Connected providers: {', '.join(p.provider for p in connected_providers) or 'none'}.\n",
        f"Total items ingested: {len(recent_items)}.\n",
    ]

    for item_type, items in by_type.items():
        lines = "\n".join(f"  - {i.title}" for i in items[:10])
        sections.append(f"{item_type.title()} ({len(items)}):\n{lines}\n")

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "sinclair_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_sinclair(content)

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

    review_body = llm_text or (
        f"Sync complete, {display_name}. "
        f"{len(recent_items)} items ingested across "
        f"{len(by_type)} type(s). "
        "Review the inbox for items requiring your attention."
    )

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="sinclair",
        report_type="provider_first_sync_review",
        summary=review_body[:500],
        data={
            "total_items": len(recent_items),
            "by_type": {k: len(v) for k, v in by_type.items()},
            "providers": [p.provider for p in connected_providers],
        },
    )
    db.add(report)
    db.flush()

    artifact = Artifact(
        client_id=client_id,
        kind="report",
        title="Provider Sync Review",
        body=review_body,
        status="ready",
        created_by="agent:sinclair",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "total_items": len(recent_items),
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    approval = Approval(
        client_id=client_id,
        artifact_id=artifact.id,
        governed_action="provider_sync_review",
        reason=(
            "Sinclair has reviewed your provider sync. "
            "Approve to confirm you've seen the summary and are ready to act on any items."
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
        "review_chars": len(review_body),
        "total_items": len(recent_items),
    }
