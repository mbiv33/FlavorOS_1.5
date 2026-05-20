"use client";

import { useEffect, useState } from "react";
import type { ApprovalDecideRead } from "@/lib/api";
import { PileItemList, type PileListItem } from "./PileItemList";

export type PileTone =
  | "rose"
  | "amber"
  | "emerald"
  | "violet"
  | "blue"
  | "stone";

type PileToneStyle = {
  border: string;
  bg: string;
  text: string;
};

const TONES: Record<PileTone, PileToneStyle> = {
  rose: {
    border: "border-rose-300",
    bg: "bg-rose-50/60",
    text: "text-rose-800",
  },
  amber: {
    border: "border-amber-300",
    bg: "bg-amber-50/60",
    text: "text-amber-900",
  },
  emerald: {
    border: "border-emerald-300",
    bg: "bg-emerald-50/60",
    text: "text-emerald-900",
  },
  violet: {
    border: "border-violet-300",
    bg: "bg-violet-50/60",
    text: "text-violet-900",
  },
  blue: {
    border: "border-blue-300",
    bg: "bg-blue-50/60",
    text: "text-blue-800",
  },
  stone: {
    border: "border-stone-300",
    bg: "bg-stone-100/60",
    text: "text-stone-800",
  },
};

export type PileDef = {
  key: string;
  label: string;
  tone: PileTone;
  subtitle?: string;
  items: PileListItem[];
  hint?: string;
};

/**
 * Render a row of pile cards. Clicking a pile opens a side-overlay drawer
 * with the pile's items, using PileItemList for per-kind actions.
 *
 * Server components can compose this by passing plain data (no functions).
 */
export function PileRow({
  piles,
  onAfterDecide,
}: {
  piles: PileDef[];
  onAfterDecide?: (result: ApprovalDecideRead) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey]);

  const active = piles.find((p) => p.key === openKey) ?? null;

  return (
    <>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${piles.length}, minmax(0, 1fr))`,
        }}
      >
        {piles.map((p) => (
          <Stack
            key={p.key}
            label={p.label}
            tone={p.tone}
            count={p.items.length}
            hint={p.hint}
            onOpen={() => setOpenKey(p.key)}
          />
        ))}
      </div>
      {active ? (
        <Overlay
          title={active.label}
          subtitle={
            active.subtitle
              ? `${active.items.length} ${active.items.length === 1 ? "item" : "items"} · ${active.subtitle}`
              : `${active.items.length} ${active.items.length === 1 ? "item" : "items"}`
          }
          tone={active.tone}
          onClose={() => setOpenKey(null)}
        >
          <PileItemList items={active.items} onAfterDecide={onAfterDecide} />
        </Overlay>
      ) : null}
    </>
  );
}

export function Stack({
  label,
  tone,
  count,
  hint,
  onOpen,
}: {
  label: string;
  tone: PileTone;
  count: number;
  hint?: string;
  onOpen: () => void;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block text-left"
      aria-label={`Open ${label} (${count})`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-2 top-2 h-full rounded-xl border ${t.border} ${t.bg} opacity-60`}
      />
      <span
        aria-hidden
        className={`absolute inset-x-1 top-1 h-full rounded-xl border ${t.border} ${t.bg} opacity-80`}
      />
      <div
        className={`relative flex h-32 flex-col justify-between rounded-xl border bg-surface p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition group-hover:-translate-y-0.5 group-hover:shadow-md ${t.border}`}
      >
        <div className="flex items-start justify-between">
          <h3 className={`text-sm font-semibold ${t.text}`}>{label}</h3>
          <span
            className={`rounded-full border bg-white px-2 py-0.5 text-xs font-semibold ${t.border} ${t.text}`}
          >
            {count}
          </span>
        </div>
        <p className="text-xs text-muted">
          {hint ??
            (count === 0
              ? "Quiet here right now"
              : count === 1
                ? "1 item · open to review"
                : `${count} items · open to review`)}
        </p>
      </div>
    </button>
  );
}

export function Overlay({
  title,
  subtitle,
  tone,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  tone: PileTone;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/20 p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className={`flex items-center justify-between border-b border-border px-5 py-4 ${t.bg}`}
        >
          <div>
            <h2 className={`text-base font-semibold ${t.text}`}>{title}</h2>
            {subtitle ? (
              <p className="text-xs text-muted-strong">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border-strong bg-white px-3 py-1 text-xs font-medium hover:bg-surface-muted"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
