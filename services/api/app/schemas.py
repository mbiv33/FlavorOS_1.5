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


# ---------------------------------------------------------------------------
# Client Universe
# ---------------------------------------------------------------------------


class ClientUniverseEntryRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    category: str
    key: str
    value: Optional[dict]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClientUniverseEntryWrite(BaseModel):
    category: str = Field(..., min_length=1, max_length=64)
    key: str = Field(..., min_length=1, max_length=255)
    value: Optional[dict] = None


# ---------------------------------------------------------------------------
# Artifact
# ---------------------------------------------------------------------------

ARTIFACT_KINDS = {"client", "sigma"}
ARTIFACT_STATUSES = {"draft", "ready", "approved", "rejected", "archived"}


class ArtifactRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    kind: str
    title: str
    body: Optional[str]
    meta: Optional[dict]
    status: str
    created_by: Optional[str]
    workflow_run_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ArtifactCreate(BaseModel):
    kind: str = Field(..., pattern=r"^(client|sigma)$")
    title: str = Field(..., min_length=1, max_length=512)
    body: Optional[str] = None
    meta: Optional[dict] = None
    status: str = Field("draft", pattern=r"^(draft|ready)$")
    created_by: Optional[str] = Field(None, max_length=128)
    workflow_run_id: Optional[uuid.UUID] = None


class ArtifactUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=512)
    body: Optional[str] = None
    meta: Optional[dict] = None
    status: Optional[str] = Field(None, pattern=r"^(draft|ready|approved|rejected|archived)$")


# ---------------------------------------------------------------------------
# Approval
# ---------------------------------------------------------------------------

APPROVAL_DECISIONS = {"pending", "approved", "rejected", "expired"}


class ApprovalRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    artifact_id: Optional[uuid.UUID]
    governed_action: str
    reason: Optional[str]
    decision: str
    decided_by: Optional[uuid.UUID]
    decided_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApprovalCreate(BaseModel):
    artifact_id: Optional[uuid.UUID] = None
    governed_action: str = Field(..., min_length=1, max_length=255)
    reason: Optional[str] = None


class ApprovalDecide(BaseModel):
    decision: str = Field(..., pattern=r"^(approved|rejected)$")


# ---------------------------------------------------------------------------
# Workflow Run
# ---------------------------------------------------------------------------

WORKFLOW_STATUSES = {"queued", "running", "completed", "failed", "cancelled"}


class WorkflowRunRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    workflow_type: str
    agent: Optional[str]
    status: str
    input_data: Optional[dict]
    output_data: Optional[dict]
    error: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkflowRunCreate(BaseModel):
    workflow_type: str = Field(..., min_length=1, max_length=128)
    agent: Optional[str] = Field(None, max_length=64)
    input_data: Optional[dict] = None


# ---------------------------------------------------------------------------
# Provider Connection
# ---------------------------------------------------------------------------


class ProviderConnectionRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    provider: str
    status: str
    config: Optional[dict]
    enabled: bool
    last_sync_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProviderConnectionWrite(BaseModel):
    provider: str = Field(..., min_length=1, max_length=64)
    status: str = Field("disconnected", pattern=r"^(connected|disconnected|error)$")
    config: Optional[dict] = None
    enabled: bool = True


# ---------------------------------------------------------------------------
# Audit Event
# ---------------------------------------------------------------------------


class AuditEventRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    actor_id: Optional[uuid.UUID]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[uuid.UUID]
    detail: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditEventCreate(BaseModel):
    action: str = Field(..., min_length=1, max_length=128)
    resource_type: Optional[str] = Field(None, max_length=64)
    resource_id: Optional[uuid.UUID] = None
    detail: Optional[dict] = None
