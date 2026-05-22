"""Gmail outbound send — protocol, stub, and Composio-backed implementation."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol, runtime_checkable

from app.models import OutboundAction

logger = logging.getLogger(__name__)


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


class ComposioGmailOutboundAdapter:
    """Live Gmail send via Composio GMAIL_SEND_EMAIL action.

    Reads composio_user_id and message fields from outbound.payload_json — these
    are stored there at enqueue time by communications_outbound.create_outbound_for_approval.

    Composio action param names (verify against SDK if send fails):
      recipient_email, subject, message_body
    https://docs.composio.dev/actions/gmail
    """

    provider = "gmail"

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._toolset: Any = None

    def _get_toolset(self) -> Any:
        if self._toolset is None:
            from composio import ComposioToolSet
            self._toolset = ComposioToolSet(api_key=self._api_key, timeout=30.0)
        return self._toolset

    def send_draft(self, outbound: OutboundAction) -> SendDraftResult:
        payload = outbound.payload_json or {}
        composio_user_id = payload.get("composio_user_id")
        to = payload.get("to") or ""
        subject = payload.get("subject") or ""
        body = payload.get("body") or ""

        if not composio_user_id:
            return SendDraftResult(
                success=False,
                external_result_id=None,
                receipt_status="failed",
                error="composio_user_id missing from outbound payload — cannot route to Composio entity",
            )
        if not to:
            return SendDraftResult(
                success=False,
                external_result_id=None,
                receipt_status="failed",
                error="recipient 'to' missing from outbound payload",
            )

        try:
            from composio import Action
            result = self._get_toolset().execute_action(
                action=Action.GMAIL_SEND_EMAIL,
                params={
                    "recipient_email": to,
                    "subject": subject,
                    "message_body": body,
                },
                entity_id=composio_user_id,
            )
            data = result if isinstance(result, dict) else {}
            successful = data.get("successful", True)
            if not successful:
                error_msg = str(data.get("error") or data.get("data") or "Composio reported failure")
                logger.warning("GMAIL_SEND_EMAIL failed for outbound %s: %s", outbound.id, error_msg)
                return SendDraftResult(
                    success=False,
                    external_result_id=None,
                    receipt_status="failed",
                    error=error_msg,
                    data=data,
                )
            inner = data.get("data") if isinstance(data.get("data"), dict) else data
            thread_id = inner.get("threadId") or inner.get("id") or f"composio-{outbound.id}"
            return SendDraftResult(
                success=True,
                external_result_id=thread_id,
                receipt_status="success",
                response_summary=f"Sent to {to} via Composio GMAIL_SEND_EMAIL",
                data=inner,
            )
        except Exception as exc:
            logger.exception("ComposioGmailOutboundAdapter.send_draft failed: %s", exc)
            return SendDraftResult(
                success=False,
                external_result_id=None,
                receipt_status="failed",
                error=str(exc)[:500],
            )


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


def apply_send_result(outbound: OutboundAction, result: OutboundSendResult | SendDraftResult) -> None:
    outbound.status = "executed"
    outbound.executed_at = datetime.now(timezone.utc)
    outbound.execution_result_json = {
        "provider": outbound.provider,
        "external_result_id": result.external_result_id,
        "receipt_status": result.receipt_status,
        "response_summary": result.response_summary,
    }
    outbound.updated_at = datetime.now(timezone.utc)
