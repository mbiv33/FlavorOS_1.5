"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useThreadsStore } from "@/lib/state/threads";
import { THREADS } from "@/lib/mock/threads";
import { applyAction, resolvePhrase } from "@/lib/voice/phrases";

/**
 * Single global composer (PRD 06). Targets active thread; placeholder
 * adapts. ↵ sends, Shift+↵ inserts a newline.
 *
 * As a stub for voice transport: typing a slash command "/voice <phrase>"
 * routes through the voice phrase mapper instead of sending a chat message.
 * That keeps the voice action surface exercisable without a mic.
 */
export function Composer() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const active = useThreadsStore((s) => s.active);
  const send = useThreadsStore((s) => s.send);

  const placeholder =
    THREADS.find((t) => t.id === active)?.composerPlaceholder ?? "Type…";

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    if (text.startsWith("/voice ")) {
      const phrase = text.slice(7);
      const result = applyAction(resolvePhrase(phrase));
      send(`(voice) ${phrase} → ${result.label}`);
      if (result.navigate) router.push(result.navigate);
    } else {
      send(text);
    }
    setDraft("");
  };

  return (
    <div className="flex items-center gap-1.5 bg-card-solid border border-line rounded-xl px-2.5 py-2">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label="Compose message"
        className="flex-1 bg-transparent border-0 outline-none font-sans text-[13px] text-ink placeholder:text-ink-3"
      />
      <button
        type="button"
        onClick={submit}
        aria-label="Send"
        disabled={!draft.trim()}
        className="w-[26px] h-[26px] rounded-full bg-ink text-white grid place-items-center text-[11px] disabled:opacity-40"
      >
        ↑
      </button>
    </div>
  );
}
