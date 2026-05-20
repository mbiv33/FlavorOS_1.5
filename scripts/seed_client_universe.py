#!/usr/bin/env python3
"""Seed dev Client Universe KV rows for a tenant (authority, onboarding, preferences).

Contexts are not seeded here — use onboarding save or POST /contexts.
Requires DATABASE_URL and an existing client (tenant) id.
"""

from __future__ import annotations

import argparse
import os
import sys
import uuid

# Allow importing app from services/api
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "api"))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models import Base, ClientUniverseEntry
from app.services.client_universe import materialize_onboarding_kv, upsert_entry


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed client_universe KV for a client")
    parser.add_argument("client_id", type=uuid.UUID, help="Tenant/client UUID")
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL"),
        help="SQLAlchemy database URL",
    )
    args = parser.parse_args()
    if not args.database_url:
        parser.error("Set DATABASE_URL or pass --database-url")

    engine = create_engine(args.database_url)
    Base.metadata.create_all(engine)

    authority = {
        "outbound_comms": "draft_only",
        "calendar_commits": "approval_required",
    }
    onboarding_status = {"status": "ready_for_auth", "client_context_ids": []}
    preferences = {"locale": "en-US"}

    with Session(engine) as db:
        for category, key, value in materialize_onboarding_kv(
            authority_defaults=authority,
            onboarding_status=onboarding_status,
            preferences=preferences,
        ):
            upsert_entry(db, client_id=args.client_id, category=category, key=key, value=value)
        db.commit()

    print(f"Seeded KV universe rows for client {args.client_id}")


if __name__ == "__main__":
    main()
