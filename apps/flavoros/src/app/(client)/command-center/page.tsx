import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { ClientInbox } from "@/components/ClientInbox";
import { GoalsStrip } from "@/components/GoalsStrip";
import { MiniCalendar } from "@/components/MiniCalendar";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import {
  inboxItems,
  todayOperatingPicture,
} from "@/lib/fixtures";

export default function CommandCenterPage() {
  return (
    <SurfaceFrame
      title={todayOperatingPicture.greeting}
      description={`${todayOperatingPicture.date} · ${todayOperatingPicture.dayStatus} · ${todayOperatingPicture.nextFocus}`}
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
          <Link
            href="/projects"
            className="text-xs text-muted hover:text-foreground"
          >
            Open Projects →
          </Link>
        }
      >
        <GoalsStrip />
      </SurfaceSection>

      <ClientInbox items={inboxItems} />

      <SurfaceSection
        title="Events & Happenings"
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
