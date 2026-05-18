import { StatusChip } from "./StatusChip";
import type { CardStatus, AgentName, ItemKind } from "@/lib/fixtures";

export type PileListItem = {
  id: string;
  kind: ItemKind;
  title: string;
  status: CardStatus;
  agent: AgentName;
  detail: string;
  when?: string;
  canDefer?: boolean;
  sourceLinkLabel?: string;
};

export function PileItemList({
  items,
  emptyLabel = "Nothing here right now.",
}: {
  items: PileListItem[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted">
        {emptyLabel}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="px-5 py-4 hover:bg-surface-muted">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{item.title}</h3>
              <p className="text-xs text-muted">
                {item.agent} · {item.detail}
              </p>
              {item.when ? (
                <p className="text-xs text-muted">{item.when}</p>
              ) : null}
            </div>
            <StatusChip status={item.status} />
          </div>
          <ItemActions item={item} />
        </li>
      ))}
    </ul>
  );
}

function ItemActions({ item }: { item: PileListItem }) {
  // Per-kind action sets, grounded in 03-approval-card.md + status semantics.
  if (item.kind === "approval") {
    return (
      <>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:opacity-90">
            Approve
          </button>
          <button className="rounded-md border border-border-strong px-3 py-1 text-xs font-medium hover:bg-surface-muted">
            Modify
          </button>
          <button className="rounded-md border border-border-strong px-3 py-1 text-xs font-medium hover:bg-surface-muted">
            I&apos;ll do myself
          </button>
          {item.canDefer ? (
            <button className="rounded-md border border-border-strong px-3 py-1 text-xs font-medium hover:bg-surface-muted">
              Defer
            </button>
          ) : null}
        </div>
        {item.sourceLinkLabel ? (
          <div className="mt-2">
            <button className="text-xs text-muted hover:text-foreground">
              Open source ↗{" "}
              <span className="text-muted-strong">{item.sourceLinkLabel}</span>
            </button>
          </div>
        ) : null}
      </>
    );
  }
  if (item.kind === "update") {
    const isSent = item.status === "Sent";
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-md border border-border-strong px-3 py-1 text-xs font-medium hover:bg-surface-muted">
          Open
        </button>
        {isSent ? (
          <button className="rounded-md border border-border-strong px-3 py-1 text-xs font-medium hover:bg-surface-muted">
            Pull back
          </button>
        ) : null}
        {item.sourceLinkLabel ? (
          <button className="text-xs text-muted hover:text-foreground">
            Open source ↗
          </button>
        ) : null}
      </div>
    );
  }
  // event
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button className="rounded-md border border-border-strong px-3 py-1 text-xs font-medium hover:bg-surface-muted">
        Open
      </button>
      {item.sourceLinkLabel ? (
        <button className="text-xs text-muted hover:text-foreground">
          Open source ↗
        </button>
      ) : null}
    </div>
  );
}
