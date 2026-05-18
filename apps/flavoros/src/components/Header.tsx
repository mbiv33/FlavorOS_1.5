export function Header({
  title,
  nextFocus,
  readyForYou,
  action,
}: {
  title: string;
  nextFocus?: string;
  readyForYou?: number;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
      <div className="space-y-0.5">
        <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        {nextFocus ? (
          <p className="text-xs text-muted">{nextFocus}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {readyForYou && readyForYou > 0 ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
            {readyForYou} ready for you
          </span>
        ) : null}
        {action}
      </div>
    </header>
  );
}
