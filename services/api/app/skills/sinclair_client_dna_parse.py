"""Client DNA Parse skill — Sinclair.

Reads NormalizedItems from the CU DB, calls the LLM to extract structured
candidates across four domains (contacts, locations, entities, projects),
writes ClientDnaCandidate rows, and ingests each to GBrain when live.

No approval gate — this is a background parse step. HITL verification is
the Lane Z gate (admin review queue).

Output:
- AgentReport (parse stats)
- Artifact (kind=report, visible on Command Center)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_gbrain_adapter
from app.models import AgentReport, AgentTask, AgentTaskEvent, Artifact, WorkflowRun
from app.skills import register_skill
from app.workflows.client_dna_parse import DNA_DOMAINS, run_client_dna_parse

logger = logging.getLogger(__name__)


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


@register_skill("client_dna_parse")
async def client_dna_parse(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id

    input_data = task.input_data or {}
    sweep_window = input_data.get("sweep_window")
    lookback_hours = int(input_data.get("lookback_hours", 72))

    _emit(db, task, "parse_started", {
        "sweep_window": sweep_window, "lookback_hours": lookback_hours
    })

    gbrain = get_gbrain_adapter()
    parse = await run_client_dna_parse(
        db,
        client_id=client_id,
        workflow_run_id=run_id,
        gbrain=gbrain,
        sweep_window=sweep_window,
        lookback_hours=lookback_hours,
    )

    _emit(db, task, "parse_complete", {
        "total_items_read": parse.total_items_read,
        "candidates_written": parse.candidates_written,
        "gbrain_ingested": parse.gbrain_ingested,
        "by_domain": parse.by_domain,
    })

    domain_lines = "\n".join(
        f"  {d}: {parse.by_domain.get(d, 0)} candidate(s)" for d in DNA_DOMAINS
    )
    body = (
        f"DNA parse complete.\n"
        f"Items read: {parse.total_items_read}\n"
        f"Candidates extracted: {parse.candidates_written}\n"
        f"GBrain ingested: {parse.gbrain_ingested}\n\n"
        f"By domain:\n{domain_lines}"
    )
    if parse.errors:
        body += f"\n\nErrors ({len(parse.errors)}):\n" + "\n".join(parse.errors[:5])

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="sinclair",
        report_type="client_dna_parse",
        summary=body[:500],
        data={
            "total_items_read": parse.total_items_read,
            "candidates_written": parse.candidates_written,
            "gbrain_ingested": parse.gbrain_ingested,
            "by_domain": parse.by_domain,
            "errors": parse.errors[:10],
        },
    )
    db.add(report)
    db.flush()

    artifact = Artifact(
        client_id=client_id,
        kind="report",
        title="Client DNA Parse",
        body=body,
        status="ready",
        created_by="agent:sinclair",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "candidates_written": parse.candidates_written,
            "artifact_type": "client_dna_parse",
            "sweep_window": sweep_window,
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
            "candidates_written": parse.candidates_written,
            "by_domain": parse.by_domain,
        }
        db.flush()

    return {
        "artifact_id": str(artifact.id),
        "report_id": str(report.id),
        "candidates_written": parse.candidates_written,
        "gbrain_ingested": parse.gbrain_ingested,
        "by_domain": parse.by_domain,
    }
