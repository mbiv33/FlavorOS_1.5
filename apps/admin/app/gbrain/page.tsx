import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";
import { MetricCard } from "../components/ui/MetricCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { gbrainStatus } from "../../lib/demo";

export const metadata: Metadata = {
  title: "GBrain status — FlavorOS Admin",
};

export default function GbrainPage() {
  const s = gbrainStatus;

  return (
    <div className="space-y-8">
      <PageHeader
        title="GBrain status"
        description="Knowledge index health, vector counts, and query latency. Not wired in-repo yet — continue using machine-local GBrain CLI/MCP."
      />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
          Index health
        </span>
        <StatusBadge status={s.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Indexed docs" value={s.indexedDocs.toLocaleString()} />
        <MetricCard label="Vectors" value={s.vectorCount.toLocaleString()} />
        <MetricCard label="Query P50" value={`${s.queryLatencyP50Ms}ms`} />
        <MetricCard label="Query P99" value={`${s.queryLatencyP99Ms}ms`} />
        <MetricCard
          label="Last index"
          value={new Date(s.lastIndexAt).toLocaleTimeString()}
          sub={new Date(s.lastIndexAt).toLocaleDateString()}
        />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">
          Integration notes
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
          <li>GBrain runs as a machine-local CLI/MCP sidecar</li>
          <li>Index refresh triggered by <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">/sync-gbrain</code></li>
          <li>In-repo runtime ownership deferred per architecture docs</li>
          <li>Adapter contract defined in integration-boundaries milestone</li>
        </ul>
      </div>
    </div>
  );
}
