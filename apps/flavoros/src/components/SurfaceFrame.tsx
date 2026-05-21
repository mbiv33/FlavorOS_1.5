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
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
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
        <header className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-strong">
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      <div className="space-y-3">{children}</div>
    </section>
  );
}
