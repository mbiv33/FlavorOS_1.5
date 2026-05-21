"""Client Universe read/write service — envelope assembly and KV upserts."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.models import ClientContext, ClientUniverseEntry, Profile, ProviderConnection, User
from app.schemas import (
    ClientContextEnvelopeRead,
    ClientUniverseEnvelopeRead,
    ProviderConnectionRead,
    UniverseReadinessRead,
)
from app.universe_registry import validate_kv_category, validate_kv_key

_SINGLETON_CONTEXT_TYPES = frozenset({"personal", "professional"})


def upsert_entry(
    db: Session,
    *,
    client_id: uuid.UUID,
    category: str,
    key: str,
    value: dict,
) -> ClientUniverseEntry:
    validate_kv_category(category)
    validate_kv_key(category, key)
    entry = db.execute(
        select(ClientUniverseEntry).where(
            ClientUniverseEntry.client_id == client_id,
            ClientUniverseEntry.category == category,
            ClientUniverseEntry.key == key,
        )
    ).scalar_one_or_none()
    if entry is None:
        entry = ClientUniverseEntry(
            client_id=client_id,
            category=category,
            key=key,
            value=value,
        )
        db.add(entry)
    else:
        entry.value = value
        entry.updated_at = datetime.now(timezone.utc)
    return entry


def materialize_onboarding_kv(
    *,
    authority_defaults: dict,
    onboarding_status: dict,
    provider_trigger: dict | None = None,
    preferences: dict | None = None,
) -> list[tuple[str, str, dict]]:
    """Return (category, key, value) tuples for KV universe rows from onboarding."""
    rows: list[tuple[str, str, dict]] = [
        ("authority_defaults", "defaults", authority_defaults),
        ("onboarding", "status", onboarding_status),
    ]
    if provider_trigger is not None:
        rows.append(("onboarding", "provider_trigger", provider_trigger))
    if preferences is not None:
        rows.append(("preferences", "defaults", preferences))
    return rows


def get_envelope(db: Session, client_id: uuid.UUID) -> ClientUniverseEnvelopeRead:
    profile = (
        db.execute(
            select(Profile)
            .join(User, Profile.user_id == User.id)
            .where(Profile.client_id == client_id)
            .order_by(case((User.role == "client", 0), else_=1), Profile.created_at.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )

    contexts = (
        db.execute(
            select(ClientContext)
            .where(ClientContext.client_id == client_id)
            .order_by(ClientContext.type, ClientContext.name)
        )
        .scalars()
        .all()
    )

    connections = (
        db.execute(
            select(ProviderConnection).where(ProviderConnection.client_id == client_id)
        )
        .scalars()
        .all()
    )
    by_context: dict[uuid.UUID, list[ProviderConnection]] = {}
    for conn in connections:
        if conn.client_context_id is not None:
            by_context.setdefault(conn.client_context_id, []).append(conn)

    context_reads: list[ClientContextEnvelopeRead] = []
    for ctx in contexts:
        conns = by_context.get(ctx.id, [])
        context_reads.append(
            ClientContextEnvelopeRead(
                id=ctx.id,
                client_id=ctx.client_id,
                type=ctx.type,
                name=ctx.name,
                created_at=ctx.created_at,
                provider_connections=[
                    ProviderConnectionRead.model_validate(c) for c in conns
                ],
            )
        )

    entries = (
        db.execute(
            select(ClientUniverseEntry).where(ClientUniverseEntry.client_id == client_id)
        )
        .scalars()
        .all()
    )

    authority: dict[str, Any] | None = None
    onboarding: dict[str, Any] = {}
    preferences: dict[str, Any] | None = None
    readiness: dict[str, Any] = {}
    provider_expectations: dict[str, Any] = {}

    for entry in entries:
        if entry.category == "authority_defaults" and entry.key == "defaults":
            authority = entry.value
        elif entry.category == "onboarding":
            onboarding[entry.key] = entry.value
        elif entry.category == "preferences" and entry.key == "defaults":
            preferences = entry.value
        elif entry.category == "readiness":
            readiness[entry.key] = entry.value
        elif entry.category == "provider_expectations":
            provider_expectations[entry.key] = entry.value

    profile_payload: dict[str, Any] | None = None
    if profile is not None:
        profile_payload = {
            "id": str(profile.id),
            "display_name": profile.display_name,
            "timezone": profile.timezone,
            "preferences": profile.preferences,
        }

    return ClientUniverseEnvelopeRead(
        client_id=client_id,
        profile=profile_payload,
        contexts=context_reads,
        authority=authority,
        onboarding=onboarding,
        preferences=preferences,
        readiness=readiness,
        provider_expectations=provider_expectations,
    )


def compute_readiness(
    db: Session,
    client_id: uuid.UUID,
) -> UniverseReadinessRead:
    envelope = get_envelope(db, client_id)
    onboarding_status = (envelope.onboarding.get("status") or {}).get("status", "pending")
    connections = (
        db.execute(
            select(ProviderConnection).where(ProviderConnection.client_id == client_id)
        )
        .scalars()
        .all()
    )
    oauth_connections = [c for c in connections if c.enabled]
    ready_count = sum(1 for c in oauth_connections if c.status == "ready")
    sync_ready = bool(oauth_connections) and ready_count == len(oauth_connections)
    flags = {
        "has_profile": envelope.profile is not None,
        "has_contexts": len(envelope.contexts) > 0,
        "onboarding_status": onboarding_status,
        "provider_connections_total": len(oauth_connections),
        "provider_connections_ready": ready_count,
        "sync_ready": sync_ready,
    }
    return UniverseReadinessRead(
        client_id=client_id,
        onboarding_complete=onboarding_status in {"ready_for_auth", "ready_for_sync", "active"},
        sync_ready=sync_ready,
        flags=flags,
    )


def record_provider_sync_completion(
    db: Session,
    *,
    client_id: uuid.UUID,
    provider: str,
    items_synced: int,
    status: str,
    workflow_run_id: uuid.UUID | None = None,
) -> None:
    """Update readiness and provider_expectations after provider-first sync."""
    now = datetime.now(timezone.utc).isoformat()
    sync_payload: dict[str, Any] = {
        "provider": provider,
        "items_synced": items_synced,
        "connection_status": status,
        "completed_at": now,
        "last_provider": provider,
        "status": "completed",
    }
    if workflow_run_id is not None:
        sync_payload["workflow_run_id"] = str(workflow_run_id)
    upsert_entry(
        db,
        client_id=client_id,
        category="provider_expectations",
        key=provider,
        value={"status": status, "items_synced": items_synced},
    )
    upsert_entry(
        db,
        client_id=client_id,
        category="readiness",
        key=f"sync:{provider}",
        value=sync_payload,
    )
    upsert_entry(
        db,
        client_id=client_id,
        category="readiness",
        key="sync",
        value={
            "last_provider": provider,
            "items_synced": items_synced,
            "status": "completed",
            "completed_at": now,
        },
    )


def export_yaml_slices(db: Session, client_id: uuid.UUID) -> dict[str, dict]:
    """Build dev export payloads keyed by YAML filename (no filesystem write)."""
    envelope = get_envelope(db, client_id)
    profile = envelope.profile or {}
    return {
        "profile.yaml": {
            "display_name": profile.get("display_name"),
            "timezone": profile.get("timezone"),
            "preferences": profile.get("preferences"),
        },
        "hitl_policy.yaml": envelope.authority or {},
        "onboarding_status.yaml": envelope.onboarding,
        "preferences.yaml": envelope.preferences or {},
    }
