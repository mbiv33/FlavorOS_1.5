import { StatusChip } from "./StatusChip";

export function LaunchCard({
  title,
  subtitle,
  status,
  agent,
  action,
}: {
  title: string;
  subtitle: string;
  status: string;
  agent?: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          <StatusChip status={status} />
        </div>
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center justify-between">
        {agent && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            via {agent}
          </span>
        )}
        <button className="ml-auto rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
          {action ?? "Launch"}
        </button>
      </div>
    </div>
  );
}
