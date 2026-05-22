"""Scheduled outbound send windows (10:00 / 13:00 / 16:00 local)."""

from __future__ import annotations

import os
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Profile

# Local send windows: 10am, 1pm, 4pm
DEFAULT_BATCH_HOURS = (10, 13, 16)
DEFAULT_TIMEZONE = "America/New_York"


def batch_hours() -> tuple[int, ...]:
    raw = os.environ.get("OUTBOUND_BATCH_HOURS", "")
    if not raw.strip():
        return DEFAULT_BATCH_HOURS
    parts: list[int] = []
    for piece in raw.split(","):
        piece = piece.strip()
        if not piece:
            continue
        hour = int(piece.split(":")[0])
        if 0 <= hour <= 23:
            parts.append(hour)
    return tuple(parts) if parts else DEFAULT_BATCH_HOURS


def resolve_client_timezone(db: Session, client_id, user_id=None) -> ZoneInfo:
    if user_id is not None:
        tz_name = db.execute(
            select(Profile.timezone).where(
                Profile.client_id == client_id,
                Profile.user_id == user_id,
            )
        ).scalar_one_or_none()
        if tz_name:
            try:
                return ZoneInfo(tz_name)
            except Exception:
                pass
    fallback = os.environ.get("OUTBOUND_DEFAULT_TIMEZONE", DEFAULT_TIMEZONE)
    try:
        return ZoneInfo(fallback)
    except Exception:
        return ZoneInfo(DEFAULT_TIMEZONE)


def next_send_window(
    after: datetime,
    tz: ZoneInfo,
    *,
    hours: tuple[int, ...] | None = None,
) -> datetime:
    """Next batch window strictly after `after` (UTC-aware)."""
    if after.tzinfo is None:
        after = after.replace(tzinfo=timezone.utc)
    window_hours = hours or batch_hours()
    local = after.astimezone(tz)
    candidates: list[datetime] = []
    for hour in window_hours:
        local_dt = datetime.combine(local.date(), time(hour, 0, 0), tzinfo=tz)
        candidates.append(local_dt.astimezone(timezone.utc))
    for day_offset in (0, 1):
        d = local.date() + timedelta(days=day_offset)
        for hour in window_hours:
            local_dt = datetime.combine(d, time(hour, 0, 0), tzinfo=tz)
            candidates.append(local_dt.astimezone(timezone.utc))
    for candidate in sorted(candidates):
        if candidate > after:
            return candidate
    # Fallback: next day first window
    d = local.date() + timedelta(days=1)
    hour = window_hours[0]
    return datetime.combine(d, time(hour, 0, 0), tzinfo=tz).astimezone(timezone.utc)


def format_scheduled_label(scheduled_utc: datetime, tz: ZoneInfo) -> str:
    if scheduled_utc.tzinfo is None:
        scheduled_utc = scheduled_utc.replace(tzinfo=timezone.utc)
    local = scheduled_utc.astimezone(tz)
    hour = int(local.strftime("%I"))
    minute = local.strftime("%M")
    suffix = local.strftime("%p")
    return f"{hour}:{minute} {suffix}"


def schedule_metadata(
    db: Session,
    *,
    client_id,
    user_id=None,
    approved_at: datetime | None = None,
) -> tuple[datetime, str]:
    tz = resolve_client_timezone(db, client_id, user_id=user_id)
    at = approved_at or datetime.now(timezone.utc)
    scheduled = next_send_window(at, tz)
    label = format_scheduled_label(scheduled, tz)
    return scheduled, label
