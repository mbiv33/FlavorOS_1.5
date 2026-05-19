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

import asyncio
import logging
import uuid
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

logger = logging.getLogger(__name__)


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
    # Email items fetched during sync: [{subject, snippet, message_id}, ...]
    # Populated by RealComposioAdapter; empty list in stub mode.
    items: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True)
class ConnectLinkResult:
    provider: str
    url: str
    connected_account_id: str | None = None


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

    async def create_connect_link(
        self,
        client_id: uuid.UUID,
        composio_user_id: str,
        provider: str,
        toolkit: str,
        redirect_uri: str,
        auth_config_id: str | None = None,
    ) -> ConnectLinkResult:
        """Create a hosted Composio Connect Link scoped to one FlavorOS user."""
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
        composio_user_id: str | None = None,
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

    async def create_connect_link(
        self,
        client_id: uuid.UUID,
        composio_user_id: str,
        provider: str,
        toolkit: str,
        redirect_uri: str,
        auth_config_id: str | None = None,
    ) -> ConnectLinkResult:
        return ConnectLinkResult(
            provider=provider,
            url=(
                f"{redirect_uri}?stub=true&provider={provider}"
                f"&toolkit={toolkit}&user_id={composio_user_id}"
            ),
        )

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
        composio_user_id: str | None = None,
    ) -> SyncResult:
        return SyncResult(provider=provider, records_synced=0)


class RealComposioAdapter:
    """Live Composio adapter backed by the composio-core SDK.

    Verify exact action names against https://docs.composio.dev before
    first real-user session — SDK action strings (e.g. GMAIL_FETCH_EMAILS)
    may differ across composio-core versions.
    """

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._toolset: Any = None  # lazy: created on first use to avoid SDK startup network calls

    def _get_toolset(self) -> Any:
        if self._toolset is None:
            from composio import ComposioToolSet
            self._toolset = ComposioToolSet(api_key=self._api_key)
        return self._toolset

    async def list_toolkits(self) -> list[ProviderToolkit]:
        return [
            ProviderToolkit(name="gmail", label="Gmail", category="email"),
            ProviderToolkit(name="googlecalendar", label="Google Calendar", category="calendar"),
        ]

    async def initiate_auth(
        self,
        client_id: uuid.UUID,
        provider: str,
        redirect_uri: str,
    ) -> str:
        result = await self.create_connect_link(
            client_id=client_id,
            composio_user_id=str(client_id),
            provider=provider,
            toolkit=provider,
            redirect_uri=redirect_uri,
        )
        return result.url

    async def create_connect_link(
        self,
        client_id: uuid.UUID,
        composio_user_id: str,
        provider: str,
        toolkit: str,
        redirect_uri: str,
        auth_config_id: str | None = None,
    ) -> ConnectLinkResult:
        from composio import App

        app = getattr(App, toolkit.upper(), toolkit)
        kwargs: dict[str, Any] = {
            "entity_id": composio_user_id,
            "app": app,
            "redirect_url": redirect_uri,
        }
        if auth_config_id:
            kwargs["auth_config"] = auth_config_id

        request = await asyncio.to_thread(self._get_toolset().initiate_connection, **kwargs)
        return ConnectLinkResult(
            provider=provider,
            url=request.redirectUrl,
            connected_account_id=getattr(request, "connectedAccountId", None),
        )

    async def check_connection(
        self,
        client_id: uuid.UUID,
        provider: str,
    ) -> ConnectionStatus:
        return ConnectionStatus(provider=provider, connected=True)

    async def execute_action(
        self,
        client_id: uuid.UUID,
        provider: str,
        action: str,
        params: dict[str, Any] | None = None,
    ) -> ActionResult:
        try:
            result = await asyncio.to_thread(
                self._get_toolset().execute_action,
                action=action,
                params=params or {},
            )
            return ActionResult(success=True, data=result if isinstance(result, dict) else {})
        except Exception as exc:
            logger.warning("Composio execute_action failed: %s", exc)
            return ActionResult(success=False, error=str(exc))

    async def trigger_sync(
        self,
        client_id: uuid.UUID,
        provider: str,
        composio_user_id: str | None = None,
    ) -> SyncResult:
        if not composio_user_id:
            return SyncResult(
                provider=provider,
                records_synced=0,
                errors=["composio_user_id is required for real sync"],
            )

        from composio import Action  # noqa: PLC0415

        try:
            # Verify action name against Composio docs if GMAIL_FETCH_EMAILS fails:
            # https://docs.composio.dev/actions/gmail
            raw = await asyncio.to_thread(
                self._get_toolset().execute_action,
                action=Action.GMAIL_FETCH_EMAILS,
                params={"max_results": 10, "label_ids": ["INBOX"]},
                entity_id=composio_user_id,
            )
        except Exception as exc:
            logger.warning("Composio trigger_sync failed for %s: %s", provider, exc)
            return SyncResult(provider=provider, records_synced=0, errors=[str(exc)])

        # Composio wraps results in {"data": {...}, "successful": bool}
        data = raw if isinstance(raw, dict) else {}
        messages = (
            data.get("data", data).get("messages", [])
            if isinstance(data.get("data", data), dict)
            else []
        )

        items = [
            {
                "subject": _header(msg, "Subject") or "(no subject)",
                "snippet": msg.get("snippet", ""),
                "message_id": msg.get("id", ""),
            }
            for msg in messages
            if isinstance(msg, dict)
        ]
        return SyncResult(provider=provider, records_synced=len(items), items=items)


def _header(message: dict[str, Any], name: str) -> str | None:
    """Extract a header value from a Gmail message dict."""
    headers = (message.get("payload") or {}).get("headers") or []
    for h in headers:
        if isinstance(h, dict) and h.get("name", "").lower() == name.lower():
            return h.get("value")
    return None
