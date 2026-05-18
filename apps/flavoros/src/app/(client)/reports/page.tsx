import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow, type PileDef } from "@/components/PileRow";
import { StatusChip } from "@/components/StatusChip";
import { DataTable, type Column } from "@/components/DataTable";
import {
  reportsItems,
  reportsStats,
  type ArtifactPileItem,
  type ReportsPile,
} from "@/lib/fixtures";

const PILE_DEF: Record<
  ReportsPile,
  { label: string; tone: "violet" | "blue" | "emerald"; subtitle: string }
> = {
  reports: {
    label: "Reports",
    tone: "violet",
    subtitle: "Formal reports across contexts",
  },
  briefs: {
    label: "Briefs",
    tone: "blue",
    subtitle: "Project & travel briefs",
  },
  drafts: {
    label: "Drafts",
    tone: "emerald",
    subtitle: "Outbound drafts in flight",
  },
};

const PILE_ORDER: ReportsPile[] = ["reports", "briefs", "drafts"];

const COLUMNS: Column<ArtifactPileItem>[] = [
  {
    key: "title",
    header: "Title",
    render: (r) => <span className="font-medium">{r.title}</span>,
  },
  { key: "type", header: "Type", render: (r) => r.artifactType },
  { key: "context", header: "Context", render: (r) => r.context },
  { key: "agent", header: "Prepared by", render: (r) => r.agent },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusChip status={r.status} />,
  },
  {
    key: "updated",
    header: "Updated",
    render: (r) => <span className="text-muted">{r.updated}</span>,
  },
];

export default function ReportsArtifactsPage() {
  const piles: PileDef[] = PILE_ORDER.map((key) => {
    const def = PILE_DEF[key];
    return {
      key,
      label: def.label,
      tone: def.tone,
      subtitle: def.subtitle,
      items: reportsItems
        .filter((i) => i.pile === key)
        .map((r) => ({
          id: r.id,
          kind: r.kind,
          title: r.title,
          status: r.status,
          agent: r.agent,
          detail: `${r.artifactType} · ${r.context}`,
          when: r.updated,
          sourceLinkLabel: r.sourceLinkLabel,
        })),
    };
  });

  return (
    <SurfaceFrame
      title="Reports & Artifacts"
      description="Generated work product, drafts, and reports — across every context."
      action={
        <Link
          href="/meetings/reports-artifacts"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      <SurfaceSection title="Stats">
        <StatStrip stats={reportsStats} />
      </SurfaceSection>

      <SurfaceSection title="Piles">
        <PileRow piles={piles} />
      </SurfaceSection>

      <SurfaceSection title="Document Product Library">
        <DataTable columns={COLUMNS} rows={reportsItems} />
      </SurfaceSection>
    </SurfaceFrame>
  );
}
