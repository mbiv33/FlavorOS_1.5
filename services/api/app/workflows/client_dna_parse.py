"""Client DNA parse workflow — extract four-domain candidates from CU DB items.

Reads NormalizedItems from the CU DB (optionally filtered to a sweep window),
calls the LLM to extract structured candidates across four domains, writes
ClientDnaCandidate rows, and ingests each candidate into GBrain when the
adapter is live (degrades gracefully in stub mode).

Domains: contacts | locations | entities | projects
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.llm import call_llm
from app.models import ClientDnaCandidate, NormalizedItem

logger = logging.getLogger(__name__)

DNA_DOMAINS = ("contacts", "locations", "entities", "projects")

_PARSE_SYSTEM = """You are a structured data extraction agent. Given a set of communications and
calendar items, extract Client DNA candidates across four domains. Return ONLY valid JSON — no
markdown, no prose, no explanation.

Schema:
{
  "contacts": [{"name": str, "role": str|null, "context": str, "confidence": float}],
  "locations": [{"name": str, "type": str|null, "context": str, "confidence": float}],
  "entities": [{"name": str, "type": str|null, "context": str, "confidence": float}],
  "projects": [{"name": str, "description": str|null, "context": str, "confidence": float}]
}

Rules:
- contacts: real people (not generic roles). Include name, role/title if known.
- locations: physical places (cities, addresses, venues). Not vague references.
- entities: companies, organizations, affiliations. Include type (company/nonprofit/etc) if clear.
- projects: named efforts, deliverables. "Monthly report" is a project; "replied" is not.
- confidence: 0.0–1.0. Only include candidates with confidence >= 0.4.
- Deduplicate: one entry per distinct person/place/org/project.
- Empty domain = empty array, never omit the key."""


@dataclass
class ParseResult:
    total_items_read: int = 0
    candidates_written: int = 0
    gbrain_ingested: int = 0
    by_domain: dict[str, int] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)


def _build_content(items: list[NormalizedItem]) -> str:
    lines: list[str] = [f"Items to parse ({len(items)} total):\n"]
    for item in items:
        data = item.data or {}
        if "email" in (item.item_type or ""):
            lines.append(
                f"[EMAIL] {item.title} | snippet: {data.get('snippet', '')[:120]}"
            )
        elif "calendar" in (item.item_type or ""):
            lines.append(
                f"[CALENDAR] {item.title} | {data.get('start', '')} → {data.get('end', '')}"
            )
        else:
            lines.append(f"[ITEM] {item.title}")
    return "\n".join(lines)


def _parse_llm_response(text: str) -> dict[str, list[dict]]:
    try:
        raw = text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw)
        result: dict[str, list[dict]] = {}
        for domain in DNA_DOMAINS:
            entries = parsed.get(domain, [])
            result[domain] = entries if isinstance(entries, list) else []
        return result
    except Exception as exc:
        logger.warning("DNA parse LLM response JSON parse failed: %s", exc)
        return {d: [] for d in DNA_DOMAINS}


async def run_client_dna_parse(
    db: Session,
    client_id: uuid.UUID,
    workflow_run_id: uuid.UUID | None,
    gbrain: Any,
    *,
    sweep_window: str | None = None,
    lookback_hours: int = 72,
    max_items: int = 60,
) -> ParseResult:
    result = ParseResult(by_domain={d: 0 for d in DNA_DOMAINS})

    # Fetch recent NormalizedItems — prefer sweep-tagged items for the window
    cutoff = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
    q = (
        select(NormalizedItem)
        .where(
            NormalizedItem.client_id == client_id,
            NormalizedItem.created_at >= cutoff,
        )
        .order_by(NormalizedItem.created_at.desc())
        .limit(max_items)
    )
    items = db.execute(q).scalars().all()
    result.total_items_read = len(items)

    if not items:
        logger.info("client_dna_parse: no items to parse for client %s", client_id)
        return result

    content = _build_content(items)
    resp = call_llm(system=_PARSE_SYSTEM, content=content, max_tokens=2048)
    if not resp.text:
        result.errors.append("LLM returned empty response")
        return result

    extracted = _parse_llm_response(resp.text)

    # Map source item: use the first item as a representative source
    first_item_id = items[0].id if items else None

    for domain in DNA_DOMAINS:
        candidates = extracted.get(domain, [])
        for entry in candidates:
            if not isinstance(entry, dict):
                continue
            confidence = float(entry.get("confidence", 0.5))
            if confidence < 0.4:
                continue

            content_text = (
                entry.get("name", "")
                + (f" — {entry.get('role') or entry.get('type') or entry.get('description') or ''}")
                + (f" | {entry.get('context', '')[:200]}")
            ).strip(" —|")

            candidate = ClientDnaCandidate(
                client_id=client_id,
                workflow_run_id=workflow_run_id,
                source_item_id=first_item_id,
                domain=domain,
                status="pending",
                confidence=confidence,
                sweep_window=sweep_window,
                content=content_text[:1000],
                raw_data=entry,
            )
            db.add(candidate)
            db.flush()

            # Ingest to GBrain — degrades gracefully in stub mode
            try:
                ingest_result = await gbrain.ingest(
                    client_id=client_id,
                    category="client_dna_candidate",
                    content=content_text,
                    metadata={
                        "domain": domain,
                        "confidence": confidence,
                        "candidate_id": str(candidate.id),
                        "sweep_window": sweep_window,
                    },
                )
                if ingest_result.accepted:
                    candidate.gbrain_record_id = ingest_result.record_id
                    result.gbrain_ingested += 1
            except Exception as exc:
                logger.warning("GBrain ingest failed for candidate %s: %s", candidate.id, exc)

            result.candidates_written += 1
            result.by_domain[domain] = result.by_domain.get(domain, 0) + 1

    db.flush()
    logger.info(
        "client_dna_parse: wrote %d candidates (%d GBrain ingested) for client %s",
        result.candidates_written,
        result.gbrain_ingested,
        client_id,
    )
    return result
