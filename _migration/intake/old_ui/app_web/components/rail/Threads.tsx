"use client";

import { PairAvatar, PersonaAvatar } from "@/components/primitives/Avatar";
import { useThreadsStore } from "@/lib/state/threads";
import { THREADS } from "@/lib/mock/threads";
import { PERSONAS, type PersonaId } from "@/lib/types/persona";
import type { MessageAuthor, Thread, ThreadId } from "@/lib/types/threads";
import { cn } from "@/lib/cn";

/**
 * Three-thread stack. Only one expanded at a time (PRD 06).
 * Click a collapsed thread → it becomes active, previous active collapses.
 */
export function Threads() {
  const active = useThreadsStore((s) => s.active);
  const setActive = useThreadsStore((s) => s.setActive);
  const messages = useThreadsStore((s) => s.messages);

  return (
    <div className="flex-1 overflow-auto p-2 flex flex-col gap-2">
      {THREADS.map((t) => {
        const isActive = active === t.id;
        const last = [...messages].reverse().find((m) => m.threadId === t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={cn(
              "text-left bg-card-solid border rounded-xl p-3 transition-colors w-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              isActive
                ? "border-accent shadow-[0_0_0_2px_rgba(91,70,214,0.08)]"
                : "border-line hover:border-line-2",
            )}
            aria-pressed={isActive}
            aria-label={`${t.label} thread`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <ThreadHeads thread={t} />
              <div className="text-[13px] font-bold">{t.label}</div>
              <div className="ml-auto text-[11px] text-ink-3">
                {last?.timestampLabel ?? ""}
              </div>
            </div>
            {isActive ? (
              <ActiveBody threadId={t.id} />
            ) : last ? (
              <CollapsedPreview author={last.author} text={last.body} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ThreadHeads({ thread }: { thread: Thread }) {
  if (thread.personas.length >= 2) {
    return (
      <PairAvatar
        personas={[
          PERSONAS[thread.personas[0]],
          PERSONAS[thread.personas[1]],
        ]}
      />
    );
  }
  return <PersonaAvatar persona={PERSONAS[thread.personas[0]]} size="sm" />;
}

function authorName(author: MessageAuthor): string {
  if (author === "user") return "You";
  return PERSONAS[author as PersonaId]?.name ?? author;
}

function CollapsedPreview({
  author,
  text,
}: {
  author: MessageAuthor;
  text: string;
}) {
  const label = authorName(author);
  return (
    <div className="text-[12.5px] text-ink-2 line-clamp-1">
      <span className="text-ink font-semibold">{label}:</span> {text}
    </div>
  );
}

function ActiveBody({ threadId }: { threadId: ThreadId }) {
  const messages = useThreadsStore((s) => s.messages);
  const recent = messages.filter((m) => m.threadId === threadId).slice(-6);
  return (
    <div className="flex flex-col gap-1 text-[13px] mt-1">
      {recent.map((m) => {
        const fromUser = m.author === "user";
        const personaName = authorName(m.author);
        return (
          <div key={m.id} className="text-ink-2 leading-snug">
            <span
              className={cn(
                "font-semibold mr-1.5",
                fromUser ? "text-accent" : "text-ink",
              )}
            >
              {personaName}:
            </span>
            {m.body}
          </div>
        );
      })}
    </div>
  );
}
