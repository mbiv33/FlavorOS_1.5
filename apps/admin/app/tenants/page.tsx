import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MetricCard } from "../components/ui/MetricCard";
import { tenants } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Tenant monitor — FlavorOS Admin",
};

export default function TenantsPage() {
  const totalUsers = tenants.reduce((s, t) => s + t.users, 0);
  const totalAgents = tenants.reduce((s, t) => s + t.agents, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tenant monitor"
        description="Isolation posture, quotas, and tenant-level health."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Tenants" value={tenants.length} />
        <MetricCard label="Total users" value={totalUsers} />
        <MetricCard label="Total agents" value={totalAgents} />
        <MetricCard
          label="Healthy"
          value={tenants.filter((t) => t.status === "healthy").length}
          sub={`of ${tenants.length}`}
        />
      </div>

      <DataTable headers={["Slug", "Name", "Plan", "Users", "Agents", "Status", "Last activity"]}>
        {tenants.map((t) => (
          <tr key={t.id}>
            <td className="px-5 py-3 font-mono text-xs">{t.slug}</td>
            <td className="px-5 py-3">{t.name}</td>
            <td className="px-5 py-3 capitalize">{t.plan}</td>
            <td className="px-5 py-3 tabular-nums">{t.users}</td>
            <td className="px-5 py-3 tabular-nums">{t.agents}</td>
            <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
            <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">{t.lastActivity}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
