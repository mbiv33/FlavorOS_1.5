import { statToneAccentBorder } from "@/lib/statusAccent";

export type StatTone = "neutral" | "ok" | "attention" | "blocked" | "info";

const VALUE_TONE: Record<StatTone, string> = {
  neutral: "text-foreground",
  ok: "text-foreground",
  attention: "text-foreground",
  blocked: "text-foreground",
  info: "text-foreground",
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
            className={`rounded-lg border border-border-strong border-l-4 bg-surface p-4 ${statToneAccentBorder(tone)}`}
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
