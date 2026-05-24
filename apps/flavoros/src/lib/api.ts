export const API_BASE_URL =
  process.env.NEXT_PUBLIC_FLAVOROS_API_URL ?? "http://127.0.0.1:8001";

export type FlavorOSSession = {
  accessToken: string;
  tenantSlug: string;
  tenantId?: string;
  email: string;
  role?: string;
};

export type ProviderConnection = {
  id: string;
  client_id: string;
  provider: "gmail" | "googlecalendar" | "googledrive";
  client_context_id: string | null;
  context_id: string | null;
  context_account_id: string | null;
  account_alias: string | null;
  purpose: string | null;
  toolkit: string | null;
  connected_account_id: string | null;
  composio_user_id: string | null;
  status:
    | "not_started"
    | "pending_consent"
    | "initiated"
    | "connected"
    | "syncing"
    | "ready"
    | "degraded"
    | "blocked"
    | "revoked"
    | "failed";
  status_reason: string | null;
  enabled: boolean;
};

export type ProfileRead = {
  id: string;
  client_id: string;
  user_id: string;
  display_name: string;
  timezone: string | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ArtifactRead = {
  id: string;
  client_id: string;
  kind: string;
  title: string;
  body: string | null;
  meta: Record<string, unknown> | null;
  status: "draft" | "ready" | "approved" | "rejected" | "archived";
  created_by: string | null;
  workflow_run_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DraftEmailPreviewRow = {
  label: string;
  value: string;
};

export type DraftEmailPreview = {
  to?: string | null;
  subject?: string | null;
  body_excerpt?: string | null;
  inbound_summary?: string | null;
  body?: string | null;
  rows?: DraftEmailPreviewRow[];
};

export type ApprovalStakeChip = {
  kind: string;
  label: string;
};

export type ApprovalRead = {
  id: string;
  client_id: string;
  artifact_id: string | null;
  governed_action: string;
  reason: string | null;
  decision: "pending" | "approved" | "rejected" | "expired";
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  preview?: DraftEmailPreview | null;
  stakes?: ApprovalStakeChip[];
  source_link_label?: string | null;
};

export type NormalizedItemRead = {
  id: string;
  client_id: string;
  provider_event_id: string;
  item_type: string;
  title: string;
  data: Record<string, unknown> | null;
  created_at: string;
};

export type OutboundStatus = "queued" | "executed" | "failed" | "pulled_back";

export type OutboundActionRead = {
  id: string;
  client_id: string;
  approval_id: string;
  artifact_id: string | null;
  provider_connection_id: string | null;
  provider: string;
  action_type: string;
  status: OutboundStatus;
  target_reference_json: Record<string, unknown> | null;
  payload_json: Record<string, unknown> | null;
  idempotency_key: string | null;
  last_error_summary: string | null;
  scheduled_send_at: string | null;
  executed_at: string | null;
  execution_result_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ApprovalDecideRead = ApprovalRead & {
  outbound_action: OutboundActionRead | null;
};

export type OnboardingSaveResponse = {
  trigger: string;
  onboarding_status: string;
  profile: {
    id: string;
    client_id: string;
    display_name: string;
    timezone: string | null;
  };
  provider_connections: ProviderConnection[];
};

export type ProviderConnectLinkResponse = {
  provider_connection_id: string;
  provider: string;
  url: string;
  composio_user_id: string;
  status: ProviderConnection["status"];
};

export type ProviderSyncResponse = {
  provider_connection_id: string;
  provider: string;
  status: ProviderConnection["status"];
  records_synced: number;
  errors: string[];
  provider_event_id: string | null;
  workflow_run_id: string | null;
};

export type ClientContext = {
  id: string;
  client_id: string;
  type: "personal" | "professional" | "business";
  name: string;
  created_at: string;
};

export type ClientContextEnvelope = ClientContext & {
  provider_connections: ProviderConnection[];
};

export type ClientUniverseEnvelope = {
  client_id: string;
  profile: {
    display_name?: string;
    timezone?: string | null;
    preferences?: Record<string, unknown>;
  } | null;
  contexts: ClientContextEnvelope[];
  authority: Record<string, unknown> | null;
  onboarding: Record<string, unknown>;
  preferences: Record<string, unknown> | null;
  readiness: Record<string, unknown>;
  provider_expectations: Record<string, unknown>;
};

export type UniverseReadiness = {
  client_id: string;
  onboarding_complete: boolean;
  sync_ready: boolean;
  flags: Record<string, unknown>;
};

export type ContextProviderDef = {
  provider: string;
  toolkit: string;
  label: string;
  category: string;
  enabled: boolean;
};

export function saveSession(session: FlavorOSSession) {
  window.localStorage.setItem("flavoros.session", JSON.stringify(session));
}

export function loadSession(): FlavorOSSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("flavoros.session");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FlavorOSSession;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  session: FlavorOSSession,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      "X-Client-ID": session.tenantId ?? session.tenantSlug,
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getProfile(session: FlavorOSSession): Promise<ProfileRead> {
  return apiRequest<ProfileRead>("/profiles/me", session);
}

export async function getUniverseEnvelope(
  session: FlavorOSSession,
): Promise<ClientUniverseEnvelope> {
  return apiRequest<ClientUniverseEnvelope>("/universe/envelope", session);
}

export async function getUniverseReadiness(
  session: FlavorOSSession,
): Promise<UniverseReadiness> {
  return apiRequest<UniverseReadiness>("/universe/readiness", session);
}

export async function listArtifacts(session: FlavorOSSession): Promise<ArtifactRead[]> {
  return apiRequest<ArtifactRead[]>("/artifacts", session);
}

export async function getArtifact(
  session: FlavorOSSession,
  artifactId: string,
): Promise<ArtifactRead> {
  return apiRequest<ArtifactRead>(`/artifacts/${artifactId}`, session);
}

export type ArtifactCreatePayload = {
  kind: "client" | "sigma";
  title: string;
  body?: string | null;
  meta?: Record<string, unknown> | null;
  status?: "draft" | "ready";
};

export async function createArtifact(
  session: FlavorOSSession,
  body: ArtifactCreatePayload,
): Promise<ArtifactRead> {
  return apiRequest<ArtifactRead>("/artifacts", session, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ApprovalCreatePayload = {
  artifact_id: string;
  governed_action: string;
  reason?: string | null;
};

export async function createApproval(
  session: FlavorOSSession,
  body: ApprovalCreatePayload,
): Promise<ApprovalRead> {
  return apiRequest<ApprovalRead>("/approvals", session, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listApprovals(
  session: FlavorOSSession,
  decision?: string,
): Promise<ApprovalRead[]> {
  const path = decision ? `/approvals?decision=${decision}` : "/approvals";
  return apiRequest<ApprovalRead[]>(path, session);
}

export async function getApproval(
  session: FlavorOSSession,
  approvalId: string,
): Promise<ApprovalRead> {
  return apiRequest<ApprovalRead>(`/approvals/${approvalId}`, session);
}

export async function decideApproval(
  session: FlavorOSSession,
  approvalId: string,
  decision: "approved" | "rejected",
): Promise<ApprovalDecideRead> {
  return apiRequest<ApprovalDecideRead>(`/approvals/${approvalId}/decide`, session, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export async function listOutboundActions(
  session: FlavorOSSession,
  filters?: { status?: OutboundStatus; provider?: string; artifact_id?: string },
): Promise<OutboundActionRead[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.provider) params.set("provider", filters.provider);
  if (filters?.artifact_id) params.set("artifact_id", filters.artifact_id);
  const qs = params.toString();
  return apiRequest<OutboundActionRead[]>(
    qs ? `/outbound-actions?${qs}` : "/outbound-actions",
    session,
  );
}

export async function listNormalizedItems(
  session: FlavorOSSession,
  filters?: { item_type?: string; limit?: number },
): Promise<NormalizedItemRead[]> {
  const params = new URLSearchParams();
  if (filters?.item_type) params.set("item_type", filters.item_type);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiRequest<NormalizedItemRead[]>(
    qs ? `/providers/normalized-items?${qs}` : "/providers/normalized-items",
    session,
  );
}

export async function getOutboundAction(
  session: FlavorOSSession,
  outboundId: string,
): Promise<OutboundActionRead> {
  return apiRequest<OutboundActionRead>(`/outbound-actions/${outboundId}`, session);
}

export async function pullBackOutboundAction(
  session: FlavorOSSession,
  outboundId: string,
): Promise<OutboundActionRead> {
  return apiRequest<OutboundActionRead>(`/outbound-actions/${outboundId}/pull-back`, session, {
    method: "POST",
  });
}

export async function executeOutboundAction(
  session: FlavorOSSession,
  outboundId: string,
): Promise<OutboundActionRead> {
  return apiRequest<OutboundActionRead>(`/outbound-actions/${outboundId}/execute`, session, {
    method: "POST",
  });
}

export async function listProviderConnections(
  session: FlavorOSSession,
): Promise<ProviderConnection[]> {
  return apiRequest<ProviderConnection[]>("/providers", session);
}

export async function listContexts(
  session: FlavorOSSession,
): Promise<ClientContext[]> {
  return apiRequest<ClientContext[]>("/contexts", session);
}

// ---------------------------------------------------------------------------
// Workflow launch + status polling
// ---------------------------------------------------------------------------

export type WorkflowStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type WorkflowLaunchResponse = {
  run_id: string;
  status: WorkflowStatus;
  workflow_type: string;
};

export type WorkflowRunRead = {
  id: string;
  client_id: string;
  workflow_type: string;
  agent: string | null;
  status: WorkflowStatus;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export async function launchWorkflow(
  session: FlavorOSSession,
  workflowType: string,
  inputData?: Record<string, unknown>,
): Promise<WorkflowLaunchResponse> {
  return apiRequest<WorkflowLaunchResponse>("/workflows/launch", session, {
    method: "POST",
    body: JSON.stringify({ workflow_type: workflowType, input_data: inputData ?? null }),
  });
}

export async function getWorkflowRun(
  session: FlavorOSSession,
  runId: string,
): Promise<WorkflowRunRead> {
  return apiRequest<WorkflowRunRead>(`/workflows/${runId}`, session);
}

export async function login(input: {
  tenantSlug: string;
  email: string;
  password: string;
}): Promise<FlavorOSSession> {
  const tokenResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_slug: input.tenantSlug,
      email: input.email,
      password: input.password,
    }),
  });
  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    throw new Error(detail || "Login failed");
  }
  const token = (await tokenResponse.json()) as { access_token: string };
  const session: FlavorOSSession = {
    accessToken: token.access_token,
    tenantSlug: input.tenantSlug,
    email: input.email,
  };
  const me = await apiRequest<{
    tenant_id: string;
    tenant_slug: string;
    role: string;
    email: string;
  }>("/auth/me", session);
  return {
    ...session,
    tenantId: me.tenant_id,
    tenantSlug: me.tenant_slug,
    role: me.role,
    email: me.email,
  };
}
