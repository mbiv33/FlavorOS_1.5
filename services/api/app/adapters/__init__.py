"""Integration adapter contracts and stub implementations.

Each adapter defines a Protocol that downstream code programs against.
Stub implementations return safe defaults so the MVP runs without real
provider SDKs, a live GBrain process, or a full orchestration engine.
Swap in real implementations via ``deps.py`` dependency overrides.
"""

from app.adapters.composio import ComposioAdapter, StubComposioAdapter
from app.adapters.gbrain import GBrainAdapter, LocalFileGBrainAdapter, StubGBrainAdapter
from app.adapters.gmail_outbound import (
    GmailOutboundAdapter,
    OutboundSendResult,
    SendDraftResult,
    StubGmailOutboundAdapter,
    apply_send_result,
    get_gmail_outbound_adapter,
)
from app.adapters.orchestrator import OrchestratorAdapter, StubOrchestratorAdapter

__all__ = [
    "ComposioAdapter",
    "StubComposioAdapter",
    "GBrainAdapter",
    "LocalFileGBrainAdapter",
    "StubGBrainAdapter",
    "GmailOutboundAdapter",
    "OutboundSendResult",
    "SendDraftResult",
    "StubGmailOutboundAdapter",
    "apply_send_result",
    "get_gmail_outbound_adapter",
    "OrchestratorAdapter",
    "StubOrchestratorAdapter",
]
