export type AdminSurfaceSpec = {
  title: string;
  subtitle: string;
  notes: string[];
  liveData: boolean;
};

export type AdminSurface = AdminSurfaceSpec & { slug: string };

export const ADMIN_TILES = [
  { slug: "tenants", title: "Tenants" },
  { slug: "providers", title: "Providers" },
  { slug: "workflows", title: "Workflows" },
  { slug: "agents", title: "Agents" },
  { slug: "gbrain", title: "GBrain" },
  { slug: "artifacts", title: "Artifact queue" },
  { slug: "approvals", title: "Approval queue" },
  { slug: "outbound", title: "Outbound actions" },
  { slug: "logs", title: "Logs" },
  { slug: "config", title: "Config" },
  { slug: "dna", title: "DNA Review" },
] as const;

export type AdminTileSlug = (typeof ADMIN_TILES)[number]["slug"];

export const ADMIN_SURFACES: Record<string, AdminSurfaceSpec> = {
  tenants: {
    title: "Tenant Monitor",
    subtitle: "Tenants, clients, and isolation posture",
    liveData: false,
    notes: [
      "Lists tenants and clients with environment + isolation health.",
      "Drill-in shows client id, onboarding status, Client Universe readiness.",
      "Read-only at MVP — no tenant deletion from UI.",
    ],
  },
  providers: {
    title: "Provider Sync Status",
    subtitle: "Provider connection and sync health",
    liveData: true,
    notes: [
      "Per-connection state, last sync, last error, backlog size.",
      "Commands: retry sync, force reconnect, mark for follow-up.",
      "Source: provider_connections, provider_sync_events.",
    ],
  },
  workflows: {
    title: "Workflow Monitor",
    subtitle: "Active, failed, completed, and scheduled runs",
    liveData: true,
    notes: [
      "Per run: definition, client, current state, agent task tree.",
      "Linked artifacts and approvals.",
      "Admin-only error trace.",
    ],
  },
  agents: {
    title: "Agent Monitor",
    subtitle: "Khadijah, Sinclair, Regine activity",
    liveData: false,
    notes: [
      "Active task counts, failures, durations per agent.",
      "Drill-in surfaces full agent_task + agent_report envelopes.",
    ],
  },
  gbrain: {
    title: "GBrain Ingestion Status",
    subtitle: "Memory and context readiness",
    liveData: false,
    notes: [
      "Ingestion queue size, indexed counts, failures, retrieval health.",
      "Commands: retry ingestion, reindex client, open ingest log.",
    ],
  },
  artifacts: {
    title: "Artifact Queue",
    subtitle: "Cross-client artifact pipeline",
    liveData: true,
    notes: [
      "Drafts, pending review, approved/filed, SIGMA artifacts (admin-only).",
      "Per artifact: id, type, client, state, version, linked workflow run.",
    ],
  },
  approvals: {
    title: "Approval Queue",
    subtitle: "HITL state across clients",
    liveData: true,
    notes: [
      "Needs approval, approved (recent), failed execution, pulled back.",
      "Observability only — admin does not override client approvals here.",
    ],
  },
  outbound: {
    title: "Outbound actions",
    subtitle: "Approval-gated communications write-back",
    liveData: true,
    notes: [
      "Gmail send lifecycle: queued, executed, failed, pulled_back.",
      "Linked approval, artifact, provider connection, and audit events.",
    ],
  },
  logs: {
    title: "Logs",
    subtitle: "Audit-safe runtime events",
    liveData: true,
    notes: [
      "Filter by client, event type, severity, time range.",
      "Never displays secrets in plain text.",
    ],
  },
  config: {
    title: "Config Editor",
    subtitle: "Controlled configuration surface",
    liveData: false,
    notes: [
      "Editable: workflow flags, briefing/meeting flags, authority defaults, feature flags, persona pack assignments.",
      "Read-only: provider OAuth credentials, API keys, service tokens.",
      "Every edit writes an audit event.",
    ],
  },
  dna: {
    title: "DNA Review",
    subtitle: "Client DNA candidate HITL verify & adoption queue",
    liveData: true,
    notes: [
      "Pending candidates from account sweep LLM extraction — contacts, locations, entities, projects.",
      "Accept promotes to GBrain durable memory. Reject returns to queue; 3× rejection purges.",
    ],
  },
};

export function getAdminSurface(slug: string): AdminSurfaceSpec | undefined {
  return ADMIN_SURFACES[slug];
}

export function formatTileMeta(
  slug: AdminTileSlug,
  overview: import("@/lib/admin-api").AdminOverview | null,
): string {
  if (!overview) {
    return "Counts unavailable";
  }

  switch (slug) {
    case "tenants":
      return "1 tenant · 1 client";
    case "providers":
      return overview.providersTotal === 0
        ? "No provider connections"
        : `${overview.providersConnected} connected · ${overview.providersTotal} total`;
    case "workflows":
      return `${overview.workflowsFailed} failed · ${overview.workflowsActive} active`;
    case "agents":
      return "Khadijah · Sinclair · Regine";
    case "gbrain":
      return "Ingestion idle";
    case "artifacts":
      return `${overview.artifactsPending} pending review`;
    case "approvals":
      return `${overview.approvalsPending} needs approval`;
    case "outbound":
      return overview.outboundTotal === 0
        ? "No outbound actions"
        : `${overview.outboundQueued} queued · ${overview.outboundFailed} failed · ${overview.outboundTotal} total`;
    case "logs":
      return `${overview.auditRecent} recent audit events`;
    case "config":
      return "Workflow + briefing flags";
    case "dna":
      return "Pending HITL review";
    default:
      return "";
  }
}
