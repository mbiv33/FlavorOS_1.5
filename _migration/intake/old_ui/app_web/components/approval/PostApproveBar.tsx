"use client";

interface PostApproveBarProps {
  text: string;
  onPullBack: () => void;
}

/**
 * Visible right after Approve. Honors the protocol-driven scheduling text
 * (e.g. "sending in next batch (4:00 PM)"). Pull-back lets the client reverse
 * during the window. PRD 03 §Post-approve state.
 */
export function PostApproveBar({ text, onPullBack }: PostApproveBarProps) {
  return (
    <div
      className="px-4 py-3 flex items-center gap-2 text-[13px] font-semibold text-max"
      style={{
        background: "rgba(63,154,126,0.06)",
        borderTop: "1px solid rgba(63,154,126,0.15)",
      }}
    >
      <span
        aria-hidden
        className="w-[18px] h-[18px] rounded-full bg-max text-white grid place-items-center text-[10px] flex-shrink-0"
      >
        ✓
      </span>
      <span className="truncate">{text}</span>
      <button
        type="button"
        onClick={onPullBack}
        className="ml-auto text-[12px] font-medium text-ink-3 underline hover:text-ink-2"
      >
        Pull back
      </button>
    </div>
  );
}
