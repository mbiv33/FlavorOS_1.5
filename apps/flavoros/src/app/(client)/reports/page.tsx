"use client";

import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow } from "@/components/PileRow";
import { Card } from "@/components/Card";
import { useReportsData } from "@/lib/hooks/useReportsData";

export default function ReportsPage() {
  const { piles, stats, tableRows, loading, error } = useReportsData();

  return (
    <SurfaceFrame
      title="Reports"
      description="Weekly updates, metrics, and reporting artifacts."
      action={
        <Link
          href="/meetings/reports"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      {error ? (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading reports…</p>
      ) : (
        <>
          <SurfaceSection title="Stats">
            <StatStrip stats={stats} />
          </SurfaceSection>

          <SurfaceSection title="Piles">
            {piles.every((p) => p.items.length === 0) ? (
              <p className="text-sm text-muted">
                No report items yet — updates will appear after the first provider sync.
              </p>
            ) : (
              <PileRow piles={piles} />
            )}
          </SurfaceSection>

          <SurfaceSection title="Recent reports">
            <Card>
              {tableRows.length === 0 ? (
                <p className="text-sm text-muted">No report rows from sync yet.</p>
              ) : (
                <ReportsTable rows={tableRows} />
              )}
            </Card>
          </SurfaceSection>
        </>
      )}
    </SurfaceFrame>
  );
}

function ReportsTable({
  rows,
}: {
  rows: { id: string; title: string; status: string; updated: string; agent: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="pb-2 font-medium">Report</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Updated</th>
            <th className="pb-2 font-medium">Owner</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="py-2.5 font-medium">{row.title}</td>
              <td className="py-2.5 text-muted">{row.status}</td>
              <td className="py-2.5 text-muted">{row.updated}</td>
              <td className="py-2.5 text-muted">{row.agent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
