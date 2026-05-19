"use client";

import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { Card } from "@/components/Card";
import { useMeetingsData } from "@/lib/hooks/useMeetingsData";

export default function MeetingsPage() {
  const { meetingCards, loading, error } = useMeetingsData();

  return (
    <SurfaceFrame
      title="Meetings"
      description="Channel meetings — prep, agenda, and linked inbox items."
    >
      {error ? (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading meetings…</p>
      ) : (
        <SurfaceSection title="Channels">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meetingCards.map((m) => (
              <Link key={m.topic} href={m.href}>
                <Card className="h-full transition-colors hover:border-ring">
                  <p className="text-sm font-semibold">{m.title}</p>
                  <p className="mt-1 text-xs text-muted">{m.description}</p>
                  <p className="mt-3 text-xs font-medium text-muted-strong">
                    {m.count} item{m.count === 1 ? "" : "s"} in inbox
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </SurfaceSection>
      )}
    </SurfaceFrame>
  );
}
