export type StatTone = "neutral" | "ok" | "attention" | "blocked" | "info";

const TILE_TONE: Record<StatTone, string> = {
  neutral: "border-border bg-surface",
  ok: "border-emerald-200 bg-emerald-50/40",
  attention: "border-amber-200 bg-amber-50/40",
  blocked: "border-rose-200 bg-rose-50/40",
  info: "border-blue-200 bg-blue-50/40",
};

const VALUE_TONE: Record<StatTone, string> = {
  neutral: "text-foreground",
  ok: "text-emerald-800",
  attention: "text-amber-900",
  blocked: "text-rose-800",
  info: "text-blue-800",
};

export type Stat = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone?: StatTone;
};

export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
        const tone = s.tone ?? "neutral";
        return (
          <div
            key={s.id}
            className={`rounded-xl border p-4 ${TILE_TONE[tone]}`}
          >
            <p className="text-xs uppercase tracking-wider text-muted-strong">
              {s.label}
            </p>
            <p className={`mt-2 text-2xl font-semibold ${VALUE_TONE[tone]}`}>
              {s.value}
            </p>
            {s.detail ? (
              <p className="mt-1 text-xs text-muted">{s.detail}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
