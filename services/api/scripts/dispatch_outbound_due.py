#!/usr/bin/env python3
"""Dispatch due queued communications outbounds (10/13/16 batch windows).

Run from repo root or services/api with PYTHONPATH set:

  cd services/api && PYTHONPATH=. python scripts/dispatch_outbound_due.py

Cron example (every 5 minutes):

  */5 * * * * cd /path/to/FlavorOS_1.5/services/api && PYTHONPATH=. python scripts/dispatch_outbound_due.py
"""

from __future__ import annotations

import sys

from app.database import SessionLocal
from app.workflows.communications_outbound import dispatch_due_outbound_actions


def main() -> int:
    db = SessionLocal()
    try:
        dispatched = dispatch_due_outbound_actions(db, limit=200)
        db.commit()
        print(f"dispatched={len(dispatched)}")
        for row in dispatched:
            print(f"  {row.id} status={row.status}")
        return 0
    except Exception as exc:
        db.rollback()
        print(f"error: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
