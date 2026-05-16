import type { Project, ProjectDecision } from "@/lib/types/project";

const KIND_LABEL: Record<ProjectDecision["kind"], string> = {
  approved: "approved",
  modified: "modified",
  "do-myself": "took it on yourself",
  "briefing-decision": "decided at briefing",
};

/**
 * Decisions tab — client's moments only. Approvals, modifications, "I'll
 * do myself", briefing decisions. Plain English. NO agent activity here
 * (PRD 04 §4.2 Decisions tab).
 */
export function DecisionsTab({ project }: { project: Project }) {
  if (project.decisions.length === 0) {
    return (
      <div className="text-[13.5px] text-ink-3 py-3">
        No decisions logged yet on this project.
      </div>
    );
  }
  return (
    <ul className="list-none p-0 m-0">
      {project.decisions.map((d) => (
        <li
          key={d.id}
          className="grid items-baseline gap-3 py-3 border-b border-line text-[13.5px] last:border-b-0"
          style={{ gridTemplateColumns: "70px 1fr auto" }}
        >
          <span className="text-[12.5px] text-ink-3 font-semibold">{d.dateLabel}</span>
          <span className="text-ink">{d.text}</span>
          <span className="text-[11.5px] text-ink-3 uppercase tracking-[0.04em]">
            {KIND_LABEL[d.kind]}
          </span>
        </li>
      ))}
    </ul>
  );
}
