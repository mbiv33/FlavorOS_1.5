"""Processor for the provider_first_sync workflow.

Materializes the Artifact + Approval rows that make the sync result
visible on the client Command Center. Designed to be called inline
from the sync_provider handler after the initial commit.

Idempotency: if the WorkflowRun is already completed the processor
returns immediately, making it safe to call more than once per run.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AgentTask, Approval, Artifact, WorkflowRun


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

    artifact = Artifact(
        client_id=run.client_id,
        kind="report",
        title="First inbox sweep",
        body=(
            f"Your {provider_label} account was connected and your inbox has been reviewed. "
            "Items have been prepared for your attention. Approve this sweep to confirm "
            "that the initial sync looked as expected and nothing unexpected was ingested."
        ),
        status="ready",
        created_by="system:provider_first_sync",
        workflow_run_id=run.id,
        meta={
            "provider": provider,
            "provider_connection_id": (run.input_data or {}).get("provider_connection_id"),
            "normalized_item_id": (run.input_data or {}).get("normalized_item_id"),
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
