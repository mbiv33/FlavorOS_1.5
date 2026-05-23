"""Account sweep workflow — pulls historical provider data into CU DB by time window.

Called by sinclair_account_sweep skill. Fetches Gmail + Calendar for the requested
window (60d / 180d / 360d / prior_years), writes per-item ProviderEvent +
NormalizedItem with window-scoped idempotency keys, and records a SyncCheckpoint
cursor per (client_id, provider_connection_id, window).

Idempotency key format:  {conn_id}:{provider}:{window}:{item_id}
Checkpoint key format:   account_sweep:{provider}:{window}
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    NormalizedItem,
    ProviderConnection,
    ProviderEvent,
    SyncCheckpoint,
)

logger = logging.getLogger(__name__)

SWEEP_WINDOWS: dict[str, int] = {
    "60d": 60,
    "180d": 180,
    "360d": 360,
    "prior_years": 365 * 5,
}

SWEEP_PROVIDERS = ("gmail", "googlecalendar")

CONNECTED_STATUSES = frozenset({"connected", "syncing", "ready"})


@dataclass
class SweepProviderResult:
    provider: str
    window: str
    new_items: int = 0
    skipped_items: int = 0
    errors: list[str] = field(default_factory=list)


@dataclass
class SweepResult:
    window: str
    since: datetime
    until: datetime
    providers: list[SweepProviderResult] = field(default_factory=list)

    @property
    def total_new(self) -> int:
        return sum(p.new_items for p in self.providers)

    @property
    def total_skipped(self) -> int:
        return sum(p.skipped_items for p in self.providers)


def _item_type_for_provider(provider: str) -> str:
    return "calendar_event" if provider == "googlecalendar" else "email"


def _item_id(item: dict[str, Any], provider: str) -> str:
    return item.get("message_id") or item.get("event_id") or ""


def _item_title(item: dict[str, Any], provider: str) -> str:
    return item.get("subject") or item.get("summary") or provider


def _checkpoint_key(provider: str, window: str) -> str:
    return f"account_sweep:{provider}:{window}"


def resolve_connections(
    db: Session,
    client_id: uuid.UUID,
) -> list[ProviderConnection]:
    rows = db.execute(
        select(ProviderConnection).where(
            ProviderConnection.client_id == client_id,
            ProviderConnection.provider.in_(SWEEP_PROVIDERS),
            ProviderConnection.enabled.is_(True),
        )
    ).scalars().all()
    return [r for r in rows if r.status in CONNECTED_STATUSES]


async def run_account_sweep(
    db: Session,
    client_id: uuid.UUID,
    window: str,
    composio: Any,
) -> SweepResult:
    """Fetch and ingest all provider items for the given window into CU DB."""
    if window not in SWEEP_WINDOWS:
        raise ValueError(f"Unknown sweep window: {window!r}. Must be one of {list(SWEEP_WINDOWS)}")

    now = datetime.now(timezone.utc)
    since = now - timedelta(days=SWEEP_WINDOWS[window])
    result = SweepResult(window=window, since=since, until=now)

    connections = resolve_connections(db, client_id)
    if not connections:
        logger.info("account_sweep: no connected providers for client %s", client_id)
        return result

    for conn in connections:
        pr = SweepProviderResult(provider=conn.provider, window=window)
        result.providers.append(pr)

        user_ref = conn.composio_user_id or f"conn:{conn.id}"
        ck_key = _checkpoint_key(conn.provider, window)

        try:
            sync = await composio.fetch_window(
                client_id=client_id,
                provider=conn.provider,
                composio_user_id=user_ref,
                since=since,
                until=now,
            )
        except Exception as exc:
            logger.exception("fetch_window failed: %s", exc)
            pr.errors.append(str(exc)[:300])
            continue

        if sync.errors:
            pr.errors.extend(sync.errors)

        for item in sync.items:
            item_id = _item_id(item, conn.provider)
            ikey = f"{conn.id}:{conn.provider}:{window}:{item_id}"

            already = db.execute(
                select(ProviderEvent).where(
                    ProviderEvent.client_id == client_id,
                    ProviderEvent.idempotency_key == ikey,
                )
            ).scalar_one_or_none()
            if already:
                pr.skipped_items += 1
                continue

            pe = ProviderEvent(
                client_id=client_id,
                provider_connection_id=conn.id,
                provider=conn.provider,
                event_type="sweep_item_ingested",
                idempotency_key=ikey,
                status="received",
                payload={**item, "_sweep_window": window},
            )
            db.add(pe)
            db.flush()
            db.add(
                NormalizedItem(
                    client_id=client_id,
                    provider_event_id=pe.id,
                    item_type=_item_type_for_provider(conn.provider),
                    title=_item_title(item, conn.provider),
                    data={**item, "_sweep_window": window},
                )
            )
            pr.new_items += 1

        # Record checkpoint so re-sweeps know this window was last run at `now`.
        ckpt = db.execute(
            select(SyncCheckpoint).where(
                SyncCheckpoint.client_id == client_id,
                SyncCheckpoint.provider_connection_id == conn.id,
                SyncCheckpoint.checkpoint_key == ck_key,
            )
        ).scalar_one_or_none()
        if ckpt:
            ckpt.checkpoint_value = now.isoformat()
            ckpt.synced_at = now
        else:
            db.add(
                SyncCheckpoint(
                    client_id=client_id,
                    provider_connection_id=conn.id,
                    checkpoint_key=ck_key,
                    checkpoint_value=now.isoformat(),
                    synced_at=now,
                )
            )

        logger.info(
            "account_sweep %s %s: +%d new, %d skipped, %d errors",
            conn.provider,
            window,
            pr.new_items,
            pr.skipped_items,
            len(pr.errors),
        )

    db.flush()
    return result
