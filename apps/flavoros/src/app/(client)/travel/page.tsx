"use client";

import Link from "next/link";
import { useState } from "react";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow, type PileDef } from "@/components/PileRow";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import {
  logistics,
  travelItems,
  travelStats,
  trips,
  type TravelPile,
} from "@/lib/fixtures";

const PILE_DEF: Record<
  TravelPile,
  { label: string; tone: "violet" | "blue" | "emerald"; subtitle: string }
> = {
  decisions: {
    label: "Decisions",
    tone: "violet",
    subtitle: "Travel options awaiting your choice",
  },
  research: {
    label: "Research",
    tone: "blue",
    subtitle: "Background prep, ready when you are",
  },
  itineraries: {
    label: "Itineraries",
    tone: "emerald",
    subtitle: "Itinerary drafts and finals",
  },
};

const PILE_ORDER: TravelPile[] = ["decisions", "research", "itineraries"];

export default function TravelPage() {
  const [activeTrip, setActiveTrip] = useState(trips[0].id);
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];

  const piles: PileDef[] = PILE_ORDER.map((key) => {
    const def = PILE_DEF[key];
    return {
      key,
      label: def.label,
      tone: def.tone,
      subtitle: def.subtitle,
      items: travelItems
        .filter((i) => i.pile === key)
        .map((t) => ({
          id: t.id,
          kind: t.kind,
          title: t.title,
          status: t.status,
          agent: t.agent,
          detail: `${t.trip} · ${t.detail}`,
          when: t.updated,
          sourceLinkLabel: t.sourceLinkLabel,
        })),
    };
  });

  return (
    <SurfaceFrame
      title="Travel & Logistics"
      description="Upcoming trips, options, and logistics."
      action={
        <Link
          href="/meetings/travel"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      <SurfaceSection title="Stats">
        <StatStrip stats={travelStats} />
      </SurfaceSection>

      <SurfaceSection title="Trips">
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex flex-wrap gap-2 border-b border-border p-3">
            {trips.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTrip(t.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  t.id === activeTrip
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border-strong text-foreground hover:bg-surface-muted"
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-[120px_1fr]">
            <div
              aria-hidden
              className="hidden h-24 rounded-lg bg-stone-100 md:block"
            />
            <div className="space-y-1">
              <CardTitle>{trip.title}</CardTitle>
              <CardMeta>
                {trip.phase} · {trip.when}
              </CardMeta>
              <p className="text-sm text-foreground/90">{trip.summary}</p>
            </div>
          </div>
        </div>
      </SurfaceSection>

      <SurfaceSection title="Travel artifacts">
        <PileRow piles={piles} />
      </SurfaceSection>

      <SurfaceSection title="Logistics">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LogisticsColumn label="Hospitality" items={logistics.hospitality} />
          <LogisticsColumn
            label="Transportation"
            items={logistics.transportation}
          />
          <LogisticsColumn label="Dining" items={logistics.dining} />
          <LogisticsColumn label="Locations" items={logistics.locations} />
        </div>
      </SurfaceSection>
    </SurfaceFrame>
  );
}

function LogisticsColumn({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <Card>
      <CardTitle>{label}</CardTitle>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md border border-dashed border-border-strong px-3 py-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
