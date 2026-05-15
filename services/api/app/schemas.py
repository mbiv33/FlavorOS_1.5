"""Pydantic schemas for API."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    env: str


class LoginRequest(BaseModel):
    tenant_slug: str = Field(..., min_length=1, max_length=64)
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: uuid.UUID
    tenant_id: uuid.UUID
    tenant_slug: str
    role: str


class UserPublic(BaseModel):
    id: uuid.UUID
    email: EmailStr
    tenant_id: uuid.UUID
    tenant_slug: str
    role: str

    model_config = {"from_attributes": True}


class ProfileRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    user_id: uuid.UUID
    display_name: str
    timezone: Optional[str]
    preferences: Optional[dict]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileWrite(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    timezone: Optional[str] = Field(None, max_length=64)
    preferences: Optional[dict] = None
