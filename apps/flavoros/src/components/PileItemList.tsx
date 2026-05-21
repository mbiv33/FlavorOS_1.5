"use client";

import { useState } from "react";
import { StatusChip } from "./StatusChip";
import { decideApproval, loadSession, type ApprovalDecideRead } from "@/lib/api";
import { statusAccentBorder } from "@/lib/statusAccent";
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
  approvalId?: string;
};

export function PileItemList({
  items,
  emptyLabel = "Nothing here right now.",
  onAfterDecide,
}: {
  items: PileListItem[];
  emptyLabel?: string;
  onAfterDecide?: (result: ApprovalDecideRead) => void;
}) {
  const [decidedIds, setDecidedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDecide(item: PileListItem, decision: "approved" | "rejected") {
    if (!item.approvalId || pendingId) return;
    const session = loadSession();
    if (!session) return;
    setPendingId(item.id);
    try {
      const result = await decideApproval(session, item.approvalId, decision);
      setDecidedIds((prev) => new Set([...prev, item.id]));
      onAfterDecide?.(result);
    } finally {
      setPendingId(null);
    }
  }

  const visible = items.filter((i) => !decidedIds.has(i.id));

  if (visible.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted">
        {decidedIds.size > 0 ? "All done — great work." : emptyLabel}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {visible.map((item) => (
        <li
          key={item.id}
          className={`border-l-4 px-5 py-4 hover:bg-surface-muted ${statusAccentBorder(item.status)}`}
        >
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
          <ItemActions
            item={item}
            isPending={pendingId === item.id}
            onDecide={handleDecide}
          />
        </li>
      ))}
    </ul>
  );
}

function ItemActions({
  item,
  isPending,
  onDecide,
}: {
  item: PileListItem;
  isPending: boolean;
  onDecide: (item: PileListItem, decision: "approved" | "rejected") => void;
}) {
  if (item.kind === "approval") {
    const canAct = !!item.approvalId && !isPending;
    return (
      <>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            disabled={!canAct}
            onClick={() => onDecide(item, "approved")}
            className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? "Working…" : "Approve"}
          </button>
          <button className="rounded-md border border-border-strong px-3 py-1 text-xs font-medium hover:bg-surface-muted">
            Modify
          </button>
          <button
            disabled={!canAct}
            onClick={() => onDecide(item, "rejected")}
            className="rounded-md border border-border-strong px-3 py-1 text-xs font-medium hover:bg-surface-muted disabled:opacity-40"
          >
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
    return (
      <div className="mt-3 flex flex-wrap justify-end gap-2">
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
  // event
  return (
    <div className="mt-3 flex flex-wrap justify-end gap-2">
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
