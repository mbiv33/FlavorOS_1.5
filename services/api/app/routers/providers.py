"""Provider Connection router — external service links per tenant."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters import ComposioAdapter, GBrainAdapter
from app.deps import get_composio, get_db, get_gbrain, require_tenant_match
from app.models import (
    AgentTask,
    AuditEvent,
    NormalizedItem,
    ProviderConnection,
    ProviderEvent,
    SyncCheckpoint,
    Tenant,
    User,
    WorkflowRun,
)
from app.onboarding import provider_catalog
from app.schemas import (
    NormalizedItemRead,
    ProviderCallbackRead,
    ProviderCatalogItem,
    ProviderConnectionRead,
    ProviderConnectionWrite,
    ProviderConnectLinkRead,
    ProviderConnectLinkRequest,
    ProviderSyncRead,
    ProviderSyncRequest,
)
from app.executor import dispatch_task
from app.services.client_universe import record_provider_sync_completion

router = APIRouter(prefix="/providers", tags=["providers"])


def _schedule_workflow_dispatch(agent_task_id: uuid.UUID) -> None:
    """Run the queued AgentTask via the in-process executor (same path as orchestrator.launch)."""
    asyncio.create_task(dispatch_task(agent_task_id))

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]
Composio = Annotated[ComposioAdapter, Depends(get_composio)]
GBrain = Annotated[GBrainAdapter, Depends(get_gbrain)]


def _get_connection(db: Session, tenant: Tenant, provider_connection_id: uuid.UUID):
    conn = db.execute(
        select(ProviderConnection).where(
            ProviderConnection.id == provider_connection_id,
            ProviderConnection.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Provider connection not found"
        )
    return conn


def _agent_for_provider(provider: str) -> str:
    if provider in {"gmail", "googlecalendar"}:
        return "sinclair"
    return "khadijah"


def _item_type_for_provider(provider: str) -> str:
    return {
        "gmail": "email_sync_receipt",
        "googlecalendar": "calendar_sync_receipt",
        "googledrive": "drive_sync_receipt",
    }.get(provider, "provider_sync_receipt")


def _checkpoint_key_for_provider(provider: str) -> str:
    return {
        "gmail": "gmail_history_id",
        "googlecalendar": "calendar_sync_token",
    }.get(provider, f"{provider}_cursor")


@router.get("/catalog", response_model=list[ProviderCatalogItem])
def list_provider_catalog():
    return provider_catalog()


@router.get("", response_model=list[ProviderConnectionRead])
def list_providers(tu: TenantUser, db: DB):
    tenant, _ = tu
    q = (
        select(ProviderConnection)
        .where(ProviderConnection.client_id == tenant.id)
        .order_by(ProviderConnection.provider)
    )
    return db.execute(q).scalars().all()


@router.post("", response_model=ProviderConnectionRead, status_code=status.HTTP_201_CREATED)
def upsert_provider(body: ProviderConnectionWrite, tu: TenantUser, db: DB):
    tenant, _ = tu
    existing = db.execute(
        select(ProviderConnection).where(
            ProviderConnection.client_id == tenant.id,
            ProviderConnection.provider == body.provider,
            ProviderConnection.context_account_id == body.context_account_id,
        )
    ).scalar_one_or_none()

    if existing:
        for field, value in body.model_dump(exclude={"provider", "context_account_id"}).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    conn = ProviderConnection(client_id=tenant.id, **body.model_dump())
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.post("/{provider}/connect-link", response_model=ProviderConnectLinkRead)
async def create_provider_connect_link(
    provider: str,
    body: ProviderConnectLinkRequest,
    tu: TenantUser,
    db: DB,
    composio: Composio,
):
    tenant, user = tu
    conn = _get_connection(db, tenant, body.provider_connection_id)
    if conn.provider != provider:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Provider mismatch")
    if not conn.enabled:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Provider disabled")
    if not conn.toolkit:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Provider toolkit is not configured"
        )

    # Each connection gets its own Composio entity so multiple accounts of the
    # same provider (e.g. personal Gmail + business Gmail) map to distinct entities.
    user_ref = conn.composio_user_id or f"conn:{conn.id}"
    # Embed provider_connection_id in redirect URI so the public callback can
    # identify the connection without requiring auth headers.
    callback_uri = f"{body.redirect_uri}?provider_connection_id={conn.id}"
    result = await composio.create_connect_link(
        client_id=tenant.id,
        composio_user_id=user_ref,
        provider=conn.provider,
        toolkit=conn.toolkit,
        redirect_uri=callback_uri,
        auth_config_id=conn.auth_config_id,
    )
    conn.composio_user_id = user_ref
    conn.status = "pending_consent"
    conn.status_reason = "Hosted Connect Link created during onboarding."
    conn.last_checked_at = datetime.now(timezone.utc)
    db.add(
        AuditEvent(
            client_id=tenant.id,
            actor_id=user.id,
            action="provider_connection.connect_link_created",
            resource_type="provider_connection",
            resource_id=conn.id,
            detail={
                "provider": conn.provider,
                "context_account_id": conn.context_account_id,
                "trigger": "client_onboarding.provider_auth",
            },
        )
    )
    db.commit()
    db.refresh(conn)
    return {
        "provider_connection_id": conn.id,
        "provider": conn.provider,
        "url": result.url,
        "composio_user_id": user_ref,
        "status": conn.status,
    }


@router.get("/callback", response_model=ProviderCallbackRead)
def provider_callback(
    provider_connection_id: uuid.UUID,
    db: DB,
    status_value: str = Query("connected", alias="status"),
    connected_account_id: str | None = Query(None, alias="connected_account_id"),
    connected_account_id_camel: str | None = Query(None, alias="connectedAccountId"),
):
    # Public endpoint — called by browser redirect from Composio OAuth flow.
    # provider_connection_id in the URL is the only identifier; no auth headers possible.
    conn = db.execute(
        select(ProviderConnection).where(ProviderConnection.id == provider_connection_id)
    ).scalar_one_or_none()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider connection not found",
        )

    status_map = {
        "ACTIVE": "connected",
        "active": "connected",
        "connected": "connected",
        "success": "connected",
        "SUCCESS": "connected",
        "INITIATED": "pending_consent",
        "initiated": "pending_consent",
        "FAILED": "failed",
        "failed": "failed",
        "EXPIRED": "failed",
        "expired": "failed",
        "INACTIVE": "revoked",
        "inactive": "revoked",
        "revoked": "revoked",
    }
    conn.status = status_map.get(status_value, "failed")
    resolved_account_id = connected_account_id or connected_account_id_camel
    conn.connected_account_id = resolved_account_id or conn.connected_account_id
    conn.status_reason = f"Composio callback status: {status_value}"
    conn.last_checked_at = datetime.now(timezone.utc)
    db.add(
        AuditEvent(
            client_id=conn.client_id,
            actor_id=None,
            action="provider_connection.callback_recorded",
            resource_type="provider_connection",
            resource_id=conn.id,
            detail={
                "provider": conn.provider,
                "status": conn.status,
                "connected_account_id_present": bool(conn.connected_account_id),
            },
        )
    )
    db.commit()
    db.refresh(conn)
    return {
        "provider_connection_id": conn.id,
        "status": conn.status,
        "connected_account_id": conn.connected_account_id,
    }


@router.post("/{provider}/sync", response_model=ProviderSyncRead)
async def sync_provider(
    provider: str,
    body: ProviderSyncRequest,
    tu: TenantUser,
    db: DB,
    composio: Composio,
    gbrain: GBrain,
):
    tenant, user = tu
    conn = _get_connection(db, tenant, body.provider_connection_id)
    if conn.provider != provider:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Provider mismatch")
    if conn.status not in {"connected", "ready", "degraded"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Provider must be connected before first sync.",
        )

    # Detect first vs. incremental sync before overwriting last_sync_at.
    is_first_sync = conn.last_sync_at is None

    # Read incremental sync cursor from SyncCheckpoint (None → full fetch).
    ck_key = _checkpoint_key_for_provider(conn.provider)
    ckpt = db.execute(
        select(SyncCheckpoint).where(
            SyncCheckpoint.client_id == tenant.id,
            SyncCheckpoint.provider_connection_id == conn.id,
            SyncCheckpoint.checkpoint_key == ck_key,
        )
    ).scalar_one_or_none()
    prior_cursor = ckpt.checkpoint_value if ckpt else None

    conn.status = "syncing"
    db.flush()
    user_ref = conn.composio_user_id or f"conn:{conn.id}"
    result = await composio.trigger_sync(
        client_id=tenant.id,
        provider=conn.provider,
        composio_user_id=user_ref,
        cursor=prior_cursor,
    )
    now = datetime.now(timezone.utc)
    conn.status = "ready" if not result.errors else "degraded"
    conn.status_reason = (
        "; ".join(result.errors) if result.errors
        else ("First sync verified." if is_first_sync else "Incremental sync complete.")
    )
    conn.last_sync_at = now
    conn.last_checked_at = now

    # Write back updated cursor when the provider returned one.
    if result.next_cursor:
        if ckpt is not None:
            ckpt.checkpoint_value = result.next_cursor
            ckpt.synced_at = now
        else:
            db.add(
                SyncCheckpoint(
                    client_id=tenant.id,
                    provider_connection_id=conn.id,
                    checkpoint_key=ck_key,
                    checkpoint_value=result.next_cursor,
                    synced_at=now,
                )
            )

    # Per-item dedup: create one ProviderEvent + NormalizedItem per message/event.
    # Idempotency key is stable across re-syncs so the same item is never duplicated.
    new_items: list[dict] = []
    for item in result.items:
        item_id = item.get("message_id") or item.get("event_id") or ""
        ikey = f"{conn.id}:{conn.provider}:{item_id}"
        already_exists = db.execute(
            select(ProviderEvent).where(
                ProviderEvent.client_id == tenant.id,
                ProviderEvent.idempotency_key == ikey,
            )
        ).scalar_one_or_none()
        if already_exists:
            continue
        item_pe = ProviderEvent(
            client_id=tenant.id,
            provider_connection_id=conn.id,
            provider=conn.provider,
            event_type="item_ingested",
            idempotency_key=ikey,
            status="received",
            payload=item,
        )
        db.add(item_pe)
        db.flush()
        db.add(
            NormalizedItem(
                client_id=tenant.id,
                provider_event_id=item_pe.id,
                item_type=_item_type_for_provider(conn.provider),
                title=(item.get("subject") or item.get("summary") or conn.provider),
                data=item,
            )
        )
        new_items.append(item)

    # Batch sync event records the sync itself (timestamp-keyed, always written).
    # The batch NormalizedItem passes only new items to the workflow so Sinclair
    # summarises what's actually new on re-sync.
    workflow_type = "provider_first_sync" if is_first_sync else "communication_sweep"
    task_type = "provider_first_sync_review" if is_first_sync else "communication_sweep_review"

    provider_event = ProviderEvent(
        client_id=tenant.id,
        provider_connection_id=conn.id,
        provider=conn.provider,
        event_type=workflow_type,
        idempotency_key=f"{conn.id}:sync:{now.isoformat()}",
        status="received",
        payload={
            "records_synced": result.records_synced,
            "new_items": len(new_items),
            "errors": result.errors,
            "is_first_sync": is_first_sync,
            "source": "providers.sync",
        },
    )
    db.add(provider_event)
    db.flush()
    normalized_item = NormalizedItem(
        client_id=tenant.id,
        provider_event_id=provider_event.id,
        item_type=_item_type_for_provider(conn.provider),
        title=f"{conn.provider} {'first sync' if is_first_sync else 'sweep'}",
        data={
            "provider_connection_id": str(conn.id),
            "records_synced": result.records_synced,
            "status": conn.status,
            "items": new_items,
        },
    )
    db.add(normalized_item)
    db.flush()
    workflow_run = WorkflowRun(
        client_id=tenant.id,
        workflow_type=workflow_type,
        agent=_agent_for_provider(conn.provider),
        status="queued",
        input_data={
            "provider_connection_id": str(conn.id),
            "provider_event_id": str(provider_event.id),
            "normalized_item_id": str(normalized_item.id),
            "provider": conn.provider,
            "is_first_sync": is_first_sync,
        },
    )
    db.add(workflow_run)
    db.flush()
    queued_agent_task = AgentTask(
        client_id=tenant.id,
        workflow_run_id=workflow_run.id,
        agent=workflow_run.agent or "khadijah",
        task_type=task_type,
        status="queued",
        payload={
            "schema_version": "flavoros.agent_task.v1",
            "workflow_run_id": str(workflow_run.id),
            "client_id": str(tenant.id),
            "target_agent": workflow_run.agent,
            "task_type": task_type,
            "source_refs": {
                "provider_event_id": str(provider_event.id),
                "normalized_item_id": str(normalized_item.id),
            },
            "inputs": workflow_run.input_data,
        },
    )
    db.add(queued_agent_task)
    db.add(
        AuditEvent(
            client_id=tenant.id,
            actor_id=user.id,
            action="provider_connection.sync_completed",
            resource_type="provider_connection",
            resource_id=conn.id,
            detail={
                "provider": conn.provider,
                "records_synced": result.records_synced,
                "new_items": len(new_items),
                "errors": result.errors,
                "is_first_sync": is_first_sync,
                "workflow_type": workflow_type,
                "provider_event_id": str(provider_event.id),
                "workflow_run_id": str(workflow_run.id),
            },
        )
    )
    db.commit()
    db.refresh(conn)
    db.refresh(provider_event)
    db.refresh(workflow_run)
    db.refresh(queued_agent_task)

    _schedule_workflow_dispatch(queued_agent_task.id)

    record_provider_sync_completion(
        db,
        client_id=tenant.id,
        provider=conn.provider,
        items_synced=result.records_synced,
        status=conn.status,
        workflow_run_id=workflow_run.id,
    )
    db.commit()

    await gbrain.ingest(
        client_id=tenant.id,
        category="provider_memory",
        content=(
            f"{conn.provider} {'first sync' if is_first_sync else 'sweep'}: "
            f"{result.records_synced} items, {len(new_items)} new."
        ),
        metadata={
            "provider": conn.provider,
            "provider_connection_id": str(conn.id),
            "workflow_run_id": str(workflow_run.id),
            "workflow_type": workflow_type,
            "records_synced": result.records_synced,
        },
    )

    return {
        "provider_connection_id": conn.id,
        "provider": conn.provider,
        "status": conn.status,
        "records_synced": result.records_synced,
        "errors": result.errors,
        "is_first_sync": is_first_sync,
        "provider_event_id": provider_event.id,
        "workflow_run_id": workflow_run.id,
    }


@router.get("/normalized-items", response_model=list[NormalizedItemRead])
def list_normalized_items(
    tu: TenantUser,
    db: DB,
    item_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """Tenant-scoped normalized ingest rows for Communications piles."""
    tenant, _ = tu
    q = select(NormalizedItem).where(NormalizedItem.client_id == tenant.id)
    if item_type == "email":
        q = q.where(NormalizedItem.item_type.in_(("email", "email_sync_receipt")))
    elif item_type:
        q = q.where(NormalizedItem.item_type == item_type)
    q = q.order_by(NormalizedItem.created_at.desc()).limit(limit)
    return db.execute(q).scalars().all()


@router.get("/{provider_id}", response_model=ProviderConnectionRead)
def get_provider(provider_id: uuid.UUID, tu: TenantUser, db: DB):
    tenant, _ = tu
    conn = db.execute(
        select(ProviderConnection).where(
            ProviderConnection.id == provider_id,
            ProviderConnection.client_id == tenant.id,
        )
    ).scalar_one_or_none()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Provider connection not found"
        )
    return conn
