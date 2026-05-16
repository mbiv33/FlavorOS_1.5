"use client";

import { useApprovalsStore } from "@/lib/state/approvals";
import { MOCK_OUTBOX } from "@/lib/mock/messages";

/**
 * Outbox indicator. Mirrors the email auto-responder protocol (PRD 07).
 * Each row exposes Pull-back to give the client a buffer before scheduled send.
 *
 * Pull-back walks each `ref` (an Approval id) back to "pending" via the
 * approvals store. Once all refs in a row are pulled, the row drops away.
 * If no rows remain, the entire Outbox card hides — silence equals working.
 */
export function Outbox() {
  const pullBack = useApprovalsStore((s) => s.pullBack);
  const approvals = useApprovalsStore((s) => s.approvals);

  // A row is live only if at least one of its refs is still in "approved" state.
  // Refs that point at approvals not in the store (or already pulled) are
  // ignored — protocol-driven rows like an outbox row that doesn't trace back
  // to an Approval still render (e.g., scheduled invoices outside the cards
  // demo).
  const rows = MOCK_OUTBOX.filter((row) => {
    if (!row.refs || row.refs.length === 0) return true;
    return row.refs.some((id) => {
      const a = approvals.find((x) => x.id === id);
      return !a || a.state === "approved";
    });
  });

  if (rows.length === 0) return null;

  return (
    <div
      className="rounded-card p-4 mb-4"
      style={{
        background: "rgba(63,154,126,0.04)",
        border: "1px solid rgba(63,154,126,0.18)",
      }}
    >
      <div className="flex items-center gap-2 text-[12px] text-max font-bold uppercase tracking-[0.06em] mb-2">
        <span aria-hidden>📤</span>
        Outbox · sending later
      </div>
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={`flex items-center justify-between gap-3 py-2 text-[13px] text-ink-2 ${i > 0 ? "border-t" : ""}`}
          style={i > 0 ? { borderTopColor: "rgba(63,154,126,0.1)" } : undefined}
        >
          <span className="min-w-0">
            <span className="text-ink font-semibold">{row.summary}</span>
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-max font-semibold text-[12.5px]">
              {row.scheduledLabel}
            </span>
            {row.refs && row.refs.length > 0 ? (
              <button
                type="button"
                onClick={() => row.refs?.forEach((id) => pullBack(id))}
                className="text-[12px] text-ink-3 underline hover:text-ink-2"
              >
                Pull back
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
