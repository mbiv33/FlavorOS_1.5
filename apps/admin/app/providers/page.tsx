import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MetricCard } from "../components/ui/MetricCard";
import { providers } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Provider sync — FlavorOS Admin",
};

export default function ProvidersPage() {
  const connected = providers.filter((p) => p.connected).length;
  const totalErrors = providers.reduce((s, p) => s + p.errorCount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Provider sync status"
        description="OAuth renewals, webhook health, and integration-specific backpressure."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Providers" value={providers.length} />
        <MetricCard label="Connected" value={connected} sub={`of ${providers.length}`} />
        <MetricCard label="Disconnected" value={providers.length - connected} />
        <MetricCard label="Total errors" value={totalErrors} />
      </div>

      <DataTable headers={["Provider", "Kind", "Tenant", "Status", "Last sync", "Errors"]}>
        {providers.map((p) => (
          <tr key={p.id}>
            <td className="px-5 py-3 font-medium">{p.name}</td>
            <td className="px-5 py-3 font-mono text-xs">{p.kind}</td>
            <td className="px-5 py-3 font-mono text-xs">{p.tenantSlug}</td>
            <td className="px-5 py-3">
              <StatusBadge status={p.connected ? "connected" : "offline"} />
            </td>
            <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">
              {p.lastSync ?? "Never"}
            </td>
            <td className="px-5 py-3 tabular-nums">{p.errorCount}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
