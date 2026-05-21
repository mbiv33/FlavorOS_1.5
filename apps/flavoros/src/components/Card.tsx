import type { ReactNode } from "react";
import { statusAccentBorder } from "@/lib/statusAccent";
import type { CardStatus } from "@/lib/fixtures";

export function Card({
  children,
  className = "",
  accentBar,
}: {
  children: ReactNode;
  className?: string;
  accentBar?: CardStatus;
}) {
  const accent = accentBar
    ? statusAccentBorder(accentBar)
    : "border-l-transparent";
  return (
    <div
      className={`rounded-lg border border-border-strong border-l-4 bg-surface p-4 ${accent} ${className}`}
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
