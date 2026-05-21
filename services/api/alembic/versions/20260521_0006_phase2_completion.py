"""Phase 2 completion: sync_checkpoints, agent_task_events, agent_reports."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260521_0006"
down_revision: Union[str, Sequence[str], None] = "20260520_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # sync_checkpoints — incremental sync cursor per provider connection
    op.create_table(
        "sync_checkpoints",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider_connection_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("checkpoint_key", sa.String(128), nullable=False),
        sa.Column("checkpoint_value", sa.Text(), nullable=True),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["provider_connection_id"], ["provider_connections.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "client_id",
            "provider_connection_id",
            "checkpoint_key",
            name="uq_sync_checkpoints_conn_key",
        ),
    )
    op.create_index(
        "ix_sync_checkpoints_conn",
        "sync_checkpoints",
        ["client_id", "provider_connection_id"],
    )

    # agent_task_events — immutable step log per agent task
    op.create_table(
        "agent_task_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("detail", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["agent_task_id"], ["agent_tasks.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_agent_task_events_task_ts",
        "agent_task_events",
        ["agent_task_id", "created_at"],
    )

    # agent_reports — formal work product envelope produced by an agent
    op.create_table(
        "agent_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workflow_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("agent_task_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("agent", sa.String(64), nullable=False),
        sa.Column("report_type", sa.String(128), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("data", sa.JSON(), nullable=True),
        sa.Column("artifact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["workflow_run_id"], ["workflow_runs.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["agent_task_id"], ["agent_tasks.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["artifact_id"], ["artifacts.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_agent_reports_client_agent", "agent_reports", ["client_id", "agent"]
    )
    op.create_index(
        "ix_agent_reports_client_type", "agent_reports", ["client_id", "report_type"]
    )
    op.create_index(
        "ix_agent_reports_workflow_run", "agent_reports", ["workflow_run_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_agent_reports_workflow_run", table_name="agent_reports")
    op.drop_index("ix_agent_reports_client_type", table_name="agent_reports")
    op.drop_index("ix_agent_reports_client_agent", table_name="agent_reports")
    op.drop_table("agent_reports")

    op.drop_index("ix_agent_task_events_task_ts", table_name="agent_task_events")
    op.drop_table("agent_task_events")

    op.drop_index("ix_sync_checkpoints_conn", table_name="sync_checkpoints")
    op.drop_table("sync_checkpoints")
