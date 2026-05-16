import { Threads } from "@/components/rail/Threads";
import { VoiceOrb } from "@/components/rail/VoiceOrb";
import { Composer } from "@/components/rail/Composer";
import { cn } from "@/lib/cn";

/**
 * Right rail — three threads, voice orb, single composer. Always present
 * except during the Call Surface (which takes over via ShellContent).
 */
export function RightRail() {
  return (
    <aside
      className={cn(
        "self-start sticky top-[76px]",
        "h-[calc(100vh-96px)]",
        "flex flex-col overflow-hidden",
        "bg-card border border-line rounded-[18px] backdrop-blur-md shadow-sm2",
      )}
      aria-label="Persistent chat"
    >
      <div className="px-4 py-3 border-b border-line text-[12px] text-ink-3 font-semibold uppercase tracking-[0.06em]">
        Persistent chat · 3 threads
      </div>
      <Threads />
      <div className="border-t border-line p-2.5 bg-[rgba(255,255,255,0.6)]">
        <VoiceOrb />
        <Composer />
      </div>
    </aside>
  );
}
