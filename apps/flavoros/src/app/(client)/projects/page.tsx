"use client";

import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow } from "@/components/PileRow";
import { Card } from "@/components/Card";
import { useProjectsData } from "@/lib/hooks/useProjectsData";

export default function ProjectsPage() {
  const { piles, stats, tableRows, loading, error } = useProjectsData();

  return (
    <SurfaceFrame
      title="Projects"
      description="Active work, milestones, and project-linked artifacts."
      action={
        <Link
          href="/meetings/projects"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      {error ? (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading projects…</p>
      ) : (
        <>
          <SurfaceSection title="Stats">
            <StatStrip stats={stats} />
          </SurfaceSection>

          <SurfaceSection title="Piles">
            {piles.every((p) => p.items.length === 0) ? (
              <p className="text-sm text-muted">
                No project items yet — work will appear after the first provider sync.
              </p>
            ) : (
              <PileRow piles={piles} />
            )}
          </SurfaceSection>

          <SurfaceSection title="Active projects">
            <Card>
              {tableRows.length === 0 ? (
                <p className="text-sm text-muted">No project rows from sync yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted">
                        <th className="pb-2 font-medium">Project</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Due</th>
                        <th className="pb-2 font-medium">Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-0">
                          <td className="py-2.5 font-medium">{row.title}</td>
                          <td className="py-2.5 text-muted">{row.status}</td>
                          <td className="py-2.5 text-muted">{row.dueAt}</td>
                          <td className="py-2.5 text-muted">{row.owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </SurfaceSection>
        </>
      )}
    </SurfaceFrame>
  );
}
