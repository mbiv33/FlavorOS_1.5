"""Provider Connection router — external service links per tenant."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters import ComposioAdapter
from app.deps import get_composio, get_db, require_tenant_match
from app.models import (
    AgentTask,
    AuditEvent,
    NormalizedItem,
    ProviderConnection,
    ProviderEvent,
    Tenant,
    User,
    WorkflowRun,
)
from app.onboarding import composio_user_id, provider_catalog
from app.schemas import (
    ProviderCallbackRead,
    ProviderCatalogItem,
    ProviderConnectionRead,
    ProviderConnectionWrite,
    ProviderConnectLinkRead,
    ProviderConnectLinkRequest,
    ProviderSyncRead,
    ProviderSyncRequest,
)
from app.workflows.provider_first_sync import process_provider_first_sync

router = APIRouter(prefix="/providers", tags=["providers"])

TenantUser = Annotated[tuple[Tenant, User], Depends(require_tenant_match)]
DB = Annotated[Session, Depends(get_db)]
Composio = Annotated[ComposioAdapter, Depends(get_composio)]


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

    user_ref = conn.composio_user_id or composio_user_id(tenant.id, user.id)
    result = await composio.create_connect_link(
        client_id=tenant.id,
        composio_user_id=user_ref,
        provider=conn.provider,
        toolkit=conn.toolkit,
        redirect_uri=body.redirect_uri,
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
    tu: TenantUser,
    db: DB,
    status_value: str = Query("connected", alias="status"),
    connected_account_id: str | None = None,
):
    tenant, user = tu
    conn = _get_connection(db, tenant, provider_connection_id)
    status_map = {
        "ACTIVE": "connected",
        "active": "connected",
        "connected": "connected",
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
    conn.connected_account_id = connected_account_id or conn.connected_account_id
    conn.status_reason = f"Composio callback status: {status_value}"
    conn.last_checked_at = datetime.now(timezone.utc)
    db.add(
        AuditEvent(
            client_id=tenant.id,
            actor_id=user.id,
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

    conn.status = "syncing"
    db.flush()
    result = await composio.trigger_sync(client_id=tenant.id, provider=conn.provider)
    conn.status = "ready" if not result.errors else "degraded"
    conn.status_reason = "; ".join(result.errors) if result.errors else "First sync verified."
    conn.last_sync_at = datetime.now(timezone.utc)
    conn.last_checked_at = conn.last_sync_at
    provider_event = ProviderEvent(
        client_id=tenant.id,
        provider_connection_id=conn.id,
        provider=conn.provider,
        event_type="provider_first_sync",
        idempotency_key=f"{conn.id}:sync:{conn.last_sync_at.isoformat()}",
        status="received",
        payload={
            "records_synced": result.records_synced,
            "errors": result.errors,
            "source": "providers.sync",
        },
    )
    db.add(provider_event)
    db.flush()
    normalized_item = NormalizedItem(
        client_id=tenant.id,
        provider_event_id=provider_event.id,
        item_type=_item_type_for_provider(conn.provider),
        title=f"{conn.provider} first sync",
        data={
            "provider_connection_id": str(conn.id),
            "records_synced": result.records_synced,
            "status": conn.status,
        },
    )
    db.add(normalized_item)
    db.flush()
    workflow_run = WorkflowRun(
        client_id=tenant.id,
        workflow_type="provider_first_sync",
        agent=_agent_for_provider(conn.provider),
        status="queued",
        input_data={
            "provider_connection_id": str(conn.id),
            "provider_event_id": str(provider_event.id),
            "normalized_item_id": str(normalized_item.id),
            "provider": conn.provider,
        },
    )
    db.add(workflow_run)
    db.flush()
    db.add(
        AgentTask(
            client_id=tenant.id,
            workflow_run_id=workflow_run.id,
            agent=workflow_run.agent or "khadijah",
            task_type="provider_first_sync_review",
            status="queued",
            payload={
                "schema_version": "flavoros.agent_task.v1",
                "workflow_run_id": str(workflow_run.id),
                "client_id": str(tenant.id),
                "target_agent": workflow_run.agent,
                "task_type": "provider_first_sync_review",
                "source_refs": {
                    "provider_event_id": str(provider_event.id),
                    "normalized_item_id": str(normalized_item.id),
                },
                "inputs": workflow_run.input_data,
            },
        )
    )
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
                "errors": result.errors,
                "provider_event_id": str(provider_event.id),
                "workflow_run_id": str(workflow_run.id),
            },
        )
    )
    db.commit()
    db.refresh(conn)
    db.refresh(provider_event)
    db.refresh(workflow_run)

    process_provider_first_sync(db, workflow_run.id)

    return {
        "provider_connection_id": conn.id,
        "provider": conn.provider,
        "status": conn.status,
        "records_synced": result.records_synced,
        "errors": result.errors,
        "provider_event_id": provider_event.id,
        "workflow_run_id": workflow_run.id,
    }


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
