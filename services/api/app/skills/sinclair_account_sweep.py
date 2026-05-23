"""Account Sweep skill — Sinclair.

Pulls historical provider data across a time window into the CU DB so that
the DNA parse track (Lane Y) has a full owned dataset to work from.

Output:
- AgentReport (sweep stats)
- Artifact (kind=report, shown on Command Center)

No approval gate here — this is a background ingestion step. The DNA
HITL verification (Lane Z) is the downstream gate.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_composio_adapter
from app.llm import call_llm
from app.models import (
    AgentReport,
    AgentTask,
    AgentTaskEvent,
    Artifact,
    WorkflowRun,
)
from app.skills import register_skill
from app.workflows.account_sweep import SWEEP_WINDOWS, run_account_sweep

logger = logging.getLogger(__name__)

_SINCLAIR_SWEEP_SYSTEM = (
    "You are Sinclair, FlavorOS communications agent. "
    "You have just completed a historical account sweep for the client. "
    "Summarize what was ingested in plain English: how many items per provider, "
    "what time window was covered, and what this data will be used for. "
    "Be concise — 2-3 sentences. Mention that DNA parsing will follow."
)


def _emit(
    db: Session, task: AgentTask, event_type: str, detail: dict[str, Any] | None = None
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


@register_skill("account_sweep")
async def account_sweep(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id

    input_data = task.input_data or {}
    window = input_data.get("window", "180d")
    if window not in SWEEP_WINDOWS:
        window = "180d"

    _emit(db, task, "sweep_started", {"window": window})

    composio = get_composio_adapter()
    sweep = await run_account_sweep(db, client_id=client_id, window=window, composio=composio)

    provider_lines = []
    for pr in sweep.providers:
        line = f"{pr.provider}: {pr.new_items} new, {pr.skipped_items} already ingested"
        if pr.errors:
            line += f" ({len(pr.errors)} errors)"
        provider_lines.append(line)

    stats_text = "\n".join(provider_lines) if provider_lines else "No connected providers found."
    content = (
        f"Account sweep complete.\n"
        f"Window: {window} ({sweep.since.strftime('%Y-%m-%d')} "
        f"to {sweep.until.strftime('%Y-%m-%d')})\n"
        f"Total new items ingested: {sweep.total_new}\n"
        f"Already present (skipped): {sweep.total_skipped}\n\n"
        f"Per-provider breakdown:\n{stats_text}"
    )

    _emit(db, task, "tool_called", {"tool": "sinclair_account_sweep_llm", "window": window})

    resp = call_llm(system=_SINCLAIR_SWEEP_SYSTEM, content=content, max_tokens=256)
    llm_text = resp.text

    _emit(db, task, "llm_response", {"chars": len(llm_text) if llm_text else 0})

    body = llm_text or (
        f"Account sweep complete for {window} window. "
        f"{sweep.total_new} new item(s) ingested across {len(sweep.providers)} provider(s). "
        "DNA parsing will follow."
    )

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="sinclair",
        report_type="account_sweep",
        summary=body[:500],
        data={
            "window": window,
            "since": sweep.since.isoformat(),
            "until": sweep.until.isoformat(),
            "total_new": sweep.total_new,
            "total_skipped": sweep.total_skipped,
            "providers": [
                {
                    "provider": p.provider,
                    "new_items": p.new_items,
                    "skipped_items": p.skipped_items,
                    "errors": p.errors,
                }
                for p in sweep.providers
            ],
        },
    )
    db.add(report)
    db.flush()

    artifact = Artifact(
        client_id=client_id,
        kind="report",
        title=f"Account Sweep — {window}",
        body=body,
        status="ready",
        created_by="agent:sinclair",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "window": window,
            "total_new": sweep.total_new,
            "artifact_type": "account_sweep",
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    run = db.execute(select(WorkflowRun).where(WorkflowRun.id == run_id)).scalar_one_or_none()
    if run and run.status != "completed":
        run.status = "completed"
        run.completed_at = datetime.now(timezone.utc)
        run.output_data = {
            "artifact_id": str(artifact.id),
            "report_id": str(report.id),
            "window": window,
            "total_new": sweep.total_new,
        }
        db.flush()

    return {
        "artifact_id": str(artifact.id),
        "report_id": str(report.id),
        "window": window,
        "total_new": sweep.total_new,
        "total_skipped": sweep.total_skipped,
    }
