"""Canonical Client Universe KV categories and keys.

Contexts and context accounts live in relational tables (`client_contexts`,
`provider_connections`), not in `client_universe` KV rows.
"""

from __future__ import annotations

# KV categories allowed in client_universe table
KV_CATEGORIES = frozenset(
    {
        "authority_defaults",
        "onboarding",
        "preferences",
        "readiness",
        "provider_expectations",
    }
)

# Deprecated — do not write new rows
DEPRECATED_KV_CATEGORIES = frozenset({"context", "context_account"})

AUTHORITY_DEFAULTS_KEYS = frozenset({"defaults"})
ONBOARDING_KEYS = frozenset({"status", "provider_trigger"})
READINESS_KEYS = frozenset({"onboarding", "sync", "universe"})
PREFERENCES_KEYS = frozenset({"defaults"})


def validate_kv_category(category: str) -> str:
    if category in DEPRECATED_KV_CATEGORIES:
        raise ValueError(
            f"category '{category}' is deprecated; use client_contexts / provider_connections"
        )
    if category not in KV_CATEGORIES:
        raise ValueError(
            f"unknown universe category '{category}'; allowed: {sorted(KV_CATEGORIES)}"
        )
    return category


def validate_kv_key(category: str, key: str) -> str:
    validate_kv_category(category)
    allowed: frozenset[str] | None = None
    if category == "authority_defaults":
        allowed = AUTHORITY_DEFAULTS_KEYS
    elif category == "onboarding":
        allowed = ONBOARDING_KEYS
    elif category == "readiness":
        if key in READINESS_KEYS or key.startswith("sync:"):
            return key
        allowed = READINESS_KEYS
    elif category == "preferences":
        allowed = PREFERENCES_KEYS
    elif category == "provider_expectations":
        return key  # per-provider keys
    if allowed is not None and key not in allowed:
        raise ValueError(
            f"unknown key '{key}' for category '{category}'; allowed: {sorted(allowed)}"
        )
    return key
