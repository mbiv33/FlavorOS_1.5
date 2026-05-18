import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow, type PileDef } from "@/components/PileRow";
import { MiniCalendar } from "@/components/MiniCalendar";
import { Card } from "@/components/Card";
import {
  calendarPileItems,
  calendarStats,
  type CalendarPile,
} from "@/lib/fixtures";

const PILE_DEF: Record<
  CalendarPile,
  { label: string; tone: "violet" | "rose" | "blue"; subtitle: string }
> = {
  today: {
    label: "Today",
    tone: "violet",
    subtitle: "Events scheduled today",
  },
  conflicts: {
    label: "Conflicts",
    tone: "rose",
    subtitle: "Overlapping commitments needing resolution",
  },
  upcoming: {
    label: "Upcoming",
    tone: "blue",
    subtitle: "Next 7 days",
  },
};

const PILE_ORDER: CalendarPile[] = ["today", "conflicts", "upcoming"];

export default function CalendarPage() {
  const piles: PileDef[] = PILE_ORDER.map((key) => {
    const def = PILE_DEF[key];
    return {
      key,
      label: def.label,
      tone: def.tone,
      subtitle: def.subtitle,
      items: calendarPileItems
        .filter((i) => i.pile === key)
        .map((c) => ({
          id: c.id,
          kind: c.kind,
          title: c.title,
          status: c.status,
          agent: c.agent,
          detail: `${c.context} · ${c.detail}`,
          when: c.when,
          canDefer: c.canDefer,
          sourceLinkLabel: c.sourceLinkLabel,
        })),
    };
  });

  return (
    <SurfaceFrame
      title="Calendar"
      description="Events, conflicts, scheduling, and upcoming commitments."
      action={
        <Link
          href="/meetings/calendar"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      <SurfaceSection title="Stats">
        <StatStrip stats={calendarStats} />
      </SurfaceSection>

      <SurfaceSection title="Piles">
        <PileRow piles={piles} />
      </SurfaceSection>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <SurfaceSection title="Today">
          <Card>
            <ul className="divide-y divide-border">
              {calendarPileItems
                .filter((c) => c.pile === "today")
                .map((c) => (
                  <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted">{c.detail}</p>
                  </li>
                ))}
            </ul>
          </Card>
        </SurfaceSection>
        <SurfaceSection title="Month">
          <MiniCalendar />
        </SurfaceSection>
      </div>
    </SurfaceFrame>
  );
}
