export function OperatingPicture({
  greeting,
  dateLine,
  summary,
}: {
  greeting: string;
  dateLine: string;
  summary: string;
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface-muted px-6 py-5"
      aria-label="Operating picture"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-strong">
        Operating picture
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
        {greeting}
      </h2>
      <p className="mt-0.5 text-sm text-muted">{dateLine}</p>
      <p className="mt-3 text-sm text-muted-strong">{summary}</p>
    </section>
  );
}
