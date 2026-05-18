import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MetricCard } from "../components/ui/MetricCard";
import { agents } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Agent monitor — FlavorOS Admin",
};

export default function AgentsPage() {
  const running = agents.filter((a) => a.status === "running").length;
  const totalTasks = agents.reduce((s, a) => s + a.tasksToday, 0);
  const avgLatency = Math.round(
    agents.filter((a) => a.avgLatencyMs > 0).reduce((s, a) => s + a.avgLatencyMs, 0) /
      agents.filter((a) => a.avgLatencyMs > 0).length
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agent monitor"
        description="Live agent sessions, tool latencies, and failure taxonomy."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Total agents" value={agents.length} />
        <MetricCard label="Running" value={running} />
        <MetricCard label="Tasks today" value={totalTasks} />
        <MetricCard label="Avg latency" value={`${avgLatency}ms`} sub="p50 across active" />
      </div>

      <DataTable headers={["Name", "Role", "Tenant", "Status", "Tasks today", "Avg latency"]}>
        {agents.map((a) => (
          <tr key={a.id}>
            <td className="px-5 py-3 font-medium">{a.name}</td>
            <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">{a.role}</td>
            <td className="px-5 py-3 font-mono text-xs">{a.tenantSlug}</td>
            <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
            <td className="px-5 py-3 tabular-nums">{a.tasksToday}</td>
            <td className="px-5 py-3 tabular-nums">{a.avgLatencyMs > 0 ? `${a.avgLatencyMs}ms` : "—"}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
