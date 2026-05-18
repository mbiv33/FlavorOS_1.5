import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow, type PileDef } from "@/components/PileRow";
import { StatusChip } from "@/components/StatusChip";
import { DataTable, type Column } from "@/components/DataTable";
import {
  projectsItems,
  projectsStats,
  type ProjectPileItem,
  type ProjectsPile,
} from "@/lib/fixtures";

const PILE_DEF: Record<
  ProjectsPile,
  { label: string; tone: "amber" | "rose" | "emerald"; subtitle: string }
> = {
  active: {
    label: "Active",
    tone: "amber",
    subtitle: "In progress · awaiting your input",
  },
  blocked: {
    label: "Blocked",
    tone: "rose",
    subtitle: "Held on missing input or external dependency",
  },
  completed: {
    label: "Completed",
    tone: "emerald",
    subtitle: "Shipped this quarter",
  },
};

const PILE_ORDER: ProjectsPile[] = ["active", "blocked", "completed"];

const COLUMNS: Column<ProjectPileItem>[] = [
  {
    key: "title",
    header: "Project",
    render: (r) => <span className="font-medium">{r.title}</span>,
  },
  { key: "owner", header: "Owner", render: (r) => r.owner },
  { key: "context", header: "Context", render: (r) => r.context },
  { key: "next", header: "Next step", render: (r) => r.nextStep },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusChip status={r.status} />,
  },
  {
    key: "due",
    header: "Due",
    render: (r) => <span className="text-muted">{r.dueAt}</span>,
  },
];

export default function ProjectsPage() {
  const piles: PileDef[] = PILE_ORDER.map((key) => {
    const def = PILE_DEF[key];
    return {
      key,
      label: def.label,
      tone: def.tone,
      subtitle: def.subtitle,
      items: projectsItems
        .filter((i) => i.pile === key)
        .map((p) => ({
          id: p.id,
          kind: p.kind,
          title: p.title,
          status: p.status,
          agent: p.owner,
          detail: `${p.context} · ${p.nextStep}`,
          when: `Due ${p.dueAt}`,
          sourceLinkLabel: p.sourceLinkLabel,
        })),
    };
  });

  return (
    <SurfaceFrame
      title="Projects"
      description="Active projects, blockers, and next steps."
      action={
        <Link
          href="/meetings/projects"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      <SurfaceSection title="Stats">
        <StatStrip stats={projectsStats} />
      </SurfaceSection>

      <SurfaceSection title="Piles">
        <PileRow piles={piles} />
      </SurfaceSection>

      <SurfaceSection title="Tasks list">
        <DataTable columns={COLUMNS} rows={projectsItems} />
      </SurfaceSection>
    </SurfaceFrame>
  );
}
