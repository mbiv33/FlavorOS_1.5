"""SQLAlchemy models."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# ---------------------------------------------------------------------------
# Tenant / User / Profile (existing)
# ---------------------------------------------------------------------------


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    users: Mapped[list["User"]] = relationship(back_populates="tenant")
    profiles: Mapped[list["Profile"]] = relationship(back_populates="tenant")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # client | developer_admin
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    tenant: Mapped[Tenant] = relationship(back_populates="users")
    profile: Mapped[Optional["Profile"]] = relationship(back_populates="user", uselist=False)


class Profile(Base):
    """Client-scoped profile; client_id references tenants.id (tenant = client for MVP)."""

    __tablename__ = "profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_profiles_user"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    timezone: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )

    tenant: Mapped[Tenant] = relationship(back_populates="profiles")
    user: Mapped[User] = relationship(back_populates="profile")


# ---------------------------------------------------------------------------
# Client Context — named operational context per client tenant
# ---------------------------------------------------------------------------


class ClientContext(Base):
    """A named operational context for a client tenant.

    Context type drives agent routing and contact classification:
    - personal: household/lifestyle providers; no business contact scope
    - professional: W2 employment; contacts are work colleagues and external customers
    - business: client-owned businesses; contacts are clients and contractors

    Khadijah (conductor agent) reads context.type to set contact scope and
    approval authority defaults on workflow tasks.
    """

    __tablename__ = "client_contexts"
    __table_args__ = (
        UniqueConstraint("client_id", "type", "name", name="uq_client_context_type_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# ---------------------------------------------------------------------------
# Client Universe — extensible key/value context per tenant
# ---------------------------------------------------------------------------


class ClientUniverseEntry(Base):
    """
    Arbitrary context about the client's world — preferences, facts, contacts,
    locations, etc.  category+key is unique per tenant.
    """

    __tablename__ = "client_universe"
    __table_args__ = (
        UniqueConstraint("client_id", "category", "key", name="uq_cuniverse_cat_key"),
        Index("ix_cuniverse_client_category", "client_id", "category"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )


# ---------------------------------------------------------------------------
# Artifact — work product produced by agents for clients or internal use
# ---------------------------------------------------------------------------


class Artifact(Base):
    """
    kind: 'client' (user-facing) | 'sigma' (internal agent-used).
    status: draft | ready | approved | rejected | archived.
    """

    __tablename__ = "artifacts"
    __table_args__ = (
        Index("ix_artifacts_client_kind", "client_id", "kind"),
        Index("ix_artifacts_client_status", "client_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft")
    created_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    workflow_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workflow_runs.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )

    approvals: Mapped[list["Approval"]] = relationship(back_populates="artifact")


# ---------------------------------------------------------------------------
# Approval — HITL gate for governed actions
# ---------------------------------------------------------------------------


class Approval(Base):
    """
    decision: pending | approved | rejected | expired.
    governed_action describes what happens on approval.
    """

    __tablename__ = "approvals"
    __table_args__ = (
        Index("ix_approvals_client_decision", "client_id", "decision"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    artifact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("artifacts.id", ondelete="SET NULL"), nullable=True
    )
    governed_action: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decision: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    decided_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    artifact: Mapped[Optional[Artifact]] = relationship(back_populates="approvals")


# ---------------------------------------------------------------------------
# Outbound Action — approval-gated provider write-back
# ---------------------------------------------------------------------------


class OutboundAction(Base):
    """
    status: queued | executed | failed | pulled_back.
    One outbound row per approval (unique approval_id).
    """

    __tablename__ = "outbound_actions"
    __table_args__ = (
        Index("ix_outbound_actions_client_status_created", "client_id", "status", "created_at"),
        UniqueConstraint("approval_id", name="uq_outbound_actions_approval_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    approval_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("approvals.id", ondelete="CASCADE"), nullable=False
    )
    artifact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("artifacts.id", ondelete="SET NULL"), nullable=True
    )
    provider_connection_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("provider_connections.id", ondelete="SET NULL"),
        nullable=True,
    )
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    action_type: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    target_reference_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    payload_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    executed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    execution_result_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )


# ---------------------------------------------------------------------------
# Workflow Run — tracks orchestrator / agent workflow executions
# ---------------------------------------------------------------------------


class WorkflowRun(Base):
    """
    status: queued | running | completed | failed | cancelled.
    """

    __tablename__ = "workflow_runs"
    __table_args__ = (
        Index("ix_wfruns_client_status", "client_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    workflow_type: Mapped[str] = mapped_column(String(128), nullable=False)
    agent: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="queued")
    input_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    output_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class AgentTask(Base):
    """Durable unit of work assigned to an agent for a workflow run."""

    __tablename__ = "agent_tasks"
    __table_args__ = (
        Index("ix_agent_tasks_client_status", "client_id", "status"),
        Index("ix_agent_tasks_client_agent", "client_id", "agent"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    workflow_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False
    )
    agent: Mapped[str] = mapped_column(String(64), nullable=False)
    task_type: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="queued")
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )


# ---------------------------------------------------------------------------
# Provider Connection — Composio / external provider link per tenant
# ---------------------------------------------------------------------------


class ProviderConnection(Base):
    """
    status: not_started | pending_consent | initiated | connected | syncing |
    ready | degraded | blocked | revoked | failed.
    """

    __tablename__ = "provider_connections"
    __table_args__ = (
        UniqueConstraint(
            "client_id",
            "provider",
            "client_context_id",
            name="uq_provconn_client_provider_client_context",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    client_context_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("client_contexts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    context_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    context_account_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    account_alias: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    purpose: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    toolkit: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    auth_config_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    connected_account_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    composio_user_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="not_started")
    status_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scopes: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )


class ProviderEvent(Base):
    """Durable provider ingress/sync event before normalization or agent work."""

    __tablename__ = "provider_events"
    __table_args__ = (
        Index("ix_provider_events_client_provider", "client_id", "provider"),
        UniqueConstraint("client_id", "idempotency_key", name="uq_provider_events_idempotency"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    provider_connection_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("provider_connections.id", ondelete="SET NULL"),
        nullable=True,
    )
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False)
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="received")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class NormalizedItem(Base):
    """Provider-native event normalized into a FlavorOS-native item envelope."""

    __tablename__ = "normalized_items"
    __table_args__ = (
        Index("ix_normalized_items_client_type", "client_id", "item_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    provider_event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("provider_events.id", ondelete="CASCADE"), nullable=False
    )
    item_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# ---------------------------------------------------------------------------
# Audit Event — immutable log of significant actions
# ---------------------------------------------------------------------------


class AuditEvent(Base):
    __tablename__ = "audit_events"
    __table_args__ = (
        Index("ix_audit_client_ts", "client_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    resource_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    detail: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# ---------------------------------------------------------------------------
# Sync Checkpoint — tracks incremental sync cursor per provider connection
# ---------------------------------------------------------------------------


class SyncCheckpoint(Base):
    """Last-known sync position per provider connection and checkpoint key.

    checkpoint_key identifies what is being tracked, e.g. "gmail_history_id"
    or "calendar_sync_token". checkpoint_value is the opaque cursor returned
    by the provider. On re-sync, the ingestion path reads this value to fetch
    only new events rather than replaying the full history.
    """

    __tablename__ = "sync_checkpoints"
    __table_args__ = (
        UniqueConstraint(
            "client_id",
            "provider_connection_id",
            "checkpoint_key",
            name="uq_sync_checkpoints_conn_key",
        ),
        Index("ix_sync_checkpoints_conn", "client_id", "provider_connection_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    provider_connection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("provider_connections.id", ondelete="CASCADE"),
        nullable=False,
    )
    checkpoint_key: Mapped[str] = mapped_column(String(128), nullable=False)
    checkpoint_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    synced_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )


# ---------------------------------------------------------------------------
# Agent Task Event — immutable step log per agent task
# ---------------------------------------------------------------------------


class AgentTaskEvent(Base):
    """Append-only log of events within a single agent task execution.

    event_type vocabulary: started | tool_called | llm_response | hitl_gate |
    hitl_resumed | completed | failed | retried.

    detail carries structured context: tool name, token counts, error message,
    approval_id for HITL gates, etc. Never update — always append.
    """

    __tablename__ = "agent_task_events"
    __table_args__ = (
        Index("ix_agent_task_events_task_ts", "agent_task_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    agent_task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    detail: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# ---------------------------------------------------------------------------
# Agent Report — formal work product produced by an agent task or run
# ---------------------------------------------------------------------------


class AgentReport(Base):
    """Structured output envelope produced by an agent after completing work.

    report_type identifies the workflow that generated it, e.g.:
    "communication_sweep" | "morning_standup" | "cob_workday" |
    "meeting_prep" | "finance_pulse" | "travel_horizon_scan".

    An AgentReport may be promoted to a Client Artifact (artifact_id FK) once
    it passes HITL review. Until then it lives here as the agent's raw output.
    """

    __tablename__ = "agent_reports"
    __table_args__ = (
        Index("ix_agent_reports_client_agent", "client_id", "agent"),
        Index("ix_agent_reports_client_type", "client_id", "report_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    workflow_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    agent_task_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    agent: Mapped[str] = mapped_column(String(64), nullable=False)
    report_type: Mapped[str] = mapped_column(String(128), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    artifact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("artifacts.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )


# ---------------------------------------------------------------------------
# PAC/PTQ — buffer between inbound signals and committed execution work
#
# Flow (runs as workflow.pac_ptq_review, nightly + event-driven, Khadijah):
#
#   normalized_items / provider_events / agent_reports
#           │
#           ▼
#   pending_action_candidates  ←── idempotency_key dedupe
#     status: pending → scoring → incubating → converting → converted
#                                           ↘ disqualified / purged
#           │
#           ▼
#   qualification_checks  ←── one row per score pass
#     recommendation → decided_outcome (HITL can override)
#           │
#           ▼
#   pac_events  ←── append-only lifecycle log
#           │
#           ▼ (on "convert")
#   workflow_runs → agent_tasks → artifacts → Client Universe
#
# ---------------------------------------------------------------------------


class PendingActionCandidate(Base):
    """Possible work buffered before PTQ decides if it becomes committed work.

    source_type identifies the originating record kind:
      "normalized_item" | "provider_event" | "agent_report" | "manual"
    source_id is the UUID of that record (polymorphic — no FK enforced).

    idempotency_key prevents duplicate PACs for the same underlying signal.
    Format: "{source_type}:{source_id}" or a provider-native key when the
    signal arrives before normalization.

    status vocabulary:
      pending → scoring → incubating → converting → converted
                                    ↘ disqualified | purged

    incubate_until: when set, the PTQ cron skips this PAC until the datetime
    passes, then re-scores it. Supports "check back in 3 days" incubation.

    resolved_workflow_run_id: set when outcome is "convert"; links the PAC
    to the workflow run that executed the promoted work.
    """

    __tablename__ = "pending_action_candidates"
    __table_args__ = (
        UniqueConstraint(
            "client_id", "idempotency_key", name="uq_pac_client_idempotency"
        ),
        Index("ix_pac_client_status", "client_id", "status"),
        Index("ix_pac_client_originator", "client_id", "originator_agent"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    originator_agent: Mapped[str] = mapped_column(String(64), nullable=False)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    score_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    resolution_outcome: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    resolved_workflow_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    incubate_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )


class QualificationCheck(Base):
    """One PTQ scoring pass against a PendingActionCandidate.

    check_type vocabulary:
      "initial"            — first score after PAC creation
      "rescore"            — periodic re-evaluation of an incubating PAC
      "promotion_tripwire" — triggered when a scoring vector crosses a threshold
      "expiry_review"      — end-of-incubation review before purge decision

    score_snapshot captures scoring vectors at the time of this check:
      { time_urgency, relationship_gravity, milestone_alignment,
        repeated_touches, risk, explicit_language, source_reliability }

    recommendation is the system's proposed outcome. decided_outcome is what
    actually happened — they differ when a human overrides the recommendation.
    decided_by is null for system-decided outcomes.
    """

    __tablename__ = "qualification_checks"
    __table_args__ = (
        Index("ix_qual_checks_pac", "pac_id"),
        Index("ix_qual_checks_client_ts", "client_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    pac_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pending_action_candidates.id", ondelete="CASCADE"),
        nullable=False,
    )
    check_type: Mapped[str] = mapped_column(String(64), nullable=False)
    score_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    recommendation: Mapped[str] = mapped_column(String(32), nullable=False)
    rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_outcome: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    decided_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PacEvent(Base):
    """Append-only lifecycle log for a PendingActionCandidate.

    event_type vocabulary:
      created | scored | incubated | rescored | tripwire_fired |
      promoted | converted | redirected | disqualified | purged | hitl_override

    detail carries context relevant to the event: score delta, override reason,
    target workflow_run_id on convert, redirect target on redirect, etc.
    Never update — always append.
    """

    __tablename__ = "pac_events"
    __table_args__ = (
        Index("ix_pac_events_pac_ts", "pac_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    pac_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pending_action_candidates.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    detail: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
