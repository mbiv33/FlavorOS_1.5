"use client";

import { useState } from "react";
import { MOCK_QUIETLY_HANDLED } from "@/lib/mock/today";

/**
 * Collapsed drawer of things the system handled silently. Rare to expand,
 * but the count is reassuring (PRD 04 §4.1 — Quietly handled).
 */
export function QuietlyHandled() {
  const data = MOCK_QUIETLY_HANDLED;
  const [open, setOpen] = useState(false);
  if (data.count === 0) return null;

  return (
    <div className="mt-2.5 bg-card border border-line rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-[13px] text-ink-3 hover:bg-[rgba(31,29,43,0.02)]"
        aria-expanded={open}
      >
        <span aria-hidden className="text-[10px]">{open ? "▾" : "▸"}</span>
        <span>
          <span className="text-ink font-semibold">{data.count} things</span>{" "}
          handled quietly — {open ? "see below" : "tap to review"}
        </span>
      </button>
      {open && data.items ? (
        <ul className="list-none p-0 m-0 px-4 pb-3 text-[13px] text-ink-2">
          {data.items.map((item, i) => (
            <li key={i} className="py-1.5 border-t border-line">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
