import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">{children}</div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-medium text-foreground">{children}</h3>;
}

export function CardMeta({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted">{children}</p>;
}
