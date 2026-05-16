"use client";

import { useCallStore } from "@/lib/state/call";

const CHIPS: { label: string; primary?: boolean }[] = [
  { label: "Yes", primary: true },
  { label: "No" },
  { label: "Defer" },
  { label: "Skip · note for later" },
];

/**
 * Silent-mode chips (PRD 05 §Quick-reply chips). Tap === speaking — Khadijah
 * acknowledges and moves on. Stub implementation pushes the reply to the
 * transcript; the agenda transition would happen via the speaker turn.
 */
export function QuickReply() {
  const pushUserReply = useCallStore((s) => s.pushUserReply);
  return (
    <div className="mt-3.5 px-3.5 py-3 bg-[rgba(255,255,255,0.7)] border border-line rounded-xl">
      <div className="text-[11.5px] text-ink-3 font-semibold mb-2">
        Quick reply (when you can't talk):
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => pushUserReply(c.label)}
            className={`px-3.5 py-1.5 rounded-full border text-[13px] font-semibold cursor-pointer font-sans ${c.primary ? "bg-ink text-white border-ink" : "bg-card-solid text-ink border-line-2"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
