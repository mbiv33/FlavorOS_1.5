"use client";

import { useEffect, useState } from "react";
import { StatusChip } from "./StatusChip";
import type { InboxItem, InboxPile } from "@/lib/fixtures";

const PILE_META: Record<
  InboxPile,
  { label: string; tone: string; accent: string }
> = {
  urgent: {
    label: "Urgent",
    tone: "border-rose-300 bg-rose-50/60",
    accent: "text-rose-800",
  },
  "needs-attention": {
    label: "Needs Attention",
    tone: "border-amber-300 bg-amber-50/60",
    accent: "text-amber-900",
  },
  updates: {
    label: "Updates",
    tone: "border-emerald-300 bg-emerald-50/60",
    accent: "text-emerald-900",
  },
};

const PILE_ORDER: InboxPile[] = ["urgent", "needs-attention", "updates"];

export function ClientInbox({ items }: { items: InboxItem[] }) {
  const [openPile, setOpenPile] = useState<InboxPile | null>(null);

  useEffect(() => {
    if (!openPile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPile(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPile]);

  const grouped = PILE_ORDER.map((pile) => ({
    pile,
    items: items.filter((i) => i.pile === pile),
  }));

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-strong">
          Client Inbox
        </h2>
        <p className="text-xs text-muted">Click a stack to open</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {grouped.map(({ pile, items: pileItems }) => (
          <PileCard
            key={pile}
            pile={pile}
            count={pileItems.length}
            onOpen={() => setOpenPile(pile)}
          />
        ))}
      </div>

      {openPile ? (
        <InboxOverlay
          pile={openPile}
          items={items.filter((i) => i.pile === openPile)}
          onClose={() => setOpenPile(null)}
        />
      ) : null}
    </section>
  );
}

function PileCard({
  pile,
  count,
  onOpen,
}: {
  pile: InboxPile;
  count: number;
  onOpen: () => void;
}) {
  const meta = PILE_META[pile];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block text-left"
      aria-label={`Open ${meta.label} (${count})`}
    >
      {/* Stacked paper effect */}
      <span
        aria-hidden
        className={`absolute inset-x-2 top-2 h-full rounded-xl border ${meta.tone} opacity-60`}
      />
      <span
        aria-hidden
        className={`absolute inset-x-1 top-1 h-full rounded-xl border ${meta.tone} opacity-80`}
      />
      <div
        className={`relative flex h-32 flex-col justify-between rounded-xl border bg-surface p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition group-hover:-translate-y-0.5 group-hover:shadow-md ${meta.tone.replace("bg-", "border-").split(" ")[0]}`}
      >
        <div className="flex items-start justify-between">
          <h3 className={`text-sm font-semibold ${meta.accent}`}>
            {meta.label}
          </h3>
          <span
            className={`rounded-full bg-white px-2 py-0.5 text-xs font-semibold ${meta.accent} border ${meta.tone.replace("bg-", "border-").split(" ")[0]}`}
          >
            {count}
          </span>
        </div>
        <p className="text-xs text-muted">
          {count === 0
            ? "Nothing here right now"
            : count === 1
              ? "1 item · open to review"
              : `${count} items · open to review`}
        </p>
      </div>
    </button>
  );
}

function InboxOverlay({
  pile,
  items,
  onClose,
}: {
  pile: InboxPile;
  items: InboxItem[];
  onClose: () => void;
}) {
  const meta = PILE_META[pile];
  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/20 p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.label} inbox`}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className={`flex items-center justify-between border-b border-border px-5 py-4 ${meta.tone}`}
        >
          <div>
            <h2 className={`text-base font-semibold ${meta.accent}`}>
              {meta.label}
            </h2>
            <p className="text-xs text-muted-strong">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border-strong bg-white px-3 py-1 text-xs font-medium hover:bg-surface-muted"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-muted">
              Nothing here right now.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="px-5 py-4 hover:bg-surface-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <p className="text-xs text-muted">
                        {item.agent} · {item.detail}
                      </p>
                      <p className="text-xs text-muted">{item.when}</p>
                    </div>
                    <StatusChip status={item.status} />
                  </div>
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
                  </div>
                  <div className="mt-2">
                    <button className="text-xs text-muted hover:text-foreground">
                      Open source ↗
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
