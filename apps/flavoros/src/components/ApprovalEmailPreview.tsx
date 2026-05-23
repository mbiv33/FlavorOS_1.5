export type ApprovalEmailPreviewData = {
  to?: string | null;
  subject?: string | null;
  bodyExcerpt?: string | null;
  inboundSummary?: string | null;
  body?: string | null;
  rows?: { label: string; value: string }[];
};

export function ApprovalEmailPreview({
  preview,
}: {
  preview: ApprovalEmailPreviewData;
}) {
  const bodyText = preview.bodyExcerpt ?? preview.body;
  const rows = preview.rows?.filter((r) => r.label && r.value) ?? [];

  return (
    <div className="rounded-md border border-border bg-surface-muted px-3 py-2 text-xs text-muted-strong">
      {preview.inboundSummary ? (
        <p className="mb-2 text-muted">{preview.inboundSummary}</p>
      ) : null}
      {rows.length > 0 ? (
        <dl className="space-y-0.5">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-2">
              <dt className="shrink-0 text-muted">{row.label}:</dt>
              <dd className="min-w-0 break-words">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <>
          {preview.to ? (
            <p>
              <span className="text-muted">To:</span> {preview.to}
            </p>
          ) : null}
          {preview.subject ? (
            <p>
              <span className="text-muted">Subject:</span> {preview.subject}
            </p>
          ) : null}
        </>
      )}
      {bodyText ? (
        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-muted">
          {bodyText}
        </p>
      ) : null}
    </div>
  );
}
