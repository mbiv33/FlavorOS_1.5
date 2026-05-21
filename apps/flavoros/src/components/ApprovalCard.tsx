import { Card, CardMeta, CardRow, CardTitle } from "./Card";
import { StatusChip } from "./StatusChip";
import type { CardStatus, AgentName } from "@/lib/fixtures";

export function ApprovalCard({
  title,
  detail,
  status,
  agent,
  canDefer = false,
  sourceLinkLabel,
}: {
  title: string;
  detail: string;
  status: CardStatus;
  agent: AgentName;
  canDefer?: boolean;
  sourceLinkLabel?: string;
}) {
  return (
    <Card accentBar={status}>
      <CardRow>
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardMeta>
            {agent} prepared · {detail}
          </CardMeta>
        </div>
        <StatusChip status={status} />
      </CardRow>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90">
          Approve
        </button>
        <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted">
          Modify
        </button>
        <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted">
          I&apos;ll do myself
        </button>
        {canDefer ? (
          <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted">
            Defer
          </button>
        ) : null}
      </div>
      {sourceLinkLabel ? (
        <div className="mt-3 border-t border-border pt-3">
          <button className="text-xs text-muted hover:text-foreground">
            Open source ↗ <span className="text-muted-strong">{sourceLinkLabel}</span>
          </button>
        </div>
      ) : null}
    </Card>
  );
}
