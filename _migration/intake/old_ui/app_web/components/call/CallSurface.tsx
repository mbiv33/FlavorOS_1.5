"use client";

import { PairAvatar, PersonaAvatar } from "@/components/primitives/Avatar";
import { SpeakerOrb } from "./SpeakerOrb";
import { AgendaChecklist } from "./AgendaChecklist";
import { Transcript } from "./Transcript";
import { QuickReply } from "./QuickReply";
import { CallControls } from "./CallControls";
import { useCallStore } from "@/lib/state/call";
import { PERSONAS } from "@/lib/types/persona";

/**
 * Full Call Surface. PRD 05. Renders only when a call is active. Spans the
 * center + right-rail columns; the right rail is hidden by ShellContent
 * during a call. Focus is the value — no other interaction surfaces during
 * a call.
 */
export function CallSurface() {
  const call = useCallStore((s) => s.call);
  if (!call) return null;

  return (
    <section
      className="bg-card-solid border border-line rounded-[22px] overflow-hidden shadow-md2 flex flex-col min-h-[calc(100vh-116px)]"
      aria-label={call.label}
    >
      <header
        className="flex items-center gap-3.5 px-6 py-4 border-b border-line"
        style={{
          background:
            "linear-gradient(135deg, rgba(228,103,78,0.06), rgba(217,162,50,0.05))",
        }}
      >
        <span
          aria-hidden
          className="w-2.5 h-2.5 rounded-full bg-warn animate-pulse"
        />
        {call.hosts.length >= 2 ? (
          <PairAvatar
            personas={[PERSONAS[call.hosts[0]], PERSONAS[call.hosts[1]]]}
            size="md"
          />
        ) : (
          <PersonaAvatar persona={PERSONAS[call.hosts[0]]} size="md" />
        )}
        <div className="text-[17px] font-bold tracking-tight">{call.label}</div>
        <div className="ml-auto text-[13px] text-ink-3">
          {call.paused ? "Paused" : "Live"} · {formatElapsed(call.elapsedSeconds)}
        </div>
      </header>

      <div
        className="grid flex-1 min-h-0"
        style={{ gridTemplateColumns: "320px minmax(0,1fr)" }}
      >
        <aside
          className="border-r border-line p-6 flex flex-col gap-6 bg-[rgba(250,247,255,0.4)]"
        >
          <SpeakerOrb speaking={call.speaking} />
          <AgendaChecklist items={call.agenda} />
          <CallControls />
        </aside>

        <main className="p-6 flex flex-col min-h-0">
          <Transcript lines={call.transcript} />
          <QuickReply />
        </main>
      </div>
    </section>
  );
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
