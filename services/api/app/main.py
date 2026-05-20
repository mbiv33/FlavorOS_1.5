"""FlavorOS FastAPI entrypoint."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.config import get_settings, parse_origins
from app.database import SessionLocal
from app.routers import (
    approvals,
    artifacts,
    audit,
    auth,
    contexts,
    health,
    onboarding,
    outbound_actions,
    profiles,
    providers,
    universe,
    workflows,
)
from app.seed import seed_if_empty

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    if settings.api_skip_startup_seed:
        yield
        return
    db = SessionLocal()
    try:
        seed_if_empty(db)
    except OperationalError as exc:
        logger.warning(
            "Startup seed skipped — database unreachable or credentials mismatch (%s). "
            "Bring up Postgres (`docker compose up -d postgres`), run `alembic upgrade head`, "
            "or set DATABASE_URL to match your server (see README). "
            "/health works; auth and tenant APIs need a working DB.",
            exc.orig if getattr(exc, "orig", None) else exc,
        )
    finally:
        db.close()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="FlavorOS API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_origins(settings.api_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(onboarding.router)
    app.include_router(contexts.router)
    app.include_router(profiles.router)
    app.include_router(universe.router)
    app.include_router(artifacts.router)
    app.include_router(approvals.router)
    app.include_router(outbound_actions.router)
    app.include_router(workflows.router)
    app.include_router(providers.router)
    app.include_router(audit.router)
    return app


app = create_app()
