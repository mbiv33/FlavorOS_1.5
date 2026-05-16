"use client";

import { PhaseIndicator } from "../PhaseIndicator";
import { Timeline } from "../Timeline";
import { CandidateGrid } from "../CandidateGrid";
import { ApprovalsList } from "@/components/approval";
import { Section } from "@/components/primitives/Section";
import { useApprovalsStore } from "@/lib/state/approvals";
import type { Project } from "@/lib/types/project";

/**
 * Status tab — phase-aware. Travel projects show phase indicator + timeline
 * + candidates. Standard projects show pending approvals + a status sentence.
 *
 * "Nothing needs you" empty note is intentional and per-PRD; it's the
 * project-scoped equivalent of Today's calm state.
 */
export function StatusTab({ project }: { project: Project }) {
  const projectApprovals = useApprovalsStore((s) =>
    s.approvals.filter(
      (a) =>
        (a.state === "pending" || a.state === "approved") &&
        a.contextId === project.contextId,
    ),
  );

  return (
    <div>
      {project.kind === "travel" && project.phase ? (
        <PhaseIndicator current={project.phase.current} />
      ) : null}

      {projectApprovals.length === 0 ? (
        <div className="text-center text-[13.5px] text-ink-3 py-3">
          Nothing needs you right now.
          {project.nextMilestone ? (
            <>
              {" "}Next moment for you is{" "}
              <strong className="text-ink">{project.nextMilestone}</strong>.
            </>
          ) : null}
        </div>
      ) : (
        <Section title={`Ready for you · ${projectApprovals.length}`}>
          <ApprovalsList approvals={projectApprovals} />
        </Section>
      )}

      {project.timeline ? <Timeline entries={project.timeline} /> : null}

      {project.candidates ? (
        <CandidateGrid
          candidates={project.candidates}
          meta={`${project.candidates.length} finalists`}
        />
      ) : null}
    </div>
  );
}
