"""Processor for the communication_sweep workflow.

Runs after every incremental provider sync (re-syncs after the first).
Creates an Artifact (Sinclair's sweep summary) and an Approval (HITL gate)
so the client can confirm ingested items look right before Khadijah routes
any of them toward tasks or projects via PAC/PTQ.

Idempotency: if the WorkflowRun is already completed the processor returns
immediately, making it safe to call more than once per run.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AgentTask, Approval, Artifact, NormalizedItem, WorkflowRun
from app.services.client_universe import get_envelope

logger = logging.getLogger(__name__)


def _sinclair_sweep_system(provider: str) -> str:
    if provider == "googlecalendar":
        return (
            "You are Sinclair, FlavorOS communications agent. "
            "Summarize the following new calendar events for the client's Command Center. "
            "Lead with scheduling conflicts or high-priority commitments. "
            "Reply with 2-3 sentences only, no bullet points."
        )
    return (
        "You are Sinclair, FlavorOS communications agent. "
        "Summarize the following new Gmail messages for the client's Command Center. "
        "Lead with anything requiring action or time-sensitive replies. "
        "Reply with 2-3 sentences only, no bullet points."
    )


def _call_sinclair_sweep(items: list[dict], provider: str = "gmail") -> str | None:
    """Call Claude to summarize new provider items. Returns None on any failure."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        return None
    try:
        import anthropic

        if provider == "googlecalendar":
            lines = "\n".join(
                f"- {i.get('summary', '(no title)')}: "
                f"{i.get('start', '')} to {i.get('end', '')}"
                for i in items
            )
            content = f"Here are {len(items)} new calendar events:\n{lines}"
        else:
            lines = "\n".join(
                f"- {i.get('subject', '(no subject)')}: {i.get('snippet', '')}"
                for i in items
            )
            content = f"Here are {len(items)} new Gmail messages:\n{lines}"

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            timeout=30.0,
            system=_sinclair_sweep_system(provider),
            messages=[{"role": "user", "content": content}],
        )
        return response.content[0].text if response.content else None
    except Exception as exc:
        logger.warning("Sinclair sweep LLM call failed (using canned text): %s", exc)
        return None


def process_communication_sweep(db: Session, workflow_run_id: uuid.UUID) -> None:
    """Create Artifact + Approval for a queued communication_sweep WorkflowRun."""

    run = db.execute(
        select(WorkflowRun).where(WorkflowRun.id == workflow_run_id)
    ).scalar_one_or_none()

    if run is None or run.status == "completed":
        return

    run.status = "running"
    run.started_at = datetime.now(timezone.utc)
    db.flush()

    provider = (run.input_data or {}).get("provider", "gmail")
    provider_label = provider.replace("googlecalendar", "Google Calendar").replace("gmail", "Gmail")

    normalized_item_id = (run.input_data or {}).get("normalized_item_id")
    items: list[dict] = []
    if normalized_item_id:
        ni = db.execute(
            select(NormalizedItem).where(NormalizedItem.id == uuid.UUID(normalized_item_id))
        ).scalar_one_or_none()
        if ni and ni.data:
            items = ni.data.get("items") or []

    if items:
        llm_body = _call_sinclair_sweep(items, provider=provider)
        noun = "events" if provider == "googlecalendar" else "messages"
        title = f"{provider_label} sweep ({len(items)} new {noun})"
        body = llm_body or (
            f"Sinclair reviewed {len(items)} new {noun} from your {provider_label} account. "
            "Approve this sweep to confirm ingested items look as expected."
        )
    else:
        title = f"{provider_label} sweep — no new items"
        body = (
            f"Sinclair completed a {provider_label} sweep. "
            "No new items were found since the last sync."
        )

    artifact = Artifact(
        client_id=run.client_id,
        kind="report",
        title=title,
        body=body,
        status="ready",
        created_by="system:communication_sweep",
        workflow_run_id=run.id,
        meta={
            "provider": provider,
            "provider_connection_id": (run.input_data or {}).get("provider_connection_id"),
            "normalized_item_id": normalized_item_id,
            "items_count": len(items),
        },
    )
    db.add(artifact)
    db.flush()

    approval = Approval(
        client_id=run.client_id,
        artifact_id=artifact.id,
        governed_action="communication_sweep_review",
        reason=(
            f"{provider_label} sweep complete — review the new items and confirm "
            "the sync looks correct before Khadijah routes anything to tasks."
        ),
        decision="pending",
    )
    db.add(approval)
    db.flush()

    task = db.execute(
        select(AgentTask).where(
            AgentTask.workflow_run_id == run.id,
            AgentTask.task_type == "communication_sweep_review",
        )
    ).scalar_one_or_none()

    envelope = get_envelope(db, run.client_id)
    universe_context = {
        "profile_display_name": (envelope.profile or {}).get("display_name"),
        "context_count": len(envelope.contexts),
        "onboarding_status": (envelope.onboarding or {}).get("status"),
        "readiness": envelope.readiness,
    }

    if task is not None:
        task.status = "completed"
        task.result = {
            "artifact_id": str(artifact.id),
            "approval_id": str(approval.id),
            "universe_context": universe_context,
        }

    run.status = "completed"
    run.completed_at = datetime.now(timezone.utc)
    run.output_data = {
        "artifact_id": str(artifact.id),
        "approval_id": str(approval.id),
        "universe_context": universe_context,
    }

    db.commit()
