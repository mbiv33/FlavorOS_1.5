export function SurfacePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {description ??
          "Admin MVP placeholder — monitors and queues wire up post-foundation milestones."}
      </p>
    </div>
  );
}
