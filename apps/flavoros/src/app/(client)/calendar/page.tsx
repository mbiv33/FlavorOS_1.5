"use client";

import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow } from "@/components/PileRow";
import { MiniCalendar } from "@/components/MiniCalendar";
import { Card } from "@/components/Card";
import { useCalendarData } from "@/lib/hooks/useCalendarData";

export default function CalendarPage() {
  const { piles, stats, month, highlightDates, todayItems, loading, error } =
    useCalendarData();

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
      {error ? (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading calendar…</p>
      ) : (
        <>
          <SurfaceSection title="Stats">
            <StatStrip stats={stats} />
          </SurfaceSection>

          <SurfaceSection title="Piles">
            {piles.every((p) => p.items.length === 0) ? (
              <p className="text-sm text-muted">
                No calendar items yet — events will appear after the first provider sync.
              </p>
            ) : (
              <PileRow piles={piles} />
            )}
          </SurfaceSection>

          <CalendarTodayGrid
            todayItems={todayItems}
            month={month}
            highlightDates={highlightDates}
          />
        </>
      )}
    </SurfaceFrame>
  );
}

function CalendarTodayGrid({
  todayItems,
  month,
  highlightDates,
}: {
  todayItems: { id: string; title: string; detail: string }[];
  month: { label: string; weekdays: string[]; weeks: Array<Array<number | null>>; today: number };
  highlightDates: number[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <SurfaceSection title="Today">
        <Card>
          {todayItems.length === 0 ? (
            <p className="text-sm text-muted">Nothing scheduled for today from sync.</p>
          ) : (
            <ul className="divide-y divide-border">
              {todayItems.map((c) => (
                <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted">{c.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </SurfaceSection>
      <SurfaceSection title="Month">
        <MiniCalendar
          label={month.label}
          weekdays={month.weekdays}
          weeks={month.weeks}
          today={month.today}
          highlightDates={highlightDates}
        />
      </SurfaceSection>
    </div>
  );
}
