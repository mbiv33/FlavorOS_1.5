"""Health check endpoints."""

from __future__ import annotations

import asyncio
import json
import shutil
from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health(settings: Annotated[Settings, Depends(get_settings)]) -> dict[str, str]:
    return {"status": "ok", "env": settings.api_env}


async def _gbrain_doctor(cli_path: str) -> dict[str, Any]:
    """Run ``gbrain doctor --json --fast`` and return parsed output.

    Returns a minimal error dict if the CLI is unavailable or unhealthy.
    """
    if not shutil.which(cli_path):
        return {"status": "unavailable", "error": f"CLI not found on PATH: {cli_path}"}
    try:
        proc = await asyncio.create_subprocess_exec(
            cli_path, "doctor", "--json", "--fast",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout_b, _ = await asyncio.wait_for(proc.communicate(), timeout=10.0)
        return json.loads(stdout_b.decode(errors="replace"))
    except asyncio.TimeoutError:
        return {"status": "timeout", "error": "gbrain doctor timed out after 10s"}
    except Exception as exc:
        return {"status": "error", "error": str(exc)[:200]}


@router.get("/admin/system-health")
async def system_health(
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """Adapter and subsystem health — for admin app surfaces.

    Returns:
      env:        deployment environment label
      adapters:   active mode for each adapter (real / stub / cli / local_file)
      gbrain:     output of ``gbrain doctor --json --fast``
    """
    gbrain_health = await _gbrain_doctor(settings.gbrain_cli_path)

    return {
        "env": settings.api_env,
        "adapters": {
            "composio": "real" if settings.composio_api_key else "stub",
            "gbrain": settings.gbrain_adapter,
            "orchestrator": "stub",
        },
        "gbrain": gbrain_health,
    }
