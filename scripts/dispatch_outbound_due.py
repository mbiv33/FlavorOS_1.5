#!/usr/bin/env python3
"""Dispatch queued outbound actions whose scheduled_send_at is due.

Run from cron every minute (or via systemd timer). Idempotent — rows already
executed or not yet due are skipped.

Usage (from repo root or VPS):
    python scripts/dispatch_outbound_due.py
    DATABASE_URL=postgresql+psycopg://... python scripts/dispatch_outbound_due.py
    python scripts/dispatch_outbound_due.py --dry-run
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "api"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("dispatch_outbound_due")


def main() -> None:
    parser = argparse.ArgumentParser(description="Dispatch due scheduled outbound actions")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Query and log due rows without executing sends",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Max rows to process per run (default 100)",
    )
    args = parser.parse_args()

    from sqlalchemy import select

    from app.database import SessionLocal
    from app.models import OutboundAction
    from app.workflows.communications_outbound import dispatch_due_outbound_actions

    now = datetime.now(timezone.utc)

    with SessionLocal() as db:
        if args.dry_run:
            rows = db.execute(
                select(OutboundAction)
                .where(
                    OutboundAction.status == "queued",
                    OutboundAction.scheduled_send_at.isnot(None),
                    OutboundAction.scheduled_send_at <= now,
                )
                .limit(args.limit)
            ).scalars().all()
            logger.info("DRY RUN — %d due outbound action(s) found (not sent)", len(rows))
            for row in rows:
                logger.info(
                    "  id=%s provider=%s scheduled_send_at=%s",
                    row.id,
                    row.provider,
                    row.scheduled_send_at,
                )
            return

        dispatched = dispatch_due_outbound_actions(db, as_of=now, limit=args.limit)
        db.commit()

    executed = [o for o in dispatched if o.status == "executed"]
    failed = [o for o in dispatched if o.status == "failed"]
    logger.info(
        "Dispatched %d action(s): %d executed, %d failed",
        len(dispatched),
        len(executed),
        len(failed),
    )
    for o in failed:
        logger.error("  FAILED id=%s error=%s", o.id, o.last_error_summary)

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
