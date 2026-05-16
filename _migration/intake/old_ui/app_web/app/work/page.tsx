import Link from "next/link";
import { ProjectRow } from "@/components/work/ProjectRow";
import { MOCK_PROJECTS } from "@/lib/mock/projects";

/**
 * Work landing — list of all in-flight projects. NO "+ New Project"
 * affordance (PRD 02 §Why "Work"). Travel sub-link surfaces at top since
 * Travel is a beloved sub-surface.
 */
export default function WorkPage() {
  const projects = MOCK_PROJECTS.filter((p) => p.status === "active");
  return (
    <div>
      <div className="px-1 pt-4 pb-2 flex items-baseline justify-between">
        <h1 className="m-0 text-[28px] font-bold tracking-tight">Work</h1>
        <Link
          href="/work/travel"
          className="text-[13px] text-accent no-underline font-semibold hover:underline"
        >
          Travel ›
        </Link>
      </div>
      <div className="text-[13.5px] text-ink-3 mb-4 px-1">
        {projects.length} active project{projects.length === 1 ? "" : "s"}
      </div>
      {projects.map((p) => (
        <ProjectRow key={p.id} project={p} />
      ))}
    </div>
  );
}
