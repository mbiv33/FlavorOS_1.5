"""Composio / external-provider adapter contract.

The ``ComposioAdapter`` protocol describes how FlavorOS talks to Composio
(or any future provider-access layer) without coupling the API service to
a specific SDK version.

Responsibilities covered:
- list available provider toolkits for a tenant
- initiate an OAuth/auth flow for a provider
- check connection health
- execute a governed action through the provider
- trigger a data sync from a provider into Client Universe
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable


@dataclass(frozen=True)
class ProviderToolkit:
    """A provider toolkit that can be connected (e.g. gmail, googlecalendar)."""

    name: str
    label: str
    category: str
    auth_type: str = "oauth2"


@dataclass(frozen=True)
class ConnectionStatus:
    provider: str
    connected: bool
    last_sync_at: str | None = None
    error: str | None = None


@dataclass(frozen=True)
class ActionResult:
    success: bool
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


@dataclass(frozen=True)
class SyncResult:
    provider: str
    records_synced: int = 0
    errors: list[str] = field(default_factory=list)


@runtime_checkable
class ComposioAdapter(Protocol):
    """Boundary contract for all Composio/provider-layer interactions."""

    async def list_toolkits(self) -> list[ProviderToolkit]:
        """Return the catalog of available provider toolkits."""
        ...

    async def initiate_auth(
        self,
        client_id: uuid.UUID,
        provider: str,
        redirect_uri: str,
    ) -> str:
        """Start an auth flow; return a URL the client should redirect to."""
        ...

    async def check_connection(
        self,
        client_id: uuid.UUID,
        provider: str,
    ) -> ConnectionStatus:
        """Return the health/status of a provider connection."""
        ...

    async def execute_action(
        self,
        client_id: uuid.UUID,
        provider: str,
        action: str,
        params: dict[str, Any] | None = None,
    ) -> ActionResult:
        """Execute a governed action through the provider (e.g. send email)."""
        ...

    async def trigger_sync(
        self,
        client_id: uuid.UUID,
        provider: str,
    ) -> SyncResult:
        """Trigger an inbound data sync from the provider into Client Universe."""
        ...


class StubComposioAdapter:
    """Noop implementation that returns safe defaults for MVP development."""

    async def list_toolkits(self) -> list[ProviderToolkit]:
        return [
            ProviderToolkit(name="gmail", label="Gmail", category="email"),
            ProviderToolkit(name="googlecalendar", label="Google Calendar", category="calendar"),
            ProviderToolkit(name="linear", label="Linear", category="project_management"),
        ]

    async def initiate_auth(
        self,
        client_id: uuid.UUID,
        provider: str,
        redirect_uri: str,
    ) -> str:
        return f"{redirect_uri}?stub=true&provider={provider}"

    async def check_connection(
        self,
        client_id: uuid.UUID,
        provider: str,
    ) -> ConnectionStatus:
        return ConnectionStatus(provider=provider, connected=False)

    async def execute_action(
        self,
        client_id: uuid.UUID,
        provider: str,
        action: str,
        params: dict[str, Any] | None = None,
    ) -> ActionResult:
        return ActionResult(
            success=False,
            error="Composio adapter is in stub mode — no real provider actions available.",
        )

    async def trigger_sync(
        self,
        client_id: uuid.UUID,
        provider: str,
    ) -> SyncResult:
        return SyncResult(provider=provider, records_synced=0)
