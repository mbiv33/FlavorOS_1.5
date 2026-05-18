import type { Metadata } from "next";

import { LaunchCard } from "../components/ui/LaunchCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { briefings } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Briefings — FlavorOS Client",
};

export default function BriefingsPage() {
  const delivered = briefings.filter((b) => b.status === "delivered");
  const inProgress = briefings.filter(
    (b) => b.status === "generating" || b.status === "ready",
  );

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Briefings</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Agent-generated summaries and contextual brief packs.
        </p>
      </div>

      {delivered.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Delivered" count={delivered.length} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {delivered.map((b) => (
              <LaunchCard
                key={b.id}
                title={b.title}
                subtitle={b.summary}
                status={b.status}
                agent={b.agentName}
                action="Read"
              />
            ))}
          </div>
        </section>
      )}

      {inProgress.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Queued & Generating" count={inProgress.length} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((b) => (
              <LaunchCard
                key={b.id}
                title={b.title}
                subtitle={b.summary}
                status={b.status}
                agent={b.agentName}
                action={b.status === "generating" ? "Generating…" : "Launch"}
              />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Request a new briefing from any agent — morning standup, travel prep,
          project deep-dive.
        </p>
        <button className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
          New Briefing
        </button>
      </section>
    </div>
  );
}
