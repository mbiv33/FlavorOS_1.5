"use client";

import Link from "next/link";
import { Chip } from "@/components/primitives/Chip";
import { getContextById } from "@/lib/mock/profile";
import { useApprovalsStore } from "@/lib/state/approvals";
import type { Project } from "@/lib/types/project";

interface ProjectRowProps {
  project: Project;
}

/**
 * One row in the Work landing list. Shows context chip, title, status
 * sentence, next milestone, and a "needs you" badge if there are pending
 * approvals tagged to this project's context (PRD 04 §4.2).
 *
 * Note: Slice 3 doesn't yet thread project_id onto Approval. Approximate by
 * matching contextId — good enough for the demo, swap to project_id later.
 */
export function ProjectRow({ project }: ProjectRowProps) {
  const ctx = getContextById(project.contextId);
  return (
    <Link
      href={`/work/${project.id}`}
      className="block bg-card-solid border border-line rounded-card shadow-sm2 p-4 mb-2.5 no-underline text-ink hover:shadow-md2 transition-shadow"
    >
      <div className="flex items-center gap-2 mb-1">
        {ctx ? <Chip kind="context">{ctx.label}</Chip> : null}
        <NeedsYouBadge contextId={project.contextId} />
      </div>
      <div className="text-[16px] font-bold tracking-tight">{project.title}</div>
      {project.subtitle ? (
        <div className="text-[12.5px] text-ink-3 mt-0.5">{project.subtitle}</div>
      ) : null}
      <div className="text-[13.5px] text-ink-2 mt-2">{project.statusSentence}</div>
      {project.nextMilestone ? (
        <div className="text-[12.5px] text-ink-3 mt-1">
          Next: {project.nextMilestone}
        </div>
      ) : null}
    </Link>
  );
}

function NeedsYouBadge({ contextId }: { contextId: string }) {
  const count = useApprovalsStore(
    (s) =>
      s.approvals.filter(
        (a) => a.state === "pending" && a.contextId === contextId,
      ).length,
  );
  if (count === 0) return null;
  return (
    <span className="ml-auto text-[11px] font-bold bg-accent text-white rounded-full px-2 py-0.5">
      {count} ready for you
    </span>
  );
}
