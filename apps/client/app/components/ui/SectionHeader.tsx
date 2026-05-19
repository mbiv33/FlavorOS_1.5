export function SectionHeader({
  title,
  description,
  count,
}: {
  title: string;
  description?: string;
  count?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-500">
            ({count})
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
    </div>
  );
}
