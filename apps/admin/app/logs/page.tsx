import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";
import { MetricCard } from "../components/ui/MetricCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { logs } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Logs — FlavorOS Admin",
};

const LEVEL_DOT: Record<string, string> = {
  error: "bg-red-500",
  warn: "bg-amber-500",
  info: "bg-emerald-500",
};

export default function LogsPage() {
  const errors = logs.filter((l) => l.level === "error").length;
  const warnings = logs.filter((l) => l.level === "warn").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="System logs"
        description="Structured log stream with severity filtering across all services."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Total entries" value={logs.length} />
        <MetricCard label="Errors" value={errors} />
        <MetricCard label="Warnings" value={warnings} />
        <MetricCard label="Info" value={logs.filter((l) => l.level === "info").length} />
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${LEVEL_DOT[log.level] ?? "bg-neutral-400"}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-neutral-700 dark:text-neutral-300 break-words">
                {log.message}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                {log.timestamp}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                {log.service}
              </span>
              <StatusBadge status={log.level} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
