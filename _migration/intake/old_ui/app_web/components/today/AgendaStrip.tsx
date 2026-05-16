import { Section } from "@/components/primitives/Section";
import { MOCK_AGENDA } from "@/lib/mock/today";
import { cn } from "@/lib/cn";

/**
 * Compact agenda strip for Today (PRD 04 §4.1). Held focus blocks are
 * visually distinct; clicks would jump to project Status (wired in Slice 4
 * when Calendar surface lands).
 */
export function AgendaStrip() {
  const events = MOCK_AGENDA;
  if (events.length === 0) return null;
  const heldCount = events.filter((e) => e.kind === "focus-block").length;
  const meta =
    heldCount > 0
      ? `${events.length} events · ${heldCount} focus block${heldCount === 1 ? "" : "s"} held`
      : `${events.length} events`;

  return (
    <Section title="Today's agenda" meta={meta}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {events.map((ev) => (
          <div
            key={ev.id}
            className={cn(
              "rounded-sm2 border p-3 min-h-[70px]",
              ev.kind === "focus-block"
                ? "bg-[rgba(63,154,126,0.06)] border-[rgba(63,154,126,0.18)]"
                : "bg-card-solid border-line",
            )}
          >
            <div className="text-[11px] text-ink-3 font-semibold tracking-[0.04em]">
              {ev.time}
            </div>
            <div
              className={cn(
                "text-[13.5px] font-semibold mt-1",
                ev.kind === "focus-block" ? "text-max" : "text-ink",
              )}
            >
              {ev.title}
            </div>
            <div className="text-[11.5px] text-ink-3 mt-px">{ev.meta}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
