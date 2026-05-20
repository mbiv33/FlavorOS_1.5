"""Add client_contexts table and client_context_id FK on provider_connections."""

from __future__ import annotations

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: Union[str, Sequence[str], None] = "20260520_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create client_contexts table
    op.create_table(
        "client_contexts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("client_id", "type", "name", name="uq_client_context_type_name"),
    )
    op.create_index("ix_client_contexts_client_id", "client_contexts", ["client_id"])

    # 2. Add client_context_id to provider_connections (nullable UUID FK)
    op.add_column(
        "provider_connections",
        sa.Column("client_context_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_provider_connections_client_context_id",
        "provider_connections",
        "client_contexts",
        ["client_context_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_provider_connections_client_context_id",
        "provider_connections",
        ["client_context_id"],
    )

    # 3. Backfill demo tenant — create "Bivines Group" business context and
    #    assign all existing provider_connections for that tenant to it.
    bind = op.get_bind()
    try:
        result = bind.execute(
            sa.text(
                "SELECT t.id FROM tenants t "
                "JOIN users u ON u.tenant_id = t.id "
                "WHERE u.email IN ('client@demo.local', 'marcus@bivinesgroup.com') "
                "LIMIT 1"
            )
        )
        row = result.fetchone()
        if row:
            tenant_id = row[0]
            ctx_id = str(uuid.uuid4())
            bind.execute(
                sa.text(
                    "INSERT INTO client_contexts (id, client_id, type, name) "
                    "VALUES (:id, :client_id, 'business', 'Bivines Group')"
                ),
                {"id": ctx_id, "client_id": str(tenant_id)},
            )
            bind.execute(
                sa.text(
                    "UPDATE provider_connections "
                    "SET client_context_id = :ctx_id "
                    "WHERE client_id = :tenant_id"
                ),
                {"ctx_id": ctx_id, "tenant_id": str(tenant_id)},
            )
    except Exception as e:
        print(f"[migration 0006] backfill skipped: {e}")


def downgrade() -> None:
    op.drop_index("ix_provider_connections_client_context_id", table_name="provider_connections")
    op.drop_constraint(
        "fk_provider_connections_client_context_id",
        "provider_connections",
        type_="foreignkey",
    )
    op.drop_column("provider_connections", "client_context_id")
    op.drop_index("ix_client_contexts_client_id", table_name="client_contexts")
    op.drop_table("client_contexts")
