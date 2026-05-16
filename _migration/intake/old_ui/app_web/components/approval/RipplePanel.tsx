import type { RippleNote } from "@/lib/types/approval";

/**
 * Ripple panel — only renders when the underlying skill flagged non-trivial
 * downstream impact. Empty ripples must not render an empty container.
 */
export function RipplePanel({ note }: { note: RippleNote }) {
  return (
    <div
      className="mx-4 mb-3 px-3 py-2.5 rounded-[10px] text-[12.5px] text-ink-2"
      style={{
        background: "rgba(196,99,46,0.05)",
        border: "1px solid rgba(196,99,46,0.18)",
      }}
    >
      <span className="block mb-1 text-[11px] font-bold text-warn uppercase tracking-[0.06em]">
        Ripple
      </span>
      {note.text}
    </div>
  );
}
