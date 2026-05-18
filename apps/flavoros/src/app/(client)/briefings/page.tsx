import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { LaunchCard } from "@/components/LaunchCard";
import { briefings } from "@/lib/fixtures";

export default function BriefingsIndex() {
  return (
    <>
      <Header
        title="Briefings"
        nextFocus="Scheduled and on-demand structured sessions"
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <Zone title="Today">
            {(Object.keys(briefings) as Array<keyof typeof briefings>).map(
              (key) => {
                const b = briefings[key];
                return (
                  <LaunchCard
                    key={key}
                    title={b.title}
                    meta={b.direction}
                    statusLine={`${
                      b.preparedStatus === "ready"
                        ? "Ready"
                        : b.preparedStatus === "not_prepared"
                          ? "Not prepared"
                          : b.preparedStatus
                    } · ${b.scheduledFor}`}
                    primaryHref={`/briefings/${key}`}
                    primaryLabel="Open"
                  />
                );
              },
            )}
          </Zone>
        </div>
      </div>
    </>
  );
}
