"""Travel Research Seed skill — Regine.

One-time prep run during client onboarding. Reads the Client Universe
for travel preferences, frequent destinations, and travel context to
produce an initial profile that primes Regine's travel and research work.

Output:
- AgentReport (seed output)
- Artifact (kind=sigma, internal agent reference)
- No Approval gate (seed artifacts don't require HITL)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    AgentReport,
    AgentTask,
    AgentTaskEvent,
    Artifact,
    ClientUniverseEntry,
    WorkflowRun,
)
from app.services.client_universe import get_envelope
from app.skills import register_skill

logger = logging.getLogger(__name__)

_REGINE_SEED_SYSTEM = (
    "You are Regine, FlavorOS travel and research agent. "
    "You are setting up the client's initial travel and research profile. "
    "Your job: write a brief orientation note summarising what you know "
    "about this client's travel style, frequent destinations, preferences, "
    "and what great travel support looks like for them. "
    "This note anchors your future travel research and briefings. "
    "Be specific and practical. Maximum 3 short paragraphs."
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


def _call_regine_seed(content: str) -> tuple[str | None, int]:
    settings = get_settings()
    if not settings.anthropic_api_key:
        return None, 0
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=400,
            timeout=30.0,
            system=_REGINE_SEED_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text if response.content else None
        tokens = getattr(response.usage, "input_tokens", 0)
        return text, tokens
    except Exception as exc:
        logger.warning("Regine Seed LLM call failed: %s", exc)
        return None, 0


@register_skill("travel_research_seed")
async def travel_research_seed(*, db: Session, task: AgentTask) -> dict[str, Any]:
    client_id: uuid.UUID = task.client_id
    run_id = task.workflow_run_id

    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    display_name = profile.get("display_name") or "the client"

    # Load travel-category entries from Client Universe
    travel_entries = (
        db.execute(
            select(ClientUniverseEntry).where(
                ClientUniverseEntry.client_id == client_id,
                ClientUniverseEntry.category.in_(
                    ["travel", "preferences", "lifestyle", "locations"]
                ),
            )
        )
        .scalars()
        .all()
    )

    sections: list[str] = [f"Travel Research Seed for {display_name}.\n"]

    if travel_entries:
        entry_lines = "\n".join(
            f"  - [{e.category}] {e.key}: {str(e.value)[:120]}"
            for e in travel_entries[:20]
        )
        sections.append(f"Client Universe travel/preference entries:\n{entry_lines}\n")
    else:
        sections.append(
            "No travel entries in Client Universe yet — "
            "Regine will build this profile from future interactions.\n"
        )

    content = "\n".join(sections)

    _emit(db, task, "tool_called", {"tool": "regine_seed_llm", "input_chars": len(content)})

    llm_text, input_tokens = _call_regine_seed(content)

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

    seed_body = llm_text or (
        f"Travel research seeded for {display_name}. "
        f"{len(travel_entries)} preference entries loaded. "
        "Regine will build a richer travel profile as context accumulates."
    )

    report = AgentReport(
        client_id=client_id,
        workflow_run_id=run_id,
        agent_task_id=task.id,
        agent="regine",
        report_type="travel_research_seed",
        summary=seed_body[:500],
        data={
            "display_name": display_name,
            "travel_entries": len(travel_entries),
        },
    )
    db.add(report)
    db.flush()

    artifact = Artifact(
        client_id=client_id,
        kind="sigma",
        title="Travel Research Seed",
        body=seed_body,
        status="ready",
        created_by="agent:regine",
        workflow_run_id=run_id,
        meta={
            "report_id": str(report.id),
            "seed_type": "travel_research",
        },
    )
    db.add(artifact)
    db.flush()

    report.artifact_id = artifact.id
    db.flush()

    run = db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id)
    ).scalar_one_or_none()
    if run and run.status != "completed":
        run.status = "completed"
        run.completed_at = datetime.now(timezone.utc)
        run.output_data = {
            "artifact_id": str(artifact.id),
            "report_id": str(report.id),
        }
        db.flush()

    return {
        "artifact_id": str(artifact.id),
        "report_id": str(report.id),
        "seed_chars": len(seed_body),
        "travel_entries": len(travel_entries),
    }
