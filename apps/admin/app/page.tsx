import { ApiStatus } from "./components/ApiStatus";
import { PageHeader } from "./components/ui/PageHeader";
import { MetricCard } from "./components/ui/MetricCard";
import { tenants, agents, workflows, approvalQueue, logs } from "../lib/demo";

export default function AdminHome() {
  const healthyTenants = tenants.filter((t) => t.status === "healthy").length;
  const activeAgents = agents.filter((a) => a.status === "running").length;
  const pendingApprovals = approvalQueue.filter((a) => a.status === "pending").length;
  const runningWorkflows = workflows.filter((w) => w.status === "running").length;
  const recentErrors = logs.filter((l) => l.level === "error").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin overview"
        description="Tenant health, agent throughput, and workflow SLAs at a glance."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Tenants" value={tenants.length} sub={`${healthyTenants} healthy`} />
        <MetricCard label="Active agents" value={activeAgents} sub={`of ${agents.length} total`} />
        <MetricCard label="Workflows" value={runningWorkflows} sub="running now" />
        <MetricCard label="Pending approvals" value={pendingApprovals} />
        <MetricCard label="Recent errors" value={recentErrors} sub="last hour" />
      </div>

      <ApiStatus />

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Recent activity
        </h2>
        <div className="space-y-2">
          {logs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span
                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  log.level === "error"
                    ? "bg-red-500"
                    : log.level === "warn"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
              />
              <span className="flex-1 text-neutral-700 dark:text-neutral-300">
                {log.message}
              </span>
              <span className="whitespace-nowrap text-xs text-neutral-400">
                {log.service}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
