import { ApiStatus } from "./components/ApiStatus";
import { LaunchCard } from "./components/ui/LaunchCard";
import { ApprovalCard } from "./components/ui/ApprovalCard";
import { SectionHeader } from "./components/ui/SectionHeader";
import { StatusChip } from "./components/ui/StatusChip";
import {
  briefings,
  meetings,
  approvals,
  projects,
} from "../lib/demo";

export default function Home() {
  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Command Center
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Your day at a glance — briefings, meetings, approvals, and open loops.
        </p>
      </div>

      {/* Today's Briefings */}
      <section className="space-y-4">
        <SectionHeader
          title="Briefings"
          count={briefings.length}
          description="Agent-generated summaries for your day."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {briefings.map((b) => (
            <LaunchCard
              key={b.id}
              title={b.title}
              subtitle={b.summary}
              status={b.status}
              agent={b.agentName}
              action="View"
            />
          ))}
        </div>
      </section>

      {/* Upcoming Meetings */}
      <section className="space-y-4">
        <SectionHeader
          title="Meetings"
          count={meetings.length}
          description="Today's schedule with prep status."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetings.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-tight">
                  {m.title}
                </h3>
                <StatusChip status={m.status} />
              </div>
              <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                <p>{m.time}</p>
                <p>{m.participants.join(", ")}</p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    m.prepReady
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {m.prepReady ? "Prep ready" : "Prep in progress"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Needs Your Approval"
            count={pendingApprovals.length}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingApprovals.map((a) => (
              <ApprovalCard
                key={a.id}
                title={a.title}
                kind={a.kind}
                initialStatus={a.status}
                agent={a.agentName}
                summary={a.summary}
              />
            ))}
          </div>
        </section>
      )}

      {/* Active Projects */}
      <section className="space-y-4">
        <SectionHeader
          title="Active Projects"
          count={projects.filter((p) => p.status === "active").length}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {projects
            .filter((p) => p.status === "active")
            .map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    via {p.agentName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div
                      className="h-full rounded-full bg-neutral-900 dark:bg-white"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-neutral-500">
                    {p.progress}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* API Connectivity */}
      <section className="space-y-4">
        <SectionHeader title="System Status" />
        <ApiStatus />
      </section>
    </div>
  );
}
