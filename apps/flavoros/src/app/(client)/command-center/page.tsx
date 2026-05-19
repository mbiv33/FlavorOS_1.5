"use client";

import Link from "next/link";

import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { ClientInbox } from "@/components/ClientInbox";
import { GoalsStrip } from "@/components/GoalsStrip";
import { MiniCalendar } from "@/components/MiniCalendar";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { useCommandCenterData } from "@/lib/hooks/useCommandCenterData";
import { useChannelData } from "@/lib/hooks/useChannelData";
import {
  artifactHighlightDays,
  buildCurrentMonthGrid,
  buildGoalChips,
  buildGreeting,
  relativeTime,
  todayDateLine,
} from "@/lib/mappers";
import type { Stat } from "@/components/StatStrip";

export default function CommandCenterPage() {
  const { profile, inboxItems, loading, error } = useCommandCenterData();
  const {
    artifacts,
    loading: channelLoading,
    error: channelError,
  } = useChannelData();

  const greeting = profile ? buildGreeting(profile.display_name) : "Good day.";
  const dateLine = todayDateLine();
  const goalStats: Stat[] = buildGoalChips(artifacts).map((g) => ({
    id: g.id,
    label: g.label,
    value: g.value,
    tone: g.tone,
  }));
  const month = buildCurrentMonthGrid();
  const highlightDates = artifactHighlightDays(artifacts);
  const eventCards = artifacts.slice(0, 3).map((a) => ({
    id: a.id,
    title: a.title,
    meta: `${a.kind} · ${relativeTime(a.updated_at)}`,
  }));

  return (
    <SurfaceFrame
      title={greeting}
      description={dateLine}
      action={
        <Link
          href="/meetings"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm hover:opacity-90"
        >
          Start a Meeting
        </Link>
      }
    >
      <SurfaceSection
        title="Goals & Milestones"
        action={
          <Link href="/projects" className="text-xs text-muted hover:text-foreground">
            Open Projects →
          </Link>
        }
      >
        {channelError ? (
          <p className="text-sm text-rose-800">{channelError}</p>
        ) : channelLoading ? (
          <p className="text-sm text-muted">Loading milestones…</p>
        ) : (
          <GoalsStrip stats={goalStats} />
        )}
      </SurfaceSection>

      {error ? (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading inbox…</p>
      ) : inboxItems.length === 0 ? (
        <section className="space-y-3">
          <header className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-strong">
              Client Inbox
            </h2>
          </header>
          <p className="text-sm text-muted">
            No items yet — your inbox will populate after the first provider sync.
          </p>
        </section>
      ) : (
        <ClientInbox items={inboxItems} />
      )}

      <SurfaceSection
        title="Events & Happenings"
        action={
          <Link href="/calendar" className="text-xs text-muted hover:text-foreground">
            Open Calendar →
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {channelLoading ? (
              <p className="text-sm text-muted">Loading events…</p>
            ) : eventCards.length === 0 ? (
              <p className="text-sm text-muted">No events from sync yet.</p>
            ) : (
              eventCards.map((ev) => (
                <Card key={ev.id}>
                  <CardTitle>{ev.title}</CardTitle>
                  <CardMeta>{ev.meta}</CardMeta>
                </Card>
              ))
            )}
          </div>
          <MiniCalendar
            label={month.label}
            weekdays={month.weekdays}
            weeks={month.weeks}
            today={month.today}
            highlightDates={highlightDates}
          />
        </div>
      </SurfaceSection>
    </SurfaceFrame>
  );
}
