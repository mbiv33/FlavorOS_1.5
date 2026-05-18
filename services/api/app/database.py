"""Database engine and session."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


_settings = get_settings()

_pool_kwargs: dict = {"pool_pre_ping": True}
if not _settings.database_url.startswith("sqlite"):
    _pool_kwargs.update(pool_size=5, max_overflow=10)

engine = create_engine(_settings.database_url, **_pool_kwargs)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
