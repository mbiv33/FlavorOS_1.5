#!/usr/bin/env python3
"""Scaffold a new SIGMA file from its type template.

Usage:
  scripts/sigma/sigma_init.py <type> --slug <short-slug> [--by <agent>] [--dry-run]

Examples:
  scripts/sigma/sigma_init.py trip-instance --slug london-q2
  scripts/sigma/sigma_init.py ripple --slug board-shift --by khadijah

Writes to:
  vault/05-SIGMA/<type>/<sigma_id>.md
"""

from __future__ import annotations

import argparse
import sys

from _lib import (
    KNOWN_AGENTS,
    KNOWN_TYPES,
    SIGMA_ROOT,
    SLUG_RE,
    iso,
    normalize_slug,
    sigma_id,
    template_path_for,
    utc_now,
)


def main() -> int:
    p = argparse.ArgumentParser(description="Scaffold a new SIGMA file.")
    p.add_argument("type", help=f"SIGMA type. One of: {', '.join(sorted(KNOWN_TYPES))}")
    p.add_argument("--slug", required=True, help="short-slug (lowercase, hyphenated, ≤24 chars)")
    p.add_argument("--by", default="scooter", help="creating agent (default: scooter)")
    p.add_argument("--dry-run", action="store_true", help="print the path that would be written")
    args = p.parse_args()

    if args.type not in KNOWN_TYPES:
        sys.stderr.write(
            f"error: unknown SIGMA type '{args.type}'. "
            f"Add it to SIGMA_SPEC.md §5 first.\n"
        )
        return 2

    if args.by not in KNOWN_AGENTS:
        sys.stderr.write(f"error: unknown agent '{args.by}'.\n")
        return 2

    slug = normalize_slug(args.slug)
    if not SLUG_RE.match(slug):
        sys.stderr.write(f"error: invalid slug '{args.slug}' (after normalization: '{slug}').\n")
        return 2

    template = template_path_for(args.type)
    if not template.exists():
        sys.stderr.write(
            f"error: no template at {template.relative_to(SIGMA_ROOT.parent.parent)}.\n"
            f"       create it before initializing this type.\n"
        )
        return 2

    now = utc_now()
    sid = sigma_id(now, slug)
    out_dir = SIGMA_ROOT / args.type
    out_path = out_dir / f"{sid}.md"

    if out_path.exists():
        sys.stderr.write(f"error: {out_path} already exists.\n")
        return 1

    text = template.read_text(encoding="utf-8")
    text = text.replace("SIGMA-YYYYMMDD-HHMMSS-shortslug", sid)
    text = text.replace("YYYY-MM-DDTHH:MM:SSZ", iso(now))
    text = text.replace("created_by:      scooter", f"created_by:      {args.by}")

    if args.dry_run:
        print(out_path)
        return 0

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text, encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
