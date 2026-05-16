"use client";

import { usePendingCount } from "@/lib/state/approvals";
import { cn } from "@/lib/cn";

/**
 * Slot 5 of the header. Hidden when there are no pending approvals
 * (PRD 02 §Header strip · slot 5).
 */
export function NeedsYouChip() {
  const pending = usePendingCount();
  if (pending === 0) return null;
  return (
    <button
      type="button"
      aria-label={`${pending} ready for you`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12.5px] font-medium",
        "bg-[rgba(91,70,214,0.07)] text-accent border-[rgba(91,70,214,0.2)]",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
      )}
    >
      <span
        aria-hidden
        className="w-[7px] h-[7px] rounded-full bg-accent animate-pulse"
      />
      {pending} ready for you
    </button>
  );
}
