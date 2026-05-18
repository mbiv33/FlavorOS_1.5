import Link from "next/link";
import { ClientInbox } from "@/components/ClientInbox";
import { GoalsStrip } from "@/components/GoalsStrip";
import { MiniCalendar } from "@/components/MiniCalendar";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import {
  clientProfile,
  inboxItems,
  todayOperatingPicture,
} from "@/lib/fixtures";

export default function CommandCenterPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {/* Greeting */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted">
              {todayOperatingPicture.date}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {todayOperatingPicture.greeting}
            </h1>
            <p className="text-sm text-muted">
              {todayOperatingPicture.dayStatus} ·{" "}
              {todayOperatingPicture.nextFocus}
            </p>
          </div>
          <Link
            href="/meetings"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm hover:opacity-90"
          >
            Start a Meeting
          </Link>
        </header>

        {/* Goals & Milestones */}
        <Zone
          title="Goals & Milestones"
          action={
            <Link
              href="/projects"
              className="text-xs text-muted hover:text-foreground"
            >
              Open Projects →
            </Link>
          }
        >
          <GoalsStrip />
        </Zone>

        {/* Client Inbox */}
        <ClientInbox items={inboxItems} />

        {/* Events & Happenings */}
        <Zone
          title="Events & Happenings"
          action={
            <Link
              href="/comms-calendar"
              className="text-xs text-muted hover:text-foreground"
            >
              Open Comms & Calendar →
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
        </Zone>

        <footer className="pt-4 text-xs text-muted">
          Signed in as {clientProfile.displayName} · {clientProfile.timezone}
        </footer>
      </div>
    </div>
  );
}
