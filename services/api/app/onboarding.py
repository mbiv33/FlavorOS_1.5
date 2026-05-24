"""Onboarding workflow helpers.

The Composio connection flow is triggered from saved onboarding state.  This
keeps provider grants tenant-scoped and prevents scripts from creating shared
or global client connections.

Contexts and context accounts are stored relationally (`client_contexts`,
`provider_connections.client_context_id`). KV `client_universe` holds only
authority_defaults, onboarding, preferences, readiness, and provider_expectations.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    AgentTask,
    Artifact,
    AuditEvent,
    ClientContext,
    Profile,
    ProviderConnection,
    Tenant,
    User,
    WorkflowRun,
)
from app.schemas import OnboardingContext, OnboardingContextAccount, OnboardingSaveRequest
from app.services.client_universe import upsert_entry

ONBOARDING_TRIGGER = "client_onboarding.profile_saved"

_SINGLETON_CONTEXT_TYPES = frozenset({"personal", "professional"})

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


def _p(provider: str, toolkit: str, label: str, category: str, enabled: bool) -> dict:
    return {
        "provider": provider,
        "toolkit": toolkit,
        "label": label,
        "category": category,
        "enabled": enabled,
    }


CONTEXT_PROVIDER_CATALOG: dict[str, list[dict]] = {
    "personal": [
        _p("gmail", "gmail", "Gmail", "email", True),
        _p("googlecalendar", "googlecalendar", "Google Calendar", "calendar", True),
        _p("x", "twitter", "X / Twitter", "social", False),
        _p("linkedin", "linkedin", "LinkedIn", "social", False),
        _p("facebook", "facebook", "Facebook", "social", False),
        _p("instagram", "instagram", "Instagram", "social", False),
    ],
    "professional": [
        _p("gmail", "gmail", "Work Gmail", "email", True),
        _p("googlecalendar", "googlecalendar", "Work Calendar", "calendar", True),
        _p("linkedin", "linkedin", "LinkedIn", "social", False),
    ],
    "business": [
        _p("gmail", "gmail", "Business Gmail", "email", True),
        _p("googlecalendar", "googlecalendar", "Business Calendar", "calendar", True),
        _p("googledrive", "googledrive", "Google Drive / Docs", "files", True),
        _p("x", "twitter", "X / Twitter", "social", False),
        _p("linkedin", "linkedin", "LinkedIn", "social", False),
        _p("instagram", "instagram", "Instagram", "social", False),
    ],
}


def provider_catalog() -> list[dict]:
    return list(GOOGLE_WORKSPACE_CATALOG.values())


def providers_for_context(context_type: str) -> list[dict]:
    """Return the provider catalog entries for a given context type."""
    return CONTEXT_PROVIDER_CATALOG.get(context_type, [])


def _resolve_or_create_client_context(
    db: Session,
    tenant: Tenant,
    context: OnboardingContext,
) -> ClientContext:
    """Upsert relational ClientContext from onboarding payload."""
    try:
        ctx_uuid = uuid.UUID(context.context_id)
        existing = db.get(ClientContext, ctx_uuid)
        if existing is not None and existing.client_id == tenant.id:
            existing.name = context.display_name
            existing.type = context.context_type
            return existing
    except ValueError:
        pass

    existing = db.execute(
        select(ClientContext).where(
            ClientContext.client_id == tenant.id,
            ClientContext.type == context.context_type,
            ClientContext.name == context.display_name,
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    if context.context_type in _SINGLETON_CONTEXT_TYPES:
        singleton = db.execute(
            select(ClientContext).where(
                ClientContext.client_id == tenant.id,
                ClientContext.type == context.context_type,
            )
        ).scalar_one_or_none()
        if singleton is not None:
            singleton.name = context.display_name
            return singleton

    ctx = ClientContext(
        client_id=tenant.id,
        type=context.context_type,
        name=context.display_name,
    )
    db.add(ctx)
    db.flush()
    return ctx


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
    client_context_ids: list[str],
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
            "client_context_ids": client_context_ids,
        },
    )
    db.add(artifact)
    return artifact


def _upsert_provider_connection(
    db: Session,
    *,
    tenant: Tenant,
    user: User,
    client_context: ClientContext,
    context_slug: str,
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
            ProviderConnection.client_context_id == client_context.id,
        )
    ).scalar_one_or_none()

    shared_fields = {
        "client_context_id": client_context.id,
        "context_id": context_slug,
        "context_account_id": account.context_account_id,
        "account_alias": account.account_alias,
        "purpose": account.context_account_purpose,
        "toolkit": catalog_item["toolkit"],
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
                    "context_id": context_slug,
                    "client_context_id": str(client_context.id),
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
    if body.identity is not None:
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
    elif profile is None:
        raise ValueError("identity is required for first-time onboarding save")

    provider_connections: list[ProviderConnection] = []
    client_context_ids: list[str] = []

    for context in body.contexts:
        client_context = _resolve_or_create_client_context(db, tenant, context)
        context_uuid = str(client_context.id)
        client_context_ids.append(context_uuid)
        context_slug = context_uuid

        for account in context.context_accounts:
            conn = _upsert_provider_connection(
                db,
                tenant=tenant,
                user=user,
                client_context=client_context,
                context_slug=context_slug,
                account=account,
            )
            if conn is not None:
                provider_connections.append(conn)

    authority_value = {
        **body.authority_defaults,
        "client_context_ids": client_context_ids,
    }
    upsert_entry(
        db,
        client_id=tenant.id,
        category="authority_defaults",
        key="defaults",
        value=authority_value,
    )
    upsert_entry(
        db,
        client_id=tenant.id,
        category="onboarding",
        key="status",
        value={
            **body.onboarding.model_dump(),
            "client_context_ids": client_context_ids,
        },
    )

    next_status = "ready_for_auth" if provider_connections else body.onboarding.status
    upsert_entry(
        db,
        client_id=tenant.id,
        category="onboarding",
        key="provider_trigger",
        value={
            "trigger": ONBOARDING_TRIGGER,
            "status": next_status,
            "provider_connections": len(provider_connections),
            "client_context_ids": client_context_ids,
        },
    )
    upsert_entry(
        db,
        client_id=tenant.id,
        category="readiness",
        key="onboarding",
        value={"status": next_status, "client_context_ids": client_context_ids},
    )

    workflow_run = _queue_agent_task(
        db,
        tenant=tenant,
        workflow_type="client_onboarding",
        agent="khadijah",
        task_type="client_onboarding",
        payload={
            "trigger": ONBOARDING_TRIGGER,
            "onboarding_status": next_status,
            "contexts": client_context_ids,
            "provider_connections": len(provider_connections),
        },
    )

    sigma = _create_onboarding_sigma(
        db,
        tenant=tenant,
        workflow_run=workflow_run,
        provider_connections=provider_connections,
        status=next_status,
        client_context_ids=client_context_ids,
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
                "client_context_ids": client_context_ids,
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
