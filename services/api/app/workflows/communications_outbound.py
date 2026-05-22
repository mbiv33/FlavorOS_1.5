"""Approval-gated communications outbound write-back (Lane J / K1)."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.gmail_outbound import apply_send_result, get_gmail_outbound_adapter
from app.models import Approval, Artifact, AuditEvent, OutboundAction, ProviderConnection, User

COMMUNICATIONS_SEND_GOVERNED_ACTION = "send_communication_draft"
COMMUNICATIONS_PROVIDER = "gmail"
COMMUNICATIONS_ACTION_TYPE = "gmail_send_draft"

OUTBOUND_STATUSES = frozenset({"queued", "executed", "failed", "pulled_back"})

CONNECTED_STATUSES = frozenset({"connected", "syncing", "ready"})


class OutboundExecuteConflictError(Exception):
    """Outbound cannot be executed in its current status."""

    def __init__(self, status: str) -> None:
        self.status = status
        super().__init__(f"Cannot execute outbound in status: {status}")


def is_communications_send(approval: Approval) -> bool:
    return approval.governed_action == COMMUNICATIONS_SEND_GOVERNED_ACTION


def is_communications_draft_artifact(artifact: Artifact) -> bool:
    meta = artifact.meta or {}
    if meta.get("artifact_type") == "draft_email":
        return True
    if meta.get("channel") == "email":
        return True
    return False


def resolve_gmail_connection(db: Session, client_id: uuid.UUID) -> ProviderConnection | None:
    rows = db.execute(
        select(ProviderConnection)
        .where(
            ProviderConnection.client_id == client_id,
            ProviderConnection.provider == COMMUNICATIONS_PROVIDER,
            ProviderConnection.enabled.is_(True),
        )
        .order_by(ProviderConnection.created_at.desc())
    ).scalars()
    for conn in rows:
        if conn.status in CONNECTED_STATUSES:
            return conn
    return None


def get_outbound_for_approval(db: Session, approval_id: uuid.UUID) -> OutboundAction | None:
    return db.execute(
        select(OutboundAction).where(OutboundAction.approval_id == approval_id)
    ).scalar_one_or_none()


def _audit_outbound(
    db: Session,
    *,
    client_id: uuid.UUID,
    actor_id: uuid.UUID | None,
    action: str,
    outbound: OutboundAction,
    extra: dict | None = None,
) -> None:
    detail: dict = {
        "outbound_action_id": str(outbound.id),
        "approval_id": str(outbound.approval_id),
        "artifact_id": str(outbound.artifact_id) if outbound.artifact_id else None,
        "provider": outbound.provider,
        "status": outbound.status,
    }
    if extra:
        detail.update(extra)
    db.add(
        AuditEvent(
            client_id=client_id,
            actor_id=actor_id,
            action=action,
            resource_type="outbound_action",
            resource_id=outbound.id,
            detail=detail,
        )
    )


def create_outbound_for_approval(
    db: Session,
    *,
    approval: Approval,
    artifact: Artifact,
    connection: ProviderConnection,
) -> OutboundAction:
    meta = artifact.meta or {}
    target = {
        "to": meta.get("to") or meta.get("recipient"),
        "subject": meta.get("subject") or artifact.title,
        "thread_id": meta.get("thread_id"),
    }
    payload = {
        "body": artifact.body,
        "subject": target.get("subject"),
        "to": target.get("to"),
        # Stored so ComposioGmailOutboundAdapter can route to the right Composio entity at execute time.
        "composio_user_id": connection.composio_user_id,
    }
    if meta.get("_force_failure"):
        payload["_force_failure"] = True
    outbound = OutboundAction(
        client_id=approval.client_id,
        approval_id=approval.id,
        artifact_id=artifact.id,
        provider_connection_id=connection.id,
        provider=COMMUNICATIONS_PROVIDER,
        action_type=COMMUNICATIONS_ACTION_TYPE,
        status="queued",
        target_reference_json=target,
        payload_json=payload,
        idempotency_key=f"approval:{approval.id}",
    )
    db.add(outbound)
    db.flush()
    return outbound


def _should_defer_execution() -> bool:
    """When true, decide only enqueues; execution runs via POST /execute or worker."""
    return os.environ.get("OUTBOUND_DEFER_EXECUTION", "").lower() in ("1", "true", "yes")


def _should_inline_execute() -> bool:
    """Inline execute on approve when demo env explicitly enables it."""
    if _should_defer_execution():
        return False
    for key in (
        "OUTBOUND_INLINE_EXECUTE_ON_APPROVE",
        "OUTBOUND_INLINE_EXECUTE",
    ):
        if os.environ.get(key, "").lower() in ("1", "true", "yes"):
            return True
    defer_default = os.environ.get("OUTBOUND_DEFER_EXECUTION", "true").lower()
    return defer_default in ("0", "false", "no")


def execute_outbound(
    db: Session,
    outbound: OutboundAction,
    *,
    actor_id: uuid.UUID | None = None,
    client_id: uuid.UUID | None = None,
) -> None:
    if outbound.status != "queued":
        return
    try:
        if outbound.provider == COMMUNICATIONS_PROVIDER:
            adapter = get_gmail_outbound_adapter()
            result = adapter.send_draft(outbound)
            apply_send_result(outbound, result)
        else:
            raise ValueError(f"Unsupported outbound provider: {outbound.provider}")
    except Exception as exc:
        outbound.status = "failed"
        outbound.last_error_summary = str(exc)[:500]
        outbound.updated_at = datetime.now(timezone.utc)
        if client_id is not None:
            _audit_outbound(
                db,
                client_id=client_id,
                actor_id=actor_id,
                action="outbound.failed",
                outbound=outbound,
                extra={"error": outbound.last_error_summary},
            )
        return
    outbound.updated_at = datetime.now(timezone.utc)
    if client_id is not None:
        _audit_outbound(
            db,
            client_id=client_id,
            actor_id=actor_id,
            action="outbound.executed",
            outbound=outbound,
        )


def enqueue_for_approval(
    db: Session,
    *,
    approval: Approval,
    user: User,
) -> OutboundAction:
    existing = get_outbound_for_approval(db, approval.id)
    if existing is not None:
        return existing

    if approval.artifact_id is None:
        raise ValueError("Communication draft approval requires a linked artifact")

    artifact = db.execute(
        select(Artifact).where(
            Artifact.id == approval.artifact_id,
            Artifact.client_id == approval.client_id,
        )
    ).scalar_one_or_none()
    if artifact is None:
        raise ValueError("Linked artifact not found")

    if not is_communications_draft_artifact(artifact):
        raise ValueError("Artifact is not a communication email draft")

    connection = resolve_gmail_connection(db, approval.client_id)
    if connection is None:
        raise ValueError("No connected Gmail provider for this client")

    outbound = create_outbound_for_approval(
        db, approval=approval, artifact=artifact, connection=connection
    )
    _audit_outbound(
        db,
        client_id=approval.client_id,
        actor_id=user.id,
        action="outbound.queued",
        outbound=outbound,
    )
    return outbound


def execute_outbound_with_audit(
    db: Session,
    *,
    outbound: OutboundAction,
    user: User,
) -> OutboundAction:
    """Execute a queued outbound row; raise if status is not queued."""
    if outbound.status != "queued":
        raise OutboundExecuteConflictError(outbound.status)
    execute_outbound(
        db,
        outbound,
        actor_id=user.id,
        client_id=outbound.client_id,
    )
    return outbound


def maybe_enqueue_and_execute(
    db: Session,
    *,
    approval: Approval,
    user: User,
) -> OutboundAction:
    outbound = enqueue_for_approval(db, approval=approval, user=user)
    if _should_inline_execute() and outbound.status == "queued":
        execute_outbound_with_audit(db, outbound=outbound, user=user)
    return outbound
