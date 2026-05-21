"""PAC/PTQ tables: pending_action_candidates, qualification_checks, pac_events."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260521_0007"
down_revision: Union[str, Sequence[str], None] = "20260521_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pending_action_candidates — possible work buffered before PTQ scoring
    op.create_table(
        "pending_action_candidates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("originator_agent", sa.String(64), nullable=False),
        sa.Column("source_type", sa.String(64), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("idempotency_key", sa.String(255), nullable=False),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("score_data", sa.JSON(), nullable=True),
        sa.Column("resolution_outcome", sa.String(32), nullable=True),
        sa.Column("resolved_workflow_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("incubate_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
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
            ["resolved_workflow_run_id"], ["workflow_runs.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "client_id", "idempotency_key", name="uq_pac_client_idempotency"
        ),
    )
    op.create_index(
        "ix_pac_client_status", "pending_action_candidates", ["client_id", "status"]
    )
    op.create_index(
        "ix_pac_client_originator",
        "pending_action_candidates",
        ["client_id", "originator_agent"],
    )

    # qualification_checks — one PTQ scoring pass per PAC
    op.create_table(
        "qualification_checks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pac_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("check_type", sa.String(64), nullable=False),
        sa.Column("score_snapshot", sa.JSON(), nullable=True),
        sa.Column("recommendation", sa.String(32), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("decided_outcome", sa.String(32), nullable=True),
        sa.Column("decided_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["pac_id"], ["pending_action_candidates.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["decided_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_qual_checks_pac", "qualification_checks", ["pac_id"])
    op.create_index(
        "ix_qual_checks_client_ts", "qualification_checks", ["client_id", "created_at"]
    )

    # pac_events — append-only lifecycle log per PAC
    op.create_table(
        "pac_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pac_id", postgresql.UUID(as_uuid=True), nullable=False),
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
            ["pac_id"], ["pending_action_candidates.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pac_events_pac_ts", "pac_events", ["pac_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_pac_events_pac_ts", table_name="pac_events")
    op.drop_table("pac_events")

    op.drop_index("ix_qual_checks_client_ts", table_name="qualification_checks")
    op.drop_index("ix_qual_checks_pac", table_name="qualification_checks")
    op.drop_table("qualification_checks")

    op.drop_index("ix_pac_client_originator", table_name="pending_action_candidates")
    op.drop_index("ix_pac_client_status", table_name="pending_action_candidates")
    op.drop_table("pending_action_candidates")
