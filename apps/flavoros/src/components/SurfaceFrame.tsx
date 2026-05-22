import type { ReactNode } from "react";

export function SurfaceFrame({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto min-w-0 max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
        {children}
      </div>
    </div>
  );
}

export function SurfaceSection({
  title,
  action,
  children,
  hideWhenEmpty,
  empty,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  hideWhenEmpty?: boolean;
  empty?: boolean;
}) {
  if (hideWhenEmpty && empty) return null;
  return (
    <section className="space-y-3">
      {title ? (
        <header className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-strong">
            {title}
          </h2>
          {action ? (
            <div className="shrink-0 text-left sm:text-right">{action}</div>
          ) : null}
        </header>
      ) : null}
      <div className="space-y-3">{children}</div>
    </section>
  );
}
