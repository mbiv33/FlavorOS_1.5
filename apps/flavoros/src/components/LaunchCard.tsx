import Link from "next/link";
import { Card, CardMeta, CardRow, CardTitle } from "./Card";

export function LaunchCard({
  title,
  meta,
  statusLine,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  meta: string;
  statusLine?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Card>
      <CardRow>
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardMeta>{meta}</CardMeta>
          {statusLine ? (
            <p className="text-xs text-muted-strong">{statusLine}</p>
          ) : null}
        </div>
      </CardRow>
      <div className="mt-4 flex gap-2">
        <Link
          href={primaryHref}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
