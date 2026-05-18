"""Integration adapter contracts and stub implementations.

Each adapter defines a Protocol that downstream code programs against.
Stub implementations return safe defaults so the MVP runs without real
provider SDKs, a live GBrain process, or a full orchestration engine.
Swap in real implementations via ``deps.py`` dependency overrides.
"""

from app.adapters.composio import ComposioAdapter, StubComposioAdapter
from app.adapters.gbrain import GBrainAdapter, StubGBrainAdapter
from app.adapters.orchestrator import OrchestratorAdapter, StubOrchestratorAdapter

__all__ = [
    "ComposioAdapter",
    "StubComposioAdapter",
    "GBrainAdapter",
    "StubGBrainAdapter",
    "OrchestratorAdapter",
    "StubOrchestratorAdapter",
]
