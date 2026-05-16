#!/usr/bin/env python3
"""Scaffold a complete trip footprint.

Creates, atomically:
  vault/05-SIGMA/trip-instance/<sigma_id>.md   — the live trip-instance SIGMA
  vault/50-Travel/<slug>/<slug>.md              — the readiness artifact (trip page)
  vault/50-Travel/<slug>/receipts/.gitkeep     — receipt drop folder

Cross-references are wired both directions:
  - SIGMA.related_readiness_artifacts -> [artifact path]
  - artifact.related_sigmas           -> [sigma_id]

Usage:
  scripts/sigma/trip_init.py <slug> --destination "London, UK" \\
      --depart 2026-06-15 --return 2026-06-20 \\
      [--purpose business|personal|mixed] [--business personal] [--by scooter]
"""

from __future__ import annotations

import argparse
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

import yaml

from _lib import (
    KNOWN_AGENTS,
    REPO_ROOT,
    SIGMA_ROOT,
    SLUG_RE,
    VAULT_ROOT,
    iso,
    normalize_slug,
    read_sigma,
    sigma_id,
    template_path_for,
    utc_now,
)

PURPOSES = {"business", "personal", "mixed"}
TRIP_TEMPLATE = VAULT_ROOT / "50-Travel" / "_templates" / "trip.md"
TRIP_DIR = VAULT_ROOT / "50-Travel"


def parse_iso_date(s: str) -> date:
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError as e:
        raise argparse.ArgumentTypeError(f"invalid date '{s}': use YYYY-MM-DD") from e


def next_trip_number(year: int) -> int:
    """Find the highest TRIP-<year>-NNN already used and return next."""
    instance_dir = SIGMA_ROOT / "trip-instance"
    if not instance_dir.exists():
        return 1
    prefix = f"TRIP-{year}-"
    highest = 0
    for path in instance_dir.glob("*.md"):
        try:
            fm, _ = read_sigma(path)
        except (ValueError, OSError):
            continue
        tid = fm.get("trip_id")
        if isinstance(tid, str) and tid.startswith(prefix):
            try:
                num = int(tid[len(prefix):])
            except ValueError:
                continue
            highest = max(highest, num)
    return highest + 1


def compose(frontmatter: dict[str, Any], body: str) -> str:
    fm_text = yaml.safe_dump(
        frontmatter,
        sort_keys=False,
        default_flow_style=False,
        allow_unicode=True,
    )
    return f"---\n{fm_text}---\n{body}"


def build_sigma(*, sid: str, trip_id: str, slug: str, args, now: datetime, artifact_rel: str) -> str:
    template_text = template_path_for("trip-instance").read_text(encoding="utf-8")
    fm, body = read_sigma(template_path_for("trip-instance"))

    fm["sigma_id"] = sid
    fm["status"] = "draft"
    fm["created_at"] = iso(now)
    fm["created_by"] = args.by
    fm["confidence"] = "medium"
    fm["trip_id"] = trip_id
    fm["destination"] = args.destination
    fm["purpose"] = args.purpose
    fm["business_context"] = args.business
    fm["depart"] = args.depart.isoformat()
    fm["return"] = args.return_date.isoformat()
    fm["phase"] = "planning"
    fm["phase_history"] = [
        {"phase": "planning", "entered_at": iso(now), "by": args.by},
    ]
    fm["related_readiness_artifacts"] = [artifact_rel]

    return compose(fm, body)


def split_body_only(text: str) -> str:
    """Return everything after the closing `---` of the frontmatter block.

    The trip.md template's frontmatter contains Obsidian-Templater placeholders
    that aren't valid YAML, so we don't try to parse it — we replace it wholesale.
    """
    if not text.startswith("---\n"):
        return text
    end = text.find("\n---\n", 4)
    if end == -1:
        return text
    return text[end + 5:]


def build_artifact(*, sid: str, trip_id: str, slug: str, args, now: datetime) -> str:
    body = split_body_only(TRIP_TEMPLATE.read_text(encoding="utf-8"))

    artifact_id = f"READY-{now:%Y%m%d-%H%M%S}-{slug}"
    new_fm: dict[str, Any] = {
        "artifact_id": artifact_id,
        "artifact_type": "trip",
        "client_id": "marcus",
        "created_at": iso(now),
        "created_by": args.by,
        "status": "Planning",
        "requires_approval": True,
        "next_action": "review_planning",
        "related_sigmas": [sid],
        "trip_id": trip_id,
        "destination": args.destination,
        "purpose": args.purpose,
        "business": args.business,
        "depart": args.depart.isoformat(),
        "return": args.return_date.isoformat(),
    }

    body = body.replace("{{destination}}", args.destination)
    body = body.replace("{{depart}}", args.depart.isoformat())
    body = body.replace("{{return}}", args.return_date.isoformat())

    return compose(new_fm, body)


def main() -> int:
    p = argparse.ArgumentParser(description="Scaffold a new trip (SIGMA + readiness + receipts).")
    p.add_argument("slug", help="trip slug (lowercase, hyphenated, ≤24 chars). e.g. london-q2")
    p.add_argument("--destination", required=True, help='destination, e.g. "London, UK"')
    p.add_argument("--depart", required=True, type=parse_iso_date, help="YYYY-MM-DD")
    p.add_argument("--return", required=True, type=parse_iso_date, dest="return_date", help="YYYY-MM-DD")
    p.add_argument("--purpose", choices=sorted(PURPOSES), default="business")
    p.add_argument("--business", default="personal", help="business name or 'personal' (default: personal)")
    p.add_argument("--by", default="scooter", help="creating agent (default: scooter)")
    p.add_argument("--dry-run", action="store_true", help="print paths that would be written")
    args = p.parse_args()

    if args.return_date < args.depart:
        sys.stderr.write("error: --return is before --depart\n")
        return 2
    if args.by not in KNOWN_AGENTS:
        sys.stderr.write(f"error: unknown agent '{args.by}'\n")
        return 2

    slug = normalize_slug(args.slug)
    if not SLUG_RE.match(slug):
        sys.stderr.write(f"error: invalid slug '{args.slug}' (after normalization: '{slug}')\n")
        return 2

    if not TRIP_TEMPLATE.exists():
        sys.stderr.write(f"error: trip template missing at {TRIP_TEMPLATE}\n")
        return 2
    if not template_path_for("trip-instance").exists():
        sys.stderr.write("error: trip-instance SIGMA template missing\n")
        return 2

    now = utc_now()
    year = args.depart.year
    trip_num = next_trip_number(year)
    trip_id = f"TRIP-{year}-{trip_num:03d}"
    sid = sigma_id(now, slug)

    trip_dir = TRIP_DIR / slug
    artifact_path = trip_dir / f"{slug}.md"
    receipts_dir = trip_dir / "receipts"
    sigma_path = SIGMA_ROOT / "trip-instance" / f"{sid}.md"

    if trip_dir.exists():
        sys.stderr.write(f"error: trip folder already exists: {trip_dir}\n")
        return 1
    if sigma_path.exists():
        sys.stderr.write(f"error: SIGMA already exists: {sigma_path}\n")
        return 1

    artifact_rel = str(artifact_path.relative_to(REPO_ROOT))
    sigma_text = build_sigma(sid=sid, trip_id=trip_id, slug=slug, args=args, now=now, artifact_rel=artifact_rel)
    artifact_text = build_artifact(sid=sid, trip_id=trip_id, slug=slug, args=args, now=now)

    if args.dry_run:
        print(f"trip_id:  {trip_id}")
        print(f"sigma:    {sigma_path}")
        print(f"artifact: {artifact_path}")
        print(f"receipts: {receipts_dir}/")
        return 0

    sigma_path.parent.mkdir(parents=True, exist_ok=True)
    sigma_path.write_text(sigma_text, encoding="utf-8")
    trip_dir.mkdir(parents=True)
    artifact_path.write_text(artifact_text, encoding="utf-8")
    receipts_dir.mkdir()
    (receipts_dir / ".gitkeep").write_text("", encoding="utf-8")

    print(f"created {trip_id}")
    print(f"  SIGMA:    {sigma_path.relative_to(REPO_ROOT)}")
    print(f"  artifact: {artifact_path.relative_to(REPO_ROOT)}")
    print(f"  receipts: {receipts_dir.relative_to(REPO_ROOT)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
