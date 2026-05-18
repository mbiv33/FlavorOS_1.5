import Link from "next/link";
import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardRow, CardTitle } from "@/components/Card";
import { StatusChip } from "@/components/StatusChip";
import { trips } from "@/lib/fixtures";

export default function TravelPage() {
  return (
    <>
      <Header
        title="Travel / Logistics"
        nextFocus="Upcoming trips, options, and logistics"
        action={
          <Link
            href="/meetings/travel"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
          >
            Open meeting
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <Zone title="Upcoming trips">
            {trips.map((t) => (
              <Card key={t.id}>
                <CardRow>
                  <div className="space-y-1">
                    <CardTitle>{t.title}</CardTitle>
                    <CardMeta>
                      {t.phase} · {t.when}
                    </CardMeta>
                  </div>
                  <StatusChip status={t.status} />
                </CardRow>
              </Card>
            ))}
          </Zone>
          <Zone title="Client travel library">
            <Card>
              <CardMeta>
                Filed travel documents and packing references will live here.
              </CardMeta>
            </Card>
          </Zone>
        </div>
      </div>
    </>
  );
}
