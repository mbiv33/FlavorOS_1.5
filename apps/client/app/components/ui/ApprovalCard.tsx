"use client";

import { useState } from "react";
import { StatusChip } from "./StatusChip";

const kindLabels: Record<string, string> = {
  send: "Send",
  book: "Book",
  publish: "Publish",
  expense: "Expense",
  schedule: "Schedule",
};

export function ApprovalCard({
  title,
  kind,
  initialStatus,
  agent,
  summary,
}: {
  title: string;
  kind: string;
  initialStatus: string;
  agent: string;
  summary: string;
}) {
  const [status, setStatus] = useState(initialStatus);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {kindLabels[kind] ?? kind} · via {agent}
          </span>
        </div>
        <StatusChip status={status} />
      </div>
      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        {summary}
      </p>
      {status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => setStatus("approved")}
            className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Approve
          </button>
          <button
            onClick={() => setStatus("rejected")}
            className="rounded-lg border border-neutral-300 px-3.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
