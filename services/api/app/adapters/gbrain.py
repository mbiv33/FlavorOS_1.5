"""GBrain adapter contract.

The ``GBrainAdapter`` protocol defines how the API service requests
ingestion, retrieval, and context-building from GBrain — whether that
runs as a local PGLite engine, a remote MCP server, or a simple stub.

Responsibilities covered:
- ingest a record into the memory index
- retrieve relevant context for a given query
- build a context packet for a workflow step
- store/update a SIGMA artifact
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable


@dataclass(frozen=True)
class IngestResult:
    accepted: bool
    record_id: str | None = None
    error: str | None = None


@dataclass(frozen=True)
class RetrievalHit:
    record_id: str
    score: float
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ContextPacket:
    """Pre-assembled context bundle for a workflow step."""

    query: str
    hits: list[RetrievalHit] = field(default_factory=list)
    summary: str | None = None
    token_budget_used: int = 0


@dataclass(frozen=True)
class SigmaResult:
    success: bool
    sigma_id: str | None = None
    error: str | None = None


@runtime_checkable
class GBrainAdapter(Protocol):
    """Boundary contract for all GBrain/memory-layer interactions."""

    async def ingest(
        self,
        client_id: uuid.UUID,
        category: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> IngestResult:
        """Ingest a new record into the client's memory index."""
        ...

    async def retrieve(
        self,
        client_id: uuid.UUID,
        query: str,
        top_k: int = 5,
        filters: dict[str, Any] | None = None,
    ) -> list[RetrievalHit]:
        """Retrieve top-k relevant records for a semantic query."""
        ...

    async def build_context(
        self,
        client_id: uuid.UUID,
        query: str,
        token_budget: int = 4000,
        filters: dict[str, Any] | None = None,
    ) -> ContextPacket:
        """Build a context packet sized to a token budget for a workflow step."""
        ...

    async def store_sigma(
        self,
        client_id: uuid.UUID,
        sigma_type: str,
        payload: dict[str, Any],
    ) -> SigmaResult:
        """Create or update a SIGMA artifact in the client's memory."""
        ...


class StubGBrainAdapter:
    """Noop implementation — returns empty results for MVP development."""

    async def ingest(
        self,
        client_id: uuid.UUID,
        category: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> IngestResult:
        return IngestResult(accepted=False, error="GBrain adapter is in stub mode.")

    async def retrieve(
        self,
        client_id: uuid.UUID,
        query: str,
        top_k: int = 5,
        filters: dict[str, Any] | None = None,
    ) -> list[RetrievalHit]:
        return []

    async def build_context(
        self,
        client_id: uuid.UUID,
        query: str,
        token_budget: int = 4000,
        filters: dict[str, Any] | None = None,
    ) -> ContextPacket:
        return ContextPacket(query=query)

    async def store_sigma(
        self,
        client_id: uuid.UUID,
        sigma_type: str,
        payload: dict[str, Any],
    ) -> SigmaResult:
        return SigmaResult(success=False, error="GBrain adapter is in stub mode.")
