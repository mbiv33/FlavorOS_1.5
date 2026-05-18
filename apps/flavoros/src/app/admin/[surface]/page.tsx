import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardMeta, CardTitle } from "@/components/Card";

const SURFACES: Record<
  string,
  { title: string; subtitle: string; notes: string[] }
> = {
  tenants: {
    title: "Tenant Monitor",
    subtitle: "Tenants, clients, and isolation posture",
    notes: [
      "Lists tenants and clients with environment + isolation health.",
      "Drill-in shows client id, onboarding status, Client Universe readiness.",
      "Read-only at MVP — no tenant deletion from UI.",
    ],
  },
  providers: {
    title: "Provider Sync Status",
    subtitle: "Provider connection and sync health",
    notes: [
      "Per-connection state, last sync, last error, backlog size.",
      "Commands: retry sync, force reconnect, mark for follow-up.",
      "Source: provider_connections, provider_sync_events.",
    ],
  },
  workflows: {
    title: "Workflow Monitor",
    subtitle: "Active, failed, completed, and scheduled runs",
    notes: [
      "Per run: definition, client, current state, agent task tree.",
      "Linked artifacts and approvals.",
      "Admin-only error trace.",
    ],
  },
  agents: {
    title: "Agent Monitor",
    subtitle: "Khadijah, Sinclair, Regine activity",
    notes: [
      "Active task counts, failures, durations per agent.",
      "Drill-in surfaces full agent_task + agent_report envelopes.",
    ],
  },
  gbrain: {
    title: "GBrain Ingestion Status",
    subtitle: "Memory and context readiness",
    notes: [
      "Ingestion queue size, indexed counts, failures, retrieval health.",
      "Commands: retry ingestion, reindex client, open ingest log.",
    ],
  },
  artifacts: {
    title: "Artifact Queue",
    subtitle: "Cross-client artifact pipeline",
    notes: [
      "Drafts, pending review, approved/filed, SIGMA artifacts (admin-only).",
      "Per artifact: id, type, client, state, version, linked workflow run.",
    ],
  },
  approvals: {
    title: "Approval Queue",
    subtitle: "HITL state across clients",
    notes: [
      "Needs approval, approved (recent), failed execution, pulled back.",
      "Observability only — admin does not override client approvals here.",
    ],
  },
  logs: {
    title: "Logs",
    subtitle: "Audit-safe runtime events",
    notes: [
      "Filter by client, event type, severity, time range.",
      "Never displays secrets in plain text.",
    ],
  },
  config: {
    title: "Config Editor",
    subtitle: "Controlled configuration surface",
    notes: [
      "Editable: workflow flags, briefing/meeting flags, authority defaults, feature flags, persona pack assignments.",
      "Read-only: provider OAuth credentials, API keys, service tokens.",
      "Every edit writes an audit event.",
    ],
  },
};

export default async function AdminSurfacePage({
  params,
}: {
  params: Promise<{ surface: string }>;
}) {
  const { surface } = await params;
  const data = SURFACES[surface];
  if (!data) notFound();
  return (
    <>
      <Header title={data.title} nextFocus={data.subtitle} />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-3">
          <Card>
            <CardTitle>Specification</CardTitle>
            <CardMeta>
              See docs/ui/15-admin-console.md for the full spec. This screen is
              a scaffold; wiring lands as Phase 2/3 backend records appear.
            </CardMeta>
          </Card>
          {data.notes.map((n, i) => (
            <Card key={i}>
              <p className="text-sm">{n}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
