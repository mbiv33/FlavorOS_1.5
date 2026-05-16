import { Card } from "@/components/primitives/Card";
import { PersonaAvatar } from "@/components/primitives/Avatar";
import { PERSONAS } from "@/lib/types/persona";
import type { Project } from "@/lib/types/project";

/**
 * Brief tab — Khadijah's per-project mini-brief. Rolls up into the master
 * COS brief on Today (PRD 04 §4.2).
 */
export function BriefTab({ project }: { project: Project }) {
  if (!project.briefParagraphs || project.briefParagraphs.length === 0) {
    return (
      <div className="text-[13.5px] text-ink-3 py-3">
        Khadijah hasn't filed a project brief yet.
      </div>
    );
  }
  const khadijah = PERSONAS.khadijah;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-3 mb-2.5">
        <PersonaAvatar persona={khadijah} size="sm" />
        Khadijah
      </div>
      {project.briefParagraphs.map((p, i) => (
        <p
          key={i}
          className="m-0 mb-2.5 text-[14.5px] leading-relaxed text-ink last:mb-0"
        >
          {p}
        </p>
      ))}
    </Card>
  );
}
