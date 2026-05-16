#!/usr/bin/env python3
"""Supersede an active SIGMA with a newer version.

Sets the old SIGMA's status: superseded and superseded_by: <new sigma_id>.
The new SIGMA is not modified — promote it separately if needed.

Usage:
  scripts/sigma/sigma_supersede.py <old> <new>

  <old> and <new> can each be a sigma_id (e.g. SIGMA-20260507-...) or a path.

Exit codes:
  0  superseded successfully
  1  validation/state error (already superseded, type mismatch, etc.)
  2  usage / IO error
"""

from __future__ import annotations

import argparse
import sys

from _lib import (
    SIGMA_ID_RE,
    find_sigma,
    read_sigma,
    write_sigma,
)


def main() -> int:
    p = argparse.ArgumentParser(description="Supersede a SIGMA with a newer version.")
    p.add_argument("old", help="old sigma_id or path (becomes status: superseded)")
    p.add_argument("new", help="new sigma_id or path (the replacement)")
    args = p.parse_args()

    try:
        old_path = find_sigma(args.old)
        new_path = find_sigma(args.new)
    except FileNotFoundError as e:
        sys.stderr.write(f"error: {e}\n")
        return 2

    if old_path == new_path:
        sys.stderr.write("error: old and new resolve to the same SIGMA\n")
        return 2

    old_fm, old_body = read_sigma(old_path)
    new_fm, _new_body = read_sigma(new_path)

    old_id = old_fm.get("sigma_id")
    new_id = new_fm.get("sigma_id")

    if not isinstance(old_id, str) or not isinstance(new_id, str):
        sys.stderr.write("error: missing sigma_id on one of the SIGMAs\n")
        return 1
    if not SIGMA_ID_RE.match(new_id):
        sys.stderr.write(f"error: new sigma_id is malformed: {new_id}\n")
        return 1

    old_status = old_fm.get("status")
    if old_status == "superseded":
        sys.stderr.write(
            f"error: {old_id} is already superseded by {old_fm.get('superseded_by')}\n"
        )
        return 1
    if old_status == "archived":
        sys.stderr.write(f"error: {old_id} is archived; cannot supersede\n")
        return 1

    if old_fm.get("type") != new_fm.get("type"):
        sys.stderr.write(
            f"error: type mismatch — old is '{old_fm.get('type')}', new is '{new_fm.get('type')}'\n"
        )
        return 1

    old_fm["status"] = "superseded"
    old_fm["superseded_by"] = new_id

    write_sigma(old_path, old_fm, old_body)
    print(f"superseded {old_id} -> {new_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
