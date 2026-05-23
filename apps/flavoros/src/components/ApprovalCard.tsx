import { Card, CardMeta, CardTitle } from "./Card";
import { StatusChip } from "./StatusChip";
import { ApprovalEmailPreview } from "./ApprovalEmailPreview";
import type { CardStatus, AgentName, EmailPreviewFields } from "@/lib/fixtures";

type StakeChip = { kind: string; label: string };

export function ApprovalCard({
  title,
  detail,
  status,
  agent,
  preview,
  stakes,
  sourceLinkLabel,
  canDefer = true,
}: {
  title: string;
  detail: string;
  status: CardStatus;
  agent: AgentName;
  preview?: EmailPreviewFields;
  stakes?: StakeChip[];
  sourceLinkLabel?: string;
  canDefer?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          {preview ? (
            <ApprovalEmailPreview preview={preview} />
          ) : (
            <CardMeta>
              {agent} · {detail}
            </CardMeta>
          )}
          {stakes && stakes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {stakes.map((chip) => (
                <span
                  key={`${chip.kind}-${chip.label}`}
                  className="rounded-full border border-border-strong bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-strong"
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
          {sourceLinkLabel ? (
            <p className="text-xs text-muted">
              Source: <span className="text-muted-strong">{sourceLinkLabel}</span>
            </p>
          ) : null}
        </div>
        <StatusChip status={status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
          Approve
        </button>
        <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted">
          Modify
        </button>
        {canDefer ? (
          <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted">
            Defer
          </button>
        ) : null}
      </div>
    </Card>
  );
}
