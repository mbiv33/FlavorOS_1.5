import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MetricCard } from "../components/ui/MetricCard";
import { approvalQueue } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Approval queue — FlavorOS Admin",
};

export default function ApprovalsPage() {
  const pending = approvalQueue.filter((a) => a.status === "pending").length;
  const approved = approvalQueue.filter((a) => a.status === "approved").length;
  const rejected = approvalQueue.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approval queue"
        description="HITL decision pipeline: pending, approved, and rejected actions across all tenants."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Total" value={approvalQueue.length} />
        <MetricCard label="Pending" value={pending} />
        <MetricCard label="Approved" value={approved} />
        <MetricCard label="Rejected" value={rejected} />
      </div>

      <DataTable headers={["Action", "Agent", "Tenant", "Urgency", "Status", "Created"]}>
        {approvalQueue.map((a) => (
          <tr key={a.id}>
            <td className="px-5 py-3 font-medium">{a.title}</td>
            <td className="px-5 py-3">{a.agentName}</td>
            <td className="px-5 py-3 font-mono text-xs">{a.tenantSlug}</td>
            <td className="px-5 py-3"><StatusBadge status={a.urgency} /></td>
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
