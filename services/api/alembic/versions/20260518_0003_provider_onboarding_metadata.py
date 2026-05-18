"""Add provider onboarding metadata for Composio workflow."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260518_0003"
down_revision: Union[str, Sequence[str], None] = "20260518_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("uq_provconn_client_provider", "provider_connections", type_="unique")
    op.add_column("provider_connections", sa.Column("context_id", sa.String(128), nullable=True))
    op.add_column(
        "provider_connections", sa.Column("context_account_id", sa.String(128), nullable=True)
    )
    op.add_column(
        "provider_connections", sa.Column("account_alias", sa.String(128), nullable=True)
    )
    op.add_column("provider_connections", sa.Column("purpose", sa.String(64), nullable=True))
    op.add_column("provider_connections", sa.Column("toolkit", sa.String(64), nullable=True))
    op.add_column(
        "provider_connections", sa.Column("auth_config_id", sa.String(255), nullable=True)
    )
    op.add_column(
        "provider_connections", sa.Column("connected_account_id", sa.String(255), nullable=True)
    )
    op.add_column(
        "provider_connections", sa.Column("composio_user_id", sa.String(255), nullable=True)
    )
    op.add_column("provider_connections", sa.Column("status_reason", sa.Text(), nullable=True))
    op.add_column("provider_connections", sa.Column("scopes", sa.JSON(), nullable=True))
    op.add_column(
        "provider_connections", sa.Column("last_checked_at", sa.DateTime(timezone=True))
    )
    op.alter_column(
        "provider_connections",
        "status",
        type_=sa.String(32),
        existing_type=sa.String(16),
        server_default="not_started",
    )
    op.create_unique_constraint(
        "uq_provconn_client_provider_context_account",
        "provider_connections",
        ["client_id", "provider", "context_account_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_provconn_client_provider_context_account",
        "provider_connections",
        type_="unique",
    )
    op.alter_column(
        "provider_connections",
        "status",
        type_=sa.String(16),
        existing_type=sa.String(32),
        server_default="disconnected",
    )
    for column in (
        "last_checked_at",
        "scopes",
        "status_reason",
        "composio_user_id",
        "connected_account_id",
        "auth_config_id",
        "toolkit",
        "purpose",
        "account_alias",
        "context_account_id",
        "context_id",
    ):
        op.drop_column("provider_connections", column)
    op.create_unique_constraint(
        "uq_provconn_client_provider",
        "provider_connections",
        ["client_id", "provider"],
    )
