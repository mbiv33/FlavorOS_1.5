"""Gmail outbound send contract (Lane K1 stub; Composio swap later)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol, runtime_checkable

from app.models import OutboundAction


@dataclass(frozen=True)
class OutboundSendResult:
    external_result_id: str
    receipt_status: str
    response_summary: str


@dataclass(frozen=True)
class SendDraftResult:
    """Result shape for protocol-based adapters (Composio swap target)."""

    success: bool
    external_result_id: str | None = None
    receipt_status: str = "success"
    response_summary: str = ""
    error: str | None = None
    data: dict[str, Any] | None = None


@runtime_checkable
class GmailOutboundAdapter(Protocol):
    """Provider adapter for approval-gated Gmail draft send."""

    provider: str

    def send_draft(self, outbound: OutboundAction) -> OutboundSendResult | SendDraftResult:
        ...


class StubGmailOutboundAdapter:
    """Stub send until Composio-backed implementation is wired."""

    provider = "gmail"

    def send_draft(self, outbound: OutboundAction) -> OutboundSendResult:
        payload = outbound.payload_json or {}
        if payload.get("_force_failure"):
            raise RuntimeError("Stub provider execution failed (test hook)")
        return OutboundSendResult(
            external_result_id=f"stub-{outbound.id}",
            receipt_status="success",
            response_summary="Stub gmail send completed",
        )


_default_adapter: GmailOutboundAdapter = StubGmailOutboundAdapter()


def get_gmail_outbound_adapter() -> GmailOutboundAdapter:
    return _default_adapter


def set_gmail_outbound_adapter(adapter: GmailOutboundAdapter) -> None:
    global _default_adapter
    _default_adapter = adapter


def apply_send_result(outbound: OutboundAction, result: OutboundSendResult) -> None:
    outbound.status = "executed"
    outbound.executed_at = datetime.now(timezone.utc)
    outbound.execution_result_json = {
        "provider": outbound.provider,
        "external_result_id": result.external_result_id,
        "receipt_status": result.receipt_status,
        "response_summary": result.response_summary,
    }
    outbound.updated_at = datetime.now(timezone.utc)
