import type { Metadata } from "next";

import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { comms } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Comms & Calendar — FlavorOS Client",
};

const channelIcons: Record<string, string> = {
  email: "✉️",
  slack: "💬",
  sms: "📱",
  calendar: "📅",
};

export default function CommsPage() {
  const untriaged = comms.filter((c) => !c.triaged);
  const triaged = comms.filter((c) => c.triaged);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Comms & Calendar
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Unified threads, inbox triage, and schedule-aware orchestration.
        </p>
      </div>

      {untriaged.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Needs Attention"
            count={untriaged.length}
            description="Items your agents flagged for review."
          />
          <div className="space-y-3">
            {untriaged.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="text-lg">
                  {channelIcons[c.channel] ?? "📨"}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{c.subject}</h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    from {c.sender} · {c.channel}
                  </p>
                </div>
                <StatusChip status={c.priority} />
              </div>
            ))}
          </div>
        </section>
      )}

      {triaged.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Triaged" count={triaged.length} />
          <div className="space-y-3">
            {triaged.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 opacity-70 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="text-lg">
                  {channelIcons[c.channel] ?? "📨"}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{c.subject}</h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    from {c.sender} · {c.channel}
                  </p>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Handled
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
