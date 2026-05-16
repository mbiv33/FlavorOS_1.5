import { cn } from "@/lib/cn";
import type { CallAgendaItem } from "@/lib/types/call";

const SYMBOL: Record<CallAgendaItem["state"], string> = {
  done: "✓",
  active: "◐",
  todo: "○",
  deferred: "⏱",
  skipped: "⊘",
};

const SYMBOL_COLOR: Record<CallAgendaItem["state"], string> = {
  done: "text-max",
  active: "text-accent",
  todo: "text-ink-3",
  deferred: "text-warn",
  skipped: "text-ink-3",
};

/**
 * Live agenda checklist. Items resolve as Khadijah walks them. PRD 05
 * §The agenda checklist.
 */
export function AgendaChecklist({ items }: { items: CallAgendaItem[] }) {
  return (
    <div>
      <h3 className="m-0 mb-3 text-[12px] text-ink-3 font-bold uppercase tracking-[0.08em]">
        Agenda · {items.length} items
      </h3>
      <ul className="list-none p-0 m-0">
        {items.map((it) => (
          <li
            key={it.id}
            className={cn(
              "flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px]",
              it.state === "active" &&
                "bg-[rgba(91,70,214,0.08)] text-ink font-semibold",
              it.state === "done" && "text-ink-3 line-through decoration-ink-3/30",
              it.state === "todo" && "text-ink-2",
              it.state === "deferred" && "text-ink-2",
              it.state === "skipped" && "text-ink-3",
            )}
          >
            <span className={cn("text-[14px]", SYMBOL_COLOR[it.state])} aria-hidden>
              {SYMBOL[it.state]}
            </span>
            {it.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
