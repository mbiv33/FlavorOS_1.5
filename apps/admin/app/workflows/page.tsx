import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MetricCard } from "../components/ui/MetricCard";
import { workflows } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Workflow monitor — FlavorOS Admin",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function WorkflowsPage() {
  const running = workflows.filter((w) => w.status === "running").length;
  const failed = workflows.filter((w) => w.status === "failed").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workflow monitor"
        description="DAG runs, retries, dead-letter queues, and SLA breaches."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Total runs" value={workflows.length} />
        <MetricCard label="Running" value={running} />
        <MetricCard label="Failed" value={failed} />
        <MetricCard label="Queued" value={workflows.filter((w) => w.status === "queued").length} />
      </div>

      <DataTable headers={["Name", "Tenant", "Status", "Progress", "Duration", "Started"]}>
        {workflows.map((w) => (
          <tr key={w.id}>
            <td className="px-5 py-3 font-medium">{w.name}</td>
            <td className="px-5 py-3 font-mono text-xs">{w.tenantSlug}</td>
            <td className="px-5 py-3"><StatusBadge status={w.status} /></td>
            <td className="px-5 py-3 tabular-nums">{w.currentStep}/{w.steps}</td>
            <td className="px-5 py-3 tabular-nums">{formatDuration(w.durationMs)}</td>
            <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400 text-xs">
              {new Date(w.startedAt).toLocaleString()}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
