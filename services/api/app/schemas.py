"""Pydantic schemas for API."""

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HealthResponse(BaseModel):
    status: str = "ok"
    env: str


class LoginRequest(BaseModel):
    tenant_slug: str = Field(..., min_length=1, max_length=64)
    email: str
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
    email: str
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
# Outbound Action
# ---------------------------------------------------------------------------

OUTBOUND_STATUSES = frozenset({"queued", "executed", "failed", "pulled_back"})


class OutboundActionRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    approval_id: uuid.UUID
    artifact_id: Optional[uuid.UUID]
    provider_connection_id: Optional[uuid.UUID]
    provider: str
    action_type: str
    status: str
    target_reference_json: Optional[dict]
    payload_json: Optional[dict]
    idempotency_key: Optional[str]
    last_error_summary: Optional[str]
    executed_at: Optional[datetime]
    execution_result_json: Optional[dict]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApprovalDecideRead(ApprovalRead):
    outbound_action: Optional[OutboundActionRead] = None


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


class AgentTaskRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    workflow_run_id: uuid.UUID
    agent: str
    task_type: str
    status: str
    payload: Optional[dict]
    result: Optional[dict]
    error: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Client Context
# ---------------------------------------------------------------------------


class ClientContextCreate(BaseModel):
    type: Literal["personal", "professional", "business"]
    name: str

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"personal", "professional", "business"}
        if v not in allowed:
            raise ValueError(f"type must be one of {allowed}")
        return v


class ClientContextRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    type: str
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Provider Connection
# ---------------------------------------------------------------------------

PROVIDER_CONNECTION_STATUSES = {
    "not_started",
    "pending_consent",
    "initiated",
    "connected",
    "syncing",
    "ready",
    "degraded",
    "blocked",
    "revoked",
    "failed",
}


class ProviderConnectionRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_context_id: Optional[uuid.UUID]
    provider: str
    context_id: Optional[str]
    context_account_id: Optional[str]
    account_alias: Optional[str]
    purpose: Optional[str]
    toolkit: Optional[str]
    auth_config_id: Optional[str]
    connected_account_id: Optional[str]
    composio_user_id: Optional[str]
    status: str
    status_reason: Optional[str]
    scopes: Optional[list]
    config: Optional[dict]
    enabled: bool
    last_sync_at: Optional[datetime]
    last_checked_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProviderConnectionWrite(BaseModel):
    provider: str = Field(..., min_length=1, max_length=64)
    client_context_id: Optional[uuid.UUID] = None
    context_id: Optional[str] = Field(None, max_length=128)
    context_account_id: Optional[str] = Field(None, max_length=128)
    account_alias: Optional[str] = Field(None, max_length=128)
    purpose: Optional[str] = Field(None, max_length=64)
    toolkit: Optional[str] = Field(None, max_length=64)
    auth_config_id: Optional[str] = Field(None, max_length=255)
    connected_account_id: Optional[str] = Field(None, max_length=255)
    composio_user_id: Optional[str] = Field(None, max_length=255)
    status: str = Field(
        "not_started",
        pattern=(
            r"^(not_started|pending_consent|initiated|connected|syncing|ready|"
            r"degraded|blocked|revoked|failed)$"
        ),
    )
    status_reason: Optional[str] = None
    scopes: Optional[list] = None
    config: Optional[dict] = None
    enabled: bool = True


class ProviderCatalogItem(BaseModel):
    provider: str
    toolkit: str
    label: str
    category: str
    enabled: bool = True


class ProviderConnectLinkRequest(BaseModel):
    provider_connection_id: uuid.UUID
    redirect_uri: str = Field(..., min_length=1)


class ProviderSyncRequest(BaseModel):
    provider_connection_id: uuid.UUID


class ProviderConnectLinkRead(BaseModel):
    provider_connection_id: uuid.UUID
    provider: str
    url: str
    composio_user_id: str
    status: str


class ProviderCallbackRead(BaseModel):
    provider_connection_id: uuid.UUID
    status: str
    connected_account_id: Optional[str] = None


class ProviderSyncRead(BaseModel):
    provider_connection_id: uuid.UUID
    provider: str
    status: str
    records_synced: int = 0
    errors: list[str] = Field(default_factory=list)
    provider_event_id: Optional[uuid.UUID] = None
    workflow_run_id: Optional[uuid.UUID] = None


class ProviderEventRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    provider_connection_id: Optional[uuid.UUID]
    provider: str
    event_type: str
    idempotency_key: str
    payload: Optional[dict]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NormalizedItemRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    provider_event_id: uuid.UUID
    item_type: str
    title: str
    data: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Onboarding
# ---------------------------------------------------------------------------


class OnboardingIdentity(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    legal_name: Optional[str] = None
    preferred_name: Optional[str] = None
    title: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    timezone: str = Field("America/New_York", min_length=1, max_length=64)
    locale: str = Field("en-US", min_length=1, max_length=32)


class OnboardingContextAccount(BaseModel):
    context_account_id: str = Field(..., min_length=1, max_length=128)
    provider: str = Field(..., min_length=1, max_length=64)
    context_account_purpose: str = Field(..., min_length=1, max_length=64)
    account_alias: str = Field(..., min_length=1, max_length=128)
    auth_scheme: str = Field(..., pattern=r"^(oauth|api_key|manual|local_path|none)$")
    external_identifier: Optional[str] = None


class OnboardingContext(BaseModel):
    context_id: str = Field(..., min_length=1, max_length=128)
    context_type: str = Field(..., min_length=1, max_length=64)
    display_name: str = Field(..., min_length=1, max_length=255)
    status: str = Field("active", pattern=r"^(active|pending|paused|archived)$")
    description: Optional[str] = None
    context_accounts: list[OnboardingContextAccount] = Field(default_factory=list)


class OnboardingState(BaseModel):
    status: str = Field(
        "pending",
        pattern=r"^(pending|partial|ready_for_auth|ready_for_sync|active|blocked|archived)$",
    )


class OnboardingSaveRequest(BaseModel):
    identity: OnboardingIdentity
    authority_defaults: dict = Field(default_factory=dict)
    onboarding: OnboardingState = Field(default_factory=OnboardingState)
    contexts: list[OnboardingContext] = Field(..., min_length=1)


class OnboardingSaveRead(BaseModel):
    trigger: str
    onboarding_status: str
    profile: ProfileRead
    provider_connections: list[ProviderConnectionRead]


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
