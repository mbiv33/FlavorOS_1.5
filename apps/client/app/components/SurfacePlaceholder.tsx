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
          "MVP placeholder — full workflows ship in later milestones per docs/mvp_build_notes.md."}
      </p>
    </div>
  );
}
