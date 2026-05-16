import Link from "next/link";
import { ContextSelector } from "./ContextSelector";
import { NeedsYouChip } from "./NeedsYouChip";
import { VoiceChip } from "./VoiceChip";
import { CommandKChip } from "./CommandKChip";
import { getContexts } from "@/lib/mock/profile";

/**
 * Sticky header. 8 slots per PRD 02 §Header strip.
 * Slot 7 (system alert) only renders when something is wrong — left out
 * entirely until alerts wire up.
 */
export function Header() {
  const contexts = getContexts();

  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div
        className="grid items-center gap-6 px-7 py-3.5"
        style={{ gridTemplateColumns: "260px 1fr auto" }}
      >
        {/* Slot 1 — Wordmark */}
        <Link href="/" className="flex items-center gap-2 no-underline text-ink">
          <span
            aria-hidden
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-kha to-kyl"
          />
          <span className="font-extrabold text-[17px] tracking-tight">
            Flavor<span className="text-ink-3 font-bold">OS</span>
          </span>
        </Link>

        {/* Slots 2 + 3 — Context selector + next-event line */}
        <div className="flex items-center gap-3.5 min-w-0">
          <ContextSelector contexts={contexts} />
          <NextEventLine />
        </div>

        {/* Slots 4–6 + 8 — wellness, needs-you, voice, ⌘K */}
        <div className="flex items-center gap-2">
          <WellnessChip />
          <NeedsYouChip />
          <VoiceChip />
          <CommandKChip />
        </div>
      </div>
    </header>
  );
}

function NextEventLine() {
  return (
    <span className="text-[13.5px] text-ink-2 truncate">
      Next: <strong className="text-ink font-semibold">10am NTC standup</strong>
      {" "}— in 24 min
    </span>
  );
}

function WellnessChip() {
  return (
    <span
      role="img"
      aria-label="Wellness: steady"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border bg-card-solid text-ink-2 border-line text-[12.5px] font-medium"
    >
      <span className="w-[7px] h-[7px] rounded-full bg-ok" aria-hidden />
      steady
    </span>
  );
}
