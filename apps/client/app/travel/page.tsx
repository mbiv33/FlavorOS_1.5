import type { Metadata } from "next";

import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusChip } from "../components/ui/StatusChip";
import { trips } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Travel — FlavorOS Client",
};

export default function TravelPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Travel</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Trip planning, booking status, and itinerary management.
        </p>
      </div>

      <section className="space-y-4">
        <SectionHeader title="Trips" count={trips.length} />
        <div className="space-y-3">
          {trips.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-2xl dark:bg-neutral-800">
                ✈️
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{t.destination}</h3>
                  <StatusChip status={t.status} />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t.dates}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Next: {t.nextAction}
                </p>
              </div>
              <button className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                View
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Plan a new trip — your agents will handle flights, hotels, and
          logistics.
        </p>
        <button className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
          Plan Trip
        </button>
      </section>
    </div>
  );
}
