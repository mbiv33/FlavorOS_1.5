import Link from "next/link";
import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardRow, CardTitle } from "@/components/Card";
import { StatusChip } from "@/components/StatusChip";
import { commsItems } from "@/lib/fixtures";

export default function CommsCalendarPage() {
  return (
    <>
      <Header
        title="Comms & Calendar"
        nextFocus="Prepared messages, drafts, and schedule risks"
        action={
          <Link
            href="/meetings/comms-calendar"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
          >
            Open meeting
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <Zone title="Drafts to approve">
            {commsItems.map((c) => (
              <Card key={c.id}>
                <CardRow>
                  <div className="space-y-1">
                    <CardTitle>{c.title}</CardTitle>
                    <CardMeta>
                      {c.agent} · {c.detail}
                    </CardMeta>
                  </div>
                  <StatusChip status={c.status} />
                </CardRow>
              </Card>
            ))}
          </Zone>
          <Zone title="Upcoming events">
            <Card>
              <p className="text-sm">
                Team sync · Today 10:30 AM ·{" "}
                <span className="text-muted">Calendar source</span>
              </p>
            </Card>
            <Card>
              <p className="text-sm">
                Board prep · Thursday 2:00 PM ·{" "}
                <span className="text-muted">Calendar source</span>
              </p>
            </Card>
          </Zone>
          <Zone title="Outbox status">
            <Card>
              <CardRow>
                <div className="space-y-1">
                  <CardTitle>Reply to Devon — Q3 plan</CardTitle>
                  <CardMeta>Sent · 34m ago</CardMeta>
                </div>
                <StatusChip status="Sent" />
              </CardRow>
            </Card>
          </Zone>
        </div>
      </div>
    </>
  );
}
