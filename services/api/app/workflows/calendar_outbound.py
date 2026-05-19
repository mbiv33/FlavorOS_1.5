"""Approval-gated calendar outbound write-back (Lane M)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Approval, Artifact, AuditEvent, OutboundAction, ProviderConnection, User
from app.workflows.communications_outbound import (
    CONNECTED_STATUSES,
    _audit_outbound,
    _should_inline_execute,
    get_outbound_for_approval,
)

CALENDAR_SEND_GOVERNED_ACTION = "send_calendar_hold"
CALENDAR_PROVIDER = "googlecalendar"
CALENDAR_ACTION_TYPE = "calendar_create_hold"


def is_calendar_send(approval: Approval) -> bool:
    return approval.governed_action == CALENDAR_SEND_GOVERNED_ACTION


def is_calendar_hold_artifact(artifact: Artifact) -> bool:
    meta = artifact.meta or {}
    if meta.get("artifact_type") == "calendar_hold":
        return True
    if meta.get("channel") == "calendar":
        return True
    return False


def resolve_calendar_connection(db: Session, client_id: uuid.UUID) -> ProviderConnection | None:
    rows = db.execute(
        select(ProviderConnection)
        .where(
            ProviderConnection.client_id == client_id,
            ProviderConnection.provider == CALENDAR_PROVIDER,
            ProviderConnection.enabled.is_(True),
        )
        .order_by(ProviderConnection.created_at.desc())
    ).scalars()
    for conn in rows:
        if conn.status in CONNECTED_STATUSES:
            return conn
    return None


def create_calendar_outbound_for_approval(
    db: Session,
    *,
    approval: Approval,
    artifact: Artifact,
    connection: ProviderConnection,
) -> OutboundAction:
    meta = artifact.meta or {}
    target = {
        "title": meta.get("title") or artifact.title,
        "start": meta.get("start"),
        "end": meta.get("end"),
        "location": meta.get("location"),
    }
    payload = {
        "summary": artifact.title,
        "description": artifact.body,
        "start": target.get("start"),
        "end": target.get("end"),
    }
    if meta.get("_force_failure"):
        payload["_force_failure"] = True
    outbound = OutboundAction(
        client_id=approval.client_id,
        approval_id=approval.id,
        artifact_id=artifact.id,
        provider_connection_id=connection.id,
        provider=CALENDAR_PROVIDER,
        action_type=CALENDAR_ACTION_TYPE,
        status="queued",
        target_reference_json=target,
        payload_json=payload,
        idempotency_key=f"approval:{approval.id}",
    )
    db.add(outbound)
    db.flush()
    return outbound


class CalendarExecuteConflictError(Exception):
    def __init__(self, status: str) -> None:
        self.status = status
        super().__init__(f"Cannot execute outbound in status: {status}")


def execute_calendar_outbound(
    db: Session,
    outbound: OutboundAction,
    *,
    actor_id: uuid.UUID | None = None,
    client_id: uuid.UUID | None = None,
) -> None:
    if outbound.status != "queued":
        return
    payload = outbound.payload_json or {}
    if payload.get("_force_failure"):
        outbound.status = "failed"
        outbound.last_error_summary = "Stub calendar execution failed (test hook)"
        outbound.updated_at = datetime.now(timezone.utc)
        if client_id is not None:
            _audit_outbound(
                db,
                client_id=client_id,
                actor_id=actor_id,
                action="outbound.failed",
                outbound=outbound,
            )
        return
    outbound.status = "executed"
    outbound.executed_at = datetime.now(timezone.utc)
    outbound.execution_result_json = {
        "provider": outbound.provider,
        "external_result_id": f"stub-cal-{outbound.id}",
        "receipt_status": "success",
        "response_summary": "Stub calendar hold created",
    }
    outbound.updated_at = datetime.now(timezone.utc)
    if client_id is not None:
        _audit_outbound(
            db,
            client_id=client_id,
            actor_id=actor_id,
            action="outbound.executed",
            outbound=outbound,
        )


def enqueue_calendar_for_approval(
    db: Session,
    *,
    approval: Approval,
    user: User,
) -> OutboundAction:
    existing = get_outbound_for_approval(db, approval.id)
    if existing is not None:
        return existing

    if approval.artifact_id is None:
        raise ValueError("Calendar hold approval requires a linked artifact")

    artifact = db.execute(
        select(Artifact).where(
            Artifact.id == approval.artifact_id,
            Artifact.client_id == approval.client_id,
        )
    ).scalar_one_or_none()
    if artifact is None:
        raise ValueError("Linked artifact not found")

    if not is_calendar_hold_artifact(artifact):
        raise ValueError("Artifact is not a calendar hold draft")

    connection = resolve_calendar_connection(db, approval.client_id)
    if connection is None:
        raise ValueError("No connected Google Calendar provider for this client")

    outbound = create_calendar_outbound_for_approval(
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


def execute_calendar_outbound_with_audit(
    db: Session,
    *,
    outbound: OutboundAction,
    user: User,
) -> OutboundAction:
    if outbound.status != "queued":
        raise CalendarExecuteConflictError(outbound.status)
    execute_calendar_outbound(
        db,
        outbound,
        actor_id=user.id,
        client_id=outbound.client_id,
    )
    return outbound


def maybe_enqueue_and_execute_calendar(
    db: Session,
    *,
    approval: Approval,
    user: User,
) -> OutboundAction:
    outbound = enqueue_calendar_for_approval(db, approval=approval, user=user)
    if _should_inline_execute() and outbound.status == "queued":
        execute_calendar_outbound(
            db,
            outbound,
            actor_id=user.id,
            client_id=approval.client_id,
        )
    return outbound
