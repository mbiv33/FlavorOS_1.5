export const API_BASE_URL =
  process.env.NEXT_PUBLIC_FLAVOROS_API_URL ?? "http://localhost:8000";

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
