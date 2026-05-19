"use client";

import Link from "next/link";

import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { ClientInbox } from "@/components/ClientInbox";
import { GoalsStrip } from "@/components/GoalsStrip";
import { MiniCalendar } from "@/components/MiniCalendar";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { useCommandCenterData } from "@/lib/hooks/useCommandCenterData";
import { buildGreeting, todayDateLine } from "@/lib/mappers";

export default function CommandCenterPage() {
  const { profile, inboxItems, loading, error } = useCommandCenterData();

  const greeting = profile ? buildGreeting(profile.display_name) : "Good day.";
  const dateLine = todayDateLine();

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
        <GoalsStrip />
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
          <p className="text-sm text-muted">No items yet — your inbox will populate after the first provider sync.</p>
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
            <Card>
              <CardTitle>Team sync</CardTitle>
              <CardMeta>Today · 10:30 AM · Calendar source</CardMeta>
            </Card>
            <Card>
              <CardTitle>Board prep</CardTitle>
              <CardMeta>Thursday · 2:00 PM · Calendar source</CardMeta>
            </Card>
            <Card>
              <CardTitle>Atlanta site visit</CardTitle>
              <CardMeta>May 24–26 · Travel</CardMeta>
            </Card>
          </div>
          <MiniCalendar />
        </div>
      </SurfaceSection>
    </SurfaceFrame>
  );
}
