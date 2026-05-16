"use client";

import { useThreadsStore } from "@/lib/state/threads";
import { useVoiceStore } from "@/lib/state/voice";
import { THREADS } from "@/lib/mock/threads";
import { PERSONAS } from "@/lib/types/persona";
import { cn } from "@/lib/cn";

/**
 * Voice orb above the composer. Color tints by active thread's persona
 * (PRD 06 §Color-coding by active thread).
 */
export function VoiceOrb() {
  const active = useThreadsStore((s) => s.active);
  const voice = useVoiceStore((s) => s.state);
  const thread = THREADS.find((t) => t.id === active)!;
  const targetLabel =
    thread.personas.length === 1 ? PERSONAS[thread.personas[0]].name : "Group";

  const orbBg =
    active === "khadijah"
      ? "from-kha to-[#b04632]"
      : active === "sinclair"
        ? "from-sin to-[#a87a1f]"
        : "from-kha to-kyl";

  return (
    <div className="w-full flex items-center gap-2.5 px-3 py-2 bg-card-solid border border-line rounded-full text-ink-3 text-[12.5px] mb-2">
      <span
        aria-hidden
        className={cn(
          "w-[22px] h-[22px] rounded-full bg-gradient-to-br shadow-[0_0_0_2px_rgba(91,70,214,0.1)]",
          orbBg,
          voice === "listening" && "animate-pulse",
        )}
      />
      <span className="truncate">
        {voice === "listening"
          ? "Listening…"
          : voice === "processing"
            ? "Thinking…"
            : "Voice idle"}{" "}
        · talking to <strong className="text-ink">{targetLabel}</strong>
      </span>
      <span className="ml-auto">
        <span className="kbd">space</span> to talk
      </span>
    </div>
  );
}
