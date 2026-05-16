import { cn } from "@/lib/cn";
import type { PersonaId } from "@/lib/types/persona";

/**
 * The big orb on the call surface. Color encodes who is speaking
 * (Khadijah = coral, Sinclair = gold). PRD 05.
 */
export function SpeakerOrb({ speaking }: { speaking?: PersonaId }) {
  const palette =
    speaking === "sinclair"
      ? "from-sin to-[#a87a1f] shadow-[0_0_0_4px_rgba(217,162,50,0.18),0_0_0_12px_rgba(217,162,50,0.06)]"
      : "from-kha to-[#b04632] shadow-[0_0_0_4px_rgba(228,103,78,0.18),0_0_0_12px_rgba(228,103,78,0.06)]";
  return (
    <div className="flex flex-col items-center gap-2.5 py-3.5">
      <div
        className={cn(
          "w-[90px] h-[90px] rounded-full bg-gradient-to-br animate-orbPulse",
          palette,
        )}
        aria-hidden
      />
      <div className="text-[12px] text-ink-3">
        Speaking:{" "}
        <strong className="text-ink font-bold capitalize">
          {speaking ?? "—"}
        </strong>
      </div>
    </div>
  );
}
