const palette: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  delivered: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  generating: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  draft: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  final: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  archived: "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  paused: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  upcoming: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  "in-progress": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  booked: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  planning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "in-transit": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  normal: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  low: "bg-neutral-50 text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-500",
};

const fallback = "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${palette[status] ?? fallback}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}
