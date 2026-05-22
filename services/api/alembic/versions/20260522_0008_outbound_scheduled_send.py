"""Add scheduled_send_at to outbound_actions for batch send windows."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260522_0008"
down_revision: Union[str, Sequence[str], None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "outbound_actions",
        sa.Column("scheduled_send_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_outbound_actions_scheduled_due",
        "outbound_actions",
        ["status", "scheduled_send_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_outbound_actions_scheduled_due", table_name="outbound_actions")
    op.drop_column("outbound_actions", "scheduled_send_at")
