"""In-process async workflow executor.

``dispatch_task(task_id)`` is the single entry point. It:
  1. Opens its own DB session (independent of the request session).
  2. Loads the AgentTask and marks it ``running``.
  3. Emits an ``AgentTaskEvent(started)`` row.
  4. Looks up the registered skill by ``task.task_type``.
  5. Runs the skill; the skill may flush intermediate AgentTaskEvent rows.
  6. On success: emits ``completed``, writes ``task.result``, commits.
  7. On failure: emits ``failed``, writes ``task.error``, commits.

The executor never raises — all exceptions are caught and recorded so a
fire-and-forget ``asyncio.create_task(dispatch_task(...))`` call cannot
silently crash the event loop.

Skills are imported at module load time so the registry is populated
before ``dispatch_task`` is called. New skills just need to be imported;
the ``@register_skill`` decorator does the rest.
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import select

import app.skills as skill_registry

# Import all skill modules so their @register_skill decorators run.
import app.skills.cob_workday  # noqa: F401
import app.skills.morning_standup  # noqa: F401
from app.database import SessionLocal
from app.models import AgentTask, AgentTaskEvent

logger = logging.getLogger(__name__)


async def dispatch_task(task_id: uuid.UUID) -> None:
    """Execute one AgentTask to completion in a new DB session.

    Safe to call via ``asyncio.create_task`` — never raises.
    """
    db = SessionLocal()
    try:
        task = db.execute(
            select(AgentTask).where(AgentTask.id == task_id)
        ).scalar_one_or_none()

        if task is None:
            logger.warning("dispatch_task: AgentTask %s not found", task_id)
            return

        if task.status not in {"queued", "retrying"}:
            logger.debug(
                "dispatch_task: AgentTask %s already in status %s — skipping",
                task_id,
                task.status,
            )
            return

        # Mark running
        task.status = "running"
        db.add(
            AgentTaskEvent(
                client_id=task.client_id,
                agent_task_id=task.id,
                event_type="started",
                detail={
                    "task_type": task.task_type,
                    "agent": task.agent,
                },
            )
        )
        db.commit()

        # Resolve skill
        skill = skill_registry.get(task.task_type)
        if skill is None:
            _fail(
                db,
                task,
                f"No skill registered for task_type '{task.task_type}'. "
                f"Registered: {skill_registry.registered_types()}",
            )
            return

        # Execute skill
        try:
            result = await skill(db=db, task=task)
        except Exception as exc:
            logger.exception("Skill %s failed for task %s", task.task_type, task_id)
            _fail(db, task, str(exc)[:500])
            return

        # Mark completed
        task.status = "completed"
        task.result = result
        db.add(
            AgentTaskEvent(
                client_id=task.client_id,
                agent_task_id=task.id,
                event_type="completed",
                detail=result,
            )
        )
        db.commit()
        logger.info(
            "dispatch_task: AgentTask %s (%s) completed", task_id, task.task_type
        )

    except Exception as exc:
        logger.exception("dispatch_task: unexpected error for task %s: %s", task_id, exc)
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        db.close()


def _fail(db, task: AgentTask, error: str) -> None:
    """Mark task failed and commit."""
    try:
        task.status = "failed"
        task.error = error
        db.add(
            AgentTaskEvent(
                client_id=task.client_id,
                agent_task_id=task.id,
                event_type="failed",
                detail={"error": error},
            )
        )
        db.commit()
        logger.error(
            "dispatch_task: AgentTask %s failed — %s", task.id, error[:200]
        )
    except Exception as exc:
        logger.exception("dispatch_task: could not write failed state: %s", exc)
        try:
            db.rollback()
        except Exception:
            pass
