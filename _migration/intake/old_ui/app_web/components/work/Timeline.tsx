import { Card } from "@/components/primitives/Card";
import type { TimelineEntry } from "@/lib/types/project";
import { cn } from "@/lib/cn";

/**
 * What's-happened timeline. Used in travel project Status — the iterative
 * search-refine loop is narrated in plain English (PRD 04 §4.3).
 */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Card className="p-5 mb-3.5">
      <h3 className="m-0 mb-3.5 text-[13px] text-ink-3 font-bold uppercase tracking-[0.06em]">
        What's happened
      </h3>
      {entries.map((e) => (
        <div
          key={e.id}
          className="grid items-start gap-2.5 py-1.5"
          style={{ gridTemplateColumns: "18px 80px 1fr" }}
        >
          <span
            aria-hidden
            className={cn(
              "w-2.5 h-2.5 rounded-full mt-1.5",
              e.state === "past" && "bg-max",
              e.state === "now" &&
                "bg-accent shadow-[0_0_0_4px_rgba(91,70,214,0.15)] animate-pulse",
              e.state === "future" && "bg-transparent border border-dashed border-line-2",
            )}
          />
          <div className="text-[12px] text-ink-3 font-semibold pt-0.5">
            {e.dateLabel}
          </div>
          <div className="text-[13.5px] text-ink">
            {e.text}
            {e.quote ? (
              <div className="text-ink-2 italic mt-0.5">You said: "{e.quote}"</div>
            ) : null}
          </div>
        </div>
      ))}
    </Card>
  );
}
