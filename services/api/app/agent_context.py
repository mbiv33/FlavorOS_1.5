"""Merge structured Client Universe envelope with GBrain retrieval."""

from __future__ import annotations

import uuid
from typing import Any, Protocol, runtime_checkable

from sqlalchemy.orm import Session

from app.adapters.gbrain import ContextPacket
from app.services.client_universe import get_envelope


@runtime_checkable
class GBrainLike(Protocol):
    async def build_context(
        self,
        client_id: uuid.UUID,
        query: str,
        token_budget: int = 4000,
        filters: dict[str, Any] | None = None,
    ) -> ContextPacket: ...


async def assemble_agent_context(
    db: Session,
    *,
    client_id: uuid.UUID,
    query: str,
    gbrain: GBrainLike,
    token_budget: int = 4000,
    filters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Structured universe envelope plus semantic GBrain context packet."""
    envelope = get_envelope(db, client_id)
    packet = await gbrain.build_context(
        client_id,
        query,
        token_budget=token_budget,
        filters=filters,
    )
    return {
        "envelope": envelope.model_dump(mode="json"),
        "gbrain": {
            "query": packet.query,
            "summary": packet.summary,
            "token_budget_used": packet.token_budget_used,
            "hits": [
                {
                    "record_id": hit.record_id,
                    "score": hit.score,
                    "content": hit.content,
                    "metadata": hit.metadata,
                }
                for hit in packet.hits
            ],
        },
    }
