export type MiniCalendarProps = {
  label?: string;
  weekdays?: string[];
  weeks?: Array<Array<number | null>>;
  today?: number;
  highlightDates?: number[];
};

const DEFAULT_WEEKDAYS = ["S", "M", "T", "W", "Th", "F", "S"];

export function MiniCalendar({
  label = "This month",
  weekdays = DEFAULT_WEEKDAYS,
  weeks = [],
  today,
  highlightDates = [],
}: MiniCalendarProps) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="text-xs text-muted hover:text-foreground"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-medium">{label}</p>
        <button
          type="button"
          className="text-xs text-muted hover:text-foreground"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-x-0.5 gap-y-1 text-center text-[10px] sm:text-xs">
        {weekdays.map((d, i) => (
          <div key={`wd-${i}`} className="text-muted">
            {d}
          </div>
        ))}
        {weeks.flat().map((day, i) => {
          if (day === null) return <div key={i} />;
          const isToday = today !== undefined && day === today;
          const isMarked = highlightDates.includes(day);
          return (
            <div key={i} className="flex items-center justify-center py-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7 ${
                  isToday
                    ? "bg-accent font-semibold text-accent-foreground"
                    : isMarked
                      ? "bg-amber-100 font-medium text-amber-900"
                      : "text-foreground"
                }`}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
