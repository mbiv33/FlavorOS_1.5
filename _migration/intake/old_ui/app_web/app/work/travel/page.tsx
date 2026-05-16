import Link from "next/link";
import { getTravelProjects } from "@/lib/mock/projects";

/**
 * Travel landing — trips list with countdowns and current phase.
 * PRD 04 §4.3.
 */
export default function TravelLandingPage() {
  const trips = getTravelProjects();
  const upcoming = trips.filter((t) => t.status === "active");

  return (
    <div>
      <div className="px-1 pt-4 pb-1.5 text-[12.5px] text-ink-3">
        <Link href="/work" className="text-ink-3 no-underline hover:underline">
          Work
        </Link>
        {" › "}
        <span className="text-ink font-semibold">Travel</span>
      </div>
      <h1 className="m-0 px-1 text-[28px] font-bold tracking-tight">Travel</h1>
      <div className="text-[13.5px] text-ink-3 mb-5 px-1">
        {upcoming.length} upcoming trip{upcoming.length === 1 ? "" : "s"}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {upcoming.map((t) => (
          <Link
            key={t.id}
            href={`/work/${t.id}`}
            className="block bg-gradient-to-br from-white to-[#fbf8ff] border border-line rounded-card p-4 shadow-sm2 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md2 no-underline text-ink"
          >
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="text-[18px] font-bold tracking-tight">
                  {t.title}
                </div>
                <div className="text-ink-3 text-[12.5px]">
                  {t.anchorLabel} · {t.subtitle}
                </div>
              </div>
              <div className="text-right">
                <span
                  className="text-[28px] font-extrabold tracking-tight bg-gradient-to-br from-accent to-kha bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: "text" }}
                >
                  {t.daysUntil}
                </span>
                <span className="text-[12px] text-ink-3 ml-1">days</span>
              </div>
            </div>
            <div className="text-[12.5px] text-ink-2 capitalize border-t border-line pt-2 mt-2">
              Phase: {t.phase?.current} · {t.phase?.statusLabel}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
