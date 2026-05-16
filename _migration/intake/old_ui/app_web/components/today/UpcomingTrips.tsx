import Link from "next/link";
import { Section } from "@/components/primitives/Section";
import { MOCK_UPCOMING_TRIPS } from "@/lib/mock/today";

/**
 * Trip countdown widget. Auto-shows on Today when any trip is in flight
 * (PRD 04 §4.3). The big gradient countdown is treated as a beloved feature.
 */
export function UpcomingTrips() {
  const trips = MOCK_UPCOMING_TRIPS;
  if (trips.length === 0) return null;

  return (
    <Section title="Upcoming trips" meta="Scooter is curating">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {trips.map((t) => (
          <Link
            key={t.id}
            href={`/work/${t.id}`}
            className="block bg-gradient-to-br from-white to-[#fbf8ff] border border-line rounded-card p-4 shadow-sm2 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md2 no-underline text-ink"
          >
            <div className="text-[17px] font-bold tracking-tight">{t.destination}</div>
            <div className="text-ink-3 text-[12.5px] mt-px">{t.dateRange}</div>
            <div className="flex items-baseline gap-1.5 my-3.5 mb-2">
              <span
                className="text-[36px] font-extrabold tracking-tight bg-gradient-to-br from-accent to-kha bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text" }}
              >
                {t.daysUntil}
              </span>
              <span className="text-[13px] text-ink-3 font-medium">
                day{t.daysUntil === 1 ? "" : "s"} to go
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-ink-2 capitalize">
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-sco" />
              {t.phase} · {t.phaseStatus}
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
