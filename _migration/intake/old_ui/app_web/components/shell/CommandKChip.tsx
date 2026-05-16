"use client";

import { usePaletteStore } from "@/lib/state/palette";

export function CommandKChip() {
  const setOpen = usePaletteStore((s) => s.setOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open command palette"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border bg-card-solid text-ink-2 border-line hover:border-line-2 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <span className="kbd">⌘K</span>
    </button>
  );
}
