"use client";

import { useCallStore } from "@/lib/state/call";
import { useVoiceStore } from "@/lib/state/voice";
import { cn } from "@/lib/cn";

/**
 * Slot 6 of the header. Reflects the live voice state — and switches to
 * "Live · briefing" when the Call Surface is active.
 */
export function VoiceChip() {
  const callActive = useCallStore((s) => !!s.call);
  const state = useVoiceStore((s) => s.state);

  const live = callActive;
  const label = live
    ? "● Live · briefing"
    : state === "listening"
      ? "Listening…"
      : state === "processing"
        ? "Thinking…"
        : "Voice idle";

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12.5px] font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        live
          ? "bg-[rgba(196,99,46,0.08)] text-warn border-[rgba(196,99,46,0.2)]"
          : "bg-card-solid text-ink-2 border-line hover:border-line-2",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "w-[7px] h-[7px] rounded-full",
          live ? "bg-warn animate-pulse" : "bg-ink-3",
        )}
      />
      {label}
    </button>
  );
}
