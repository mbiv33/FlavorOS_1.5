#!/usr/bin/env python3
"""Validate SIGMA files against SIGMA_SPEC.md §7.

Usage:
  scripts/sigma/sigma_validate.py [path]

  - no path:       walks vault/05-SIGMA/ recursively
  - file path:     validates that single SIGMA
  - dir path:      walks that directory recursively

Exit codes:
  0  all valid
  1  one or more validation failures
  2  usage / IO error
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from _lib import (
    KNOWN_AGENTS,
    KNOWN_CONFIDENCE,
    KNOWN_STATUSES,
    KNOWN_TYPES,
    REPO_ROOT,
    REQUIRED_FIELDS,
    SIGMA_ID_RE,
    SIGMA_ROOT,
    read_sigma,
)


def validate_links(fm: dict, sigma_id_index: set[str]) -> list[str]:
    """Resolve cross-references — every entry in related_sigmas / related_readiness_artifacts /
    superseded_by / source_items must point to something that exists.

    sigma_id_index is the set of all known sigma_ids (precomputed for speed).
    """
    errors: list[str] = []

    def check_sigma_ref(field: str, value):
        if not isinstance(value, str) or not value:
            return
        if SIGMA_ID_RE.match(value):
            if value not in sigma_id_index:
                errors.append(f"{field}: sigma_id '{value}' not found in vault/05-SIGMA/")
        elif "/" in value or value.endswith(".md"):
            p = (REPO_ROOT / value).resolve() if not value.startswith("/") else Path(value)
            if not p.exists():
                errors.append(f"{field}: path '{value}' does not exist")
        else:
            errors.append(f"{field}: value '{value}' is neither a sigma_id nor a vault path")

    sb = fm.get("superseded_by")
    if sb:
        check_sigma_ref("superseded_by", sb)

    for field in ("related_sigmas", "related_readiness_artifacts", "source_items", "contributing_observations"):
        v = fm.get(field)
        if isinstance(v, list):
            for entry in v:
                check_sigma_ref(field, entry)

    return errors


def validate_one(path: Path, *, sigma_id_index: set[str] | None = None) -> list[str]:
    """Return a list of error strings. Empty list = valid."""
    errors: list[str] = []
    try:
        fm, _body = read_sigma(path)
    except (ValueError, OSError) as e:
        return [f"unreadable: {e}"]

    # Required fields present and non-empty (usable_by may be a list, treat empty list as missing).
    for field in REQUIRED_FIELDS:
        if field not in fm:
            errors.append(f"missing required field: {field}")
        elif fm[field] in ("", None):
            errors.append(f"empty required field: {field}")

    sid = fm.get("sigma_id")
    if sid and not isinstance(sid, str):
        errors.append(f"sigma_id must be a string, got {type(sid).__name__}")
    elif sid and not SIGMA_ID_RE.match(sid):
        errors.append(f"sigma_id does not match SIGMA-YYYYMMDD-HHMMSS-slug pattern: {sid}")

    # Filename matches sigma_id.
    if isinstance(sid, str) and path.stem != sid:
        errors.append(f"filename '{path.stem}' does not match sigma_id '{sid}'")

    # Type known.
    stype = fm.get("type")
    if stype and stype not in KNOWN_TYPES:
        errors.append(f"unknown type: {stype} (add to SIGMA_SPEC.md §5)")

    # Type matches parent folder under 05-SIGMA/.
    try:
        rel = path.relative_to(SIGMA_ROOT)
        parent = rel.parts[0] if len(rel.parts) > 1 else None
    except ValueError:
        parent = None
    if stype and parent and parent != "_templates" and parent != stype:
        errors.append(f"type '{stype}' does not match parent folder '{parent}'")

    # Status enum.
    status = fm.get("status")
    if status and status not in KNOWN_STATUSES:
        errors.append(f"invalid status: {status}")

    # Confidence enum.
    conf = fm.get("confidence")
    if conf and conf not in KNOWN_CONFIDENCE:
        errors.append(f"invalid confidence: {conf}")

    # usable_by ⊆ KNOWN_AGENTS.
    usable_by = fm.get("usable_by")
    if isinstance(usable_by, list):
        unknown = [a for a in usable_by if a not in KNOWN_AGENTS]
        if unknown:
            errors.append(f"usable_by contains unknown agents: {unknown}")
    elif usable_by is not None:
        errors.append(f"usable_by must be a list, got {type(usable_by).__name__}")

    # created_by must be known.
    created_by = fm.get("created_by")
    if created_by and created_by not in KNOWN_AGENTS:
        errors.append(f"created_by is not a known agent: {created_by}")

    # Superseded must point somewhere.
    if status == "superseded":
        sb = fm.get("superseded_by")
        if not sb:
            errors.append("status is 'superseded' but superseded_by is empty")
        elif isinstance(sb, str) and not SIGMA_ID_RE.match(sb):
            errors.append(f"superseded_by is not a valid sigma_id: {sb}")

    # Optional: bidirectional reachability of cross-references.
    if sigma_id_index is not None:
        errors.extend(validate_links(fm, sigma_id_index))

    return errors


def is_template(path: Path) -> bool:
    return "_templates" in path.parts


def collect_targets(arg: str | None) -> list[Path]:
    if arg is None:
        root = SIGMA_ROOT
    else:
        root = Path(arg).resolve()
    if root.is_file():
        return [root]
    if not root.is_dir():
        sys.stderr.write(f"error: not a file or directory: {root}\n")
        sys.exit(2)
    return sorted(p for p in root.rglob("*.md") if not is_template(p))


def build_sigma_id_index() -> set[str]:
    """Walk vault/05-SIGMA/ and return every sigma_id referenced by filename."""
    idx: set[str] = set()
    if not SIGMA_ROOT.exists():
        return idx
    for path in SIGMA_ROOT.rglob("*.md"):
        if "_templates" in path.parts:
            continue
        # Trust the filename (cheaper than parsing every file).
        if SIGMA_ID_RE.match(path.stem):
            idx.add(path.stem)
    return idx


def main() -> int:
    p = argparse.ArgumentParser(description="Validate SIGMA files.")
    p.add_argument("path", nargs="?", help="file or directory (default: vault/05-SIGMA/)")
    p.add_argument("--quiet", action="store_true", help="only print failures")
    p.add_argument("--check-links", action="store_true",
                   help="also verify related_sigmas / related_readiness_artifacts / superseded_by / source_items resolve")
    args = p.parse_args()

    targets = collect_targets(args.path)
    if not targets:
        if not args.quiet:
            print("no SIGMAs to validate.")
        return 0

    sigma_id_index = build_sigma_id_index() if args.check_links else None

    failed = 0
    for path in targets:
        errors = validate_one(path, sigma_id_index=sigma_id_index)
        if errors:
            failed += 1
            print(f"FAIL {path}")
            for e in errors:
                print(f"  - {e}")
        elif not args.quiet:
            print(f"ok   {path}")

    if failed:
        print(f"\n{failed} of {len(targets)} SIGMAs failed validation.", file=sys.stderr)
        return 1
    if not args.quiet:
        print(f"\n{len(targets)} SIGMAs valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
