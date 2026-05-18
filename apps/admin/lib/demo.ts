/* Static demo data for admin monitoring surfaces. */

export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  users: number;
  agents: number;
  status: "healthy" | "degraded" | "offline";
  lastActivity: string;
};

export type AgentRow = {
  id: string;
  name: string;
  role: string;
  tenantSlug: string;
  status: "running" | "idle" | "error";
  tasksToday: number;
  avgLatencyMs: number;
};

export type WorkflowRow = {
  id: string;
  name: string;
  tenantSlug: string;
  status: "running" | "completed" | "failed" | "queued";
  startedAt: string;
  durationMs: number | null;
  steps: number;
  currentStep: number;
};

export type ProviderRow = {
  id: string;
  name: string;
  kind: string;
  tenantSlug: string;
  connected: boolean;
  lastSync: string | null;
  errorCount: number;
};

export type GBrainStatus = {
  indexedDocs: number;
  lastIndexAt: string;
  vectorCount: number;
  queryLatencyP50Ms: number;
  queryLatencyP99Ms: number;
  status: "healthy" | "stale" | "error";
};

export type ArtifactQueueRow = {
  id: string;
  title: string;
  kind: string;
  tenantSlug: string;
  agentName: string;
  status: "draft" | "final" | "approved" | "archived";
  createdAt: string;
};

export type ApprovalQueueRow = {
  id: string;
  title: string;
  tenantSlug: string;
  agentName: string;
  urgency: "high" | "medium" | "low";
  createdAt: string;
  status: "pending" | "approved" | "rejected";
};

export type LogEntry = {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  service: string;
  message: string;
};

export const tenants: TenantRow[] = [
  { id: "t-1", slug: "demo", name: "Demo Workspace", plan: "pro", users: 3, agents: 5, status: "healthy", lastActivity: "2 min ago" },
  { id: "t-2", slug: "acme", name: "Acme Corp", plan: "enterprise", users: 12, agents: 8, status: "healthy", lastActivity: "5 min ago" },
  { id: "t-3", slug: "beta-user", name: "Beta Tester", plan: "free", users: 1, agents: 2, status: "degraded", lastActivity: "1 hr ago" },
];

export const agents: AgentRow[] = [
  { id: "a-1", name: "Khadijah", role: "Chief of Staff", tenantSlug: "demo", status: "running", tasksToday: 14, avgLatencyMs: 320 },
  { id: "a-2", name: "Sinclair", role: "Travel & Logistics", tenantSlug: "demo", status: "idle", tasksToday: 6, avgLatencyMs: 450 },
  { id: "a-3", name: "Kyle", role: "Research Analyst", tenantSlug: "demo", status: "running", tasksToday: 9, avgLatencyMs: 280 },
  { id: "a-4", name: "Maxine", role: "Creative Director", tenantSlug: "demo", status: "error", tasksToday: 3, avgLatencyMs: 0 },
  { id: "a-5", name: "Scooter", role: "Ops & Maintenance", tenantSlug: "demo", status: "idle", tasksToday: 2, avgLatencyMs: 150 },
];

export const workflows: WorkflowRow[] = [
  { id: "w-1", name: "Morning Standup", tenantSlug: "demo", status: "completed", startedAt: "2026-05-18T08:00:00Z", durationMs: 45000, steps: 5, currentStep: 5 },
  { id: "w-2", name: "Inbox Triage", tenantSlug: "demo", status: "running", startedAt: "2026-05-18T09:15:00Z", durationMs: null, steps: 4, currentStep: 2 },
  { id: "w-3", name: "Travel Booking — Tokyo", tenantSlug: "demo", status: "queued", startedAt: "2026-05-18T10:00:00Z", durationMs: null, steps: 6, currentStep: 0 },
  { id: "w-4", name: "Weekly Report Generation", tenantSlug: "demo", status: "failed", startedAt: "2026-05-17T18:00:00Z", durationMs: 12000, steps: 3, currentStep: 2 },
];

export const providers: ProviderRow[] = [
  { id: "p-1", name: "Google Workspace", kind: "oauth", tenantSlug: "demo", connected: true, lastSync: "3 min ago", errorCount: 0 },
  { id: "p-2", name: "Slack", kind: "oauth", tenantSlug: "demo", connected: true, lastSync: "1 min ago", errorCount: 0 },
  { id: "p-3", name: "Linear", kind: "api_key", tenantSlug: "demo", connected: false, lastSync: null, errorCount: 0 },
  { id: "p-4", name: "Notion", kind: "oauth", tenantSlug: "demo", connected: true, lastSync: "12 min ago", errorCount: 2 },
];

export const gbrainStatus: GBrainStatus = {
  indexedDocs: 847,
  lastIndexAt: "2026-05-18T08:45:00Z",
  vectorCount: 23412,
  queryLatencyP50Ms: 42,
  queryLatencyP99Ms: 180,
  status: "healthy",
};

export const artifactQueue: ArtifactQueueRow[] = [
  { id: "aq-1", title: "Weekly Strategy Brief", kind: "brief", tenantSlug: "demo", agentName: "Khadijah", status: "final", createdAt: "2026-05-18T08:30:00Z" },
  { id: "aq-2", title: "Tokyo Flight Options", kind: "itinerary", tenantSlug: "demo", agentName: "Sinclair", status: "draft", createdAt: "2026-05-18T09:00:00Z" },
  { id: "aq-3", title: "Q2 Market Analysis", kind: "report", tenantSlug: "demo", agentName: "Kyle", status: "draft", createdAt: "2026-05-18T07:15:00Z" },
  { id: "aq-4", title: "Brand Guidelines v2", kind: "memo", tenantSlug: "demo", agentName: "Maxine", status: "approved", createdAt: "2026-05-17T16:00:00Z" },
];

export const approvalQueue: ApprovalQueueRow[] = [
  { id: "ap-1", title: "Send investor update email", tenantSlug: "demo", agentName: "Khadijah", urgency: "high", createdAt: "2026-05-18T09:00:00Z", status: "pending" },
  { id: "ap-2", title: "Book ANA flight to Tokyo", tenantSlug: "demo", agentName: "Sinclair", urgency: "medium", createdAt: "2026-05-18T09:10:00Z", status: "pending" },
  { id: "ap-3", title: "Publish blog post draft", tenantSlug: "demo", agentName: "Maxine", urgency: "low", createdAt: "2026-05-18T08:45:00Z", status: "pending" },
];

export const logs: LogEntry[] = [
  { id: "l-1", timestamp: "2026-05-18T09:15:32Z", level: "info", service: "orchestrator", message: "Workflow 'Inbox Triage' started for tenant demo" },
  { id: "l-2", timestamp: "2026-05-18T09:15:01Z", level: "warn", service: "provider-sync", message: "Notion rate limit hit — backing off 30s (tenant demo)" },
  { id: "l-3", timestamp: "2026-05-18T09:14:45Z", level: "error", service: "agent-runtime", message: "Agent Maxine failed health check — restarting (tenant demo)" },
  { id: "l-4", timestamp: "2026-05-18T09:10:00Z", level: "info", service: "approval-engine", message: "Approval ap-2 created: Book ANA flight to Tokyo" },
  { id: "l-5", timestamp: "2026-05-18T09:05:22Z", level: "info", service: "artifact-pipeline", message: "Artifact aq-2 generated: Tokyo Flight Options (draft)" },
  { id: "l-6", timestamp: "2026-05-18T08:45:00Z", level: "info", service: "gbrain", message: "Index refresh completed — 847 docs, 23412 vectors" },
  { id: "l-7", timestamp: "2026-05-18T08:30:00Z", level: "info", service: "artifact-pipeline", message: "Artifact aq-1 finalized: Weekly Strategy Brief" },
  { id: "l-8", timestamp: "2026-05-18T08:00:05Z", level: "info", service: "orchestrator", message: "Workflow 'Morning Standup' completed in 45s" },
];
