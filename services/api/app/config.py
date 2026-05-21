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
    # When True, skip lifespan DB seed (API starts; tenant routes need DB).
    api_skip_startup_seed: bool = False
    composio_api_key: str = ""
    composio_redirect_uri: str = ""
    anthropic_api_key: str = ""
    gbrain_adapter: str = "stub"
    gbrain_store_dir: str = ".gbrain/flavoros-ingest"
    gbrain_cli_path: str = "gbrain"
    orchestrator_adapter: str = "in_process"

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        return _normalize_postgres_url(v)

    @field_validator("jwt_secret")
    @classmethod
    def jwt_secret_must_not_be_default(cls, v: str, info) -> str:
        env = (info.data or {}).get("api_env", "development")
        if v == "change-me" and env == "production":
            raise ValueError(
                "JWT_SECRET is set to the default 'change-me' — "
                "generate a real secret before deploying: "
                "python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return v

    @field_validator("anthropic_api_key")
    @classmethod
    def anthropic_key_required_in_prod(cls, v: str, info) -> str:
        env = (info.data or {}).get("api_env", "development")
        if not v and env == "production":
            raise ValueError("ANTHROPIC_API_KEY must be set in production")
        return v

    @field_validator("composio_api_key")
    @classmethod
    def composio_key_required_in_prod(cls, v: str, info) -> str:
        env = (info.data or {}).get("api_env", "development")
        if not v and env == "production":
            raise ValueError("COMPOSIO_API_KEY must be set in production")
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


def parse_origins(origins: str) -> list[str]:
    return [o.strip() for o in origins.split(",") if o.strip()]
