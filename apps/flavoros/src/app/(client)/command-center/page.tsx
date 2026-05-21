"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { OperatingPicture } from "@/components/OperatingPicture";
import { ClientInbox } from "@/components/ClientInbox";
import { GoalsStrip } from "@/components/GoalsStrip";
import { MiniCalendar } from "@/components/MiniCalendar";
import { LaunchCard } from "@/components/LaunchCard";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { useChannelData } from "@/lib/hooks/useChannelData";
import { getProfile, loadSession, type ProfileRead } from "@/lib/api";
import {
  artifactHighlightDays,
  briefingPreparedStatusLabel,
  buildBriefingSummaries,
  buildCurrentMonthGrid,
  buildGoalChips,
  buildGreeting,
  buildOperatingPictureSummary,
  relativeTime,
  todayDateLine,
} from "@/lib/mappers";
import type { Stat } from "@/components/StatStrip";
import type { InboxPile } from "@/lib/fixtures";

const INBOX_PILES: InboxPile[] = ["urgent", "needs-attention", "updates"];

function hasInboxContent(items: { pile: InboxPile }[]): boolean {
  return INBOX_PILES.some((pile) => items.some((i) => i.pile === pile));
}

const SIDEBAR_BRIEFINGS = ["morning-standup", "cob-work-day"] as const;

export default function CommandCenterPage() {
  const [profile, setProfile] = useState<ProfileRead | null>(null);
  const {
    artifacts,
    approvals,
    inboxItems,
    loading,
    error,
    applyDecideResult,
  } = useChannelData();

  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    getProfile(session).then(setProfile).catch(() => null);
  }, []);

  const greeting = profile ? buildGreeting(profile.display_name) : "Good day.";
  const dateLine = todayDateLine();
  const briefingSummaries = buildBriefingSummaries(artifacts, approvals);
  const operatingSummary = buildOperatingPictureSummary({
    pendingApprovals: approvals.length,
    inboxItems,
    briefingSummaries,
  });
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

  const showInbox =
    !loading && !error && hasInboxContent(inboxItems);
  const goalsEmpty = !loading && goalStats.length === 0;
  const eventsEmpty = !loading && eventCards.length === 0;
  const sidebarBriefings = briefingSummaries.filter((b) =>
    (SIDEBAR_BRIEFINGS as readonly string[]).includes(b.type),
  );

  return (
    <SurfaceFrame title="Command Center">
      <OperatingPicture
        greeting={greeting}
        dateLine={dateLine}
        summary={operatingSummary}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          <SurfaceSection
            title="Goals & Milestones"
            hideWhenEmpty
            empty={goalsEmpty}
            action={
              <Link
                href="/projects"
                className="text-xs text-muted hover:text-foreground"
              >
                Open Projects →
              </Link>
            }
          >
            {loading ? (
              <p className="text-sm text-muted">Loading milestones…</p>
            ) : (
              <GoalsStrip stats={goalStats} />
            )}
          </SurfaceSection>

          {error ? (
            <p className="rounded-lg border border-status-blocked/30 bg-surface px-4 py-3 text-sm text-status-blocked">
              {error}
            </p>
          ) : null}
          {loading ? (
            <p className="text-sm text-muted">Loading inbox…</p>
          ) : null}
          {showInbox ? (
            <ClientInbox
              items={inboxItems}
              onAfterDecide={applyDecideResult}
            />
          ) : null}

          <SurfaceSection
            title="Events & Happenings"
            hideWhenEmpty
            empty={eventsEmpty}
            action={
              <Link
                href="/calendar"
                className="text-xs text-muted hover:text-foreground"
              >
                Open Calendar →
              </Link>
            }
          >
            <div className="grid gap-4 md:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted">Loading events…</p>
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
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Link
            href="/meetings"
            className="block w-full rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Start a Meeting
          </Link>
          {sidebarBriefings.map((b) => (
            <LaunchCard
              key={b.type}
              title={b.title}
              meta={b.direction}
              statusLine={`${briefingPreparedStatusLabel(b.preparedStatus)} · ${b.scheduledFor}${
                b.approvalCount > 0
                  ? ` · ${b.approvalCount} pending approval${b.approvalCount === 1 ? "" : "s"}`
                  : ""
              }`}
              primaryHref={`/briefings/${b.type}`}
              primaryLabel="Open"
            />
          ))}
          <Link
            href="/briefings"
            className="block text-center text-xs text-muted hover:text-foreground"
          >
            All briefings →
          </Link>
        </aside>
      </div>
    </SurfaceFrame>
  );
}
