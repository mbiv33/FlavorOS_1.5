"use client";

import { useState } from "react";
import { PersonaAvatar } from "@/components/primitives/Avatar";
import { Chip } from "@/components/primitives/Chip";
import { PERSONAS } from "@/lib/types/persona";
import type { FileKind, Project } from "@/lib/types/project";
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

export function FilesTab({ project }: { project: Project }) {
  const [filter, setFilter] = useState<FileKind | "all">("all");
  const visible =
    filter === "all" ? project.files : project.files.filter((f) => f.kind === filter);
  const visibleKinds = new Set(project.files.map((f) => f.kind));

  if (project.files.length === 0) {
    return (
      <div className="text-[13.5px] text-ink-3 py-3">
        No files filed to this project yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-3">
        {FILTERS.filter((f) => f.id === "all" || visibleKinds.has(f.id)).map((f) => (
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
        ))}
      </div>

      <ul className="list-none p-0 m-0">
        {visible.map((f) => {
          const persona = PERSONAS[f.attribution];
          return (
            <li
              key={f.id}
              className="flex items-center gap-3 py-3 border-b border-line text-[13.5px] last:border-b-0"
            >
              <PersonaAvatar persona={persona} size="sm" />
              <span className="font-semibold text-ink">{f.title}</span>
              <Chip kind="neutral">{f.kind}</Chip>
              {f.status ? <Chip kind="neutral">{f.status}</Chip> : null}
              <span className="ml-auto text-[12px] text-ink-3">{f.createdLabel}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
