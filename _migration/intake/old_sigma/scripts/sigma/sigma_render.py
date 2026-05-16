#!/usr/bin/env python3
"""Render a human-readable preview of a SIGMA.

Scope note: this tool produces a *preview* of one SIGMA (frontmatter pretty-
printed + body). It is intentionally not a generic readiness-artifact engine —
each readiness type (trip page, meeting prep, etc.) gets its own dedicated
renderer that knows the target template. This tool is for inspection, agent
context-loading, and quick CLI viewing.

Usage:
  scripts/sigma/sigma_render.py <sigma-path>           # to stdout
  scripts/sigma/sigma_render.py <sigma-path> --out FILE
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from _lib import read_sigma

try:
    import yaml
except ImportError:  # already handled in _lib but keep import local
    sys.exit(2)


def render(fm: dict[str, Any], body: str) -> str:
    sid = fm.get("sigma_id", "<unknown>")
    stype = fm.get("type", "<unknown>")
    status = fm.get("status", "<unknown>")
    title = f"{sid}  ({stype}, {status})"
    rule = "═" * len(title)

    out = [rule, title, rule, ""]

    # Identity block.
    out.append("## Metadata")
    for k in ("client_id", "created_at", "created_by", "source_protocol", "confidence"):
        if k in fm:
            out.append(f"- **{k}**: {fm[k]}")
    if fm.get("status") == "superseded":
        out.append(f"- **superseded_by**: {fm.get('superseded_by')}")
    out.append("")

    # Type-specific top-level scalars (anything not in the standard set).
    standard = {
        "sigma_id", "type", "status", "client_id", "created_at", "created_by",
        "source_protocol", "confidence", "usable_by", "superseded_by",
        "related_readiness_artifacts", "related_sigmas", "source_items",
    }
    extras = {k: v for k, v in fm.items() if k not in standard}
    if extras:
        out.append("## Type fields")
        out.append("```yaml")
        out.append(yaml.safe_dump(extras, sort_keys=False, default_flow_style=False).rstrip())
        out.append("```")
        out.append("")

    # Cross-refs.
    refs = {k: fm.get(k) for k in ("usable_by", "related_sigmas", "related_readiness_artifacts", "source_items")}
    if any(refs.values()):
        out.append("## Cross-references")
        for k, v in refs.items():
            if v:
                out.append(f"- **{k}**: {v}")
        out.append("")

    # Body.
    if body.strip():
        out.append("## Body")
        out.append(body.rstrip())

    return "\n".join(out) + "\n"


def main() -> int:
    p = argparse.ArgumentParser(description="Render a SIGMA preview.")
    p.add_argument("path", help="path to a SIGMA .md file")
    p.add_argument("--out", help="write to file instead of stdout")
    args = p.parse_args()

    src = Path(args.path)
    try:
        fm, body = read_sigma(src)
    except (ValueError, OSError) as e:
        sys.stderr.write(f"error: {e}\n")
        return 2

    rendered = render(fm, body)
    if args.out:
        Path(args.out).write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
