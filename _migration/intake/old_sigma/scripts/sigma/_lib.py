"""Shared constants and helpers for SIGMA tooling.

See docs/architecture/SIGMA_SPEC.md for the source-of-truth definitions.
"""

from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    sys.stderr.write(
        "error: PyYAML is required.\n"
        "       install with:  pip3 install pyyaml\n"
    )
    sys.exit(2)


REPO_ROOT = Path(__file__).resolve().parents[2]
VAULT_ROOT = REPO_ROOT / "vault"
SIGMA_ROOT = VAULT_ROOT / "05-SIGMA"
SIGMA_TEMPLATES = SIGMA_ROOT / "_templates"

KNOWN_AGENTS = {"khadijah", "sinclair", "maxine", "scooter", "kyle"}
KNOWN_STATUSES = {"draft", "active", "superseded", "archived"}
KNOWN_CONFIDENCE = {"low", "medium", "high"}

# SIGMA type catalog. Keep aligned with SIGMA_SPEC.md §5.
KNOWN_TYPES = {
    "trip-instance",
    "travel-preferences",
    "destination-intelligence",
    "vendor-intelligence",
    "ripple",
    "meeting-instance",
    "relationship",
    "project-state",
    "wellness-baseline",
}

REQUIRED_FIELDS = (
    "sigma_id",
    "type",
    "status",
    "client_id",
    "created_at",
    "created_by",
    "source_protocol",
    "confidence",
    "usable_by",
)

SIGMA_ID_RE = re.compile(r"^SIGMA-\d{8}-\d{6}-[a-z0-9][a-z0-9-]{0,23}$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,23}$")
FRONTMATTER_RE = re.compile(r"\A---\n(.*?\n)---\n(.*)\Z", re.DOTALL)


# ─── Time helpers ──────────────────────────────────────────────────────

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def sigma_id(now: datetime, slug: str) -> str:
    return f"SIGMA-{now:%Y%m%d-%H%M%S}-{slug}"


# ─── Frontmatter I/O ───────────────────────────────────────────────────

def split_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    """Return (frontmatter_dict, body). Body is empty string if absent.

    Raises ValueError if the file lacks frontmatter delimiters.
    """
    m = FRONTMATTER_RE.match(text)
    if not m:
        raise ValueError("file has no YAML frontmatter")
    fm_text, body = m.group(1), m.group(2)
    data = yaml.safe_load(fm_text) or {}
    if not isinstance(data, dict):
        raise ValueError("frontmatter must be a mapping")
    return data, body


def read_sigma(path: Path) -> tuple[dict[str, Any], str]:
    return split_frontmatter(path.read_text(encoding="utf-8"))


def compose_sigma(fm: dict[str, Any], body: str) -> str:
    """Serialize frontmatter + body back to a markdown string."""
    fm_text = yaml.safe_dump(fm, sort_keys=False, default_flow_style=False, allow_unicode=True)
    return f"---\n{fm_text}---\n{body}"


def write_sigma(path: Path, fm: dict[str, Any], body: str) -> None:
    path.write_text(compose_sigma(fm, body), encoding="utf-8")


def find_sigma(arg: str) -> Path:
    """Accept a sigma_id or a path, return the resolved file path.

    Raises FileNotFoundError if neither resolves.
    """
    p = Path(arg)
    if p.is_file():
        return p.resolve()
    # Try as sigma_id under vault/05-SIGMA/.
    for candidate in SIGMA_ROOT.rglob(f"{arg}.md"):
        if "_templates" in candidate.parts:
            continue
        return candidate.resolve()
    raise FileNotFoundError(f"could not resolve SIGMA: {arg}")


def template_path_for(sigma_type: str) -> Path:
    return SIGMA_TEMPLATES / f"sigma-{sigma_type}.md"


# ─── Slug helpers ──────────────────────────────────────────────────────

def normalize_slug(raw: str) -> str:
    s = re.sub(r"[^a-z0-9-]+", "-", raw.lower()).strip("-")
    s = re.sub(r"-{2,}", "-", s)
    return s[:24]
