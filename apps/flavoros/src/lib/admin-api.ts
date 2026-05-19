export { loadSession } from "@/lib/api";
export type {
  ApprovalRead,
  ArtifactRead,
  FlavorOSSession,
  ProviderConnection,
} from "@/lib/api";

import {
  loadSession,
  type ApprovalRead,
  type ArtifactRead,
  type FlavorOSSession,
  type ProviderConnection,
} from "@/lib/api";

export const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_FLAVOROS_API_URL ?? "http://localhost:8000";

export type WorkflowRunRead = {
  id: string;
  client_id: string;
  workflow_type: string;
  agent: string | null;
  status: string;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type AuditEventRead = {
  id: string;
  client_id: string;
  actor_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type AdminOverview = {
  providersConnected: number;
  providersTotal: number;
  workflowsActive: number;
  workflowsFailed: number;
  artifactsPending: number;
  approvalsPending: number;
  auditRecent: number;
};

const CONNECTED_PROVIDER_STATUSES = new Set([
  "connected",
  "syncing",
  "ready",
]);

const ACTIVE_WORKFLOW_STATUSES = new Set(["queued", "running"]);

const PENDING_ARTIFACT_STATUSES = new Set(["draft", "ready"]);

async function adminRequest<T>(
  path: string,
  session: FlavorOSSession,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
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

export function getAdminSession(): FlavorOSSession | null {
  return loadSession();
}

export async function listProviders(
  session: FlavorOSSession,
): Promise<ProviderConnection[]> {
  return adminRequest<ProviderConnection[]>("/providers", session);
}

export async function listWorkflows(
  session: FlavorOSSession,
): Promise<WorkflowRunRead[]> {
  return adminRequest<WorkflowRunRead[]>("/workflows", session);
}

export async function listArtifacts(
  session: FlavorOSSession,
): Promise<ArtifactRead[]> {
  return adminRequest<ArtifactRead[]>("/artifacts", session);
}

export async function listApprovals(
  session: FlavorOSSession,
  decision?: string,
): Promise<ApprovalRead[]> {
  const path = decision ? `/approvals?decision=${decision}` : "/approvals";
  return adminRequest<ApprovalRead[]>(path, session);
}

export async function listAuditEvents(
  session: FlavorOSSession,
  limit = 100,
): Promise<AuditEventRead[]> {
  return adminRequest<AuditEventRead[]>(`/audit?limit=${limit}`, session);
}

export async function fetchAdminOverview(
  session: FlavorOSSession,
): Promise<AdminOverview> {
  const [providers, workflows, artifacts, approvals, audit] = await Promise.all([
    listProviders(session),
    listWorkflows(session),
    listArtifacts(session),
    listApprovals(session, "pending"),
    listAuditEvents(session, 50),
  ]);

  return {
    providersConnected: providers.filter((p) =>
      CONNECTED_PROVIDER_STATUSES.has(p.status),
    ).length,
    providersTotal: providers.length,
    workflowsActive: workflows.filter((w) =>
      ACTIVE_WORKFLOW_STATUSES.has(w.status),
    ).length,
    workflowsFailed: workflows.filter((w) => w.status === "failed").length,
    artifactsPending: artifacts.filter((a) =>
      PENDING_ARTIFACT_STATUSES.has(a.status),
    ).length,
    approvalsPending: approvals.length,
    auditRecent: audit.length,
  };
}
