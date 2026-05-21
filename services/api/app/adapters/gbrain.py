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

import asyncio
import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
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


class LocalFileGBrainAdapter:
    """Tenant-scoped local durable memory adapter.

    This is the first non-stub implementation behind the GBrain contract. It
    writes JSONL records that can later be imported into a full GBrain index.
    """

    def __init__(self, store_dir: str):
        self.store_dir = Path(store_dir)

    def _client_dir(self, client_id: uuid.UUID) -> Path:
        return self.store_dir / str(client_id)

    def _append_jsonl(self, client_id: uuid.UUID, filename: str, record: dict[str, Any]) -> str:
        client_dir = self._client_dir(client_id)
        client_dir.mkdir(parents=True, exist_ok=True)
        record_id = record.get("id") or str(uuid.uuid4())
        row = {
            "id": record_id,
            "client_id": str(client_id),
            "created_at": datetime.now(timezone.utc).isoformat(),
            **record,
        }
        with (client_dir / filename).open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(row, default=str, sort_keys=True) + "\n")
        return record_id

    async def ingest(
        self,
        client_id: uuid.UUID,
        category: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> IngestResult:
        record_id = self._append_jsonl(
            client_id,
            "ingest.jsonl",
            {"category": category, "content": content, "metadata": metadata or {}},
        )
        return IngestResult(accepted=True, record_id=record_id)

    async def retrieve(
        self,
        client_id: uuid.UUID,
        query: str,
        top_k: int = 5,
        filters: dict[str, Any] | None = None,
    ) -> list[RetrievalHit]:
        ingest_path = self._client_dir(client_id) / "ingest.jsonl"
        if not ingest_path.exists():
            return []
        hits: list[RetrievalHit] = []
        needle = query.lower()
        with ingest_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                row = json.loads(line)
                content = str(row.get("content", ""))
                matches = needle in content.lower()
                if matches or not hits:
                    hits.append(
                        RetrievalHit(
                            record_id=row["id"],
                            score=1.0 if matches else 0.1,
                            content=content,
                            metadata=row.get("metadata", {}),
                        )
                    )
                if len(hits) >= top_k:
                    break
        return hits

    async def build_context(
        self,
        client_id: uuid.UUID,
        query: str,
        token_budget: int = 4000,
        filters: dict[str, Any] | None = None,
    ) -> ContextPacket:
        hits = await self.retrieve(client_id, query, top_k=5, filters=filters)
        summary = "\n".join(hit.content for hit in hits)
        return ContextPacket(
            query=query,
            hits=hits,
            summary=summary or None,
            token_budget_used=min(token_budget, len(summary.split())),
        )

    async def store_sigma(
        self,
        client_id: uuid.UUID,
        sigma_type: str,
        payload: dict[str, Any],
    ) -> SigmaResult:
        sigma_id = self._append_jsonl(
            client_id,
            "sigma.jsonl",
            {"sigma_type": sigma_type, "payload": payload},
        )
        return SigmaResult(success=True, sigma_id=sigma_id)


class GBrainCliAdapter:
    """Real GBrain adapter — calls the ``gbrain`` CLI via async subprocess.

    Tenant isolation: gbrain is a single personal brain. All slugs are
    namespaced under ``flavoros/clients/{client_id}/`` so client data
    never mingles across tenants.

    Slug conventions:
      ingest: flavoros/clients/{client_id}/{category}/{record_id}
      sigma:  flavoros/clients/{client_id}/sigma/{sigma_type}/{record_id}

    All methods degrade gracefully — if gbrain returns non-zero or raises,
    the method returns the same empty/failure shape as the stub so callers
    never need to special-case CLI errors.

    Set ``GBRAIN_ADAPTER=cli`` and ``GBRAIN_CLI_PATH=gbrain`` (default) in
    the environment to activate. GBrain must be healthy (``gbrain doctor``)
    before ingestion or retrieval will work.
    """

    def __init__(self, cli_path: str = "gbrain") -> None:
        self.cli_path = cli_path

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ingest_slug(self, client_id: uuid.UUID, category: str, record_id: str) -> str:
        return f"flavoros/clients/{client_id}/{category}/{record_id}"

    def _sigma_slug(self, client_id: uuid.UUID, sigma_type: str, sigma_id: str) -> str:
        return f"flavoros/clients/{client_id}/sigma/{sigma_type}/{sigma_id}"

    def _client_prefix(self, client_id: uuid.UUID) -> str:
        return f"flavoros/clients/{client_id}/"

    def _format_page(self, content: str, metadata: dict) -> str:
        """Wrap content with simple YAML frontmatter so gbrain indexes metadata."""
        if not metadata:
            return content
        meta_lines = "\n".join(f"{k}: {v}" for k, v in metadata.items())
        return f"---\n{meta_lines}\n---\n\n{content}"

    def _parse_output_hits(
        self, raw: str, client_id: uuid.UUID, top_k: int
    ) -> list[RetrievalHit]:
        """Parse gbrain search/query text output into RetrievalHit records.

        gbrain outputs one result block per line or as a prose summary.
        We treat each non-empty paragraph as one hit, scoped to this client.
        """
        prefix = self._client_prefix(client_id)
        hits: list[RetrievalHit] = []
        paragraphs = [p.strip() for p in raw.split("\n\n") if p.strip()]
        for i, para in enumerate(paragraphs[:top_k]):
            # Only include results that appear to belong to this client's namespace
            if prefix in para or not para.startswith("flavoros/"):
                hits.append(
                    RetrievalHit(
                        record_id=f"gbrain-result-{i}",
                        score=1.0 / (i + 1),
                        content=para,
                    )
                )
        return hits

    async def _run(
        self, args: list[str], stdin_data: bytes | None = None
    ) -> tuple[int, str, str]:
        """Run gbrain CLI and return (returncode, stdout, stderr)."""
        proc = await asyncio.create_subprocess_exec(
            self.cli_path,
            *args,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout_b, stderr_b = await proc.communicate(input=stdin_data)
        return (
            proc.returncode or 0,
            stdout_b.decode(errors="replace"),
            stderr_b.decode(errors="replace"),
        )

    # ------------------------------------------------------------------
    # GBrainAdapter protocol
    # ------------------------------------------------------------------

    async def ingest(
        self,
        client_id: uuid.UUID,
        category: str,
        content: str,
        metadata: dict | None = None,
    ) -> IngestResult:
        record_id = str(uuid.uuid4())
        slug = self._ingest_slug(client_id, category, record_id)
        page = self._format_page(content, metadata or {})
        try:
            rc, _, stderr = await self._run(["put", slug], stdin_data=page.encode())
            if rc == 0:
                return IngestResult(accepted=True, record_id=slug)
            return IngestResult(accepted=False, error=stderr[:300])
        except Exception as exc:
            return IngestResult(accepted=False, error=str(exc)[:300])

    async def retrieve(
        self,
        client_id: uuid.UUID,
        query: str,
        top_k: int = 5,
        filters: dict | None = None,
    ) -> list[RetrievalHit]:
        try:
            rc, stdout, _ = await self._run(["search", query])
            if rc != 0 or not stdout.strip():
                return []
            return self._parse_output_hits(stdout, client_id, top_k)
        except Exception:
            return []

    async def build_context(
        self,
        client_id: uuid.UUID,
        query: str,
        token_budget: int = 4000,
        filters: dict | None = None,
    ) -> ContextPacket:
        try:
            rc, stdout, _ = await self._run(
                ["query", query, "--limit", "5"]
            )
            if rc != 0 or not stdout.strip():
                return ContextPacket(query=query)
            hits = self._parse_output_hits(stdout, client_id, top_k=5)
            summary = "\n\n".join(h.content for h in hits)
            token_estimate = int(len(summary.split()) / 0.75)
            return ContextPacket(
                query=query,
                hits=hits,
                summary=summary or None,
                token_budget_used=min(token_budget, token_estimate),
            )
        except Exception:
            return ContextPacket(query=query)

    async def store_sigma(
        self,
        client_id: uuid.UUID,
        sigma_type: str,
        payload: dict,
    ) -> SigmaResult:
        sigma_id = str(uuid.uuid4())
        slug = self._sigma_slug(client_id, sigma_type, sigma_id)
        page = json.dumps(payload, indent=2, default=str)
        try:
            rc, _, stderr = await self._run(["put", slug], stdin_data=page.encode())
            if rc == 0:
                return SigmaResult(success=True, sigma_id=slug)
            return SigmaResult(success=False, error=stderr[:300])
        except Exception as exc:
            return SigmaResult(success=False, error=str(exc)[:300])
