import Link from "next/link";
import type { Project } from "@/lib/types/project";

/**
 * Top of the project detail page. Travel projects show the big gradient
 * countdown; standard projects skip it.
 */
export function ProjectHeader({ project }: { project: Project }) {
  const showCountdown =
    project.kind === "travel" && typeof project.daysUntil === "number";
  return (
    <>
      <div className="px-1 pt-4 pb-1.5 text-[12.5px] text-ink-3">
        <Link href="/work" className="text-ink-3 no-underline hover:underline">
          Work
        </Link>
        {project.kind === "travel" ? (
          <>
            {" › "}
            <Link href="/work/travel" className="text-ink-3 no-underline hover:underline">
              Travel
            </Link>
          </>
        ) : null}
        {" › "}
        <span className="text-ink font-semibold">{project.title}</span>
      </div>

      <header className="flex items-start justify-between gap-4 px-1 pb-3.5">
        <div>
          <div className="text-[26px] font-bold tracking-tight">{project.title}</div>
          {project.subtitle ? (
            <div className="text-ink-2 text-[13.5px] mt-0.5">{project.subtitle}</div>
          ) : null}
        </div>
        {showCountdown ? (
          <div className="text-right shrink-0">
            <div
              className="text-[44px] font-extrabold tracking-tight leading-none bg-gradient-to-br from-accent to-kha bg-clip-text text-transparent"
              style={{ WebkitBackgroundClip: "text" }}
            >
              {project.daysUntil}
            </div>
            <div className="text-[12px] text-ink-3 mt-0.5">
              days · {project.phase?.statusLabel ?? project.statusSentence}
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
