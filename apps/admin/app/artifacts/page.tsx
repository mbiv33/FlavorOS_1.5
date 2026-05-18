import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MetricCard } from "../components/ui/MetricCard";
import { artifactQueue } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Artifact queue — FlavorOS Admin",
};

export default function ArtifactsPage() {
  const drafts = artifactQueue.filter((a) => a.status === "draft").length;
  const finals = artifactQueue.filter((a) => a.status === "final").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Artifact queue"
        description="Pending renders, checksum validation, and publishing gates."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Total" value={artifactQueue.length} />
        <MetricCard label="Drafts" value={drafts} />
        <MetricCard label="Finalized" value={finals} />
        <MetricCard label="Approved" value={artifactQueue.filter((a) => a.status === "approved").length} />
      </div>

      <DataTable headers={["Title", "Kind", "Agent", "Tenant", "Status", "Created"]}>
        {artifactQueue.map((a) => (
          <tr key={a.id}>
            <td className="px-5 py-3 font-medium">{a.title}</td>
            <td className="px-5 py-3 capitalize">{a.kind}</td>
            <td className="px-5 py-3">{a.agentName}</td>
            <td className="px-5 py-3 font-mono text-xs">{a.tenantSlug}</td>
            <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
            <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400 text-xs">
              {new Date(a.createdAt).toLocaleString()}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
