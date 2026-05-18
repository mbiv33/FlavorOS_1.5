import { goalsAndMilestones } from "@/lib/fixtures";

const TONE: Record<"ok" | "attention" | "blocked", string> = {
  ok: "border-emerald-200 bg-emerald-50/40",
  attention: "border-amber-200 bg-amber-50/40",
  blocked: "border-rose-200 bg-rose-50/40",
};

const VALUE_TONE: Record<"ok" | "attention" | "blocked", string> = {
  ok: "text-emerald-800",
  attention: "text-amber-900",
  blocked: "text-rose-800",
};

export function GoalsStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {goalsAndMilestones.map((g) => (
        <div
          key={g.id}
          className={`rounded-xl border bg-surface p-4 ${TONE[g.tone]}`}
        >
          <p className="text-xs uppercase tracking-wider text-muted-strong">
            {g.title}
          </p>
          <p className={`mt-2 text-2xl font-semibold ${VALUE_TONE[g.tone]}`}>
            {g.value}
          </p>
          <p className="mt-1 text-xs text-muted">{g.detail}</p>
        </div>
      ))}
    </div>
  );
}
