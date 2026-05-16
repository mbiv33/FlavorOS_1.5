"use client";

import { useState } from "react";
import { PersonaAvatar } from "@/components/primitives/Avatar";
import { Chip } from "@/components/primitives/Chip";
import { ArtifactViewer } from "./ArtifactViewer";
import { PERSONAS } from "@/lib/types/persona";
import { getContextById } from "@/lib/mock/profile";
import { MOCK_LIBRARY } from "@/lib/mock/library";
import type { FileKind } from "@/lib/types/project";
import type { LibraryArtifact } from "@/lib/types/library";
import { cn } from "@/lib/cn";

const FILTERS: { id: FileKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "brief", label: "Briefs" },
  { id: "packet", label: "Packets" },
  { id: "invoice", label: "Invoices" },
  { id: "contract", label: "Contracts" },
  { id: "debrief", label: "Debriefs" },
  { id: "research", label: "Research" },
  { id: "tee-up", label: "Tee-ups" },
];

export function LibraryList() {
  const [filter, setFilter] = useState<FileKind | "all">("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<LibraryArtifact | null>(null);

  const visibleKinds = new Set(MOCK_LIBRARY.map((a) => a.kind));
  const items = MOCK_LIBRARY.filter((a) => {
    if (filter !== "all" && a.kind !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !a.title.toLowerCase().includes(q) &&
        !(a.body?.toLowerCase().includes(q) ?? false)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      <div className="flex flex-col gap-3 px-1 pb-3.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artifacts…"
          aria-label="Search library"
          className="w-full max-w-md bg-card-solid border border-line rounded-lg px-3 py-2 text-[13.5px] outline-none focus:border-accent/60"
        />
        <div className="flex flex-wrap gap-1">
          {FILTERS.filter((f) => f.id === "all" || visibleKinds.has(f.id)).map(
            (f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12.5px] font-semibold border",
                  filter === f.id
                    ? "bg-card-solid text-ink border-line-2"
                    : "text-ink-3 border-transparent hover:bg-[rgba(31,29,43,0.04)]",
                )}
              >
                {f.label}
              </button>
            ),
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-[13px] text-ink-3 px-1 py-3">
          Nothing matches.
        </div>
      ) : (
        <ul className="list-none p-0 m-0">
          {items.map((a) => {
            const persona = PERSONAS[a.attribution];
            const ctx = getContextById(a.contextId);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setActive(a)}
                  className="w-full text-left flex items-center gap-3 py-3 px-1 border-b border-line text-[13.5px] hover:bg-[rgba(31,29,43,0.02)]"
                >
                  <PersonaAvatar persona={persona} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink truncate">{a.title}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ctx ? <Chip kind="context">{ctx.label}</Chip> : null}
                      <Chip kind="neutral">{a.kind}</Chip>
                      {a.status ? <Chip kind="neutral">{a.status}</Chip> : null}
                    </div>
                  </div>
                  <span className="text-[12px] text-ink-3 shrink-0">
                    {a.createdLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ArtifactViewer
        artifact={active}
        onClose={() => setActive(null)}
      />
    </>
  );
}
