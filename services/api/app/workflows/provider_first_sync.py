"""Processor for the provider_first_sync workflow.

Materializes the Artifact + Approval rows that make the sync result
visible on the client Command Center. Designed to be called inline
from the sync_provider handler after the initial commit.

Idempotency: if the WorkflowRun is already completed the processor
returns immediately, making it safe to call more than once per run.

When NormalizedItem.data["items"] contains real email subjects+snippets,
Sinclair (claude-sonnet-4-6) generates a 2-3 sentence summary as the
artifact body. When items is empty (stub mode or empty inbox), falls
back to the canned "First inbox sweep" copy with no LLM call.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AgentTask, Approval, Artifact, NormalizedItem, WorkflowRun

logger = logging.getLogger(__name__)

_CANNED_TITLE = "First inbox sweep"
_CANNED_BODY = (
    "{provider_label} account was connected and your inbox has been reviewed. "
    "Items have been prepared for your attention. Approve this sweep to confirm "
    "that the initial sync looked as expected and nothing unexpected was ingested."
)

_SINCLAIR_SYSTEM = (
    "You are Sinclair, FlavorOS communications agent. "
    "Summarize the following Gmail messages for the client's Command Center. "
    "Lead with what needs immediate attention. Reply with 2-3 sentences only, no bullet points."
)


def _call_sinclair(items: list[dict]) -> str | None:
    """Call Claude to summarize inbox items. Returns None on any failure."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        return None

    try:
        import anthropic  # lazy: keeps module importable if package absent in dev

        message_list = "\n".join(
            f"- {item.get('subject', '(no subject)')}: {item.get('snippet', '')}"
            for item in items
        )
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            timeout=30.0,
            system=_SINCLAIR_SYSTEM,
            messages=[
                {
                    "role": "user",
                    "content": f"Here are {len(items)} Gmail messages:\n{message_list}",
                }
            ],
        )
        return response.content[0].text if response.content else None
    except Exception as exc:
        logger.warning("Sinclair LLM call failed (using canned text): %s", exc)
        return None


def process_provider_first_sync(db: Session, workflow_run_id: uuid.UUID) -> None:
    """Create Artifact + Approval for a queued provider_first_sync WorkflowRun."""

    run = db.execute(
        select(WorkflowRun).where(WorkflowRun.id == workflow_run_id)
    ).scalar_one_or_none()

    if run is None or run.status == "completed":
        return

    run.status = "running"
    run.started_at = datetime.now(timezone.utc)
    db.flush()

    provider = (run.input_data or {}).get("provider", "provider")
    provider_label = provider.replace("google", "Google ").strip().title()

    # Load email items from NormalizedItem written by sync_provider
    normalized_item_id = (run.input_data or {}).get("normalized_item_id")
    items: list[dict] = []
    if normalized_item_id:
        ni = db.execute(
            select(NormalizedItem).where(NormalizedItem.id == uuid.UUID(normalized_item_id))
        ).scalar_one_or_none()
        if ni and ni.data:
            items = ni.data.get("items") or []

    if items:
        llm_body = _call_sinclair(items)
        title = f"Gmail inbox review ({len(items)} messages)"
        body = llm_body or (
            f"Sinclair reviewed {len(items)} messages from your {provider_label} inbox. "
            "Approve this sweep to confirm the initial sync looked as expected."
        )
    else:
        title = _CANNED_TITLE
        body = f"Your {provider_label} " + _CANNED_BODY.format(provider_label=provider_label)

    artifact = Artifact(
        client_id=run.client_id,
        kind="report",
        title=title,
        body=body,
        status="ready",
        created_by="system:provider_first_sync",
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
        governed_action="provider_first_sync_review",
        reason=(
            f"First {provider_label} sync complete — please review the inbox sweep and "
            "confirm the initial data looks correct before proceeding."
        ),
        decision="pending",
    )
    db.add(approval)
    db.flush()

    task = db.execute(
        select(AgentTask).where(
            AgentTask.workflow_run_id == run.id,
            AgentTask.task_type == "provider_first_sync_review",
        )
    ).scalar_one_or_none()
    if task is not None:
        task.status = "completed"
        task.result = {
            "artifact_id": str(artifact.id),
            "approval_id": str(approval.id),
        }

    run.status = "completed"
    run.completed_at = datetime.now(timezone.utc)
    run.output_data = {
        "artifact_id": str(artifact.id),
        "approval_id": str(approval.id),
    }

    db.commit()
