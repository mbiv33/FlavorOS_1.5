"""Onboarding workflow helpers.

The Composio connection flow is triggered from saved onboarding state.  This
keeps provider grants tenant-scoped and prevents scripts from creating shared
or global client connections.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    AgentTask,
    Artifact,
    AuditEvent,
    ClientUniverseEntry,
    Profile,
    ProviderConnection,
    Tenant,
    User,
    WorkflowRun,
)
from app.schemas import OnboardingContextAccount, OnboardingSaveRequest

ONBOARDING_TRIGGER = "client_onboarding.profile_saved"

GOOGLE_WORKSPACE_CATALOG = {
    "gmail": {
        "provider": "gmail",
        "toolkit": "gmail",
        "label": "Gmail",
        "category": "email",
        "enabled": True,
    },
    "googlecalendar": {
        "provider": "googlecalendar",
        "toolkit": "googlecalendar",
        "label": "Google Calendar",
        "category": "calendar",
        "enabled": True,
    },
    "googledrive": {
        "provider": "googledrive",
        "toolkit": "googledrive",
        "label": "Google Drive / Docs",
        "category": "files",
        "enabled": True,
    },
}

PROVIDER_ALIASES = {
    "gmail": "gmail",
    "google_calendar": "googlecalendar",
    "googlecalendar": "googlecalendar",
    "gcal": "googlecalendar",
    "google_drive": "googledrive",
    "googledrive": "googledrive",
    "google_docs": "googledrive",
    "googledocs": "googledrive",
    "gdocs": "googledrive",
    "drive": "googledrive",
}


def composio_user_id(tenant_id: object, user_id: object) -> str:
    return f"tenant:{tenant_id}:user:{user_id}"


def canonical_provider(provider: str) -> str:
    return PROVIDER_ALIASES.get(provider.strip().lower(), provider.strip().lower())


def provider_catalog() -> list[dict]:
    return list(GOOGLE_WORKSPACE_CATALOG.values())


def _upsert_universe_entry(
    db: Session,
    *,
    client_id,
    category: str,
    key: str,
    value: dict,
) -> ClientUniverseEntry:
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


def _account_payload(account: OnboardingContextAccount) -> dict:
    return account.model_dump()


def _queue_agent_task(
    db: Session,
    *,
    tenant: Tenant,
    workflow_type: str,
    agent: str,
    task_type: str,
    payload: dict,
) -> WorkflowRun:
    run = WorkflowRun(
        client_id=tenant.id,
        workflow_type=workflow_type,
        agent=agent,
        status="queued",
        input_data=payload,
    )
    db.add(run)
    db.flush()
    db.add(
        AgentTask(
            client_id=tenant.id,
            workflow_run_id=run.id,
            agent=agent,
            task_type=task_type,
            status="queued",
            payload={
                "schema_version": "flavoros.agent_task.v1",
                "workflow_run_id": str(run.id),
                "client_id": str(tenant.id),
                "target_agent": agent,
                "task_type": task_type,
                "inputs": payload,
            },
        )
    )
    return run


def _create_onboarding_sigma(
    db: Session,
    *,
    tenant: Tenant,
    workflow_run: WorkflowRun,
    provider_connections: list[ProviderConnection],
    status: str,
) -> Artifact:
    artifact = Artifact(
        client_id=tenant.id,
        kind="sigma",
        title="Onboarding readiness state",
        body="Client onboarding profile, contexts, authority defaults, and provider readiness.",
        status="ready",
        created_by="system:onboarding",
        workflow_run_id=workflow_run.id,
        meta={
            "sigma_type": "client_onboarding_readiness",
            "onboarding_status": status,
            "provider_connection_ids": [str(conn.id) for conn in provider_connections],
        },
    )
    db.add(artifact)
    return artifact


def _upsert_provider_connection(
    db: Session,
    *,
    tenant: Tenant,
    user: User,
    context_id: str,
    account: OnboardingContextAccount,
) -> ProviderConnection | None:
    if account.auth_scheme != "oauth":
        return None

    provider = canonical_provider(account.provider)
    catalog_item = GOOGLE_WORKSPACE_CATALOG.get(provider)
    if catalog_item is None:
        return None

    conn = db.execute(
        select(ProviderConnection).where(
            ProviderConnection.client_id == tenant.id,
            ProviderConnection.provider == provider,
            ProviderConnection.context_account_id == account.context_account_id,
        )
    ).scalar_one_or_none()

    shared_fields = {
        "context_id": context_id,
        "account_alias": account.account_alias,
        "purpose": account.context_account_purpose,
        "toolkit": catalog_item["toolkit"],
        "composio_user_id": composio_user_id(tenant.id, user.id),
        "enabled": True,
        "config": {
            "external_identifier": account.external_identifier,
            "source": ONBOARDING_TRIGGER,
        },
    }

    if conn is None:
        conn = ProviderConnection(
            client_id=tenant.id,
            provider=provider,
            context_account_id=account.context_account_id,
            status="not_started",
            **shared_fields,
        )
        db.add(conn)
        db.flush()
        db.add(
            AuditEvent(
                client_id=tenant.id,
                actor_id=user.id,
                action="provider_connection.planned",
                resource_type="provider_connection",
                resource_id=conn.id,
                detail={
                    "trigger": ONBOARDING_TRIGGER,
                    "provider": provider,
                    "context_id": context_id,
                    "context_account_id": account.context_account_id,
                },
            )
        )
    else:
        for field, value in shared_fields.items():
            setattr(conn, field, value)
        conn.updated_at = datetime.now(timezone.utc)

    return conn


def save_onboarding(
    db: Session,
    *,
    tenant: Tenant,
    user: User,
    body: OnboardingSaveRequest,
) -> tuple[Profile, list[ProviderConnection], str, WorkflowRun, Artifact]:
    """Persist onboarding state and trigger tenant-scoped provider planning."""

    profile = db.execute(select(Profile).where(Profile.user_id == user.id)).scalar_one_or_none()
    preferences = {
        "locale": body.identity.locale,
        "legal_name": body.identity.legal_name,
        "preferred_name": body.identity.preferred_name,
        "title": body.identity.title,
        "birth_date": body.identity.birth_date,
        "gender": body.identity.gender,
        "authority_defaults": body.authority_defaults,
        "onboarding": body.onboarding.model_dump(),
    }
    if profile is None:
        profile = Profile(
            client_id=tenant.id,
            user_id=user.id,
            display_name=body.identity.display_name,
            timezone=body.identity.timezone,
            preferences=preferences,
        )
        db.add(profile)
    else:
        profile.display_name = body.identity.display_name
        profile.timezone = body.identity.timezone
        profile.preferences = preferences
        profile.updated_at = datetime.now(timezone.utc)

    _upsert_universe_entry(
        db,
        client_id=tenant.id,
        category="authority_defaults",
        key="defaults",
        value=body.authority_defaults,
    )
    _upsert_universe_entry(
        db,
        client_id=tenant.id,
        category="onboarding",
        key="status",
        value=body.onboarding.model_dump(),
    )

    provider_connections: list[ProviderConnection] = []
    for context in body.contexts:
        _upsert_universe_entry(
            db,
            client_id=tenant.id,
            category="context",
            key=context.context_id,
            value=context.model_dump(exclude={"context_accounts"}),
        )
        for account in context.context_accounts:
            _upsert_universe_entry(
                db,
                client_id=tenant.id,
                category="context_account",
                key=account.context_account_id,
                value={"context_id": context.context_id, **_account_payload(account)},
            )
            conn = _upsert_provider_connection(
                db,
                tenant=tenant,
                user=user,
                context_id=context.context_id,
                account=account,
            )
            if conn is not None:
                provider_connections.append(conn)

    next_status = "ready_for_auth" if provider_connections else body.onboarding.status
    _upsert_universe_entry(
        db,
        client_id=tenant.id,
        category="onboarding",
        key="provider_trigger",
        value={
            "trigger": ONBOARDING_TRIGGER,
            "status": next_status,
            "provider_connections": len(provider_connections),
        },
    )
    workflow_run = _queue_agent_task(
        db,
        tenant=tenant,
        workflow_type="client_onboarding",
        agent="khadijah",
        task_type="onboarding_readiness_review",
        payload={
            "trigger": ONBOARDING_TRIGGER,
            "onboarding_status": next_status,
            "contexts": [context.context_id for context in body.contexts],
            "provider_connections": len(provider_connections),
        },
    )
    _queue_agent_task(
        db,
        tenant=tenant,
        workflow_type="morning_standup_seed",
        agent="khadijah",
        task_type="briefing_seed_from_onboarding",
        payload={
            "trigger": ONBOARDING_TRIGGER,
            "profile_display_name": body.identity.display_name,
            "onboarding_status": next_status,
        },
    )
    if any(context.context_id in {"travel", "business"} for context in body.contexts):
        _queue_agent_task(
            db,
            tenant=tenant,
            workflow_type="travel_research_seed",
            agent="regine",
            task_type="travel_research_context_seed",
            payload={
                "trigger": ONBOARDING_TRIGGER,
                "contexts": [context.context_id for context in body.contexts],
            },
        )

    sigma = _create_onboarding_sigma(
        db,
        tenant=tenant,
        workflow_run=workflow_run,
        provider_connections=provider_connections,
        status=next_status,
    )
    db.add(
        AuditEvent(
            client_id=tenant.id,
            actor_id=user.id,
            action=ONBOARDING_TRIGGER,
            resource_type="tenant",
            resource_id=tenant.id,
            detail={
                "contexts": len(body.contexts),
                "provider_connections": len(provider_connections),
                "status": next_status,
            },
        )
    )

    db.commit()
    db.refresh(profile)
    db.refresh(workflow_run)
    db.refresh(sigma)
    for conn in provider_connections:
        db.refresh(conn)
    return profile, provider_connections, next_status, workflow_run, sigma
