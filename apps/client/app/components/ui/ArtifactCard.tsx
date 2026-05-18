import { StatusChip } from "./StatusChip";

const kindIcons: Record<string, string> = {
  brief: "📋",
  report: "📊",
  email_draft: "✉️",
  itinerary: "🗺️",
  memo: "📝",
  analysis: "📈",
};

export function ArtifactCard({
  title,
  kind,
  status,
  agent,
  preview,
  date,
}: {
  title: string;
  kind: string;
  status: string;
  agent: string;
  preview: string;
  date: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{kindIcons[kind] ?? "📄"}</span>
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
        </div>
        <StatusChip status={status} />
      </div>
      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        {preview}
      </p>
      <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
        <span>by {agent}</span>
        <span>{date}</span>
      </div>
    </div>
  );
}
