#!/usr/bin/env python3
"""Fold data from one SIGMA into another. Used by universe-update protocols.

Subcommands:
  append-observations  Take a list at <source-key> in the source SIGMA's
                       frontmatter and append each entry as a timestamped
                       observation to the target's `observations` block.
                       Also adds the source sigma_id to target.related_sigmas
                       and (if applicable) source.trip_id to target.trips_observed.

Usage:
  sigma_merge.py append-observations \\
      --from <source>  --to <target> \\
      --source-key learnings.destination_intel \\
      --by scooter

  <source> and <target> are sigma_ids or paths.

Exit codes:
  0  merged
  1  nothing to merge / validation error
  2  usage / IO error
"""

from __future__ import annotations

import argparse
import sys
from typing import Any

import yaml

from _lib import (
    KNOWN_AGENTS,
    KNOWN_CONFIDENCE,
    find_sigma,
    iso,
    read_sigma,
    utc_now,
    write_sigma,
)


def walk_dotted(d: dict[str, Any], dotted: str) -> Any:
    cur: Any = d
    for part in dotted.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def cmd_append_observations(args: argparse.Namespace) -> int:
    if args.by not in KNOWN_AGENTS:
        sys.stderr.write(f"error: unknown agent '{args.by}'\n")
        return 2
    if args.confidence not in KNOWN_CONFIDENCE:
        sys.stderr.write(f"error: invalid confidence '{args.confidence}'\n")
        return 2

    try:
        src_path = find_sigma(args.source)
        tgt_path = find_sigma(args.target)
    except FileNotFoundError as e:
        sys.stderr.write(f"error: {e}\n")
        return 2

    if src_path == tgt_path:
        sys.stderr.write("error: --from and --to resolve to the same SIGMA\n")
        return 2

    src_fm, _ = read_sigma(src_path)
    tgt_fm, tgt_body = read_sigma(tgt_path)

    src_id = src_fm.get("sigma_id")
    if not isinstance(src_id, str):
        sys.stderr.write("error: source has no sigma_id\n")
        return 1

    src_value = walk_dotted(src_fm, args.source_key)
    if src_value is None:
        sys.stderr.write(f"error: source key '{args.source_key}' not found in source frontmatter\n")
        return 1
    if not isinstance(src_value, list):
        sys.stderr.write(
            f"error: source key '{args.source_key}' resolves to {type(src_value).__name__}, expected list\n"
        )
        return 1
    if not src_value:
        print("nothing to merge (source list is empty)")
        return 0

    now = utc_now()
    trip_id = src_fm.get("trip_id")  # may be None for non-trip sources

    obs_list = tgt_fm.get("observations") or []
    if not isinstance(obs_list, list):
        sys.stderr.write("error: target.observations is not a list\n")
        return 1

    appended = 0
    for entry in src_value:
        if isinstance(entry, str):
            note = entry
        elif isinstance(entry, dict):
            note = entry.get("note") or yaml.safe_dump(entry, default_flow_style=True).strip()
        else:
            note = str(entry)
        record: dict[str, Any] = {
            "at": iso(now),
            "by": args.by,
            "note": note,
            "source_sigma": src_id,
            "confidence": args.confidence,
        }
        if trip_id:
            record["trip_id"] = trip_id
        obs_list.append(record)
        appended += 1
    tgt_fm["observations"] = obs_list

    # trips_observed (long-term SIGMAs that track contributing trips)
    if trip_id and "trips_observed" in tgt_fm:
        existing = tgt_fm.get("trips_observed") or []
        if isinstance(existing, list) and trip_id not in existing:
            existing.append(trip_id)
            tgt_fm["trips_observed"] = existing

    # Cross-reference back
    related = tgt_fm.get("related_sigmas") or []
    if isinstance(related, list) and src_id not in related:
        related.append(src_id)
        tgt_fm["related_sigmas"] = related

    write_sigma(tgt_path, tgt_fm, tgt_body)
    print(f"merged {appended} entries from {args.source_key} into {tgt_path}")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Merge SIGMA data — used by universe-update protocols.")
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("append-observations", help="append a list from source frontmatter into target.observations")
    a.add_argument("--from", dest="source", required=True, help="source SIGMA (id or path)")
    a.add_argument("--to", dest="target", required=True, help="target SIGMA (id or path)")
    a.add_argument("--source-key", required=True, help="dotted key in source frontmatter (e.g. learnings.destination_intel)")
    a.add_argument("--by", required=True, help="agent recording the merge")
    a.add_argument("--confidence", default="medium", help="confidence on appended observations (low|medium|high)")
    a.set_defaults(func=cmd_append_observations)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
