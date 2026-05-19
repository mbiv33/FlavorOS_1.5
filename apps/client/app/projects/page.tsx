import type { Metadata } from "next";

import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { projects } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Projects — FlavorOS Client",
};

export default function ProjectsPage() {
  const active = projects.filter((p) => p.status === "active");
  const other = projects.filter((p) => p.status !== "active");

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Workstreams, milestones, and artifact-linked execution.
        </p>
      </div>

      <section className="space-y-4">
        <SectionHeader title="Active" count={active.length} />
        <div className="space-y-3">
          {active.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  <StatusChip status={p.status} />
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Lead agent: {p.agentName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-28 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-neutral-900 transition-all dark:bg-white"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-neutral-500">
                  {p.progress}%
                </span>
                <button className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {other.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Paused & Completed" count={other.length} />
          <div className="space-y-3">
            {other.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 opacity-60 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <StatusChip status={p.status} />
                  </div>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    via {p.agentName} · {p.progress}% complete
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
