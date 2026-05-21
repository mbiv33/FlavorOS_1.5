"""Agent skill registry.

A skill is an async callable that executes one AgentTask to completion.

Signature:
    async def skill(*, db: Session, task: AgentTask) -> dict[str, Any]

The executor calls the skill, handles AgentTaskEvent bookkeeping for
``started`` / ``completed`` / ``failed``, and commits after each step.
Skills write intermediate events (``llm_response``, ``hitl_gate``,
``tool_called``) themselves via ``_emit(db, task, event_type, detail)``.

Register a skill with the ``@register_skill`` decorator or by calling
``register("task_type", fn)`` directly.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

SkillFn = Callable[..., Awaitable[dict[str, Any]]]

_REGISTRY: dict[str, SkillFn] = {}


def register(task_type: str, fn: SkillFn) -> None:
    _REGISTRY[task_type] = fn


def register_skill(task_type: str) -> Callable[[SkillFn], SkillFn]:
    """Decorator: ``@register_skill("morning_standup")``."""

    def decorator(fn: SkillFn) -> SkillFn:
        register(task_type, fn)
        return fn

    return decorator


def get(task_type: str) -> SkillFn | None:
    return _REGISTRY.get(task_type)


def registered_types() -> list[str]:
    return list(_REGISTRY)
