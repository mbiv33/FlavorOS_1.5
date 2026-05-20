"""Add unique constraint on provider_connections (client_id, provider, client_context_id)."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, Sequence[str], None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_provconn_client_provider_context_account",
        "provider_connections",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_provconn_client_provider_client_context",
        "provider_connections",
        ["client_id", "provider", "client_context_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_provconn_client_provider_client_context",
        "provider_connections",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_provconn_client_provider_context_account",
        "provider_connections",
        ["client_id", "provider", "context_account_id"],
    )
