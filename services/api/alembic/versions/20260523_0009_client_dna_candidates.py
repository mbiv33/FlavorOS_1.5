"""Add client_dna_candidates table (Lane Y — pre-HITL DNA candidate store)."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260523_0009"
down_revision: Union[str, Sequence[str], None] = "20260522_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "client_dna_candidates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "client_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "workflow_run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workflow_runs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "source_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("normalized_items.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("domain", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("verification_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("sweep_window", sa.String(32), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("raw_data", sa.JSON(), nullable=True),
        sa.Column("gbrain_record_id", sa.String(255), nullable=True),
        sa.Column("sigma_id", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_client_dna_candidates_client_domain",
        "client_dna_candidates",
        ["client_id", "domain"],
    )
    op.create_index(
        "ix_client_dna_candidates_client_status",
        "client_dna_candidates",
        ["client_id", "status"],
    )


def downgrade() -> None:
    op.drop_index("ix_client_dna_candidates_client_status", table_name="client_dna_candidates")
    op.drop_index("ix_client_dna_candidates_client_domain", table_name="client_dna_candidates")
    op.drop_table("client_dna_candidates")
