"use client";

import { Card } from "@/components/primitives/Card";
import { usePendingCount } from "@/lib/state/approvals";
import { MOCK_TRIAGE_SUMMARY } from "@/lib/mock/messages";
import { cn } from "@/lib/cn";

/**
 * Triage summary block. Maps directly to the Universal Inbox Ingestion
 * protocol's Summary block (PRD 04 §4.4). The "ready for you" count is
 * pulled from the live approvals store so it stays accurate as the client
 * acts on cards.
 */
export function TriageSummary() {
  const summary = MOCK_TRIAGE_SUMMARY;
  const pendingNow = usePendingCount();

  return (
    <Card className="p-5 mb-3.5">
      <h2 className="m-0 mb-1 text-[17px] font-bold">
        {summary.total} items came in. {pendingNow} {pendingNow === 1 ? "needs" : "need"} you.
      </h2>
      <div className="text-[12.5px] text-ink-3">
        Sinclair last triaged {summary.triagedLabel} · auto-refreshes every 15 min
      </div>
      <div className="flex flex-wrap gap-2 mt-3.5">
        {summary.breakdown.map((row) => (
          <div
            key={row.id}
            className={cn(
              "inline-flex flex-col px-3.5 py-2.5 rounded-[10px] border min-w-[120px]",
              row.alert
                ? "bg-[rgba(91,70,214,0.08)] border-[rgba(91,70,214,0.2)]"
                : "bg-[rgba(91,70,214,0.05)] border-[rgba(91,70,214,0.12)]",
            )}
          >
            <span
              className={cn(
                "text-[18px] font-bold",
                row.alert ? "text-accent" : "text-ink",
              )}
            >
              {row.id === "ready" ? pendingNow : row.count}
            </span>
            <span className="text-[11.5px] text-ink-3 font-medium">{row.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
