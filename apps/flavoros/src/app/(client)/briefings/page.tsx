"use client";

import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { LaunchCard } from "@/components/LaunchCard";
import { useBriefingsData } from "@/lib/hooks/useBriefingsData";
import type { BriefingPreparedStatus } from "@/lib/briefings-config";

function preparedStatusLabel(status: BriefingPreparedStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "not_prepared":
      return "Not prepared";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

export default function BriefingsIndex() {
  const { briefings, loading, error } = useBriefingsData();

  return (
    <>
      <Header
        title="Briefings"
        nextFocus="Scheduled and on-demand structured sessions"
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          {error ? (
            <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : loading ? (
            <p className="text-sm text-muted">Loading briefings…</p>
          ) : (
            <Zone title="Today">
              {briefings.map((b) => (
                <LaunchCard
                  key={b.type}
                  title={b.title}
                  meta={b.direction}
                  statusLine={`${preparedStatusLabel(b.preparedStatus)} · ${b.scheduledFor}${
                    b.approvalCount > 0
                      ? ` · ${b.approvalCount} pending approval${b.approvalCount === 1 ? "" : "s"}`
                      : ""
                  }`}
                  primaryHref={`/briefings/${b.type}`}
                  primaryLabel="Open"
                />
              ))}
            </Zone>
          )}
        </div>
      </div>
    </>
  );
}
