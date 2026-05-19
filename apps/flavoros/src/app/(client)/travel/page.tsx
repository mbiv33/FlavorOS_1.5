"use client";

import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow } from "@/components/PileRow";
import { Card } from "@/components/Card";
import { useTravelData } from "@/lib/hooks/useTravelData";

export default function TravelPage() {
  const { piles, stats, trips, loading, error } = useTravelData();

  return (
    <SurfaceFrame
      title="Travel"
      description="Trips, logistics, and travel-related approvals."
      action={
        <Link
          href="/meetings/travel"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      {error ? (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading travel…</p>
      ) : (
        <>
          <SurfaceSection title="Stats">
            <StatStrip stats={stats} />
          </SurfaceSection>

          <SurfaceSection title="Piles">
            {piles.every((p) => p.items.length === 0) ? (
              <p className="text-sm text-muted">
                No travel items yet — trips will appear after the first provider sync.
              </p>
            ) : (
              <PileRow piles={piles} />
            )}
          </SurfaceSection>

          <div className="grid gap-6 lg:grid-cols-2">
            <SurfaceSection title="Upcoming trips">
              <Card>
                {trips.length === 0 ? (
                  <p className="text-sm text-muted">No trips from sync yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {trips.map((trip) => (
                      <li
                        key={trip.id}
                        className="rounded-md border border-border px-3 py-2"
                      >
                        <p className="text-sm font-medium">{trip.title}</p>
                        <p className="text-xs text-muted">{trip.when}</p>
                        <p className="mt-1 text-xs text-muted">{trip.phase}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </SurfaceSection>

            <SurfaceSection title="Logistics">
              <Card>
                <p className="text-sm text-muted">
                  Logistics details will appear when travel artifacts include itinerary
                  metadata from sync.
                </p>
              </Card>
            </SurfaceSection>
          </div>
        </>
      )}
    </SurfaceFrame>
  );
}
