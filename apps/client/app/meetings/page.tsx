import type { Metadata } from "next";

import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { meetings } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Meetings — FlavorOS Client",
};

export default function MeetingsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Agenda preparation, live notes, and follow-ups.
        </p>
      </div>

      <section className="space-y-4">
        <SectionHeader title="Today" count={meetings.length} />
        <div className="space-y-3">
          {meetings.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {m.time}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">{m.title}</h3>
                  <StatusChip status={m.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {m.participants.join(", ")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    m.prepReady
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {m.prepReady ? "Prep ready" : "Prepping…"}
                </span>
                <button className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
