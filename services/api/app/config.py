"""Application configuration."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_postgres_url(url: str) -> str:
    """Use psycopg (v3) driver; bare postgresql:// defaults to psycopg2 in SQLAlchemy."""
    if "postgresql+psycopg://" in url or "postgresql+psycopg2://" in url:
        return url
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../../.env", "../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    api_env: str = "development"
    database_url: str = "postgresql+psycopg://flavoros:flavoros@localhost:5432/flavoros"
    api_origins: str = "http://localhost:3000,http://localhost:3001"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    api_strict_tenant: bool = False
    dev_client_password: str = "devclient"
    dev_admin_password: str = "devadmin"

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        return _normalize_postgres_url(v)


@lru_cache
def get_settings() -> Settings:
    return Settings()


def parse_origins(origins: str) -> list[str]:
    return [o.strip() for o in origins.split(",") if o.strip()]
