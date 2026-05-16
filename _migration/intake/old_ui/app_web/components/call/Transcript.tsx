"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { TranscriptLine } from "@/lib/types/call";

const SPEAKER_LABEL: Record<string, string> = {
  khadijah: "K",
  sinclair: "S",
  user: "Y",
};

const SPEAKER_CLASS: Record<string, string> = {
  khadijah: "text-kha",
  sinclair: "text-sin",
  user: "text-accent",
};

/**
 * Live, auto-scrolling transcript. Speaker prefixes are bold and color-coded
 * by persona; Sinclair's note-taking renders muted with brackets; captured
 * decisions get the green accent strip (PRD 05 §Live transcript).
 */
export function Transcript({ lines }: { lines: TranscriptLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [lines.length]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <h3 className="m-0 mb-2.5 text-[12px] text-ink-3 font-bold uppercase tracking-[0.08em]">
        Live transcript
      </h3>
      <div
        ref={ref}
        className="flex-1 overflow-y-auto bg-[rgba(250,247,255,0.5)] border border-line rounded-xl px-4 py-4 text-[13.5px] leading-relaxed"
      >
        {lines.map((l) => {
          if (l.kind === "decision") {
            return (
              <div
                key={l.id}
                className="my-1.5 px-2.5 py-1 bg-[rgba(63,154,126,0.06)] border-l-2 border-max text-ink font-medium"
              >
                ✓ {l.text}
              </div>
            );
          }
          if (l.kind === "note") {
            return (
              <div
                key={l.id}
                className="text-ink-3 italic text-[12.5px] pl-6 py-1"
              >
                {SPEAKER_LABEL[l.speaker] ?? "?"}: [{l.text}]
              </div>
            );
          }
          return (
            <div key={l.id} className="py-1 text-ink">
              <span className={cn("font-bold mr-1.5", SPEAKER_CLASS[l.speaker])}>
                {SPEAKER_LABEL[l.speaker] ?? "?"}:
              </span>
              {l.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
