import { cn } from "@/lib/cn";
import type { TripPhase } from "@/lib/types/today";

const PHASES: { id: TripPhase; label: string; name: string }[] = [
  { id: "planning", label: "Phase 1", name: "Planning" },
  { id: "booking", label: "Phase 2", name: "Booking" },
  { id: "prep", label: "Phase 3", name: "Trip prep" },
  { id: "travel", label: "Phase 4", name: "Travel" },
  { id: "return", label: "Phase 5", name: "Return" },
];

/**
 * Five-phase indicator for travel projects. Steps before the active one are
 * "done", the current is "active", later are "todo" (rendered faint).
 */
export function PhaseIndicator({ current }: { current: TripPhase }) {
  const idx = PHASES.findIndex((p) => p.id === current);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-1 mb-5">
      {PHASES.map((p, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "todo";
        return (
          <div
            key={p.id}
            className={cn(
              "rounded-[10px] border p-3 relative",
              state === "done" && "bg-[rgba(63,154,126,0.06)] border-[rgba(63,154,126,0.2)]",
              state === "active" &&
                "bg-gradient-to-br from-[rgba(91,70,214,0.1)] to-[rgba(228,103,78,0.06)] border-[rgba(91,70,214,0.3)]",
              state === "todo" && "bg-card-solid border-line opacity-50",
            )}
          >
            <div
              className={cn(
                "text-[10.5px] font-bold tracking-[0.06em] uppercase",
                state === "done" && "text-max",
                state === "active" && "text-accent",
                state === "todo" && "text-ink-3",
              )}
            >
              {p.label}
            </div>
            <div className="text-[13.5px] font-semibold mt-1">{p.name}</div>
            {state === "active" ? (
              <span
                aria-hidden
                className="absolute -bottom-px left-3 right-3 h-0.5 bg-accent rounded"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
