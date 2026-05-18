const COLORS: Record<string, string> = {
  healthy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  idle: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  connected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  degraded: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  queued: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  stale: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  offline: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  final: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  archived: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] ?? COLORS.idle;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight ${cls}`}>
      {status}
    </span>
  );
}
