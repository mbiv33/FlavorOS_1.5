import type { ReactNode } from "react";

export function Zone({
  title,
  action,
  children,
  empty,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  empty?: boolean;
}) {
  if (empty) return null;
  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-strong">
          {title}
        </h2>
        {action}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
